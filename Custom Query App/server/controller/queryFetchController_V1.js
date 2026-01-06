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

    await validateData(patientData, expression, expressionString, res);
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
async function validateData(data, expression, query, res) {
  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    return res.status(400).json({ message: "No data found" });
  }

  const priorityOrder = query.includes("OR") ? ["patients1", "Form_1", "Form_3", "manual_vital_data", "tcc_form"] : ["tcc_form", "manual_vital_data", "Form_3", "Form_1", "patients1"];

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
              const timestampKeys = Object.keys(form1CData);
              if (isDateRangePresent) {
                if (isPhase1) {
                  const filteredPhase1Timestamps = timestampKeys.filter((timestamp) => timestamp <= stTime);
                  Form1_ph1MaxTimestamp = Math.max(...filteredPhase1Timestamps);
                  if (Form1_ph1MaxTimestamp !== -Infinity) {
                    form1Data[Form1_ph1MaxTimestamp] = form1CData[Form1_ph1MaxTimestamp];
                  }
                } else if (isPhase2) {
                  const filteredPhase2Timestamps = timestampKeys.filter((timestamp) => timestamp >= stTime);
                  Form1_ph2MaxTimestamp = Math.max(...filteredPhase2Timestamps);
                  if (Form1_ph2MaxTimestamp !== -Infinity) {
                    form1Data[Form1_ph2MaxTimestamp] = form1CData[Form1_ph2MaxTimestamp];
                  }
                } else if (isBetween) {
                  Form1_maxTimestamp = Math.max(...timestampKeys);
                  if (Form1_maxTimestamp !== -Infinity) {
                    form1Data[Form1_maxTimestamp] = form1CData[Form1_maxTimestamp];
                  }
                }
              } else if (isPhaseDatePresent) {
                if (isPhase1) {
                  const filteredPhase1Timestamps = timestampKeys.filter((timestamp) => timestamp <= stTime);
                  Form1_ph1MaxTimestamp = Math.max(...filteredPhase1Timestamps);
                  if (Form1_ph1MaxTimestamp !== -Infinity) {
                    form1Data[Form1_ph1MaxTimestamp] = form1CData[Form1_ph1MaxTimestamp];
                  }
                }
                if (isPhase2) {
                  const filteredPhase2Timestamps = timestampKeys.filter((timestamp) => timestamp >= stTime);
                  Form1_ph2MaxTimestamp = Math.max(...filteredPhase2Timestamps);
                  if (Form1_ph2MaxTimestamp !== -Infinity) {
                    form1Data[Form1_ph2MaxTimestamp] = form1CData[Form1_ph2MaxTimestamp];
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
            } else if (selectedOption4 === "general" && isDatePresent && selectedDates.SDate <= Form1_maxTimestamp && Form1_maxTimestamp <= selectedDates.LDate && selectedOption2 === "Date") {
              conditionMap[label] = true;
            } else if (selectedOption4 === "general" && selectedOption2 === "Phase 1" && isPhaseDatePresent && isPhase1 && Form1_ph1MaxTimestamp <= stTime && Form1_ph1MaxTimestamp !== null) {
              conditionMap[label] = true;
            } else if (selectedOption4 === "general" && selectedOption2 === "Phase 2" && isPhaseDatePresent && isPhase2 && Form1_ph2MaxTimestamp >= stTime && Form1_ph2MaxTimestamp !== null) {
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
          if (villageId === "22241") console.log(`Evaluating for UUID: ${uuid} of villageId: ${villageId} with query: ${processedQuery}`);

          if (eval(processedQuery)) {
            processedCount++;
            res.write(JSON.stringify({ processed: processedCount }) + "\n");
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

            matchedUUIDs.push({ ...infoObject });
          }
        } catch (error) {
          console.error(`Error evaluating expression for UUID ${uuid}:`, error);
        }
      })
    );
  }

  console.log("Matched UUIDs length: ", matchedUUIDs.length);
  res.write(JSON.stringify({ data: matchedUUIDs }) + "\n");
  return matchedUUIDs;
}
