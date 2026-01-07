import { database } from "../db/config.js";
import { ref, child, get } from "firebase/database";
import option3Validator from "../utils/option3Validator.js";
import util from "util";

const stTime = 1704047400;

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
    console.log("Expression :", util.inspect(expression, { depth: null, maxArrayLength: null }));

    const dbRef = ref(database);

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Transfer-Encoding", "chunked");

    const requiredNodes = Array.from(
      new Set(
        expression
          .filter((item) => item.type === "selector" && item.value && item.value.selectedOption4)
          .flatMap((item) => (Array.isArray(item.value.selectedOption4) ? item.value.selectedOption4 : [item.value.selectedOption4]))
          .filter(Boolean)
      )
    );

    if (expression.some((item) => item.type === "selector" && item.value?.selectedOption4 === "general") && !requiredNodes.includes("Form_1")) {
      requiredNodes.push("Form_1");
    }

    console.log("Required Nodes:", requiredNodes);
    const snapshots = {};

    // Fetch all required nodes in parallel
    await Promise.all(
      requiredNodes.map(async (node) => {
        snapshots[node] = await get(child(dbRef, `${node}/`));
        res.write(JSON.stringify({ fetching: node }) + "\n");
      })
    );

    const patientData = {};
    for (const key in snapshots) {
      if (snapshots[key].exists()) {
        patientData[key] = snapshots[key].val();
      }
    }

    // If the query is structured as top-level parenthesis groups joined by AND,
    // evaluate each group independently and intersect results.
    // This prevents Phase-1/Phase-2 data from being combined before evaluation.
    const grouped = splitTopLevelParenGroups(expression);
    if (grouped.groups.length >= 2 && grouped.operators.length === grouped.groups.length - 1 && grouped.operators.every((op) => op === "AND")) {
      res.write(JSON.stringify({ mode: "grouped-intersection", groups: grouped.groups.length }) + "\n");

      const groupResults = [];
      for (let i = 0; i < grouped.groups.length; i++) {
        const groupExpression = grouped.groups[i];
        const groupQuery = buildQueryStringFromExpressionTokens(groupExpression);
        res.write(JSON.stringify({ group: i + 1, query: groupQuery }) + "\n");
        // Collect results without writing final data for each group.
        const result = await validateData(patientData, groupExpression, groupQuery, res, { writeFinalData: false, groupIndex: i + 1 });
        groupResults.push(result);
      }

      const intersected = intersectMatchedResults(groupResults);
      res.write(JSON.stringify({ data: intersected }) + "\n");
    } else {
      await validateData(patientData, expression, expressionString, res);
    }
  } catch (error) {
    console.error("Error in patientData function:", error);

    res.status(500).json({ error: "Internal Server Error", message: error.message });
  } finally {
    const reqEndTime = Date.now();
    const duration = reqEndTime - reqStartTime;
    console.log(`Request processed in ${duration} ms`);
    console.log("====== Query Fetch Ends ====");
    console.log("\n\n");
    res.end();
  }
}

function splitTopLevelParenGroups(expression) {
  const groups = [];
  const operators = [];

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

  return { groups, operators };
}

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

