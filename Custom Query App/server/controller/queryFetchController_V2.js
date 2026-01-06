import { database } from "../db/config.js";
import { ref, child, get } from "firebase/database";
import option3Validator from "../utils/option3Validator.js";
import util from "util";

export default async function queryFetch_V2(req, res) {
  // Jan 1, 2024 00:00:00 (UTC). Phase 1: < stTime, Phase 2: >= stTime
  const stTime = 1704067200;
  try {
    function buildExpressionTree(expressionStr) {
      const tokens = expressionStr.match(/\(|\)|AND|OR|Q\d+/g) || [];
      const ops = [];
      const vals = [];

      const isOperator = (token) => token === "AND" || token === "OR";
      const precedence = { OR: 1, AND: 2 };

      const applyTopOp = () => {
        const op = ops.pop();
        if (!op || !isOperator(op)) return;
        const right = vals.pop();
        const left = vals.pop();
        if (left === undefined || right === undefined) {
          // Malformed expression; keep it from throwing.
          return;
        }
        vals.push({ op, left, right });
      };

      for (const token of tokens) {
        if (token === "(") {
          ops.push(token);
          continue;
        }

        if (token === ")") {
          while (ops.length && ops[ops.length - 1] !== "(") {
            applyTopOp();
          }
          // Pop the matching '('
          if (ops.length && ops[ops.length - 1] === "(") ops.pop();
          continue;
        }

        if (isOperator(token)) {
          while (ops.length && isOperator(ops[ops.length - 1]) && precedence[ops[ops.length - 1]] >= precedence[token]) {
            applyTopOp();
          }
          ops.push(token);
          continue;
        }

        // Operand token (e.g., Q1)
        vals.push(token);
      }

      while (ops.length) {
        if (ops[ops.length - 1] === "(") {
          ops.pop();
          continue;
        }
        applyTopOp();
      }

      return vals.length ? vals[0] : null;
    }

    const keyOf = (item) => `${item.villageId}:${item.uuid}`;

    const normalizePhaseKey = (k) => (k === "1" || k === "2" || k === "All" ? k : "All");

    const mergePhaseKeyUnion = (aKey, bKey) => {
      const a = normalizePhaseKey(aKey);
      const b = normalizePhaseKey(bKey);
      if (a === "All" || b === "All") return "All";
      if (a === b) return a;
      return "All";
    };

    const mergePhaseKeyIntersect = (aKey, bKey) => {
      const a = normalizePhaseKey(aKey);
      const b = normalizePhaseKey(bKey);
      if (a === "All") return b;
      if (b === "All") return a;
      if (a === b) return a;
      // Mismatched phases have an empty intersection.
      return null;
    };

    const unique = (arr) => {
      const map = new Map();
      for (const it of arr || []) {
        if (!it || !it.villageId || !it.uuid) continue;
        const id = keyOf(it);
        const existing = map.get(id);
        if (!existing) {
          map.set(id, { ...it, key: it.key ?? "All" });
        } else {
          map.set(id, { ...existing, ...it, key: mergePhaseKeyUnion(existing.key, it.key) });
        }
      }
      return Array.from(map.values());
    };

    const union = (a, b) => unique([...(a || []), ...(b || [])]);

    const intersect = (a, b) => {
      const mapB = new Map();
      for (const it of b || []) {
        if (!it || !it.villageId || !it.uuid) continue;
        const id = keyOf(it);
        const existing = mapB.get(id);
        if (!existing) {
          mapB.set(id, { ...it, key: it.key ?? "All" });
        } else {
          mapB.set(id, { ...existing, ...it, key: mergePhaseKeyUnion(existing.key, it.key) });
        }
      }

      const out = [];
      const seen = new Set();
      for (const it of a || []) {
        if (!it || !it.villageId || !it.uuid) continue;
        const id = keyOf(it);
        if (seen.has(id)) continue;
        const match = mapB.get(id);
        if (!match) continue;
        seen.add(id);
        const mergedKey = mergePhaseKeyIntersect(it.key, match.key);
        if (mergedKey === null) continue;
        out.push({ ...it, key: mergedKey });
      }
      return unique(out);
    };

    const getSelectorByLabel = (label) => expression.find((item) => item?.type === "selector" && item.label === label);

    const isGeneralLabel = (label) => {
      if (typeof label !== "string") return false;
      const selector = getSelectorByLabel(label);
      return selector?.value?.selectedOption4 === "general";
    };

    function computeGeneralCandidates(generalValue) {
      const out = [];
      const mode = generalValue?.selectedOption2;

      // Prefer patients1 for location-based scoping; fallback to Form_1.
      const baseNodeKey = patientData.patients1 ? "patients1" : "Form_1";

      if (mode === "Panchayath") {
        const panchayathId = generalValue?.selectedOption3;
        const nodeData = patientData[baseNodeKey]?.[panchayathId];
        if (!nodeData || typeof nodeData !== "object") return [];

        Object.keys(nodeData).forEach((villageId) => {
          const villageData = nodeData[villageId];
          if (villageData && typeof villageData === "object") {
            Object.keys(villageData).forEach((uuid) => {
              out.push({ uuid, villageId, key: "All" });
            });
          }
        });
        return unique(out);
      }

      if (mode === "Village") {
        const villageId = generalValue?.selectedOption3;
        if (!villageId || typeof villageId !== "string") return [];
        const panchayatId = villageId.substring(0, 2);
        const villageData = patientData[baseNodeKey]?.[panchayatId]?.[villageId];
        if (!villageData || typeof villageData !== "object") return [];

        Object.keys(villageData).forEach((uuid) => {
          out.push({ uuid, villageId, key: "All" });
        });
        return unique(out);
      }

      // Date-based scoping must be derived from Form_1 timestamps.
      const form1 = patientData.Form_1;
      if (!form1 || typeof form1 !== "object") return [];

      if (mode === "Date") {
        const { SDate, LDate } = generalValue?.selectedOption3 || {};
        if (!SDate || !LDate) return [];
        const key = SDate < stTime && LDate < stTime ? "1" : SDate >= stTime && LDate >= stTime ? "2" : "All";

        Object.keys(form1).forEach((panchayathId) => {
          const panchayathData = form1[panchayathId];
          if (panchayathData && typeof panchayathData === "object") {
            Object.keys(panchayathData).forEach((villageId) => {
              const villageData = panchayathData[villageId];
              if (villageData && typeof villageData === "object") {
                Object.keys(villageData).forEach((uuid) => {
                  const uuidData = villageData[uuid];
                  if (uuidData && typeof uuidData === "object") {
                    const timestampKeys = Object.keys(uuidData)
                      .map(Number)
                      .filter((n) => !Number.isNaN(n));
                    const inRange = timestampKeys.filter((ts) => ts >= SDate && ts <= LDate);
                    if (!inRange.length) return;
                    out.push({ uuid, villageId, key });
                  }
                });
              }
            });
          }
        });
        return unique(out);
      }

      if (mode === "Phase 1") {
        Object.keys(form1).forEach((panchayathId) => {
          const panchayathData = form1[panchayathId];
          if (panchayathData && typeof panchayathData === "object") {
            Object.keys(panchayathData).forEach((villageId) => {
              const villageData = panchayathData[villageId];
              if (villageData && typeof villageData === "object") {
                Object.keys(villageData).forEach((uuid) => {
                  const uuidData = villageData[uuid];
                  if (uuidData && typeof uuidData === "object") {
                    const timestampKeys = Object.keys(uuidData)
                      .map(Number)
                      .filter((n) => !Number.isNaN(n));
                    const ph1 = timestampKeys.filter((ts) => ts < stTime);
                    if (!ph1.length) return;
                    out.push({ uuid, villageId, key: "1" });
                  }
                });
              }
            });
          }
        });
        return unique(out);
      }

      if (mode === "Phase 2") {
        Object.keys(form1).forEach((panchayathId) => {
          const panchayathData = form1[panchayathId];
          if (panchayathData && typeof panchayathData === "object") {
            Object.keys(panchayathData).forEach((villageId) => {
              const villageData = panchayathData[villageId];
              if (villageData && typeof villageData === "object") {
                Object.keys(villageData).forEach((uuid) => {
                  const uuidData = villageData[uuid];
                  if (uuidData && typeof uuidData === "object") {
                    const timestampKeys = Object.keys(uuidData)
                      .map(Number)
                      .filter((n) => !Number.isNaN(n));
                    const ph2 = timestampKeys.filter((ts) => ts >= stTime);
                    if (!ph2.length) return;
                    out.push({ uuid, villageId, key: "2" });
                  }
                });
              }
            });
          }
        });
        return unique(out);
      }

      return [];
    }

    // Used to decide evaluation order of subtrees for better performance.
    // Note: output is unchanged (AND/OR are commutative), only evaluation order changes.
    const selectorNodeKey = (label) => {
      if (typeof label !== "string") return null;
      const selector = getSelectorByLabel(label);
      const nodeKey = selector?.value?.selectedOption4;
      if (nodeKey === "general") return "Form_1";
      return typeof nodeKey === "string" ? nodeKey : null;
    };

    const subtreePriorityIndex = (node) => {
      if (!node) return Number.POSITIVE_INFINITY;
      if (typeof node === "string") {
        const nodeKey = selectorNodeKey(node);
        if (!nodeKey) return Number.POSITIVE_INFINITY;
        const idx = priorityOrder.indexOf(nodeKey);
        return idx === -1 ? Number.POSITIVE_INFINITY : idx;
      }
      if (typeof node === "object") {
        return Math.min(subtreePriorityIndex(node.left), subtreePriorityIndex(node.right));
      }
      return Number.POSITIVE_INFINITY;
    };

    async function traverseAndFetch(tree, generalSet = null) {
      if (!tree) return [];
      const currentNode = tree;
      if (typeof currentNode === "string") {
        const snapshotUUID = [];
        const selector = getSelectorByLabel(currentNode);
        if (selector && selector.type === "selector") {
          const { selectedOption1, selectedOption2, selectedOption3, selectedOption4 } = selector.value || {};

          // A "general" selector is a scope/candidate generator, not a validator-based selector.
          if (selectedOption4 === "general") {
            return computeGeneralCandidates(selector.value);
          }

          if (generalSet !== null) {
            if (generalSet.selectedOption2 === "Panchayath") {
              const panchayathId = generalSet.selectedOption3;

              const nodeKey = selectedOption4 === "general" ? "Form_1" : selectedOption4;
              const nodData = patientData[nodeKey]?.[panchayathId];
              if (!nodData || typeof nodData !== "object") {
                return [];
              }
              Object.keys(nodData).forEach((villageId) => {
                const villageData = nodData[villageId];
                if (villageData && typeof villageData === "object") {
                  Object.keys(villageData).forEach((uuid) => {
                    const uuidData = villageData[uuid];
                    if (uuidData && typeof uuidData === "object") {
                      if (nodeKey === "patients1") {
                        if (option3Validator(selectedOption2, selectedOption3, uuidData, selectedOption4)) {
                          snapshotUUID.push({ uuid, villageId });
                        }
                      } else {
                        const maxTimestamp =
                          Object.keys(uuidData).length > 0
                            ? Math.max(
                                ...Object.keys(uuidData)
                                  .map(Number)
                                  .filter((n) => Number.isFinite(n))
                              )
                            : null;
                        if (Number.isFinite(maxTimestamp)) {
                          const timestampData = uuidData[String(maxTimestamp)];
                          if (timestampData && option3Validator(selectedOption2, selectedOption3, timestampData, nodeKey)) {
                            snapshotUUID.push({ uuid, villageId, key: "All" });
                          }
                        }
                      }
                    }
                  });
                }
              });
            } else if (generalSet.selectedOption2 === "Village") {
              const villageId = generalSet.selectedOption3;
              const panchayatId = villageId.substring(0, 2);
              const nodeKey = selectedOption4 === "general" ? "Form_1" : selectedOption4;
              const panchayathData = patientData[nodeKey]?.[panchayatId];
              if (!panchayathData || typeof panchayathData !== "object") {
                return [];
              }
              const villageData = panchayathData[villageId];
              if (villageData && typeof villageData === "object") {
                Object.keys(villageData).forEach((uuid) => {
                  const uuidData = villageData[uuid];
                  if (uuidData && typeof uuidData === "object") {
                    if (nodeKey === "patients1") {
                      if (option3Validator(selectedOption2, selectedOption3, uuidData, selectedOption4)) {
                        snapshotUUID.push({ uuid, villageId });
                      }
                    } else {
                      const maxTimestamp =
                        Object.keys(uuidData).length > 0
                          ? Math.max(
                              ...Object.keys(uuidData)
                                .map(Number)
                                .filter((n) => Number.isFinite(n))
                            )
                          : null;
                      if (Number.isFinite(maxTimestamp)) {
                        const timestampData = uuidData[String(maxTimestamp)];
                        if (timestampData && option3Validator(selectedOption2, selectedOption3, timestampData, nodeKey)) {
                          snapshotUUID.push({ uuid, villageId, key: "All" });
                        }
                      }
                    }
                  }
                });
              }
            } else if (generalSet.selectedOption2 === "Date") {
              const { SDate, LDate } = generalSet.selectedOption3 || {};
              const key = SDate && LDate ? (SDate < stTime && LDate < stTime ? "1" : SDate >= stTime && LDate >= stTime ? "2" : "All") : null;

              const nodekey = selectedOption4 === "general" || selectedOption4 === "patients1" ? "Form_1" : selectedOption4;

              const nodeData = patientData[nodekey];
              if (!nodeData || typeof nodeData !== "object") {
                return [];
              }
              Object.keys(nodeData).forEach((panchayathId) => {
                const panchayathData = nodeData[panchayathId];
                if (panchayathData && typeof panchayathData === "object") {
                  Object.keys(panchayathData).forEach((villageId) => {
                    const villageData = panchayathData[villageId];
                    if (villageData && typeof villageData === "object") {
                      Object.keys(villageData).forEach((uuid) => {
                        const uuidData = villageData[uuid];
                        if (uuidData && typeof uuidData === "object") {
                          const timestampKeys = Object.keys(uuidData)
                            .map(Number)
                            .filter((n) => Number.isFinite(n));
                          const inRange = timestampKeys.filter((ts) => ts >= SDate && ts <= LDate);
                          if (!inRange.length) return;
                          const maxRangeTimestamp = Math.max(...inRange);
                          const timestampData = uuidData[String(maxRangeTimestamp)];
                          if (timestampData && option3Validator(selectedOption2, selectedOption3, timestampData, nodekey)) {
                            snapshotUUID.push({ uuid, villageId, key });
                          }
                        }
                      });
                    }
                  });
                }
              });
            } else if (generalSet.selectedOption2 === "Phase 1") {
              const nodekey = selectedOption4 === "general" || selectedOption4 === "patients1" ? "Form_1" : selectedOption4;
              const nodeData = patientData[nodekey];
              if (!nodeData || typeof nodeData !== "object") {
                return [];
              }
              Object.keys(nodeData).forEach((panchayathId) => {
                const panchayathData = nodeData[panchayathId];
                if (panchayathData && typeof panchayathData === "object") {
                  Object.keys(panchayathData).forEach((villageId) => {
                    const villageData = panchayathData[villageId];
                    if (villageData && typeof villageData === "object") {
                      Object.keys(villageData).forEach((uuid) => {
                        const uuidData = villageData[uuid];
                        if (uuidData && typeof uuidData === "object") {
                          const timestampKeys = Object.keys(uuidData)
                            .map(Number)
                            .filter((n) => Number.isFinite(n));
                          const ph1 = timestampKeys.filter((ts) => ts < stTime);
                          if (!ph1.length) return;
                          const maxPhase1Timestamp = Math.max(...ph1);
                          const timestampData = uuidData[String(maxPhase1Timestamp)];
                          if (timestampData && option3Validator(selectedOption2, selectedOption3, timestampData, nodekey)) {
                            snapshotUUID.push({ uuid, villageId, key: "1" });
                          }
                        }
                      });
                    }
                  });
                }
              });
            } else if (generalSet.selectedOption2 === "Phase 2") {
              const nodekey = selectedOption4 === "general" || selectedOption4 === "patients1" ? "Form_1" : selectedOption4;
              const nodeData = patientData[nodekey];
              if (!nodeData || typeof nodeData !== "object") {
                return [];
              }
              Object.keys(nodeData).forEach((panchayathId) => {
                const panchayathData = nodeData[panchayathId];
                if (panchayathData && typeof panchayathData === "object") {
                  Object.keys(panchayathData).forEach((villageId) => {
                    const villageData = panchayathData[villageId];
                    if (villageData && typeof villageData === "object") {
                      Object.keys(villageData).forEach((uuid) => {
                        const uuidData = villageData[uuid];
                        if (uuidData && typeof uuidData === "object") {
                          const timestampKeys = Object.keys(uuidData)
                            .map(Number)
                            .filter((n) => Number.isFinite(n));
                          const ph2 = timestampKeys.filter((ts) => ts >= stTime);
                          if (!ph2.length) return;
                          const maxPhase2Timestamp = Math.max(...ph2);
                          const timestampData = uuidData[String(maxPhase2Timestamp)];
                          if (timestampData && option3Validator(selectedOption2, selectedOption3, timestampData, nodekey)) {
                            snapshotUUID.push({ uuid, villageId, key: "2" });
                          }
                        }
                      });
                    }
                  });
                }
              });
            }
          } else {
            const nodeKey = selectedOption4 === "general" ? "Form_1" : selectedOption4;
            const nodeData = patientData[nodeKey];
            if (nodeData && typeof nodeData === "object") {
              // console.log("Node Data Keys Count:", selectedOption1, selectedOption2, selectedOption3, selectedOption4, Object.keys(nodeData).length);
              Object.keys(nodeData).forEach((panchayathId) => {
                const panchayathData = nodeData[panchayathId];
                if (panchayathData && typeof panchayathData === "object") {
                  Object.keys(panchayathData).forEach((villageId) => {
                    const villageData = panchayathData[villageId];
                    if (villageData && typeof villageData === "object") {
                      Object.keys(villageData).forEach((uuid) => {
                        const uuidData = villageData[uuid];
                        if (uuidData && typeof uuidData === "object") {
                          if (selectedOption4 === "patients1") {
                            if (option3Validator(selectedOption2, selectedOption3, uuidData, selectedOption4)) {
                              snapshotUUID.push({ uuid, villageId });
                            }
                          } else {
                            const maxTimestamp =
                              Object.keys(uuidData).length > 0
                                ? Math.max(
                                    ...Object.keys(uuidData)
                                      .map(Number)
                                      .filter((n) => Number.isFinite(n))
                                  )
                                : null;
                            if (Number.isFinite(maxTimestamp)) {
                              const timestampData = uuidData[String(maxTimestamp)];
                              console.log("Max Timestamp:", uuid, maxTimestamp, option3Validator(selectedOption2, selectedOption3, timestampData, selectedOption4));
                              if (timestampData && option3Validator(selectedOption2, selectedOption3, timestampData, selectedOption4)) {
                                snapshotUUID.push({ uuid, villageId, key: "All" });
                              }
                            }
                          }
                        }
                      });
                    }
                  });
                }
              });
            }
          }
        }
        console.log(`Selector ${(selector.value.selectedOption1, selector.value.selectedOption2, selector.value.selectedOption3, selector.value.selectedOption4)} matched count:`, snapshotUUID.length);

        return unique(snapshotUUID);
      }

      // Special-case: if this is an AND between a general-scope selector and another subtree,
      // evaluate the other side within that scope and intersect results.
      if (currentNode.op === "AND" && generalSet === null) {
        const leftIsGeneral = isGeneralLabel(currentNode.left);
        const rightIsGeneral = isGeneralLabel(currentNode.right);
        if (leftIsGeneral || rightIsGeneral) {
          const generalLabel = leftIsGeneral ? currentNode.left : currentNode.right;
          const otherSide = leftIsGeneral ? currentNode.right : currentNode.left;

          const generalSelector = getSelectorByLabel(generalLabel);
          const generalValue = generalSelector?.value || null;
          const generalCandidates = await traverseAndFetch(generalLabel, null);

          const canPushScopeDown = generalValue?.selectedOption2 === "Panchayath" || generalValue?.selectedOption2 === "Village";
          const otherResults = await traverseAndFetch(otherSide, canPushScopeDown ? generalValue : null);
          return intersect(generalCandidates, otherResults);
        }
      }

      // Non-leaf: compute left and right, then combine by op
      const leftIdx = subtreePriorityIndex(currentNode.left);
      const rightIdx = subtreePriorityIndex(currentNode.right);
      const firstNode = leftIdx <= rightIdx ? currentNode.left : currentNode.right;
      const secondNode = leftIdx <= rightIdx ? currentNode.right : currentNode.left;

      const firstResults = await traverseAndFetch(firstNode, generalSet);
      const secondResults = await traverseAndFetch(secondNode, generalSet);
      if (currentNode.op === "AND") {
        return intersect(firstResults, secondResults);
      }
      if (currentNode.op === "OR") {
        return union(firstResults, secondResults);
      }
      return union(firstResults, secondResults);
    }

    // Function name requested: postProcessing
    function postProcessing(expression, rows) {
      function isNotEmpty(obj) {
        return obj && typeof obj === "object" && Object.keys(obj).length > 0;
      }

      function splitRowByTimestamp(row) {
        const FORM_KEYS = ["Form_1", "manual_vital_data", "Form_3", "tcc_form"];
        const ph1Row = { Form_1: {}, manual_vital_data: {}, Form_3: {}, tcc_form: {}, patients1: {} };
        const ph2Row = { Form_1: {}, manual_vital_data: {}, Form_3: {}, tcc_form: {}, patients1: {} };

        FORM_KEYS.forEach((formKey) => {
          const src = row[formKey];
          if (src && typeof src === "object") {
            Object.entries(src).forEach(([ts, value]) => {
              if (Number(ts) < stTime) {
                ph1Row[formKey][ts] = value;
              } else {
                ph2Row[formKey][ts] = value;
              }
            });
          }
        });

        if (row.patients1) {
          ph1Row.patients1 = { ...row.patients1 };
          ph2Row.patients1 = { ...row.patients1 };
        }

        const result = [];
        if (isNotEmpty(ph1Row.Form_1) || isNotEmpty(ph1Row.manual_vital_data) || isNotEmpty(ph1Row.Form_3) || isNotEmpty(ph1Row.tcc_form)) {
          result.push(ph1Row);
        }
        if (isNotEmpty(ph2Row.Form_1) || isNotEmpty(ph2Row.manual_vital_data) || isNotEmpty(ph2Row.Form_3) || isNotEmpty(ph2Row.tcc_form)) {
          result.push(ph2Row);
        }
        return result;
      }
      let excelResponse = Array.isArray(rows) ? [...rows] : [];

      console.log(`PostProcessing: original Count ${excelResponse.length}`);

      // Keep only rows where both patients1 and Form_1 exist and are not empty
      excelResponse = excelResponse.filter((row) => row?.patients1 && Object.keys(row.patients1).length > 0 && row?.Form_1 && Object.keys(row.Form_1).length > 0);
      console.log(`PostProcessing: count after removeing for not having patiente1 or Form_1 ${excelResponse.length}`);

      // Check if mammography or ultrasound is advised
      const isMammography = Array.isArray(expression) && expression.some((item) => item.type === "selector" && item.value?.selectedOption2 === "Advised bilateral screening mammography");
      const isUltrasound = Array.isArray(expression) && expression.some((item) => item.type === "selector" && item.value?.selectedOption2 === "Advised bilateral screening ultrasound");
      if (isMammography || isUltrasound) {
        excelResponse = excelResponse.filter((row) => {
          const age = Number(row?.patients1?.age);
          if (isMammography && !isUltrasound) return age >= 45;
          if (!isMammography && isUltrasound) return age < 45;
          return true;
        });
      }
      console.log(`PostProcessing: count after mammography/ultrasound filtering, ${excelResponse.length} rows remain.`);

      // Flatten rows by timestamp split based on Form_1 timestamps
      let countSplit = 0;
      const flattenedRows = [];
      excelResponse.forEach((row) => {
        if (!row) {
          flattenedRows.push(row);
          return;
        }
        const allTimestamps = row.Form_1 && typeof row.Form_1 === "object" ? Object.keys(row.Form_1) : [];
        const hasTwoTimestamp = Array.isArray(allTimestamps) && allTimestamps.length > 1;
        if (!hasTwoTimestamp) {
          flattenedRows.push(row);
        } else {
          countSplit++;
          flattenedRows.push(...splitRowByTimestamp(row));
        }
      });
      if (countSplit) {
        console.log(`PostProcessing: split ${countSplit} rows into phase 1/2.`);
      }
      console.log(`PostProcessing: final flattened row count ${flattenedRows.length}.`);
      return flattenedRows;
    }

    // Helper: filter a node's timestamped data by phase key
    function filterByPhaseKey(nodeData, key, uuid, node) {
      if (!nodeData || typeof nodeData !== "object") return {};
      const tsKeys = Object.keys(nodeData)
        .map(Number)
        .filter((n) => !Number.isNaN(n));
      if (!tsKeys.length) return {};

      const ph1 = tsKeys.filter((ts) => ts < stTime);
      const ph2 = tsKeys.filter((ts) => ts >= stTime);

      const out = {};
      const k = key === "1" || key === "2" || key === "All" ? key : "All";
      if (k === "1" || k === "All") {
        if (ph1.length) {
          const max1 = Math.max(...ph1);
          out[max1] = nodeData[String(max1)];
        }
      }
      if (k === "2" || k === "All") {
        if (ph2.length) {
          const max2 = Math.max(...ph2);
          out[max2] = nodeData[String(max2)];
        }
      }

      return out;
    }

    const { expression, expressionString } = req.body || {};

    console.log("REST /query/fetch1 expressionString:", expressionString);
    console.log("REST /query/fetch1 expression:\n", util.inspect(expression, { depth: null, maxArrayLength: null }));

    if (!Array.isArray(expression) || typeof expressionString !== "string") {
      return res.status(400).json({ message: "Invalid request body" });
    }

    const priorityOrder = expressionString.includes("OR") ? ["patients1", "Form_1", "Form_3", "manual_vital_data", "tcc_form"] : ["tcc_form", "manual_vital_data", "Form_3", "Form_1", "patients1"];

    // Define all possible nodes
    const allNodes = ["patients1", "Form_1", "Form_3", "tcc_form", "manual_vital_data"];

    // Collect required nodes from expression
    const requiredNodes = Array.from(
      new Set(
        expression
          .filter((item) => item.type === "selector" && item.value && item.value.selectedOption4)
          .flatMap((item) => (Array.isArray(item.value.selectedOption4) ? item.value.selectedOption4 : [item.value.selectedOption4]))
          .filter(Boolean)
      )
    );
    // Ensure Form_1 is included if "general" selector is used
    if (expression.some((item) => item.type === "selector" && item.value?.selectedOption4 === "general") && !requiredNodes.includes("Form_1")) {
      requiredNodes.push("Form_1");
    }
    // Remove "general" from required nodes as it's not a db,general is for just for interpreting scope
    if (requiredNodes.includes("general")) {
      requiredNodes.splice(requiredNodes.indexOf("general"), 1);
    }
    console.log("Required Nodes:", requiredNodes);

    // Fetch data from Firebase for required nodes
    const dbRef = ref(database);

    // Fetch snapshots for required nodes
    const snapshots = {};
    await Promise.all(
      requiredNodes.map(async (node) => {
        try {
          snapshots[node] = await get(child(dbRef, `${node}/`));
        } catch (e) {
          console.warn(`Failed to fetch node ${node}:`, e.message);
        }
      })
    );

    // Organize fetched data
    const patientData = {};
    for (const key in snapshots) {
      if (snapshots[key] && snapshots[key].exists()) {
        patientData[key] = snapshots[key].val();
      }
    }

    // Build expression tree
    const tree = buildExpressionTree(expressionString);
    console.log("Expression Tree:", JSON.stringify(tree, null, 2));
    // Traverse tree and fetch matching UUIDs
    const result = await traverseAndFetch(tree, null);

    console.log("Final Result Count:", result.length);
    // console.log("Final Result: ", result);

    // Ensure only missing result-specific records are loaded (minimal fetches)
    const notRequiredNodes = allNodes.filter((node) => !requiredNodes.includes(node));
    const missingPaths = [];
    for (const { uuid, villageId } of result) {
      const panchayathId = villageId.substring(0, 2);
      for (const node of notRequiredNodes) {
        missingPaths.push({ node, panchayathId, villageId, uuid });
      }
    }
    console.log("Missing Paths Count:", missingPaths.length);
    if (missingPaths.length) {
      const fetched = await Promise.all(
        missingPaths.map(async ({ node, panchayathId, villageId, uuid }) => {
          try {
            const snap = await get(child(dbRef, `${node}/${panchayathId}/${villageId}/${uuid}`));
            return { node, panchayathId, villageId, uuid, snap };
          } catch (e) {
            console.warn(`Failed to fetch record ${node}/${panchayathId}/${villageId}/${uuid}:`, e.message);
            return { node, panchayathId, villageId, uuid, snap: null };
          }
        })
      );

      for (const { node, panchayathId, villageId, uuid, snap } of fetched) {
        if (snap && snap.exists()) {
          if (!patientData[node]) patientData[node] = {};
          if (!patientData[node][panchayathId]) patientData[node][panchayathId] = {};
          if (!patientData[node][panchayathId][villageId]) patientData[node][panchayathId][villageId] = {};
          patientData[node][panchayathId][villageId][uuid] = snap.val();
        }
      }
    }

    // Build the response data
    const allData = {};
    // Keep shape stable: initialize all nodes as empty objects
    for (const node of allNodes) {
      allData[node] = {};
    }

    for (const { uuid, villageId } of result) {
      const panchayathId = villageId.substring(0, 2);
      // Populate data for all nodes that have fetched values
      for (const node of allNodes) {
        const nodeData = patientData[node]?.[panchayathId]?.[villageId]?.[uuid];
        if (nodeData !== undefined) {
          if (!allData[node][panchayathId]) allData[node][panchayathId] = {};
          if (!allData[node][panchayathId][villageId]) allData[node][panchayathId][villageId] = {};
          allData[node][panchayathId][villageId][uuid] = nodeData;
        }
      }
    }

    // Log data counts for each node, Commment out in production
    Object.keys(allData).forEach((node) => {
      console.log(`Node ${node} data count:`);
      const panchayathIds = Object.keys(allData[node]);
      console.log(`  Panchayath count: ${panchayathIds.length}`);
      let villageCount = 0;
      let uuidCount = 0;
      panchayathIds.forEach((panchayathId) => {
        const villageIds = Object.keys(allData[node][panchayathId]);
        villageCount += villageIds.length;
        villageIds.forEach((villageId) => {
          const uuids = Object.keys(allData[node][panchayathId][villageId]);
          uuidCount += uuids.length;
        });
      });
      console.log(`  Village count: ${villageCount}`);
      console.log(`  UUID count: ${uuidCount}`);
    });

    let finalData = [];
    for (const { uuid, villageId, key } of result) {
      const panchayathId = villageId.substring(0, 2);
      const k = key || "All";

      const form1Data = allData.Form_1?.[panchayathId]?.[villageId]?.[uuid] || {};
      const form3Data = allData.Form_3?.[panchayathId]?.[villageId]?.[uuid] || {};
      const tccFormData = allData.tcc_form?.[panchayathId]?.[villageId]?.[uuid] || {};
      const manualVitalData = allData.manual_vital_data?.[panchayathId]?.[villageId]?.[uuid] || {};

      finalData.push({
        patients1: allData.patients1?.[panchayathId]?.[villageId]?.[uuid] || {},
        Form_1: filterByPhaseKey(form1Data, k, uuid, "Form_1"),
        Form_3: filterByPhaseKey(form3Data, k, uuid, "Form_3"),
        tcc_form: filterByPhaseKey(tccFormData, k, uuid, "tcc_form"),
        manual_vital_data: filterByPhaseKey(manualVitalData, k, uuid, "manual_vital_data"),
      });
    }
    // Apply post-processing on server side to match client expectations
    finalData = postProcessing(expression, finalData);

    console.log("finalData type:", Array.isArray(finalData) ? "array" : typeof finalData);

    return res.status(200).json(finalData);
  } catch (error) {
    console.error("/query/fetch1 error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
