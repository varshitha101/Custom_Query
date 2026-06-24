import { database } from "../db/config.js";
import { ref, child, get } from "firebase/database";
import option3Validator from "../utils/option3Validator.js";
import { once } from "events";
import util from "util";

const p2StartTime = 1704047400;
const p3StartTime = 1770532200;
const p2StartTime_1 = 1780295400;
const ROOT_NODE_FETCH_CONCURRENCY = 3;
const UUID_BATCH_SIZE = 500;
const UUID_PROCESS_CONCURRENCY = 500;
const RESULT_STREAM_CHUNK_SIZE = 50;
const PROGRESS_UPDATE_EVERY = 25;

class QueryFetchError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "QueryFetchError";
    this.status = status;
  }
}

async function writeStreamMessage(res, payload) {
  if (res.writableEnded || res.destroyed) {
    return false;
  }

  const canContinue = res.write(`${JSON.stringify(payload)}\n`);
  if (!canContinue && !res.writableEnded && !res.destroyed) {
    await once(res, "drain");
  }

  return !res.writableEnded && !res.destroyed;
}

async function streamResultRows(res, rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return;
  }

  for (let index = 0; index < rows.length; index += RESULT_STREAM_CHUNK_SIZE) {
    await writeStreamMessage(res, { rows: rows.slice(index, index + RESULT_STREAM_CHUNK_SIZE) });
  }
}

async function mapWithConcurrency(items, concurrency, mapper) {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const results = new Array(items.length);
  let nextIndex = 0;
  const workerCount = Math.min(concurrency, items.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (true) {
        const currentIndex = nextIndex++;
        if (currentIndex >= items.length) {
          return;
        }

        results[currentIndex] = await mapper(items[currentIndex], currentIndex);
      }
    }),
  );

  return results;
}

/**
 * Fetches patient data based on the provided expression and expressionString.
 * It retrieves data from the Firebase Realtime Database for the specified nodes
 * and validates it against the expression criteria.
 * This function processes the data in batches to optimize performance.
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 * @returns response with patient data based on the provided expression
 */
export default async function queryFetch_V1(req, res) {
  console.log("\n\n");
  console.log("====== Query Fetch Starts ====");
  const reqStartTime = Date.now();
  try {
    const { expression, expressionString } = req.body;
    console.log("Expression String:", expressionString);
    if (typeof expressionString === "string" && /[\r\n]/.test(expressionString)) {
      console.log("[QueryFetch_V1] Query string contains line break(s). This can break parsing/eval.");
      console.log("[QueryFetch_V1] Raw Expression String (JSON):", JSON.stringify(expressionString));
    }
    console.log("Expression :", util.inspect(expression, { depth: null, maxArrayLength: null }));

    const dbRef = ref(database);

    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");

    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }

    // get all required nodes from expression
    const requiredNodes = Array.from(
      new Set(
        expression
          .filter((item) => item.type === "selector" && item.value && item.value.selectedOption4)
          .flatMap((item) => (Array.isArray(item.value.selectedOption4) ? item.value.selectedOption4 : [item.value.selectedOption4]))
          .filter(Boolean),
      ),
    );

    // Ensure Form_1 is included if general Date or Coverage Status is used
    if (expression.some((item) => item.type === "selector" && (item.value?.selectedOption4 === "general" || item.value?.selectedOption2 === "Coverage Status")) && !requiredNodes.includes("Form_1")) {
      requiredNodes.push("Form_1");
    }
    // Ensure profile_history1 is included if patients1 is required
    if (requiredNodes.includes("patients1") && !requiredNodes.includes("profile_history1")) {
      requiredNodes.push("profile_history1");
    }
    console.log("Required Nodes:", requiredNodes);
    const snapshots = {};

    const panchayathSelector = expression.find((item) => item.type === "selector" && item.value?.selectedOption2 === "Panchayath");
    const panchayathList = panchayathSelector?.value?.selectedOption3 || [];

    // check if list has 07 if yes then no other list should be there throw error
    const hasChintamani = panchayathList.some((panchayath) => panchayath === "07");
    if (hasChintamani && panchayathList.length > 1) {
      throw new QueryFetchError("If Chintamani is selected, no other Panchayath should be selected.", 400);
    }

    const fetchNode = [];
    requiredNodes.forEach((node) => {
      if (node !== "general") {
        panchayathList.forEach((panchayath) => {
          fetchNode.push(`${node}/${panchayath}/`);
        });
      }
    });
    // Fetch all required nodes in parallel
    await mapWithConcurrency(fetchNode, ROOT_NODE_FETCH_CONCURRENCY, async (node) => {
      snapshots[node] = await get(child(dbRef, `${node}`));
      await writeStreamMessage(res, { fetching: node });
    });

    const patientData = {};
    for (const key in snapshots) {
      const path = key.split("/");
      if (snapshots[key].exists()) {
        if (patientData[path[0]]) {
          patientData[path[0]][path[1]] = snapshots[key].val();
        } else {
          patientData[path[0]] = { [path[1]]: snapshots[key].val() };
        }
      }
    }
    // If the query is structured as top-level parenthesis groups joined by AND,
    // evaluate each group independently and intersect results.
    // This prevents Phase-1/Phase-2 data from being combined before evaluation.
    const grouped = splitTopLevelParenGroups(expression);
    if (Array.isArray(grouped.issues) && grouped.issues.length > 0) {
      console.log("[QueryFetch_V1] Query token structure issues:", grouped.issues);
    }
    if (grouped.groups.length >= 2 && grouped.operators.length === grouped.groups.length - 1 && grouped.operators.every((op) => op === "AND")) {
      console.log("[QueryFetch_V1] Splitting query into top-level parenthesis groups (AND intersection mode)");
      console.log("[QueryFetch_V1] Operators between groups:", grouped.operators);
      await writeStreamMessage(res, { mode: "grouped-intersection", groups: grouped.groups.length });

      const groupResults = [];
      for (let i = 0; i < grouped.groups.length; i++) {
        const groupExpression = grouped.groups[i];
        const groupQuery = buildQueryStringFromExpressionTokens(groupExpression);
        console.log(`[QueryFetch_V1] Group ${i + 1} query (no outer parens):`, groupQuery);
        await writeStreamMessage(res, { group: i + 1, query: groupQuery });
        // Collect results without writing final data for each group.
        const result = await validateData(patientData, groupExpression, groupQuery, res, { writeFinalData: false, groupIndex: i + 1 });
        groupResults.push(result);
      }

      const intersected = intersectMatchedResults(groupResults);
      await streamResultRows(res, intersected);
      await writeStreamMessage(res, { complete: true, matched: intersected.length });
    } else {
      const matchedCount = await validateData(patientData, expression, expressionString, res);
      await writeStreamMessage(res, { complete: true, matched: matchedCount });
    }
  } catch (error) {
    console.error("Error in patientData function:", error);
    const status = error instanceof QueryFetchError ? error.status : 500;

    if (!res.headersSent) {
      res.status(status).json({ error: status === 500 ? "Internal Server Error" : "Query Error", message: error.message });
    } else {
      await writeStreamMessage(res, { error: true, status, message: error.message || "Internal Server Error" });
    }
  } finally {
    const reqEndTime = Date.now();
    const duration = reqEndTime - reqStartTime;
    console.log(`Request processed in ${duration} ms`);
    console.log("====== Query Fetch Ends ====");
    console.log("\n\n");
    if (!res.writableEnded) {
      res.end();
    }
  }
}