function mergeMatchedObjects(a, b) {
  if (!a) return b;
  if (!b) return a;

  const merged = { ...a, ...b };
  // Merge known node objects more safely.
  const nodeKeys = ["patients1", "Form_1", "manual_vital_data", "Form_3", "tcc_form"];
  for (const k of nodeKeys) {
    if (a[k] && b[k] && typeof a[k] === "object" && typeof b[k] === "object") {
      merged[k] = { ...a[k], ...b[k] };
    }
  }
  return merged;
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

  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    return res.status(400).json({ message: "No data found" });
  }

  let isTCCNo = expression.some((item) => item.type === "selector" && item.value?.selectedOption1 === "TCC" && item.value?.selectedOption2 === "No");
  let isScreeningNo = expression.some((item) => item.type === "selector" && item.value?.selectedOption1 === "Screening" && item.value?.selectedOption2 === "No");
  let isSurveyNo = expression.some((item) => item.type === "selector" && item.value?.selectedOption1 === "Survey" && item.value?.selectedOption2 === "No");

  let priorityOrder = null;

  if (query.includes("AND")) {
    if (isTCCNo) {
      priorityOrder = ["manual_vital_data", "Form_3", "Form_1", "patients1", "tcc_form"];
    } else if (isScreeningNo) {
      priorityOrder = ["Form_1", "patients1", "tcc_form", "manual_vital_data", "Form_3"];
    } else if (isSurveyNo) {
      priorityOrder = ["patients1"];
    } else {
      priorityOrder = ["tcc_form", "manual_vital_data", "Form_3", "Form_1", "patients1"];
    }
  } else {
    priorityOrder = ["patients1", "Form_1", "Form_3", "manual_vital_data", "tcc_form"];
  }
  // Only one of date range or phase date can be present between selectors
  let isDateRangePresent = false;
  let isPhaseDatePresent = false;
  let selectedDates = { SDate: null, LDate: null };
  let isPhase1 = false;
  let isPhase2 = false;
  let isBetween = false;
  expression.forEach((item) => {
    if (item.type !== "selector" || item.value?.selectedOption4 !== "general") return;

    const option2 = item.value?.selectedOption2;

    if (option2 === "Date") {
      isDateRangePresent = true;
      // Capture the selected date range for later evaluation (general Date selector).
      if (item.value?.selectedOption3?.SDate != null && item.value?.selectedOption3?.LDate != null) {
        selectedDates = {
          SDate: Number(item.value.selectedOption3.SDate),
          LDate: Number(item.value.selectedOption3.LDate),
        };
      }
      if (item.value?.selectedOption3?.SDate <= stTime && item.value?.selectedOption3?.LDate <= stTime) {
        isPhase1 = true;
      } else if (item.value?.selectedOption3?.SDate >= stTime && item.value?.selectedOption3?.LDate >= stTime) {
        isPhase2 = true;
      } else {
        isBetween = true;
      }
    }

    if (option2 === "Phase 1" || option2 === "Phase 2") {
      isPhaseDatePresent = true;
      if (option2 === "Phase 1") {
        isPhase1 = true;
      }
      if (option2 === "Phase 2") {
        isPhase2 = true;
      }
    }
  });
  // Only one of date range or phase date can be present
  if (isDateRangePresent && isPhaseDatePresent) {
    return res.status(400).json({ message: "Cannot have both Date and Phase selectors in the same query" });
  }
  let isDatePresent = isDateRangePresent || isPhaseDatePresent;

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
    return res.status(400).json({ message: "No data found" });
  }

  console.log("Total UUIDs to process: ", allUUIDsCount);

  const BATCH_SIZE = 500;
  console.log("Batch size set to:", BATCH_SIZE);

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
  const uuidBatches = chunkArray(allUUIDEntries, BATCH_SIZE);
  let processedCount = 0;

  const matchedUUIDs = [];
  for (const uuidBatch of uuidBatches) {
    await Promise.all(
      uuidBatch.map(async ({ panchayathId, villageId, uuid }) => {
        let patData = {};
        let form1Data = {};
        let Form1_maxTimestamp = null;
        let Form1_ph1MaxTimestamp = null;
        let Form1_ph2MaxTimestamp = null;

        let form1Timesatamp = [];
        let MVD = {};
        let form3Data = {};
        let tccFormData = {};
        if (!patData || typeof patData !== "object") return;

        if (data["patients1"]) {
          const patCData = data["patients1"][panchayathId]?.[villageId]?.[uuid] || {};
          if (patCData) {
            patData = patCData;
          }
        }
        if (data["Form_1"]) {
          const form1CData = data["Form_1"][panchayathId]?.[villageId]?.[uuid] || {};
          if (form1CData) {
            if (isDatePresent) {
              const timestampKeys = Object.keys(form1CData)
                .map((t) => Number(t))
                .filter((t) => Number.isFinite(t));
              if (isDateRangePresent) {
                if (isPhase1) {
                  const filteredPhase1Timestamps = timestampKeys.filter((timestamp) => timestamp <= stTime);
                  if (filteredPhase1Timestamps.length > 0) {
                    Form1_ph1MaxTimestamp = Math.max(...filteredPhase1Timestamps);
                    form1Data[Form1_ph1MaxTimestamp] = form1CData[String(Form1_ph1MaxTimestamp)];
                  } else {
                    Form1_ph1MaxTimestamp = null;
                  }
                } else if (isPhase2) {
                  const filteredPhase2Timestamps = timestampKeys.filter((timestamp) => timestamp >= stTime);
                  if (filteredPhase2Timestamps.length > 0) {
                    Form1_ph2MaxTimestamp = Math.max(...filteredPhase2Timestamps);
                    form1Data[Form1_ph2MaxTimestamp] = form1CData[String(Form1_ph2MaxTimestamp)];
                  } else {
                    Form1_ph2MaxTimestamp = null;
                  }
                } else if (isBetween) {
                  if (timestampKeys.length > 0) {
                    Form1_maxTimestamp = Math.max(...timestampKeys);
                    form1Data[Form1_maxTimestamp] = form1CData[String(Form1_maxTimestamp)];
                  } else {
                    Form1_maxTimestamp = null;
                  }
                }
              } else if (isPhaseDatePresent) {
                if (isPhase1) {
                  const filteredPhase1Timestamps = timestampKeys.filter((timestamp) => timestamp <= stTime);
                  if (filteredPhase1Timestamps.length > 0) {
                    Form1_ph1MaxTimestamp = Math.max(...filteredPhase1Timestamps);
                    form1Data[Form1_ph1MaxTimestamp] = form1CData[String(Form1_ph1MaxTimestamp)];
                  } else {
                    Form1_ph1MaxTimestamp = null;
                  }
                }
                if (isPhase2) {
                  const filteredPhase2Timestamps = timestampKeys.filter((timestamp) => timestamp >= stTime);
                  if (filteredPhase2Timestamps.length > 0) {
                    Form1_ph2MaxTimestamp = Math.max(...filteredPhase2Timestamps);
                    form1Data[Form1_ph2MaxTimestamp] = form1CData[String(Form1_ph2MaxTimestamp)];
                  } else {
                    Form1_ph2MaxTimestamp = null;
                  }
                }
              }
            } else {
              let maxPhase1Timestamp = null;
              let maxPhase2Timestamp = null;
              Object.keys(form1CData).forEach((timestamp) => {
                if (Number(timestamp) <= stTime) {
                  if (!maxPhase1Timestamp || Number(timestamp) > Number(maxPhase1Timestamp)) {
                    maxPhase1Timestamp = timestamp;
                  }
                }
                if (Number(timestamp) >= stTime) {
                  if (!maxPhase2Timestamp || Number(timestamp) > Number(maxPhase2Timestamp)) {
                    maxPhase2Timestamp = timestamp;
                  }
                }
              });
              form1Timesatamp = Math.max(maxPhase1Timestamp, maxPhase2Timestamp);
              if (maxPhase1Timestamp !== null) {
                form1Data[maxPhase1Timestamp] = form1CData[maxPhase1Timestamp];
              }
              if (maxPhase2Timestamp !== null) {
                form1Data[maxPhase2Timestamp] = form1CData[maxPhase2Timestamp];
              }
            }
          }
        }
        if (data["manual_vital_data"]) {
          const manualVitalData = data["manual_vital_data"][panchayathId]?.[villageId]?.[uuid] || {};
          if (manualVitalData) {
            if (isDatePresent) {
              const timestampKeys = Object.keys(manualVitalData);
              if (isDateRangePresent) {
                if (isPhase1) {
                  const filteredTimestamps = timestampKeys.filter((timestamp) => timestamp <= stTime);
                  const maxTimestamp = Math.max(...filteredTimestamps.map(Number));
                  if (maxTimestamp !== -Infinity) {
                    MVD[maxTimestamp] = manualVitalData[maxTimestamp];
                  }
                } else if (isPhase2) {
                  const filteredTimestamps = timestampKeys.filter((timestamp) => timestamp >= stTime);
                  const maxTimestamp = Math.max(...filteredTimestamps.map(Number));
                  if (maxTimestamp !== -Infinity) {
                    MVD[maxTimestamp] = manualVitalData[maxTimestamp];
                  }
                } else if (isBetween) {
                  const timestampKeys = Object.keys(manualVitalData);
                  const maxTimestamp = Math.max(...timestampKeys.map(Number));
                  if (maxTimestamp !== -Infinity) {
                    MVD[maxTimestamp] = manualVitalData[maxTimestamp];
                  }
                }
              } else if (isPhaseDatePresent) {
                if (isPhase1) {
                  const filteredTimestamps = timestampKeys.filter((timestamp) => timestamp <= stTime);
                  const maxTimestamp = Math.max(...filteredTimestamps.map(Number));
                  if (maxTimestamp !== -Infinity) {
                    MVD[maxTimestamp] = manualVitalData[maxTimestamp];
                  }
                }
                if (isPhase2) {
                  const filteredTimestamps = timestampKeys.filter((timestamp) => timestamp >= stTime);
                  const maxTimestamp = Math.max(...filteredTimestamps.map(Number));
                  if (maxTimestamp !== -Infinity) {
                    MVD[maxTimestamp] = manualVitalData[maxTimestamp];
                  }
                }
              }
            } else {
              let maxPhase1Timestamp = null;
              let maxPhase2Timestamp = null;
              Object.keys(manualVitalData).forEach((timestamp) => {
                if (timestamp <= stTime) {
                  if (!maxPhase1Timestamp || Number(timestamp) > Number(maxPhase1Timestamp)) {
                    maxPhase1Timestamp = timestamp;
                  }
                }
                if (timestamp >= stTime) {
                  if (!maxPhase2Timestamp || Number(timestamp) > Number(maxPhase2Timestamp)) {
                    maxPhase2Timestamp = timestamp;
                  }
                }
              });
              if (maxPhase1Timestamp !== null) {
                MVD[maxPhase1Timestamp] = manualVitalData[maxPhase1Timestamp];
              }
              if (maxPhase2Timestamp !== null) {
                MVD[maxPhase2Timestamp] = manualVitalData[maxPhase2Timestamp];
              }
            }
          }
        }
        if (data["Form_3"]) {
          const form3CData = data["Form_3"][panchayathId]?.[villageId]?.[uuid] || {};
          if (form3CData) {
            if (isDatePresent) {
              const timestampKeys = Object.keys(form3CData);
              if (isDateRangePresent) {
                if (isPhase1) {
                  const filteredTimestamps = timestampKeys.filter((timestamp) => timestamp <= stTime);
                  const maxTimestamp = Math.max(...filteredTimestamps.map(Number));
                  if (maxTimestamp !== -Infinity) {
                    form3Data[maxTimestamp] = form3CData[maxTimestamp];
                  }
                } else if (isPhase2) {
                  const filteredTimestamps = timestampKeys.filter((timestamp) => timestamp >= stTime);
                  const maxTimestamp = Math.max(...filteredTimestamps.map(Number));
                  if (maxTimestamp !== -Infinity) {
                    form3Data[maxTimestamp] = form3CData[maxTimestamp];
                  }
                } else if (isBetween) {
                  const maxTimestamp = Math.max(...timestampKeys.map(Number));
                  if (maxTimestamp !== -Infinity) {
                    form3Data[maxTimestamp] = form3CData[maxTimestamp];
                  }
                }
              } else if (isPhaseDatePresent) {
                if (isPhase1) {
                  const filteredTimestamps = timestampKeys.filter((timestamp) => timestamp <= stTime);
                  const maxTimestamp = Math.max(...filteredTimestamps.map(Number));
                  if (maxTimestamp !== -Infinity) {
                    form3Data[maxTimestamp] = form3CData[maxTimestamp];
                  }
                }
                if (isPhase2) {
                  const filteredTimestamps = timestampKeys.filter((timestamp) => timestamp >= stTime);
                  const maxTimestamp = Math.max(...filteredTimestamps.map(Number));
                  if (maxTimestamp !== -Infinity) {
                    form3Data[maxTimestamp] = form3CData[maxTimestamp];
                  }
                }
              }
            } else {
              let maxPhase1Timestamp = null;
              let maxPhase2Timestamp = null;
              Object.keys(form3CData).forEach((timestamp) => {
                if (timestamp <= stTime) {
                  if (!maxPhase1Timestamp || Number(timestamp) > Number(maxPhase1Timestamp)) {
                    maxPhase1Timestamp = timestamp;
                  }
                }
                if (timestamp >= stTime) {
                  if (!maxPhase2Timestamp || Number(timestamp) > Number(maxPhase2Timestamp)) {
                    maxPhase2Timestamp = timestamp;
                  }
                }
              });
              if (maxPhase1Timestamp !== null) {
                form3Data[maxPhase1Timestamp] = form3CData[maxPhase1Timestamp];
              }
              if (maxPhase2Timestamp !== null) {
                form3Data[maxPhase2Timestamp] = form3CData[maxPhase2Timestamp];
              }
            }
          }
        }
        if (data["tcc_form"]) {
          const tccFormCData = data["tcc_form"][panchayathId]?.[villageId]?.[uuid] || {};
          if (tccFormCData) {
            if (isDatePresent) {
              const timestampKeys = Object.keys(tccFormCData);
              if (isDateRangePresent) {
                if (isPhase1) {
                  const filteredTimestamps = timestampKeys.filter((timestamp) => timestamp <= stTime);
                  const maxTimestamp = Math.max(...filteredTimestamps.map(Number));
                  if (maxTimestamp !== -Infinity) {
                    tccFormData[maxTimestamp] = tccFormCData[maxTimestamp];
                  }
                } else if (isPhase2) {
                  const filteredTimestamps = timestampKeys.filter((timestamp) => timestamp >= stTime);
                  const maxTimestamp = Math.max(...filteredTimestamps.map(Number));
                  if (maxTimestamp !== -Infinity) {
                    tccFormData[maxTimestamp] = tccFormCData[maxTimestamp];
                  }
                } else if (isBetween) {
                  const maxTimestamp = Math.max(...timestampKeys.map(Number));
                  if (maxTimestamp !== -Infinity) {
                    tccFormData[maxTimestamp] = tccFormCData[maxTimestamp];
                  }
                }
              } else if (isPhaseDatePresent) {
                if (isPhase1) {
                  const filteredTimestamps = timestampKeys.filter((timestamp) => timestamp <= stTime);
                  const maxTimestamp = Math.max(...filteredTimestamps.map(Number));
                  if (maxTimestamp !== -Infinity) {
                    tccFormData[maxTimestamp] = tccFormCData[maxTimestamp];
                  }
                }
                if (isPhase2) {
                  const filteredTimestamps = timestampKeys.filter((timestamp) => timestamp >= stTime);
                  const maxTimestamp = Math.max(...filteredTimestamps.map(Number));
                  if (maxTimestamp !== -Infinity) {
                    tccFormData[maxTimestamp] = tccFormCData[maxTimestamp];
                  }
                }
              }
            } else {
              let maxPhase1Timestamp = null;
              let maxPhase2Timestamp = null;
              Object.keys(tccFormCData).forEach((timestamp) => {
                if (timestamp <= stTime) {
                  if (!maxPhase1Timestamp || Number(timestamp) > Number(maxPhase1Timestamp)) {
                    maxPhase1Timestamp = timestamp;
                  }
                }
                if (timestamp >= stTime) {
                  if (!maxPhase2Timestamp || Number(timestamp) > Number(maxPhase2Timestamp)) {
                    maxPhase2Timestamp = timestamp;
                  }
                }
              });
              if (maxPhase1Timestamp !== null) {
                tccFormData[maxPhase1Timestamp] = tccFormCData[maxPhase1Timestamp];
              }
              if (maxPhase2Timestamp !== null) {
                tccFormData[maxPhase2Timestamp] = tccFormCData[maxPhase2Timestamp];
              }
            }
          }
        }

        const conditionMap = {};
        for (const item of expression) {
          if (item.type === "selector") {
            const { label, value } = item;
            const { selectedOption2, selectedOption3, selectedOption4 } = value;
            // console.log(selectedOption2, selectedOption3, selectedOption4);
            // console.log("Evaluating for label:", isPhaseDatePresent, isPhase1, Form1_ph1MaxTimestamp <= stTime, Form1_ph1MaxTimestamp, Form1_ph1MaxTimestamp !== null);

            if (selectedOption4 === "patients1") {
              conditionMap[label] = option3Validator(selectedOption2, selectedOption3, patData, selectedOption4);
            } else if (selectedOption4 === "Form_1") {
              conditionMap[label] = option3Validator(selectedOption2, selectedOption3, form1Data, selectedOption4);
            } else if (selectedOption4 === "manual_vital_data") {
              conditionMap[label] = option3Validator(selectedOption2, selectedOption3, MVD, selectedOption4);
            } else if (selectedOption4 === "Form_3") {
              conditionMap[label] = option3Validator(selectedOption2, selectedOption3, form3Data, selectedOption4);
            } else if (selectedOption4 === "tcc_form") {
              conditionMap[label] = option3Validator(selectedOption2, selectedOption3, tccFormData, selectedOption4);
            } else if (selectedOption4 === "general" && selectedOption2 === "Panchayath" && selectedOption3 === panchayathId) {
              conditionMap[label] = true;
            } else if (selectedOption4 === "general" && selectedOption2 === "Village" && selectedOption3 === villageId) {
              conditionMap[label] = true;
            } else if (
              selectedOption4 === "general" &&
              selectedOption2 === "Date" &&
              isDatePresent &&
              selectedDates.SDate != null &&
              selectedDates.LDate != null &&
              Form1_maxTimestamp != null &&
              selectedDates.SDate <= Form1_maxTimestamp &&
              Form1_maxTimestamp <= selectedDates.LDate
            ) {
              conditionMap[label] = true;
            } else if (selectedOption4 === "general" && selectedOption2 === "Phase 1" && isPhaseDatePresent && isPhase1 && Form1_ph1MaxTimestamp != null && Form1_ph1MaxTimestamp <= stTime) {
              conditionMap[label] = true;
            } else if (selectedOption4 === "general" && selectedOption2 === "Phase 2" && isPhaseDatePresent && isPhase2 && Form1_ph2MaxTimestamp != null && Form1_ph2MaxTimestamp >= stTime) {
              conditionMap[label] = true;
            } else if (Array.isArray(selectedOption4) && selectedOption4.includes("patients1") && selectedOption4.includes("Form_1")) {
              const result1 = option3Validator(selectedOption2, selectedOption3, patData, "patients1");
              const result2 = option3Validator(selectedOption2, selectedOption3, form1Data, "Form_1");
              // console.log("Combined Result for patients1 and Form_1:", result1, result2);
              conditionMap[label] = result1 && result2;
            } else if (Array.isArray(selectedOption4) && selectedOption4.includes("manual_vital_data") && selectedOption4.includes("Form_3")) {
              const result1 = option3Validator(selectedOption2, selectedOption3, MVD, "manual_vital_data");
              const result2 = option3Validator(selectedOption2, selectedOption3, form3Data, "Form_3");
              // console.log("Combined Result for manual_vital_data and Form_3:", result1, result2);
              conditionMap[label] = result1 && result2;
            } else if (Array.isArray(selectedOption4) && selectedOption4.includes("tcc_form")) {
              conditionMap[label] = option3Validator(selectedOption2, selectedOption3, tccFormData, "tcc_form");
            } else {
              conditionMap[label] = false;
            }
          }
        }

        let processedQuery = query;
        for (const label in conditionMap) {
          processedQuery = processedQuery.replace(new RegExp(`\\b${label}\\b`, "g"), conditionMap[label]);
        }

        try {
          processedQuery = processedQuery.replace(/AND/g, "&&").replace(/OR/g, "||");
          const evaluation = eval(processedQuery);
          if (villageId === "22241") console.log(`Evaluating for UUID: ${uuid} of villageId: ${villageId} with query: ${processedQuery} Result: ${evaluation}`);
          if (evaluation) {
            processedCount++;
            res.write(JSON.stringify({ processed: processedCount, ...(groupIndex ? { group: groupIndex } : {}) }) + "\n");
            const dbRef = ref(database);
            const formNodes = ["patients1", "Form_1", "manual_vital_data", "Form_3", "tcc_form"];

            const infoObject = {
              patients1: patData,
              Form_1: form1Data,
              manual_vital_data: MVD,
              Form_3: form3Data,
              tcc_form: tccFormData,
            };

            let requiredNodes = Array.from(
              new Set(
                expression
                  .filter((item) => item.type === "selector" && item.value && item.value.selectedOption4)
                  .flatMap((item) => (Array.isArray(item.value.selectedOption4) ? item.value.selectedOption4 : [item.value.selectedOption4]))
                  .filter(Boolean)
              )
            );

            if (expression.some((item) => item.type === "selector" && item.value?.selectedOption4 === "general")) {
              if (!requiredNodes.includes("Form_1")) {
                requiredNodes.push("Form_1");
              }
            }
            // console.log("Final Required Nodes for fetching additional data:", requiredNodes);
            const formNode = formNodes.filter((node) => !requiredNodes.includes(node));

            // console.log("Fetching additional nodes for UUID:", uuid, "Nodes:", formNode);

            const fetchPromises = formNode.map(async (node) => {
              try {
                const snapshot = await get(child(dbRef, `${node}/${panchayathId}/${villageId}/${uuid}`));
                if (snapshot.exists()) {
                  // console.log(`fetching data ${node}/${panchayathId}/${villageId}/${uuid}`);
                  const nodeData = snapshot.val();
                  if (node !== "patients1") {
                    if (isDatePresent) {
                      if (isPhase1) {
                        // console.log("In phase 1");

                        const filteredTimestamps = Object.keys(nodeData).filter((timestamp) => timestamp <= stTime);
                        const maxFilteredTimestamp = Math.max(...filteredTimestamps.map(Number));
                        if (maxFilteredTimestamp !== -Infinity) {
                          infoObject[node] = {
                            [maxFilteredTimestamp]: nodeData[maxFilteredTimestamp],
                          };
                          // console.log("Phase 1 infoObject[node]: ", infoObject[node]);
                        } else {
                          infoObject[node] = {};
                        }
                      }
                      if (isPhase2) {
                        // console.log("In phase 2");
                        const filteredTimestamps = Object.keys(nodeData).filter((timestamp) => timestamp >= stTime);
                        const maxFilteredTimestamp = Math.max(...filteredTimestamps.map(Number));
                        if (maxFilteredTimestamp !== -Infinity) {
                          infoObject[node] = {
                            [maxFilteredTimestamp]: nodeData[maxFilteredTimestamp],
                          };
                          // console.log("Phase 2 infoObject[node]: ", infoObject[node]);
                        } else {
                          infoObject[node] = {};
                        }
                      }
                      if (isBetween) {
                        console.log("In phase b/w");
                        const timestampKeys = Object.keys(nodeData);
                        const maxTimestamp = Math.max(...timestampKeys.map(Number));
                        if (maxTimestamp !== -Infinity) {
                          infoObject[node] = {
                            [maxTimestamp]: nodeData[maxTimestamp],
                          };
                        } else {
                          infoObject[node] = {};
                        }
                      }
                    } else {
                      let maxPhase1Timestamp = null;
                      let maxPhase2Timestamp = null;
                      Object.keys(nodeData).forEach((timestamp) => {
                        if (timestamp <= stTime) {
                          if (!maxPhase1Timestamp || Number(timestamp) > Number(maxPhase1Timestamp)) {
                            maxPhase1Timestamp = timestamp;
                          }
                        }
                        if (timestamp >= stTime) {
                          if (!maxPhase2Timestamp || Number(timestamp) > Number(maxPhase2Timestamp)) {
                            maxPhase2Timestamp = timestamp;
                          }
                        }
                      });
                      infoObject[node] = {};
                      if (maxPhase1Timestamp !== null) {
                        infoObject[node][maxPhase1Timestamp] = nodeData[maxPhase1Timestamp];
                      }
                      if (maxPhase2Timestamp !== null) {
                        infoObject[node][maxPhase2Timestamp] = nodeData[maxPhase2Timestamp];
                      }
                    }
                  } else {
                    infoObject[node] = { ...nodeData };
                  }
                } else {
                  infoObject[node] = {};
                }
                // console.log(`Fetched ${node}/${panchayathId}/${villageId}/${uuid} successfully.`);
                let level1 = 0;
                let level2 = 0;
                Object.keys(infoObject[node]).forEach((key1) => {
                  level1++;
                  Object.keys(infoObject[node][key1]).forEach((key2) => {
                    level2++;
                  });
                });
                // console.log(`Data levels for ${node} - Level 1 keys: ${level1}, Level 2 keys: ${level2}`);
              } catch (err) {
                console.error(`Error fetching ${node} for UUID ${uuid}:`, err);
                infoObject[node] = null;
              }
            });

            await Promise.all(fetchPromises);

            matchedUUIDs.push({
              _key: `${panchayathId}/${villageId}/${uuid}`,
              uuid,
              panchayathId,
              villageId,
              ...infoObject,
            });
          }
        } catch (error) {
          console.error(`Error evaluating expression for UUID ${uuid}:`, error);
        }
      })
    );
  }

  console.log("Matched UUIDs length: ", matchedUUIDs.length);
  if (writeFinalData) {
    res.write(JSON.stringify({ data: matchedUUIDs }) + "\n");
  }
  return matchedUUIDs;
}