/**
 * Splits the expression tokens into top-level parenthesis groups and operators.
 * @param {*} expression
 * @returns { groups: Array, operators: Array, issues: Array }
 */
function splitTopLevelParenGroups(expression) {
  const groups = [];
  const operators = [];
  const issues = [];

  let depth = 0;
  let current = null;
  let expectingGroupOrOperator = "group";

  for (const token of expression) {
    if (token?.type === "choice" && token?.value === "(") {
      depth++;
      if (depth === 1) {
        current = [];
        expectingGroupOrOperator = "group";
        continue;
      }
    }

    if (token?.type === "choice" && token?.value === ")") {
      if (depth > 0) depth--;
      else issues.push("unmatched closing parenthesis in tokens");
      if (depth === 0 && current) {
        groups.push(current);
        current = null;
        expectingGroupOrOperator = "operator";
        continue;
      }
    }

    if (depth >= 1) {
      // Inside a top-level group (excluding the wrapping parens)
      if (current) current.push(token);
      continue;
    }

    // Between top-level groups at depth 0
    if (expectingGroupOrOperator === "operator" && token?.type === "choice" && (token?.value === "AND" || token?.value === "OR")) {
      operators.push(token.value);
      expectingGroupOrOperator = "group";
    }
  }

  if (depth !== 0) issues.push("unbalanced parentheses in tokens");
  if (current) issues.push("unterminated top-level group in tokens");

  return { groups, operators, issues };
}

/**
 * Builds a query string from the provided expression tokens.
 * @param {*} expressionTokens
 * @returns {string} - The constructed query string.
 */
function buildQueryStringFromExpressionTokens(expressionTokens) {
  // Build a query string like: Q1 AND Q2 AND ( Q3 OR Q4 )
  // based on the expression token list.
  return expressionTokens
    .map((t) => {
      if (t?.type === "selector") return t.label;
      if (t?.type === "choice") return t.value;
      return "";
    })
    .filter(Boolean)
    .join(" ");
}

/**
 * Finds potential issues in the query string that could cause evaluation errors.
 * @param {*} query
 * @param {*} conditionMap
 * @returns   {Array} - An array of issue descriptions found in the query.
 */
function findQueryBreakIssues(query, conditionMap) {
  const issues = [];
  const q = typeof query === "string" ? query : "";

  if (/[\r\n]/.test(q)) {
    issues.push("contains line breaks");
  }

  // Parentheses balance check
  let balance = 0;
  for (const ch of q) {
    if (ch === "(") balance++;
    else if (ch === ")") balance--;
    if (balance < 0) break;
  }
  if (balance !== 0) {
    issues.push("unbalanced parentheses");
  }

  if (/\bundefined\b|\bNaN\b|\bnull\b/.test(q)) {
    issues.push("contains undefined/null/NaN");
  }

  // Detect common operator problems before AND/OR conversion and after.
  if (/(&&|\|\|)\s*(&&|\|\|)/.test(q)) {
    issues.push("consecutive boolean operators");
  }
  if (/^\s*(&&|\|\|)\b|\b(&&|\|\|)\s*$/.test(q)) {
    issues.push("starts/ends with boolean operator");
  }

  // If any selector label remains unreplaced, eval will usually throw.
  if (conditionMap && typeof conditionMap === "object") {
    for (const label of Object.keys(conditionMap)) {
      if (!label) continue;
      const re = new RegExp(`\\b${label}\\b`);
      if (re.test(q)) {
        issues.push(`unreplaced label: ${label}`);
        break;
      }
    }
  }

  // Catch selector placeholders that weren't in conditionMap (e.g., malformed expressionString).
  // This app uses labels like Q1, Q2, ...
  if (/\bQ\d+\b/.test(q)) {
    issues.push("contains unreplaced selector token(s) like Q1/Q2");
  }

  return issues;
}

/**
 * Intersects matched results from multiple groups based on the _key property.
 */
function intersectMatchedResults(groupResults) {
  if (!Array.isArray(groupResults) || groupResults.length === 0) return [];
  if (groupResults.length === 1) return groupResults[0] ?? [];

  const maps = groupResults.map((arr) => {
    const map = new Map();
    for (const item of arr ?? []) {
      const key = item?._key;
      if (key) map.set(key, item);
    }
    return map;
  });

  // Intersect keys across all groups.
  const [first, ...rest] = maps;
  const intersectionKeys = [];
  for (const key of first.keys()) {
    if (rest.every((m) => m.has(key))) intersectionKeys.push(key);
  }

  // Merge objects from each group (combine node data).
  const merged = [];
  for (const key of intersectionKeys) {
    let combined = { ...first.get(key) };
    for (const m of rest) {
      combined = mergeMatchedObjects(combined, m.get(key));
    }
    merged.push(combined);
  }
  return merged;
}

/**
 * Merges two matched objects, combining their properties.
 * @param {*} a
 * @param {*} b
 * @returns {Object} - The merged object.
 */
function mergeMatchedObjects(a, b) {
  if (!a) return b;
  if (!b) return a;

  const merged = { ...a, ...b };
  // Merge known node objects more safely.
  const nodeKeys = ["patients1", "Form_1", "manual_vital_data", "Form_3", "tcc_form", "profile_history1"];
  for (const k of nodeKeys) {
    if (a[k] && b[k] && typeof a[k] === "object" && typeof b[k] === "object") {
      merged[k] = { ...a[k], ...b[k] };
    }
  }
  return merged;
}

/**
 * This function chunks an array into smaller arrays of a specified size.
 * It iterates through the original array and slices it into chunks of the specified size.
 * @param {number} arr
 * @param {number} size
 * @returns {Array} - An array of arrays, each containing a chunk of the original array
 */
function chunkArray(arr, size) {
  const result = [];
  let i = 0;
  while (i < arr.length) {
    result.push(arr.slice(i, i + size));
    i += size;
  }
  return result;
}

/**
 * Validates the provided data against the expression and query.
 * It processes the data in batches to optimize performance and returns matched UUIDs.
 * This function checks for the presence of date selectors and handles different phases based on the selected dates.
 * @param {Array} data
 * @param {Array} expression
 * @param {string} query
 * @returns {Array} - An array of matched UUIDs based on the expression and query.
 * @throws {Error} - Throws an error if the data is invalid or if there are issues during processing.
 */
async function validateData(data, expression, query, res, options = {}) {
  const { writeFinalData = true, groupIndex = null } = options;

  let isTCCNo = expression.some((item) => item.type === "selector" && item.value?.selectedOption1 === "TCC" && item.value?.selectedOption2 === "Coverage Status");
  let isScreeningNo = expression.some((item) => item.type === "selector" && item.value?.selectedOption1 === "Screening" && item.value?.selectedOption2 === "Coverage Status");
  let isSurveyNo = expression.some((item) => item.type === "selector" && item.value?.selectedOption1 === "Survey" && item.value?.selectedOption2 === "Coverage Status");

  let priorityOrder = null;

  // Determine priority order based on query structure and presence of specific selectors
  if (query.includes("AND")) {
    if (isTCCNo) {
      priorityOrder = ["manual_vital_data", "Form_3", "Form_1", "patients1", "tcc_form"];
    } else if (isScreeningNo) {
      priorityOrder = ["Form_1", "patients1", "tcc_form", "manual_vital_data", "Form_3"];
    } else if (isSurveyNo) {
      priorityOrder = ["patients1", "tcc_form", "manual_vital_data", "Form_3", "Form_1"];
    } else {
      priorityOrder = ["tcc_form", "manual_vital_data", "Form_3", "Form_1", "patients1"];
    }
  } else {
    priorityOrder = ["patients1", "Form_1", "Form_3", "manual_vital_data", "tcc_form"];
  }

  // Only one of date range or phase date can be present between selectors
  let isDateRangePresent = false;
  let isPhaseDatePresent = false;
  let isPhase1 = false;
  let isPhase2 = false;
  let isPhase3 = false;

  let isBetween = false;

  let startData = null;
  let lastDate = null;

  const panchayathSelector = expression.find((item) => item.type === "selector" && item.value?.selectedOption2 === "Panchayath");
  const panchayathList = panchayathSelector?.value?.selectedOption3 || [];
  const hasChintamani = panchayathList.some((panchayath) => panchayath === "07");

  expression.forEach((item) => {
    if (item.type === "selector") {
      if (hasChintamani) {
        const option1 = item.value?.selectedOption1;
        const option2 = item.value?.selectedOption2;
        const option3 = item.value?.selectedOption3;
        const option4 = item.value?.selectedOption4;

        // Check for general Date range selector
        if (option4 === "general" && option2 === "Date") {
          isDateRangePresent = true;
          if (item.value?.selectedOption3?.SDate != null && item.value?.selectedOption3?.LDate != null) {
            startData = item.value?.selectedOption3?.SDate;
            lastDate = item.value?.selectedOption3?.LDate;
            if (startData <= p2StartTime_1 && lastDate <= p2StartTime_1) {
              isPhase1 = true;
            } else if (startData >= p2StartTime && lastDate >= p2StartTime) {
              isPhase2 = true;
            } else {
              isBetween = true;
            }
          }
        }

        // Check for Coverage Status phase date selector
        if ((option1 === "Survey" || option1 === "Screening" || option1 === "TCC") && option2 === "Coverage Status") {
          isPhaseDatePresent = true;
          if (option3 === "Covered in Phase 1") {
            isPhase1 = true;
          } else if (option3 === "Not Covered in Phase 1") {
            isPhase2 = true;
          } else if (option3 === "Covered in Phase 2") {
            isPhase2 = true;
          } else if (option3 === "Not Covered in Phase 2") {
            isPhase1 = true;
          }
        }
      } else {
        const option1 = item.value?.selectedOption1;
        const option2 = item.value?.selectedOption2;
        const option3 = item.value?.selectedOption3;
        const option4 = item.value?.selectedOption4;

        // Check for general Date range selector
        if (option4 === "general" && option2 === "Date") {
          isDateRangePresent = true;
          if (item.value?.selectedOption3?.SDate != null && item.value?.selectedOption3?.LDate != null) {
            startData = item.value?.selectedOption3?.SDate;
            lastDate = item.value?.selectedOption3?.LDate;
            if (startData <= p2StartTime && lastDate <= p2StartTime) {
              isPhase1 = true;
            } else if (startData >= p2StartTime && lastDate >= p2StartTime && startData < p3StartTime && lastDate < p3StartTime) {
              isPhase2 = true;
            } else if (startData >= p3StartTime && lastDate >= p3StartTime) {
              isPhase3 = true;
            } else {
              isBetween = true;
            }
          }
        }

        // Check for Coverage Status phase date selector
        if ((option1 === "Survey" || option1 === "Screening" || option1 === "TCC") && option2 === "Coverage Status") {
          isPhaseDatePresent = true;
          if (option3 === "Covered in Phase 1") {
            isPhase1 = true;
          } else if (option3 === "Not Covered in Phase 1") {
            isPhase2 = true;
            isPhase3 = true;
          } else if (option3 === "Covered in Phase 2") {
            isPhase2 = true;
          } else if (option3 === "Not Covered in Phase 2") {
            isPhase1 = true;
            isPhase3 = true;
          } else if (option3 === "Covered in Phase 3") {
            isPhase3 = true;
          } else if (option3 === "Not Covered in Phase 3") {
            isPhase1 = true;
            isPhase2 = true;
          }
        }
      }
    }
  });

  // Only one of date range or phase date can be present
  if (isDateRangePresent && isPhaseDatePresent) {
    throw new QueryFetchError("Cannot have both Date and Phase selectors in the same query", 400);
  }

  let isDatePresent = isDateRangePresent || isPhaseDatePresent;
  const formNodes = ["patients1", "Form_1", "manual_vital_data", "Form_3", "tcc_form"];
  const fetchDbRef = ref(database);
  const requiredNodes = Array.from(
    new Set(
      expression
        .filter((item) => item.type === "selector" && item.value && item.value.selectedOption4)
        .flatMap((item) => (Array.isArray(item.value.selectedOption4) ? item.value.selectedOption4 : [item.value.selectedOption4]))
        .filter(Boolean),
    ),
  );

  if (expression.some((item) => item.type === "selector" && (item.value?.selectedOption4 === "general" || item.value?.selectedOption2 === "Coverage Status")) && !requiredNodes.includes("Form_1")) {
    requiredNodes.push("Form_1");
  }

  const missingFormNodes = formNodes.filter((node) => !requiredNodes.includes(node));

  // console.log("isDatePresent:", isDatePresent, " isDateRangePresent:", isDateRangePresent, " isPhaseDatePresent:", isPhaseDatePresent);
  // console.log("isPhase1:", isPhase1, " isPhase2:", isPhase2, " isPhase3:", isPhase3, " isBetween:", isBetween);

  let patients = null;
  let allUUIDsCount = 0;

  for (const key of priorityOrder) {
    if (data[key]) {
      console.log("priorityOrder Processing data for key:", key);
      patients = data[key];
      Object.values(patients).forEach((panchayathData) => {
        if (typeof panchayathData !== "object") return;
        Object.values(panchayathData).forEach((villageData) => {
          if (typeof villageData !== "object") return;
          allUUIDsCount += Object.keys(villageData).length;
        });
      });
      break;
    }
  }

  if (!patients || allUUIDsCount === 0) {
    console.log("No patients data found or no UUIDs to process.");
    return writeFinalData ? 0 : [];
  }

  console.log("Total UUIDs to process: ", allUUIDsCount);

  const BATCH_SIZE = UUID_BATCH_SIZE;
  console.log("Batch size set to:", BATCH_SIZE);

  // Collect all UUID entries with their panchayathId and villageId for processing in batches
  const allUUIDEntries = [];
  for (const panchayathId in patients) {
    const panchayathData = patients[panchayathId];
    if (typeof panchayathData !== "object") continue;
    for (const villageId in panchayathData) {
      const villageData = panchayathData[villageId];
      if (typeof villageData !== "object") continue;
      for (const uuid of Object.keys(villageData)) {
        allUUIDEntries.push({ panchayathId, villageId, uuid });
      }
    }
  }

  function getMaxPhaseTimestamps(panchayathId, villageId, uuid, data) {
    let maxPhase1 = null;
    let maxPhase2 = null;
    let maxPhase3 = null;
    let maxPhaseAll = null;
    if (data) {
      const timestampKeys = Object.keys(data);
      if (timestampKeys.length > 0) {
        if (panchayathId === "07") {
          const phase1TimeStamps = timestampKeys.filter((t) => Number.isFinite(Number(t)) && Number(t) <= p2StartTime_1);
          const phase2TimeStamps = timestampKeys.filter((t) => Number.isFinite(Number(t)) && Number(t) >= p2StartTime_1);

          maxPhase1 = phase1TimeStamps.length > 0 ? Math.max(...phase1TimeStamps) : null;
          maxPhase2 = phase2TimeStamps.length > 0 ? Math.max(...phase2TimeStamps) : null;
          maxPhaseAll = Math.max(...timestampKeys);
          return { maxPhase1, maxPhase2, maxPhase3, maxPhaseAll };
        } else {
          const phase1TimeStamps = timestampKeys.filter((t) => Number.isFinite(Number(t)) && Number(t) <= p2StartTime);
          const phase2TimeStamps = timestampKeys.filter((t) => Number.isFinite(Number(t)) && Number(t) >= p2StartTime && Number(t) < p3StartTime);
          const phase3TimeStamps = timestampKeys.filter((t) => Number.isFinite(Number(t)) && Number(t) >= p3StartTime);

          maxPhase1 = phase1TimeStamps.length > 0 ? Math.max(...phase1TimeStamps) : null;
          maxPhase2 = phase2TimeStamps.length > 0 ? Math.max(...phase2TimeStamps) : null;
          maxPhase3 = phase3TimeStamps.length > 0 ? Math.max(...phase3TimeStamps) : null;
          maxPhaseAll = Math.max(...timestampKeys);
          return { maxPhase1, maxPhase2, maxPhase3, maxPhaseAll };
        }
      } else {
        return { maxPhase1, maxPhase2, maxPhase3, maxPhaseAll };
      }
    } else {
      return { maxPhase1, maxPhase2, maxPhase3, maxPhaseAll };
    }
  }

  const uuidBatches = chunkArray(allUUIDEntries, BATCH_SIZE);
  let processedUuidCount = 0;
  let matchedCount = 0;
  let lastProgressSent = 0;

  const matchedUUIDs = [];
  const streamedRows = [];
  for (const uuidBatch of uuidBatches) {
    const batchMatches = await mapWithConcurrency(uuidBatch, UUID_PROCESS_CONCURRENCY, async ({ panchayathId, villageId, uuid }) => {
      let profile_history1 = {};
      let patData = {};
      let form1Data = {};
      let MVD = {};
      let form3Data = {};
      let tccFormData = {};

      let Form1_maxTimestamp = null; // Using this variable for general when SDate and LDate are between phase 1 and phase 2
      let Form1_ph1MaxTimestamp = null; // Using this variable for general when SDate and LDate are in phase 1
      let Form1_ph2MaxTimestamp = null; // Using this variable for general when SDate and LDate are in phase 2
      let Form1_ph3MaxTimestamp = null; // Using this variable for general when SDate and LDate are in phase 3
      let form1Timesatamp = [];

      // Track per-node phase coverage based on timestamps
      // Using these flags when only Coverage Status is selected
      let ProfileHistory1_hasPhase1 = false;
      let ProfileHistory1_hasPhase2 = false;
      let ProfileHistory1_hasPhase3 = false;
      let Form1_hasPhase1 = false;
      let Form1_hasPhase2 = false;
      let Form1_hasPhase3 = false;
      let MVD_hasPhase1 = false;
      let MVD_hasPhase2 = false;
      let MVD_hasPhase3 = false;
      let Form3_hasPhase1 = false;
      let Form3_hasPhase2 = false;
      let Form3_hasPhase3 = false;
      let TCC_hasPhase1 = false;
      let TCC_hasPhase2 = false;
      let TCC_hasPhase3 = false;

      if (!patData || typeof patData !== "object") return;

      if (data["profile_history1"]) {
        const profileCData = data["profile_history1"][panchayathId]?.[villageId]?.[uuid] || {};
        if (profileCData) {
          const { maxPhase1, maxPhase2, maxPhase3, maxPhaseAll } = getMaxPhaseTimestamps(panchayathId, villageId, uuid, profileCData);
          if (isDatePresent) {
            // Date is selected or Coverage Status is selected
            if (isDateRangePresent) {
              // Date range is selected
              if (isPhase1 && maxPhase1) {
                profile_history1[maxPhase1] = profileCData[maxPhase1];
              } else if (isPhase2 && maxPhase2) {
                profile_history1[maxPhase2] = profileCData[maxPhase2];
              } else if (isPhase3 && maxPhase3) {
                profile_history1[maxPhase3] = profileCData[maxPhase3];
              } else if (isBetween && maxPhaseAll) {
                profile_history1[maxPhaseAll] = profileCData[maxPhaseAll];
              }
            } else if (isPhaseDatePresent) {
              // Coverage Status phase date is selected
              ProfileHistory1_hasPhase1 = maxPhase1 !== null;
              ProfileHistory1_hasPhase2 = maxPhase2 !== null;
              ProfileHistory1_hasPhase3 = maxPhase3 !== null;
              if (isPhase1 && maxPhase1) {
                profile_history1[maxPhase1] = profileCData[maxPhase1];
              }
              if (isPhase2 && maxPhase2) {
                profile_history1[maxPhase2] = profileCData[maxPhase2];
              }
              if (isPhase3 && maxPhase3) {
                profile_history1[maxPhase3] = profileCData[maxPhase3];
              }
            }
          } else {
            // No date or coverage status selected, get max timestamps from both phases
            if (maxPhase1 !== null) {
              profile_history1[maxPhase1] = profileCData[maxPhase1];
            }
            if (maxPhase2 !== null) {
              profile_history1[maxPhase2] = profileCData[maxPhase2];
            }
            if (maxPhase3 !== null) {
              profile_history1[maxPhase3] = profileCData[maxPhase3];
            }
          }
        }
      }
      if (data["patients1"]) {
        const patCData = data["patients1"][panchayathId]?.[villageId]?.[uuid] || {};
        if (patCData) {
          patData = patCData;
        }
      }
      if (data["Form_1"]) {
        const form1CData = data["Form_1"][panchayathId]?.[villageId]?.[uuid] || {};
        if (form1CData) {
          const { maxPhase1, maxPhase2, maxPhase3, maxPhaseAll } = getMaxPhaseTimestamps(panchayathId, villageId, uuid, form1CData);
          form1Timesatamp = form1CData ? Object.keys(form1CData) : [];
          if (isDatePresent) {
            // Date is selected or Coverage Status is selected
            if (isDateRangePresent) {
              // Date range is selected
              if (isPhase1 && maxPhase1) {
                form1Data[maxPhase1] = form1CData[maxPhase1];
                Form1_ph1MaxTimestamp = maxPhase1;
              } else if (isPhase2 && maxPhase2) {
                form1Data[maxPhase2] = form1CData[maxPhase2];
                Form1_ph2MaxTimestamp = maxPhase2;
              } else if (isPhase3 && maxPhase3) {
                form1Data[maxPhase3] = form1CData[maxPhase3];
                Form1_ph3MaxTimestamp = maxPhase3;
              } else if (isBetween && maxPhaseAll) {
                Form1_maxTimestamp = maxPhaseAll;
              }
            } else if (isPhaseDatePresent) {
              // Coverage Status phase date is selected
              Form1_hasPhase1 = maxPhase1 !== null;
              Form1_hasPhase2 = maxPhase2 !== null;
              Form1_hasPhase3 = maxPhase3 !== null;
              if (isPhase1 && maxPhase1) {
                form1Data[maxPhase1] = form1CData[maxPhase1];
              }
              if (isPhase2 && maxPhase2) {
                form1Data[maxPhase2] = form1CData[maxPhase2];
              }
              if (isPhase3 && maxPhase3) {
                form1Data[maxPhase3] = form1CData[maxPhase3];
              }
            }
          } else {
            // No date or coverage status selected, get max timestamps from both phases
            if (maxPhase1 !== null) {
              form1Data[maxPhase1] = form1CData[maxPhase1];
            }
            if (maxPhase2 !== null) {
              form1Data[maxPhase2] = form1CData[maxPhase2];
            }
            if (maxPhase3 !== null) {
              form1Data[maxPhase3] = form1CData[maxPhase3];
            }
          }
        }
      }
      if (data["manual_vital_data"]) {
        const manualVitalData = data["manual_vital_data"][panchayathId]?.[villageId]?.[uuid] || {};
        if (manualVitalData) {
          const { maxPhase1, maxPhase2, maxPhase3, maxPhaseAll } = getMaxPhaseTimestamps(panchayathId, villageId, uuid, manualVitalData);
          if (isDatePresent) {
            // Date is selected or Coverage Status is selected
            if (isDateRangePresent) {
              // Date range is selected
              if (isPhase1 && maxPhase1) {
                MVD[maxPhase1] = manualVitalData[maxPhase1];
              } else if (isPhase2 && maxPhase2) {
                MVD[maxPhase2] = manualVitalData[maxPhase2];
              } else if (isPhase3 && maxPhase3) {
                MVD[maxPhase3] = manualVitalData[maxPhase3];
              } else if (isBetween && maxPhaseAll) {
                MVD[maxPhaseAll] = manualVitalData[maxPhaseAll];
              }
            } else if (isPhaseDatePresent) {
              // Coverage Status phase date is selected
              MVD_hasPhase1 = maxPhase1 !== null;
              MVD_hasPhase2 = maxPhase2 !== null;
              MVD_hasPhase3 = maxPhase3 !== null;
              if (isPhase1 && maxPhase1) {
                MVD[maxPhase1] = manualVitalData[maxPhase1];
              }
              if (isPhase2 && maxPhase2) {
                MVD[maxPhase2] = manualVitalData[maxPhase2];
              }
              if (isPhase3 && maxPhase3) {
                MVD[maxPhase3] = manualVitalData[maxPhase3];
              }
            }
          } else {
            // No date or coverage status selected, get max timestamps from both phases
            if (maxPhase1 !== null) {
              MVD[maxPhase1] = manualVitalData[maxPhase1];
            }
            if (maxPhase2 !== null) {
              MVD[maxPhase2] = manualVitalData[maxPhase2];
            }
            if (maxPhase3 !== null) {
              MVD[maxPhase3] = manualVitalData[maxPhase3];
            }
          }
        }
      }
      if (data["Form_3"]) {
        const form3CData = data["Form_3"][panchayathId]?.[villageId]?.[uuid] || {};
        if (form3CData) {
          const { maxPhase1, maxPhase2, maxPhase3, maxPhaseAll } = getMaxPhaseTimestamps(panchayathId, villageId, uuid, form3CData);
          if (isDatePresent) {
            // Date is selected or Coverage Status is selected
            if (isDateRangePresent) {
              if (isPhase1 && maxPhase1) {
                form3Data[maxPhase1] = form3CData[maxPhase1];
              } else if (isPhase2 && maxPhase2) {
                form3Data[maxPhase2] = form3CData[maxPhase2];
              } else if (isPhase3 && maxPhase3) {
                form3Data[maxPhase3] = form3CData[maxPhase3];
              } else if (isBetween && maxPhaseAll) {
                form3Data[maxPhaseAll] = form3CData[maxPhaseAll];
              }
            } else if (isPhaseDatePresent) {
              // Coverage Status phase date is selected
              Form3_hasPhase1 = maxPhase1 !== null;
              Form3_hasPhase2 = maxPhase2 !== null;
              Form3_hasPhase3 = maxPhase3 !== null;
              if (isPhase1 && maxPhase1) {
                form3Data[maxPhase1] = form3CData[maxPhase1];
              }
              if (isPhase2 && maxPhase2) {
                form3Data[maxPhase2] = form3CData[maxPhase2];
              }
              if (isPhase3 && maxPhase3) {
                form3Data[maxPhase3] = form3CData[maxPhase3];
              }
            }
          } else {
            // No date or coverage status selected, get max timestamps from both phases
            if (maxPhase1 !== null) {
              form3Data[maxPhase1] = form3CData[maxPhase1];
            }
            if (maxPhase2 !== null) {
              form3Data[maxPhase2] = form3CData[maxPhase2];
            }
            if (maxPhase3 !== null) {
              form3Data[maxPhase3] = form3CData[maxPhase3];
            }
          }
        }
      }
      if (data["tcc_form"]) {
        const tccFormCData = data["tcc_form"][panchayathId]?.[villageId]?.[uuid] || {};
        if (tccFormCData) {
          const { maxPhase1, maxPhase2, maxPhase3, maxPhaseAll } = getMaxPhaseTimestamps(panchayathId, villageId, uuid, tccFormCData);
          if (isDatePresent) {
            if (isDateRangePresent) {
              if (isPhase1 && maxPhase1) {
                tccFormData[maxPhase1] = tccFormCData[maxPhase1];
              } else if (isPhase2 && maxPhase2) {
                tccFormData[maxPhase2] = tccFormCData[maxPhase2];
              } else if (isPhase3 && maxPhase3) {
                tccFormData[maxPhase3] = tccFormCData[maxPhase3];
              } else if (isBetween && maxPhaseAll) {
                tccFormData[maxPhaseAll] = tccFormCData[maxPhaseAll];
              }
            } else if (isPhaseDatePresent) {
              TCC_hasPhase1 = maxPhase1 !== null;
              TCC_hasPhase2 = maxPhase2 !== null;
              TCC_hasPhase3 = maxPhase3 !== null;
              if (isPhase1 && maxPhase1) {
                tccFormData[maxPhase1] = tccFormCData[maxPhase1];
              }
              if (isPhase2 && maxPhase2) {
                tccFormData[maxPhase2] = tccFormCData[maxPhase2];
              }
              if (isPhase3 && maxPhase3) {
                tccFormData[maxPhase3] = tccFormCData[maxPhase3];
              }
            }
          } else {
            if (maxPhase1 !== null) {
              tccFormData[maxPhase1] = tccFormCData[maxPhase1];
            }
            if (maxPhase2 !== null) {
              tccFormData[maxPhase2] = tccFormCData[maxPhase2];
            }
            if (maxPhase3 !== null) {
              tccFormData[maxPhase3] = tccFormCData[maxPhase3];
            }
          }
        }
      }

      const conditionMap = {};
      for (const item of expression) {
        if (item.type === "selector") {
          const { label, value } = item;
          const { selectedOption2, selectedOption3, selectedOption4 } = value;

          if (selectedOption4 === "patients1" && !Array.isArray(selectedOption4)) {
            if (profile_history1 && Object.keys(profile_history1).length > 0) {
              // Validate against profile_history1 data
              conditionMap[label] = option3Validator(selectedOption2, selectedOption3, profile_history1, "profile_history1");
            } else {
              // Validate against patients1 data if profile_history1 is not present
              conditionMap[label] = option3Validator(selectedOption2, selectedOption3, patData, selectedOption4);
            }
          } else if (selectedOption4 === "Form_1" && !Array.isArray(selectedOption4)) {
            // Validate against Form_1 data
            conditionMap[label] = option3Validator(selectedOption2, selectedOption3, form1Data, selectedOption4);
          } else if (selectedOption4 === "manual_vital_data" && !Array.isArray(selectedOption4)) {
            // Validate against manual_vital_data
            conditionMap[label] = option3Validator(selectedOption2, selectedOption3, MVD, selectedOption4);
          } else if (selectedOption4 === "Form_3" && !Array.isArray(selectedOption4)) {
            // Validate against Form_3 data
            conditionMap[label] = option3Validator(selectedOption2, selectedOption3, form3Data, selectedOption4);
          } else if (selectedOption4 === "tcc_form" && !Array.isArray(selectedOption4)) {
            // Validate against tcc_form data
            conditionMap[label] = option3Validator(selectedOption2, selectedOption3, tccFormData, selectedOption4);
          } else if (selectedOption4 === "general" && selectedOption2 === "Panchayath" && selectedOption3.includes(panchayathId)) {
            // set true if panchayathId matches
            conditionMap[label] = true;
          } else if (selectedOption4 === "general" && selectedOption2 === "Village" && selectedOption3 === villageId) {
            // set true if villageId matches
            conditionMap[label] = true;
          } else if (selectedOption4 === "general" && selectedOption2 === "Date" && isDatePresent && isPhase1 && Form1_ph1MaxTimestamp) {
            // set true if date is present and in phase 1
            conditionMap[label] = true;
          } else if (selectedOption4 === "general" && selectedOption2 === "Date" && isDatePresent && isPhase2 && Form1_ph2MaxTimestamp) {
            // set true if date is present and in phase 2
            conditionMap[label] = true;
          } else if (selectedOption4 === "general" && selectedOption2 === "Date" && isDatePresent && isPhase3 && Form1_ph3MaxTimestamp) {
            // set true if date is present and in phase 3
            conditionMap[label] = true;
          } else if (
            selectedOption4 === "general" &&
            selectedOption2 === "Date" &&
            isDatePresent &&
            isBetween &&
            form1Timesatamp.length &&
            form1Timesatamp.some((t) => Number.isFinite(Number(t)) && Number(t) >= startData && Number(t) <= lastDate)
          ) {
            // set true if date is present and in between phases
            conditionMap[label] = true;
          } else if (selectedOption2 === "Coverage Status" && Array.isArray(selectedOption4) && selectedOption4.includes("patients1") && selectedOption4.includes("Form_1")) {
            // Survey Coverage Status conditions
            if (selectedOption3 === "Covered in Phase 1") {
              conditionMap[label] = Form1_hasPhase1;
            } else if (selectedOption3 === "Covered in Phase 2") {
              conditionMap[label] = Form1_hasPhase2;
            } else if (selectedOption3 === "Covered in Phase 3") {
              conditionMap[label] = Form1_hasPhase3;
            } else if (selectedOption3 === "Not Covered in Phase 1") {
              conditionMap[label] = !Form1_hasPhase1;
            } else if (selectedOption3 === "Not Covered in Phase 2") {
              conditionMap[label] = !Form1_hasPhase2;
            } else if (selectedOption3 === "Not Covered in Phase 3") {
              conditionMap[label] = !Form1_hasPhase3;
            } else {
              conditionMap[label] = false;
            }
          } else if (selectedOption2 === "Coverage Status" && Array.isArray(selectedOption4) && selectedOption4.includes("Form_3") && selectedOption4.includes("manual_vital_data")) {
            // Screening Coverage Status conditions
            if (selectedOption3 === "Covered in Phase 1") {
              conditionMap[label] = MVD_hasPhase1 && Form3_hasPhase1;
            } else if (selectedOption3 === "Covered in Phase 2") {
              conditionMap[label] = MVD_hasPhase2 && Form3_hasPhase2;
            } else if (selectedOption3 === "Covered in Phase 3") {
              conditionMap[label] = MVD_hasPhase3 && Form3_hasPhase3;
            } else if (selectedOption3 === "Not Covered in Phase 1") {
              conditionMap[label] = !Form3_hasPhase1 && !MVD_hasPhase1;
            } else if (selectedOption3 === "Not Covered in Phase 2") {
              conditionMap[label] = !Form3_hasPhase2 && !MVD_hasPhase2;
            } else if (selectedOption3 === "Not Covered in Phase 3") {
              conditionMap[label] = !Form3_hasPhase3 && !MVD_hasPhase3;
            } else {
              conditionMap[label] = false;
            }
          } else if (selectedOption2 === "Coverage Status" && Array.isArray(selectedOption4) && selectedOption4.includes("tcc_form")) {
            // TCC Coverage Status conditions
            if (selectedOption3 === "Covered in Phase 1") {
              conditionMap[label] = TCC_hasPhase1;
            } else if (selectedOption3 === "Covered in Phase 2") {
              conditionMap[label] = TCC_hasPhase2;
            } else if (selectedOption3 === "Covered in Phase 3") {
              conditionMap[label] = TCC_hasPhase3;
            } else if (selectedOption3 === "Not Covered in Phase 1") {
              conditionMap[label] = !TCC_hasPhase1;
            } else if (selectedOption3 === "Not Covered in Phase 2") {
              conditionMap[label] = !TCC_hasPhase2;
            } else if (selectedOption3 === "Not Covered in Phase 3") {
              conditionMap[label] = !TCC_hasPhase3;
            } else {
              conditionMap[label] = false;
            }
          } else {
            // No matching condition, set to false
            conditionMap[label] = false;
          }
        }
      }

      let processedQuery = query;
      for (const label in conditionMap) {
        processedQuery = processedQuery.replace(new RegExp(`\\b${label}\\b`, "g"), conditionMap[label]);
      }

      const preEvalIssues = findQueryBreakIssues(processedQuery, conditionMap);
      if (preEvalIssues.length > 0) {
        console.log(`[QueryFetch_V1] Possible query break for ${panchayathId}/${villageId}/${uuid}` + (groupIndex ? ` (group ${groupIndex})` : ""));
        console.log("[QueryFetch_V1] Issues:", preEvalIssues);
        console.log("[QueryFetch_V1] Original query:", query);
        console.log("[QueryFetch_V1] Processed (pre AND/OR convert):", processedQuery);
      }

      try {
        processedQuery = processedQuery.replace(/AND/g, "&&").replace(/OR/g, "||");
        const postConvertIssues = findQueryBreakIssues(processedQuery, conditionMap);
        if (postConvertIssues.length > 0) {
          console.log(`[QueryFetch_V1] Query still looks broken after AND/OR convert for ${panchayathId}/${villageId}/${uuid}` + (groupIndex ? ` (group ${groupIndex})` : ""));
          console.log("[QueryFetch_V1] Issues:", postConvertIssues);
          console.log("[QueryFetch_V1] Processed (post AND/OR convert):", processedQuery);
        }
        const evaluation = eval(processedQuery);
        if (evaluation) {
          // UUID matches the query conditions fetch the other node data that were not in required nodes
          const infoObject = {
            patients1: patData,
            Form_1: form1Data,
            manual_vital_data: MVD,
            Form_3: form3Data,
            tcc_form: tccFormData,
            profile_history1: profile_history1,
          };

          const fetchPromises = missingFormNodes.map(async (node) => {
            try {
              const snapshot = await get(child(fetchDbRef, `${node}/${panchayathId}/${villageId}/${uuid}`));
              if (snapshot && snapshot.exists()) {
                const nodeData = snapshot.val();
                if (node !== "patients1") {
                  const { maxPhase1, maxPhase2, maxPhase3, maxPhaseAll } = getMaxPhaseTimestamps(panchayathId, villageId, uuid, nodeData);
                  infoObject[node] = {};
                  if (isDatePresent) {
                    if (isPhase1 && maxPhase1) {
                      infoObject[node][maxPhase1] = nodeData[maxPhase1];
                    }
                    if (isPhase2 && maxPhase2) {
                      infoObject[node][maxPhase2] = nodeData[maxPhase2];
                    }
                    if (isPhase3 && maxPhase3) {
                      infoObject[node][maxPhase3] = nodeData[maxPhase3];
                    }
                    if (isBetween && maxPhaseAll) {
                      infoObject[node][maxPhaseAll] = nodeData[maxPhaseAll];
                    }
                  } else {
                    if (maxPhase1 !== null) {
                      infoObject[node][maxPhase1] = nodeData[maxPhase1];
                    }
                    if (maxPhase2 !== null) {
                      infoObject[node][maxPhase2] = nodeData[maxPhase2];
                    }
                    if (maxPhase3 !== null) {
                      infoObject[node][maxPhase3] = nodeData[maxPhase3];
                    }
                  }
                } else {
                  infoObject[node] = { ...nodeData };
                }
              } else {
                infoObject[node] = {};
              }
            } catch (err) {
              console.error(`Error fetching ${node} for UUID ${uuid}:`, err);
              infoObject[node] = null;
            }
          });

          await Promise.all(fetchPromises);

          return {
            _key: `${panchayathId}/${villageId}/${uuid}`,
            uuid,
            panchayathId,
            villageId,
            ...infoObject,
          };
        }
      } catch (error) {
        console.error(`Error evaluating expression for UUID ${uuid}:`, error);
        console.error("[QueryFetch_V1] Eval context:", {
          key: `${panchayathId}/${villageId}/${uuid}`,
          group: groupIndex ?? undefined,
          originalQuery: query,
          processedQuery,
        });
      }
      return null;
    });

    for (const matchedRow of batchMatches) {
      processedUuidCount++;

      if (!matchedRow) {
        if (processedUuidCount - lastProgressSent >= PROGRESS_UPDATE_EVERY) {
          await writeStreamMessage(res, { processed: processedUuidCount, ...(groupIndex ? { group: groupIndex } : {}) });
          lastProgressSent = processedUuidCount;
        }
        continue;
      }

      matchedCount++;

      if (writeFinalData) {
        streamedRows.push(matchedRow);
        if (streamedRows.length >= RESULT_STREAM_CHUNK_SIZE) {
          await streamResultRows(res, streamedRows.splice(0, streamedRows.length));
        }
      } else {
        matchedUUIDs.push(matchedRow);
      }

      if (processedUuidCount - lastProgressSent >= PROGRESS_UPDATE_EVERY) {
        await writeStreamMessage(res, { processed: processedUuidCount, ...(groupIndex ? { group: groupIndex } : {}) });
        lastProgressSent = processedUuidCount;
      }
    }
  }

  if (processedUuidCount !== lastProgressSent) {
    await writeStreamMessage(res, { processed: processedUuidCount, ...(groupIndex ? { group: groupIndex } : {}) });
  }

  if (writeFinalData) {
    if (streamedRows.length > 0) {
      await streamResultRows(res, streamedRows);
    }
    console.log("Matched UUIDs length: ", matchedCount);
    return matchedCount;
  }

  console.log("Matched UUIDs length: ", matchedUUIDs.length);
  return matchedUUIDs;
}
