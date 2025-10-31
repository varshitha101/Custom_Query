import ExcelJS from "exceljs";
import { toast } from "react-toastify";

/**
 *  Handles the query fetch operation by sending a POST request to the server
 *  and processing the streamed response to update the UI with the received data.
 *  This function reads the response in chunks, decodes it, and processes each line as JSON.
 *  It also handles specific filtering logic for mammography and ultrasound data,
 *  and applies flattening logic to the data based on timestamps.
 *  It updates the UI state with the received data and manages loading states.
 * @param {Array} expression
 * @param {string} expressionString
 * @param {boolean} setIsLoading
 * @param {number} setstartTime
 * @param {number} setendTime
 * @param {number} setRecivedLength
 * @param {boolean} setIsReciving
 * @returns
 */
export default async function handleQueryFetch(expression, expressionString, setIsLoading, setRecivedLength, setIsReciving, setProcessingNode) {
  const startTime = performance.now();
  try {
    setIsLoading(true);

    // Add timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 30 second timeout

    const response = await fetch(`${import.meta.env.VITE_BASE_SERVER_URL}/query/fetch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expression, expressionString }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId); // Clear the timeout if the request completes in time
    if (!response.ok) {
      console.error("Network response was not ok:", response.statusText);
      toast.error("Network error. Please try again later.");
      return;
    }
    if (response.status !== 200) {
      console.error("Error fetching data:", response.statusText);
      toast.error(response.statusText);
      return;
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let processed = 0;

    while (true) {
      try {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let lines = buffer.split("\n");
        buffer = lines.pop();

        for (let line of lines) {
          if (!line.trim()) continue;

          const parsed = JSON.parse(line);
          try {
            if (parsed.processed !== undefined) {
              processed = parsed.processed;
              setRecivedLength(processed);
              setIsReciving(true);
            } else if (parsed.fetching !== undefined) {
              setProcessingNode(parsed.fetching);
            } else if (parsed.data) {
              setProcessingNode("");
              setIsReciving(false);
              const startExcelTime = performance.now();
              let excelResponse = parsed.data;
              console.log("Received data chunk:", excelResponse);

              if (!excelResponse) {
                console.error("Empty response from server");
                toast.error("Empty response from server. Please try again later.");
                return;
              }
              if (!Array.isArray(excelResponse)) {
                console.log("Invalid response format. Expected an array.");
                toast.error("Invalid response format. Expected an array.");
                return;
              }
              if (excelResponse.length === 0) {
                console.log("No data found for the given query.");
                toast.error("No data found for the given query.");

                return;
              }
              const originalCount = excelResponse.length;
              // Keep only rows where both patients1 and Form_1 exist and are not empty
              excelResponse = excelResponse.filter((row) => row.patients1 && Object.keys(row.patients1).length > 0 && row.Form_1 && Object.keys(row.Form_1).length > 0);
              const removedCount = originalCount - excelResponse.length;
              console.log(`Removed patients : ${removedCount}`);

              // Check if mammography or ultrasound is advised
              const isMammography = expression.some((item) => item.type === "selector" && item.value.selectedOption2 === "Advised bilateral screening mammography");
              const isUltrasound = expression.some((item) => item.type === "selector" && item.value.selectedOption2 === "Advised bilateral screening ultrasound");

              if (isMammography || isUltrasound) {
                excelResponse = excelResponse.filter((row) => {
                  const age = Number(row?.patients1?.age);
                  if (isMammography && !isUltrasound) return age >= 45;
                  if (!isMammography && isUltrasound) return age < 45;
                  return true;
                });
              }
              // --- FLATTENING LOGIC STARTS HERE ---
              const TIMESTAMP_CUTOFF = 1704047400;
              const FORM_KEYS = ["Form_1", "manual_vital_data", "Form_3", "tcc_form"];

              function isNotEmpty(obj) {
                return obj && Object.keys(obj).length > 0;
              }

              function splitRowByTimestamp(row) {
                const ph1Row = { Form_1: {}, manual_vital_data: {}, Form_3: {}, tcc_form: {}, patients1: {} };
                const ph2Row = { Form_1: {}, manual_vital_data: {}, Form_3: {}, tcc_form: {}, patients1: {} };

                FORM_KEYS.forEach((formKey) => {
                  if (row[formKey]) {
                    Object.entries(row[formKey]).forEach(([ts, value]) => {
                      if (Number(ts) <= TIMESTAMP_CUTOFF) {
                        ph1Row[formKey][ts] = value;
                      } else {
                        ph2Row[formKey][ts] = value;
                      }
                    });
                  }
                });

                // Only add patients1 if present
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
              let countTemp = 0;
              let flattenedRows = [];
              excelResponse.forEach((row) => {
                if (!row) {
                  flattenedRows.push(row);
                  return;
                }
                // Collect all timestamps from all form keys
                //const allTimestamps = DEPENDENT_KEYS.flatMap((formKey) => (row[formKey] && typeof row[formKey] === "object" ? Object.keys(row[formKey]) : []));
                const allTimestamps = row.Form_1 && typeof row.Form_1 === "object" ? Object.keys(row.Form_1) : [];

                // const hasOldTimestamp = Array.from(allTimestamps).some((ts) => Number(ts) <= TIMESTAMP_CUTOFF);
                const hasTwoTimestamp = Array.isArray(allTimestamps) && allTimestamps.length > 1;

                if (!hasTwoTimestamp) {
                  flattenedRows.push(row);
                } else {
                  countTemp++;
                  flattenedRows.push(...splitRowByTimestamp(row));
                }
              });
              console.log("Total rows split due to old timestamps:", countTemp);

              // --- FLATTENING LOGIC ENDS HERE ---
              // console.log("Flattened rows:", flattenedRows);

              if (flattenedRows.length > 0) {
                const excelData = flattenedRows.map((row) => {
                  // console.log("excelData", dataChunks)
                  // console.log("Processing row:", row);

                  let timestamps = [];
                  let lastKey = [];

                  // console.log("lastTimestamp",lastKey)
                  let mtimestamps = [];
                  let mlastKey = [];

                  let f3timestamps = [];
                  let f3lastKey = [];

                  let tcctimestamps = [];
                  let tcclastKey = [];

                  if (row.Form_1) {
                    timestamps = Object.keys(row.Form_1);
                    lastKey = timestamps[timestamps.length - 1];
                  }
                  // console.log("lastTimestamp",lastKey)
                  if (row.manual_vital_data) {
                    mtimestamps = Object.keys(row.manual_vital_data);

                    mlastKey = mtimestamps[mtimestamps.length - 1];
                  }
                  // console.log("lastTimestamp", mlastKey);

                  if (row.Form_3) {
                    f3timestamps = Object.keys(row.Form_3);

                    f3lastKey = f3timestamps[f3timestamps.length - 1];
                  }
                  // console.log("lastTimestamp", f3lastKey);

                  if (row.tcc_form) {
                    tcctimestamps = Object.keys(row.tcc_form);
                    // console.log("tcctimestamps", tcctimestamps);

                    tcclastKey = tcctimestamps[tcctimestamps.length - 1];
                  }
                  // console.log("lastTimestamp", tcclastKey);

                  function multipleOptionShsm(shsm) {
                    if (!shsm || typeof shsm !== "object") return "";

                    const exposureOptions = [];
                    if (shsm.atw === "tr") exposureOptions.push("At place of work");
                    if (shsm.ath === "tr") exposureOptions.push("At home");
                    if (shsm.inpb === "tr") exposureOptions.push("In public");
                    if (shsm.none === "tr") exposureOptions.push("None");

                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  // function MOTCC(ttc) {
                  //     if (!ttc || typeof ttc !== "object") return "";

                  //     const exposureOptions = [];
                  //     if (ttc.ttc1) exposureOptions.push("Smoked tobacco - beedi, cigarettes");
                  //     if (ttc.ttc2) exposureOptions.push("Smokeless tobacco - ghutka, hans, pan masala, snuff");
                  //     if (ttc.ttc3) exposureOptions.push("Betel quid with tobacco (kaddipudi, hogesoppu)");
                  //     if (ttc.ttc4) exposureOptions.push("Betel quid without tobacco");
                  //     if (ttc.ttc5) exposureOptions.push("Others");
                  //     return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  // }
                  // function MOtype_tc(ttc) {
                  //     console.log("exposureOptions", ttc);

                  //     const exposureOptions = [];
                  //     if (ttc.types_of_tobacco_consumption1) exposureOptions.push("Smoked tobacco - beedi, cigarettes");
                  //     if (ttc.types_of_tobacco_consumption2) exposureOptions.push("Smokeless tobacco - ghutka, hans, pan masala, snuff");
                  //     if (ttc.types_of_tobacco_consumption3) exposureOptions.push("Betel quid with tobacco (kaddipudi, hogesoppu)");
                  //     if (ttc.types_of_tobacco_consumption4) exposureOptions.push("Betel quid without tobacco");
                  //     if (ttc.types_of_tobacco_consumption5) exposureOptions.push("Others");
                  //     return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  // }

                  function MOTCC(ttc) {
                    if (!ttc || typeof ttc !== "object") return "";

                    const exposureOptions = [];
                    if (ttc.ttc1 || ttc.types_of_tobacco_consumption1) exposureOptions.push("Smoked tobacco - beedi, cigarettes");
                    if (ttc.ttc2 || ttc.types_of_tobacco_consumption2) exposureOptions.push("Smokeless tobacco - ghutka, hans, pan masala, snuff");
                    if (ttc.ttc3 || ttc.types_of_tobacco_consumption3) exposureOptions.push("Betel quid with tobacco (kaddipudi, hogesoppu)");
                    if (ttc.ttc4 || ttc.types_of_tobacco_consumption4) exposureOptions.push("Betel quid without tobacco");
                    if (ttc.ttc5 || ttc.types_of_tobacco_consumption5) exposureOptions.push("Other");
                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  function MOCSF(csf) {
                    if (!csf || typeof csf !== "object") return "";
                    const exposureOptions = [];
                    if (csf.oc === "tr") exposureOptions.push("Oral Cavity");
                    if (csf.bst === "tr") exposureOptions.push("Breast");
                    if (csf.cvx === "tr") exposureOptions.push("Cervix");
                    if (csf.oth === "tr") exposureOptions.push("Others");
                    if (csf.os === "tr") exposureOptions.push("Oesophagus and stomach");
                    if (csf.pstate === "tr") exposureOptions.push("Prostate");
                    if (csf.crl === "tr") exposureOptions.push("Colorectal ");
                    if (csf.oth === "tr") exposureOptions.push("Other");
                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  function MoWsoc(wsoc) {
                    // console.log("wsoc", wsoc);

                    if (!wsoc || typeof wsoc !== "object") return "";
                    const exposureOptions = [];
                    if (wsoc.rwl === "tr") exposureOptions.push("Rapid weight loss without apparent cause");
                    if (wsoc.pcohv === "tr") exposureOptions.push("Persistent cough or hoarseness of voice");
                    if (wsoc.ufw === "tr") exposureOptions.push("a scab, sore or ulcer that fails to heal in three weeks");
                    if (wsoc.bus === "tr") exposureOptions.push("Blood in urine or stools");
                    if (wsoc.amole === "tr") exposureOptions.push("A mole or blemish or wart that enlarges, changes in colour, bleeds or itches");
                    if (wsoc.amogwth === "tr") exposureOptions.push("Any mass or growth in the body");
                    if (wsoc.cbs === "tr") exposureOptions.push("cough up bloody sputum");
                    if (wsoc.pds === "tr") exposureOptions.push("persistent difficulty in swallowing");
                    if (wsoc.fbb === "tr") exposureOptions.push("Frequent changes in bowel and bladder habits");
                    if (wsoc.ub === "tr") exposureOptions.push("Unusual bleeding or discharge from genital, urinary or digestive tract");
                    if (wsoc.bsm === "tr") exposureOptions.push("black sticky motion");
                    // console.log("exposureOptions", exposureOptions);
                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  function Mofss(fss) {
                    // console.log("fss", fss);

                    if (!fss || typeof fss !== "object") return "";
                    const exposureOptions = [];
                    if (fss.tlb === "tr") exposureOptions.push("A thickening or lump in breast or elsewhere");
                    if (fss.bdn === "tr") exposureOptions.push("Bleeding or discharge from nipple");
                    if (fss.ipmb === "tr") exposureOptions.push("Irregular/post menopausal bleeding");
                    if (fss.uwd === "tr") exposureOptions.push("Unusual white discharge");
                    // console.log("exposureOptions", exposureOptions);

                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  function Mosdf(sdf) {
                    // console.log("sdf", sdf)
                    if (!sdf || typeof sdf !== "object") return "";
                    const exposureOptions = [];
                    if (sdf.oc) exposureOptions.push("Oral Cancer");
                    if (sdf.bc) exposureOptions.push("Breast Cancer");
                    if (sdf.cc) exposureOptions.push("Cervical Cancer");
                    if (sdf.gco) exposureOptions.push("General check only");
                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  function Mofndgs(fndgs) {
                    // console.log("fndgs", fndgs)
                    if (!fndgs || typeof fndgs !== "object") return "";
                    const exposureOptions = [];
                    if (fndgs.elp) exposureOptions.push("Erythroleukoplakia");
                    if (fndgs.ep) exposureOptions.push("Erythroplakia");
                    if (fndgs.gwth) exposureOptions.push("growth");
                    if (fndgs.hl) exposureOptions.push("homogenous_Leukoplakia");
                    if (fndgs.lp) exposureOptions.push("Lichen Planus");
                    if (fndgs.nad) exposureOptions.push("NAD");
                    if (fndgs.ncknde) exposureOptions.push("Neck Nodes");
                    if (fndgs.nhl) exposureOptions.push("Non homogenous leukoplakia");
                    if (fndgs.sf) exposureOptions.push("submucous_Fibrosis");
                    if (fndgs.sp) exposureOptions.push("smokers_Palate");
                    if (fndgs.su) exposureOptions.push("suspicious_ulcer");
                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  function extractPhotoURLs(photoObject) {
                    if (String(photoObject) === "123") return "";
                    if (!photoObject || typeof photoObject !== "object") return "";
                    const urls = Object.values(photoObject).filter((url) => typeof url === "string" && url.trim() !== "");
                    return urls.length > 0 ? urls.join("; ") : "";
                  }

                  function Mohl(hl) {
                    // console.log("hl", hl)
                    if (!hl || typeof hl !== "object") return "";
                    const exposureOptions = [];
                    if (hl.avl) exposureOptions.push("Anterior vestibule lower");
                    if (hl.avu) exposureOptions.push("Anterior vestibule upper");
                    if (hl.fm) exposureOptions.push("Floor of the mouth");
                    if (hl.hp) exposureOptions.push("Hard palate");
                    if (hl.lbm) exposureOptions.push("Left buccal mucosa");
                    if (hl.lbtl) exposureOptions.push("Lateral border of tongue left");
                    if (hl.lbtr) exposureOptions.push("Lateral border of tongue right");
                    if (hl.llgbs) exposureOptions.push("Lower left GBS");
                    if (hl.llm) exposureOptions.push("Lower labial mucosa");
                    if (hl.lrgbs) exposureOptions.push("Lower right GBS");
                    if (hl.rbm) exposureOptions.push("Right buccal mucosa");
                    if (hl.rmt) exposureOptions.push("Retro molar trigone");
                    if (hl.sp) exposureOptions.push("Soft palate");
                    if (hl.ulgbs) exposureOptions.push("Upper left GBS");
                    if (hl.ulm) exposureOptions.push("Upper labial mucosa");
                    if (hl.urgbs) exposureOptions.push("Upper right GBS");
                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  function Mohl_ld(hl) {
                    if (!hl || typeof hl !== "object") return "";
                    const labelMap = {
                      lt2cm: "Less than 2 cm diameter",
                      tt4cm: "2-4 cm diameter",
                      mt4cm: "more than 4cm diameter",
                      dfusd: "diffused",
                    };

                    const keys = ["avl", "avu", "fm", "hp", "lbm", "lbtr", "lbtl", "llgbs", "llm", "lrgbs", "rbm", "rmt", "sp", "ulgbs", "ulm", "urgbs"];

                    const exposureOptions = [];

                    for (const key of keys) {
                      const value = hl[key];
                      if (value && labelMap[value]) {
                        exposureOptions.push(labelMap[value]);
                      } else if (value) {
                        // fallback to raw value if no mapping found
                        exposureOptions.push(value);
                      }
                    }
                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  function Monhl(nhl) {
                    // console.log("nhl", nhl)
                    if (!nhl || typeof nhl !== "object") return "";
                    const exposureOptions = [];
                    if (nhl.avl) exposureOptions.push("Anterior vestibule lower");
                    if (nhl.avu) exposureOptions.push("Anterior vestibule upper");
                    if (nhl.fm) exposureOptions.push("Floor of the mouth");
                    if (nhl.hp) exposureOptions.push("Hard palate");
                    if (nhl.lbm) exposureOptions.push("Left buccal mucosa");
                    if (nhl.lbtl) exposureOptions.push("Lateral border of tongue left");
                    if (nhl.lbtr) exposureOptions.push("Lateral border of tongue right");
                    if (nhl.llgbs) exposureOptions.push("Lower left GBS");
                    if (nhl.llm) exposureOptions.push("Lower labial mucosa");
                    if (nhl.lrgbs) exposureOptions.push("Lower right GBS");
                    if (nhl.rbm) exposureOptions.push("Right buccal mucosa");
                    if (nhl.rmt) exposureOptions.push("Retro molar trigone");
                    if (nhl.sp) exposureOptions.push("Soft palate");
                    if (nhl.ulgbs) exposureOptions.push("Upper left GBS");
                    if (nhl.ulm) exposureOptions.push("Upper labial mucosa");
                    if (nhl.urgbs) exposureOptions.push("Upper right GBS");
                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  function Monhl_ld(nhl) {
                    if (!nhl || typeof nhl !== "object") return "";
                    const labelMap = {
                      lt2cm: "Less than 2 cm diameter",
                      tt4cm: "2-4 cm diameter",
                      mt4cm: "more than 4cm diameter",
                      dfusd: "diffused",
                    };

                    const keys = ["avl", "avu", "fm", "hp", "lbm", "lbtr", "lbtl", "llgbs", "llm", "lrgbs", "rbm", "rmt", "sp", "ulgbs", "ulm", "urgbs"];

                    const exposureOptions = [];

                    for (const key of keys) {
                      const value = nhl[key];
                      if (value && labelMap[value]) {
                        exposureOptions.push(labelMap[value]);
                      } else if (value) {
                        // fallback to raw value if no mapping found
                        exposureOptions.push(value);
                      }
                    }
                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  function Moelp(elp) {
                    // console.log("elp", elp)
                    if (!elp || typeof elp !== "object") return "";
                    const exposureOptions = [];
                    if (elp.avl) exposureOptions.push("Anterior vestibule lower");
                    if (elp.avu) exposureOptions.push("Anterior vestibule upper");
                    if (elp.fm) exposureOptions.push("Floor of the mouth");
                    if (elp.hp) exposureOptions.push("Hard palate");
                    if (elp.lbm) exposureOptions.push("Left buccal mucosa");
                    if (elp.lbtl) exposureOptions.push("Lateral border of tongue left");
                    if (elp.lbtr) exposureOptions.push("Lateral border of tongue right");
                    if (elp.llgbs) exposureOptions.push("Lower left GBS");
                    if (elp.llm) exposureOptions.push("Lower labial mucosa");
                    if (elp.lrgbs) exposureOptions.push("Lower right GBS");
                    if (elp.rbm) exposureOptions.push("Right buccal mucosa");
                    if (elp.rmt) exposureOptions.push("Retro molar trigone");
                    if (elp.sp) exposureOptions.push("Soft palate");
                    if (elp.ulgbs) exposureOptions.push("Upper left GBS");
                    if (elp.ulm) exposureOptions.push("Upper labial mucosa");
                    if (elp.urgbs) exposureOptions.push("Upper right GBS");
                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  function Moelp_ld(elp) {
                    if (!elp || typeof elp !== "object") return "";
                    const labelMap = {
                      lt2cm: "Less than 2 cm diameter",
                      tt4cm: "2-4 cm diameter",
                      mt4cm: "more than 4cm diameter",
                      dfusd: "diffused",
                    };

                    const keys = ["avl", "avu", "fm", "hp", "lbm", "lbtr", "lbtl", "llgbs", "llm", "lrgbs", "rbm", "rmt", "sp", "ulgbs", "ulm", "urgbs"];

                    const exposureOptions = [];

                    for (const key of keys) {
                      const value = elp[key];
                      if (value && labelMap[value]) {
                        exposureOptions.push(labelMap[value]);
                      } else if (value) {
                        // fallback to raw value if no mapping found
                        exposureOptions.push(value);
                      }
                    }
                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  function Moep(ep) {
                    // console.log("ep", ep)
                    if (!ep || typeof ep !== "object") return "";
                    const exposureOptions = [];
                    if (ep.avl) exposureOptions.push("Anterior vestibule lower");
                    if (ep.avu) exposureOptions.push("Anterior vestibule upper");
                    if (ep.fm) exposureOptions.push("Floor of the mouth");
                    if (ep.hp) exposureOptions.push("Hard palate");
                    if (ep.lbm) exposureOptions.push("Left buccal mucosa");
                    if (ep.lbtl) exposureOptions.push("Lateral border of tongue left");
                    if (ep.lbtr) exposureOptions.push("Lateral border of tongue right");
                    if (ep.llgbs) exposureOptions.push("Lower left GBS");
                    if (ep.llm) exposureOptions.push("Lower labial mucosa");
                    if (ep.lrgbs) exposureOptions.push("Lower right GBS");
                    if (ep.rbm) exposureOptions.push("Right buccal mucosa");
                    if (ep.rmt) exposureOptions.push("Retro molar trigone");
                    if (ep.sp) exposureOptions.push("Soft palate");
                    if (ep.ulgbs) exposureOptions.push("Upper left GBS");
                    if (ep.ulm) exposureOptions.push("Upper labial mucosa");
                    if (ep.urgbs) exposureOptions.push("Upper right GBS");
                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  function Moep_ld(ep) {
                    // console.log("ep", ep)
                    if (!ep || typeof ep !== "object") return "";
                    const labelMap = {
                      lt2cm: "Less than 2 cm diameter",
                      tt4cm: "2-4 cm diameter",
                      mt4cm: "more than 4cm diameter",
                      dfusd: "diffused",
                    };

                    const keys = ["avl", "avu", "fm", "hp", "lbm", "lbtr", "lbtl", "llgbs", "llm", "lrgbs", "rbm", "rmt", "sp", "ulgbs", "ulm", "urgbs"];

                    const exposureOptions = [];

                    for (const key of keys) {
                      const value = ep[key];
                      if (value && labelMap[value]) {
                        exposureOptions.push(labelMap[value]);
                      } else if (value) {
                        // fallback to raw value if no mapping found
                        exposureOptions.push(value);
                      }
                    }
                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  function MoOSMF(osmf) {
                    // console.log("osmf", osmf)
                    if (!osmf || typeof osmf !== "object") return "";
                    const exposureOptions = [];
                    if (osmf.a_gloss) exposureOptions.push("Atrophic glossitis");
                    if (osmf.blchng) exposureOptions.push("blanching");
                    if (osmf.bm) exposureOptions.push("Burning mouth");
                    if (osmf.pfb) exposureOptions.push("Palpable fibrous bands");
                    if (osmf.rmo) exposureOptions.push("Restricted mouth opening");
                    if (osmf.rtm) exposureOptions.push("Restricted tongue movement");
                    if (osmf.sv) exposureOptions.push("Shrunken uvula");
                    if (osmf.othr_cmnts) exposureOptions.push("other comments");

                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  function MoLpp(lpp) {
                    // console.log("lpp", lpp)
                    if (!lpp || typeof lpp !== "object") return "";
                    const exposureOptions = [];
                    if (lpp.alp) exposureOptions.push("Atrophic LP");
                    if (lpp.blp) exposureOptions.push("Bullous LP");
                    if (lpp.elp) exposureOptions.push("Erosive LP");
                    if (lpp.plp) exposureOptions.push("Papular LP");
                    if (lpp.plqp) exposureOptions.push("Plaque LP");
                    if (lpp.rlp) exposureOptions.push("Reticular LP");
                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  function MoLpp_ld(lpp) {
                    if (!lpp || typeof lpp !== "object") return "";

                    const labelMap = {
                      lbm: "left buccal mucosa",
                      rbm: "right buccal mucosa",
                    };

                    const exposureOptions = [];

                    const keys = ["alp", "blp", "elp", "plp", "plqp", "rlp"];
                    for (const key of keys) {
                      const value = lpp[key];
                      if (value && labelMap[value]) {
                        exposureOptions.push(labelMap[value]);
                      } else if (value) {
                        // fallback to raw value if no mapping found
                        exposureOptions.push(value);
                      }
                    }

                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  function MoSugrwth(sugrwth) {
                    // console.log("sugrwth", sugrwth)
                    if (!sugrwth || typeof sugrwth !== "object") return "";
                    const exposureOptions = [];
                    if (sugrwth.avl) exposureOptions.push("Anterior vestibule lower");
                    if (sugrwth.avu) exposureOptions.push("Anterior vestibule upper");
                    if (sugrwth.fm) exposureOptions.push("Floor of the mouth");
                    if (sugrwth.hp) exposureOptions.push("Hard palate");
                    if (sugrwth.lbm) exposureOptions.push("Left buccal mucosa");
                    if (sugrwth.lbtl) exposureOptions.push("Lateral border of tongue left");
                    if (sugrwth.lbtr) exposureOptions.push("Lateral border of tongue right");
                    if (sugrwth.llgbs) exposureOptions.push("Lower left GBS");
                    if (sugrwth.llm) exposureOptions.push("Lower labial mucosa");
                    if (sugrwth.lrgbs) exposureOptions.push("Lower right GBS");
                    if (sugrwth.rbm) exposureOptions.push("Right buccal mucosa");
                    if (sugrwth.rmt) exposureOptions.push("Retro molar trigone");
                    if (sugrwth.sp) exposureOptions.push("Soft palate");
                    if (sugrwth.ulgbs) exposureOptions.push("Upper left GBS");
                    if (sugrwth.ulm) exposureOptions.push("Upper labial mucosa");
                    if (sugrwth.urgbs) exposureOptions.push("Upper right GBS");
                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  function MoSugrwth_ld(sugrwth) {
                    if (!sugrwth || typeof sugrwth !== "object") return "";
                    const labelMap = {
                      lt2cm: "Less than 2 cm diameter",
                      tt4cm: "2-4 cm diameter",
                      mt4cm: "more than 4cm diameter",
                    };

                    const keys = ["avl", "avu", "fm", "hp", "lbm", "lbtr", "lbtl", "llgbs", "llm", "lrgbs", "rbm", "rmt", "sp", "ulgbs", "ulm", "urgbs"];

                    const exposureOptions = [];

                    for (const key of keys) {
                      const value = sugrwth[key];
                      if (value && labelMap[value]) {
                        exposureOptions.push(labelMap[value]);
                      } else if (value) {
                        // fallback to raw value if no mapping found
                        exposureOptions.push(value);
                      }
                    }
                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  function MoSus_grwth(sus_grwth) {
                    // console.log("sus_grwth", sus_grwth)
                    if (!sus_grwth || typeof sus_grwth !== "object") return "";
                    const exposureOptions = [];
                    if (sus_grwth.avl) exposureOptions.push("Anterior vestibule lower");
                    if (sus_grwth.avu) exposureOptions.push("Anterior vestibule upper");
                    if (sus_grwth.fm) exposureOptions.push("Floor of the mouth");
                    if (sus_grwth.hp) exposureOptions.push("Hard palate");
                    if (sus_grwth.lbm) exposureOptions.push("Left buccal mucosa");
                    if (sus_grwth.lbtl) exposureOptions.push("Lateral border of tongue left");
                    if (sus_grwth.lbtr) exposureOptions.push("Lateral border of tongue right");
                    if (sus_grwth.llgbs) exposureOptions.push("Lower left GBS");
                    if (sus_grwth.llm) exposureOptions.push("Lower labial mucosa");
                    if (sus_grwth.lrgbs) exposureOptions.push("Lower right GBS");
                    if (sus_grwth.rbm) exposureOptions.push("Right buccal mucosa");
                    if (sus_grwth.rmt) exposureOptions.push("Retro molar trigone");
                    if (sus_grwth.sp) exposureOptions.push("Soft palate");
                    if (sus_grwth.ulgbs) exposureOptions.push("Upper left GBS");
                    if (sus_grwth.ulm) exposureOptions.push("Upper labial mucosa");
                    if (sus_grwth.urgbs) exposureOptions.push("Upper right GBS");
                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  function MoSus_grwth_ld(sus_grwth) {
                    if (!sus_grwth || typeof sus_grwth !== "object") return "";
                    const labelMap = {
                      lt2cm: "Less than 2 cm diameter",
                      tt4cm: "2-4 cm diameter",
                      mt4cm: "more than 4cm diameter",
                    };

                    const keys = ["avl", "avu", "fm", "hp", "lbm", "lbtr", "lbtl", "llgbs", "llm", "lrgbs", "rbm", "rmt", "sp", "ulgbs", "ulm", "urgbs"];

                    const exposureOptions = [];

                    for (const key of keys) {
                      const value = sus_grwth[key];
                      if (value && labelMap[value]) {
                        exposureOptions.push(labelMap[value]);
                      } else if (value) {
                        // fallback to raw value if no mapping found
                        exposureOptions.push(value);
                      }
                    }
                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  function MOSmkrsPalate(smkrspalate) {
                    if (!smkrspalate || typeof smkrspalate !== "object") return "";

                    const exposureOptions = [];
                    if (smkrspalate.hp) exposureOptions.push("Hard palate");
                    if (smkrspalate.sp) exposureOptions.push("Soft palate");

                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  function MObrst_exm(brst_exm) {
                    if (!brst_exm || typeof brst_exm !== "object") return "";

                    const exposureOptions = [];
                    if (brst_exm.a_n_p) exposureOptions.push("Axillary Nodes palpable");
                    if (brst_exm.f_m_l) exposureOptions.push("Freely Mobile Lump");
                    if (brst_exm.f_s_l) exposureOptions.push("Fixed Suspicious Lump");
                    if (brst_exm.n_d) exposureOptions.push("Nipple Discharge");
                    if (brst_exm.thkng) exposureOptions.push("Thickening");
                    if (brst_exm.nml) exposureOptions.push("Normal");

                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  function MOabn_det(abn_det) {
                    if (!abn_det || typeof abn_det !== "object") return "";

                    const exposureOptions = [];
                    if (abn_det.ilq) exposureOptions.push("Inner lower quadrant");
                    if (abn_det.iuq) exposureOptions.push("Inner upper quadrant");
                    if (abn_det.olq) exposureOptions.push("Outer lower quadrant");
                    if (abn_det.ouq) exposureOptions.push("Outer upper quadrant");

                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  function MOnd(nd) {
                    if (!nd || typeof nd !== "object") return "";

                    const exposureOptions = [];
                    if (nd.bs) exposureOptions.push("Blood stained");
                    if (nd.grm) exposureOptions.push("Grumous");
                    if (nd.md) exposureOptions.push("Multiple Duct");
                    if (nd.sd) exposureOptions.push("Single Duct");
                    if (nd.serous) exposureOptions.push("Serous");
                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  function MOinfrmn(infrmn) {
                    if (!infrmn || typeof infrmn !== "object") return "";
                    const exposureOptions = [];
                    if (infrmn.irrm) exposureOptions.push("Irregular menstruation");
                    if (infrmn.uce) exposureOptions.push("Under menstruation");
                    if (infrmn.phs) exposureOptions.push("Post hysterectomy status");
                    if (infrmn.um) exposureOptions.push("Unwilling for cervical examination");
                    if (infrmn.wdpv) exposureOptions.push("WDPV");
                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  function MOperspec(perspec) {
                    if (!perspec || typeof perspec !== "object") return "";

                    const exposureOptions = [];
                    if (perspec.bdp) exposureOptions.push("Bloody discharge present");
                    if (perspec.epp) exposureOptions.push("Endocervical polyp present");
                    if (perspec.ersnp) exposureOptions.push("Erosion present");
                    if (perspec.grwthp) exposureOptions.push("Growth present");
                    if (perspec.lsnp) exposureOptions.push("Lesion Present");
                    if (perspec.ncp) exposureOptions.push("Nabothian cyst present");
                    if (perspec.rft) exposureOptions.push("Require further test");
                    if (perspec.sc) exposureOptions.push("Strawberry cervix");
                    if (perspec.sfv) exposureOptions.push("SCJ fully visible");
                    if (perspec.snv) exposureOptions.push("SCJ not visible");
                    if (perspec.spv) exposureOptions.push("SCJ partially visible");
                    if (perspec.vdly) exposureOptions.push("VIA done last year");
                    if (perspec.wdp) exposureOptions.push("White discharge present");
                    return exposureOptions.length > 0 ? exposureOptions.join("; ") : "";
                  }

                  function ReasonForUptake(ba) {
                    if (!ba || typeof ba !== "string") return "";

                    const reasonMap = {
                      dntl: "Dental issues",
                      lef: "Learnt from elders of the family",
                      pinf: "Peer influence",
                      ws: "Due to work stress",
                      fprb: "Family problems",
                      slpissue: "Sleep issues",
                      bdm: "Boredom",
                      doap: "During or after pregnancy",
                      nk: "Not known",
                      sc: "Since childhood",
                      oth: "Others",
                    };

                    const codes = ba
                      .split(",")
                      .map((code) => code.trim())
                      .filter(Boolean);
                    const reasons = codes
                      .map((code) => {
                        // Find the reason if the code starts with the key (handles "oth:..." etc.)
                        const key = Object.keys(reasonMap).find((k) => code.startsWith(k));
                        return key ? reasonMap[key] : undefined;
                      })
                      .filter(Boolean);

                    return reasons.length > 0 ? reasons.join("; ") : "";
                  }

                  function barriers_To_Quit(ba) {
                    if (!ba || typeof ba !== "string") return "";

                    const reasonMap = {
                      fi1: "Stress",
                      fi2: "Craving",
                      fi3: "Sleeplessness",
                      fi4: "Disinterest in work",
                      fi5: "Irritability",
                      fi6: "Anxiety",
                      fi7: "Unable to pass bowel movements",
                      bdm: "Boredom",
                      fi9: "Peer pressure",
                      fi10: "Headaches",
                      fi11: "Others",
                    };

                    const codes = ba
                      .split(",")
                      .map((code) => code.trim().split(":")[0].trim()) // Split by colon and take the first part
                      .filter(Boolean);
                    // console.log("codes", codes);

                    const reasons = codes
                      .map((code) => {
                        // First try exact match
                        if (reasonMap[code]) return reasonMap[code];
                        // Then try startsWith for cases like fi11:other
                        const key = Object.keys(reasonMap).find((k) => code.startsWith(k));
                        return key ? reasonMap[key] : undefined;
                      })
                      .filter(Boolean);

                    // if (reasons.length > 0) {
                    //   console.log("codes", codes);
                    //   console.log("reasons", reasons);
                    //   console.log("reasons", reasons.join("; "));
                    // }

                    return reasons.length > 0 ? reasons.join("; ") : "";
                  }

                  function recFunc() {
                    const node1 = row.Form_3[f3lastKey]?.recdn;
                    const node2 = row.Form_3[f3lastKey]?.recmd;
                    if (node1 === "rflp") {
                      if (node2.lsr) return "Local Procedure-Laser";
                      if (node2.cpscy) return "Local Procedure-Colposcopy";
                      if (node2.mghpy) return "Local Procedure-Mammography";
                      if (node2.ulsnd) return "Local Procedure-Ultrasound";
                    } else {
                      if (node1 === "nsd") return "Next screening date";
                      if (node1 === "rth") return "Recommendation to hospital";
                      if (node1 === "nointrvn") return "No intervention";
                    }
                  }

                  function bilMoSrcFunc(data) {
                    let age = row.patients1.age;
                    if (age >= 45) {
                      if (data === "y") return "Yes";
                      if (data === "n") return "No";
                      if (data === "ttc5") return "Other";
                      else return "";
                    } else return "";
                  }

                  function bilMoSrcOth(data) {
                    const info = row.Form_3[f3lastKey]?.adv_mgphy_val;
                    let age = row.patients1.age;
                    if (age >= 45) {
                      if (data === "ttc5") return info;
                      else return "";
                    } else return "";
                  }

                  function bilUsSrcOth(data) {
                    const info = row.Form_3[f3lastKey]?.adv_mgphy_val;
                    let age = row.patients1.age;
                    if (age < 45) {
                      if (data === "ttc5") return info;
                      else return "";
                    } else return "";
                  }

                  function bilUsSrcFunc(data) {
                    let age = row.patients1.age;
                    if (age < 45) {
                      if (data === "y") return "Yes";
                      if (data === "n") return "No";
                      if (data === "ttc5") return "Other";
                      else return "";
                    } else return "";
                  }

                  // function fnacComment(data) {
                  //   const info = row.Form_3[f3lastKey]?.fnac_dn_in;
                  //   if (info === "othr") {
                  //     return data;
                  //   } else {
                  //     return "";
                  //   }
                  // }
                  function mapping4(data) {
                    if (data === "y") return "Yes";
                    if (data === "n") return "No";
                    if (data === "dntkw") return "Don't Know";
                    if (data === "absnt") return "Absent";
                    return data;
                  }
                  function fnacDnIn(data) {
                    if (data === "y") return "Yes";
                    if (data === "n") return "No";
                    if (data === "ttc5") return "Other";
                    if (data === "None") return "";
                    else return data;
                  }
                  function mapping(data) {
                    if (data === "F") return "Female";
                    if (data === "M") return "Male";
                    if (data === "f") return "Female";
                    if (data === "m") return "Male";
                    if (data === "dntkw") return "Don't know";
                    if (data === "othr") return "Other";
                    if (data === "others") return "Others";
                    if (data === "ttc5") return "Other";
                    if (data === "y") return "Yes";
                    if (data === "n") return "No";
                    if (data === "ip") return "In Person";
                    if (data === "absnt") return "Absent";
                    if (data === "rtc") return "Ration Card";
                    if (data === "aadhr") return "Aadhar";
                    if (data === "votid") return "Voters ID";
                    if (data === "na") return "Not available";
                    if (data === "sng") return "Single";
                    if (data === "mrd") return "Married";
                    if (data === "wdw") return "Widow";
                    if (data === "wdwr") return "Widower";
                    if (data === "dvcd") return "Divorced";
                    if (data === "Hndu") return "Hindu";
                    if (data === "Chrst") return "Christian";
                    if (data === "budst") return "Buddhist";
                    if (data === "muslm") return "Muslim";
                    if (data === "Others") return "Others";
                    if (data === "Other") return "Other";
                    if (data === "No_sch") return "No schooling";
                    if (data === "upto_5th") return "upto 5th Standard";
                    if (data === "upto_7th") return "upto 7th Standard";
                    if (data === "sslc") return "SSLC";
                    if (data === "puc") return "PUC";
                    if (data === "dip") return "Diploma";
                    if (data === "grad") return "Graduation";
                    if (data === "postgrad") return "Post graduation";
                    if (data === "grp1") return "Legislators, Senior Officials and Managers - Group 1";
                    if (data === "grp2") return "Professionals - Group 2";
                    if (data === "grp3") return "Technicians and associate professionals - Group 3";
                    if (data === "grp4") return "Clerks/Clerical support workers - Group 4";
                    if (data === "grp5") return "Service and sales workers - Group 5";
                    if (data === "grp6") return "Skilled agricultural, forestry and fishery workers - Group 6";
                    if (data === "grp7") return "Craft and related trader workers - Group 7";
                    if (data === "grp8") return "Plant and machine operators and assemblers - Group 8";
                    if (data === "grp9") return "Elementary occupations - Group 9";
                    if (data === "wkntclsby") return "Workers not classified by Occupations - Group 10";
                    if (data === "lt12500") return "less than INR 1,25,000";
                    if (data === "btw12500to50k") return "between INR 1,25,000 to INR 5,00,000";
                    if (data === "btw50kto3l") return "between INR 5,00,000 to INR 30,00,000";
                    if (data === "gt3l") return "More than INR 30,00,000";
                    if (data === "nn") return "Not Now";
                    if (data === "nk") return "Not Known";
                    if (data === "nvr") return "Never";
                    if (data === "lt1yrs") return "less than 1 year";
                    if (data === "otfyrs") return "1-5 years";
                    if (data === "sttyrs") return "6-10 years";
                    if (data === "ettyrs") return "11-20 years";
                    if (data === "gt20") return "> 20 years";
                    if (data === "gt20yrs") return "> 20 years";
                    if (data === "tt40") return "20-40 years";
                    if (data === "gt40") return "> 40 years";
                    if (data === "subs") return "Substitution";
                    if (data === "slfctrl") return "Self Control";
                    if (data === "tttdays") return "2-3 days";
                    if (data === "owk") return "1 week";
                    if (data === "omnth") return "1 month";
                    if (data === "ttsmnths") return "2-6 months";
                    if (data === "wnw") return "Was not well";
                    if (data === "athosp") return "Admitted to the hospital";
                    if (data === "fmc") return "Family member had cancer";
                    if (data === "scpags") return "saw some cancer patients and got scareds";
                    if (data === "ngfh") return "not good for health";
                    if (data === "fbama") return "felt bad about my addiction";
                    if (data === "dly") return "Daily";
                    if (data === "oiw") return "Weekly";
                    if (data === "wkly") return "Weekly";
                    if (data === "mntly") return "Monthly";
                    if (data === "ocsnly") return "Occasionally";
                    if (data === "ltay") return "less than a year";
                    if (data === "ot3yrs") return "1-3 years";
                    if (data === "mt3yrs") return "more than 3 years";
                    if (data === "fcmp") return "Free camp";
                    if (data === "sussymp") return "Suspected symptoms";
                    if (data === "prem") return "Premenopausal";
                    if (data === "perm") return "Perimenopausal";
                    if (data === "pom") return "Post menopausal";
                    if (data === "phys") return "Post hysterectomy";
                    if (data === "reg") return "Regular";
                    if (data === "irr") return "Irregular";
                    if (data === "irreg") return "Irregular";
                    if (data === "pu1") return "prolapsed uterus";
                    if (data === "eb1") return "excessive bleeding";
                    if (data === "ewd") return "excessive white dischage";
                    if (data === "pcb") return "post coital bleeding";
                    if (data === "ocyst") return "ovarian cysts";
                    if (data === "oiss") return "other issues";
                    if (data === "exsn") return "Excision";
                    if (data === "abln") return "Ablation";
                    if (data === "naa") return "NA";
                    if (data === "pos") return "Positive";
                    if (data === "neg") return "Negative";
                    if (data === "unwg") return "Unwilling";
                    if (data === "yaw") return "Yes and willing";
                    if (data === "yauw") return "Yes and unwilling";
                    if (data === "a") return "Often";
                    if (data === "b") return "Occasionally";
                    if (data === "c") return "Always";
                    if (data === "d") return "Within 5 minutes";
                    if (data === "fab") return "6-30 minutes";
                    if (data === "fac") return "31-60 minutes";
                    if (data === "e") return "After 60 minutes";
                    if (data === "first_one") return "The first one in the morning";
                    if (data === "any_other") return "Any other";
                    if (data === "dda") return "Thirty one or more";
                    if (data === "ddb") return "Twenty one-Thirty";
                    if (data === "ddc") return "Eleven-Twenty";
                    if (data === "ddd") return "Ten or less";
                    if (data === "fda") return "More than Three";
                    if (data === "fdb") return "Two - Three";
                    if (data === "fdc") return "One";
                    if (data === "gja") return "Individualized";
                    if (data === "gjb") return "Peer Group";
                    if (data === "gka") return "Inperson";
                    if (data === "gkb") return "Telephonic";
                    if (data === "hbda") return "Low dependence";
                    if (data === "hbdb") return "Low to moderate dependence";
                    if (data === "hbdc") return "Moderate dependence";
                    if (data === "hbdd") return "High dependence";
                    if (data === "he1") return "Pre-Contemplation";
                    if (data === "he2") return "Contemplation";
                    if (data === "he3") return "Action";
                    if (data === "he4") return "Maintenance";
                    if (data === "he5") return "Preparation";
                    if (data === "he6") return "Relapse";
                    if (data === "hh1") return "Solution Focused Brief Therapy Techniques";
                    if (data === "hh2") return "Motivational Enhancement techniques";
                    if (data === "hh3") return "Brief advice";
                    if (data === "a1") return "Alive";
                    if (data === "d1") return "Dead";
                    else return data;
                  }

                  function mapping1(data) {
                    if (data === "y") return "Yes";
                    if (data === "nn") return "Not Now";
                    if (data === "nvr") return "Never";
                    if (data === "absnt") return "Never";
                    else return data;
                  }

                  function Mapping2(data) {
                    if (data === "c") return "Always";
                    if (data === "fbb") return "Sometimes";
                    if (data === "fbc") return "Never";
                    if (data === "0") return "";
                    else return data;
                  }

                  function mapping3(data) {
                    if (data === "y") return "Yes";
                    if (data === "nn") return "Not now";
                    if (data === "nvr") return "Never";
                    if (data === "absnt") return "Never";
                    else return data;
                  }
                  function mapping5(data) {
                    if (data === "fda") return "More than Three";
                    if (data === "fdb") return "Two-Three";
                    if (data === "fdc") return "One";
                  }
                  function ORBA(ba) {
                    if (!ba || typeof ba !== "string") return "";

                    const match = ba
                      .split(",")
                      .map((s) => s.trim())
                      .find((entry) => entry.startsWith("oth:"));
                    return match ? match.split(":")[1] : "";
                  }

                  function ORFI(fi) {
                    if (!fi || typeof fi !== "string") return "";

                    const match = fi
                      .split(",")
                      .map((s) => s.trim())
                      .find((entry) => entry.startsWith("fi11:"));
                    return match ? match.split(":")[1] : "";
                  }

                  function no_fm() {
                    const isFilled = (section) => {
                      if (!section) return false;
                      return Object.values(section).some((val) => val !== "");
                    };
                    let count = 0;
                    if (isFilled(row.Form_1[lastKey]?.f1d)) count++;
                    if (isFilled(row.Form_1[lastKey]?.f2d)) count++;
                    if (isFilled(row.Form_1[lastKey]?.f3d)) count++;
                    if (count === 0) return "";
                    if (count === 3) return "3 or more";
                    return count;
                  }

                  return {
                    // Patients
                    Timestamp: lastKey ? new Date((Number(lastKey) + 19800) * 1000).toISOString().replace("T", " ").replace(/\..+/, "").replace(/-/g, "/") : "",
                    Date: lastKey ? new Date((Number(lastKey) + 19800) * 1000).toISOString().replace(/-/g, "/").replace("T", " ").split(" ")[0] : "",
                    Village: row.patients1.vname || "",
                    Panchayath: row.patients1.pcht_n || "",
                    "Individual Unique ID ": row.patients1.pid || "",
                    Name: row.patients1.name || "",
                    "ID Proof Type": mapping(row.patients1.idprftype) || "",
                    "ID Proof Number": row.patients1.idprfno || "",
                    "Number of family members": row.patients1.no_fm || "",
                    Status: mapping(row.patients1.sts) || "",
                    Gender: mapping(row.patients1.gndr) || "",
                    "Contact Number": row.patients1.ctc_no || "",
                    "Marital Status": mapping(row.patients1.ms) || "",
                    "Father's Name ": row.patients1.f_name || "",
                    "Mother's Name": row.patients1.m_name || "",
                    Age: row.patients1.age || "",
                    "Weight (in kgs)": row.patients1.wt || "",
                    "Height (in cms)": row.patients1.ht || "",
                    Religion: mapping(row.patients1.rlg) || "",
                    Education: mapping(row.patients1.edu) || "",
                    "Occupation Group - According to NCO 2015": mapping(row.patients1.occgrp) || "",
                    "Estimated Annual Family Income": mapping(row.patients1.fam_inc) || "",
                    //Form1
                    "Have you heard about cancer ?": mapping(row.Form_1[lastKey]?.abt_ca) || "",
                    "Are you aware of the symptoms/warning signs of cancer?": mapping(row.Form_1[lastKey]?.ws_ca) || "",
                    "Do you think tobacco causes cancer?": mapping4(row.Form_1[lastKey]?.tcc) || "",
                    "Can cancer spread from one person to another?": mapping4(row.Form_1[lastKey]?.spp) || "",
                    "Is there treatment and cure for cancer?": mapping4(row.Form_1[lastKey]?.tmt_cc) || "",
                    "Exposure to second hand smoke": multipleOptionShsm(row.Form_1[lastKey]?.shsm) || "",
                    "Do you currently use tobacco in any form?": mapping1(row.Form_1[lastKey]?.tif) || "",
                    'If answered "yes" or "not now", for how many years have you had the habit? ': mapping(row.Form_1[lastKey]?.yoh) || "",
                    "If not now, how long has it been since you quit the habit?": mapping(row.Form_1[lastKey]?.qth) || "",
                    "Types of tobacco consumption": MOTCC(row.Form_1[lastKey]?.ttc) || "",
                    "Frequency of use / day [Smoked tobacco - beedi, cigarettes]": row.Form_1[lastKey]?.ttc_val.stbc || "",
                    "Frequency of use / day [Smokeless tobacco - ghutka, hans, pan masala, snuff]": row.Form_1[lastKey]?.ttc_val.stghpms || "",
                    "Frequency of use / day [Betel quid with tobacco (kaddipudi, hogesoppu)]": row.Form_1[lastKey]?.ttc_val.bqt || "",
                    "Frequency of use / day [Betel quid without tobacco]": row.Form_1[lastKey]?.ttc_val.bqwot || "",
                    "Frequency of use / day [Others ]": row.Form_1[lastKey]?.ttc_val.othr || "",
                    "Have you attempted to quit tobacco in the past ?": mapping(row.Form_1[lastKey]?.aqtp) || "",
                    "If yes, what was the method you adopted?": mapping(row.Form_1[lastKey]?.mthd) || "",
                    "For how many days did you quit the habit?": mapping(row.Form_1[lastKey]?.hdqh) || "",
                    "What was the reason to quit the habit?": mapping(row.Form_1[lastKey]?.rtqh) || "",
                    "Alcohol consumption status": mapping3(row.Form_1[lastKey]?.acs) || "",
                    "If yes, since when": mapping(row.Form_1[lastKey]?.acsw) || "",
                    "If not now, how long has it been since you quit": mapping(row.Form_1[lastKey]?.hlqh) || "",
                    "For how long did you consume alcohol?": mapping(row.Form_1[lastKey]?.hlca) || "",
                    "Alcohol consumption frequency": mapping(row.Form_1[lastKey]?.acf) || "",
                    "Have you undergone any cancer screening tests before?": mapping(row.Form_1[lastKey]?.uacstb) || "",
                    "If yes, when?": mapping(row.Form_1[lastKey]?.wcswd) || "",
                    "Which cancer were you screened for?": MOCSF(row.Form_1[lastKey]?.csf) || "",
                    "If Other is selected in previous question": row.Form_1[lastKey]?.csf.ov || "",
                    "What was the reason for screening?": mapping(row.Form_1[lastKey]?.rcs) || "",
                    "Was any blood related family member diagnosed with cancer?": mapping(row.Form_1[lastKey]?.fmca) || "",
                    "If yes, how many?": no_fm() || "",

                    "Type of cancer": row.Form_1[lastKey]?.f1d.toc || "",
                    "When was it diagnosed?": row.Form_1[lastKey]?.f1d.wd || "",
                    "Did they undergo treatment?": mapping(row.Form_1[lastKey]?.f1d.ut) || "",
                    "Status ": mapping(row.Form_1[lastKey]?.f1d.sts) || "",
                    "Type of cancer ": row.Form_1[lastKey]?.f2d.toc || "",
                    "When was it diagnosed?  ": row.Form_1[lastKey]?.f2d.wd || "",
                    "Did they undergo treatment? ": mapping(row.Form_1[lastKey]?.f2d.ut) || "",
                    "Status  ": mapping(row.Form_1[lastKey]?.f2d.sts) || "",
                    "Type of cancer  ": row.Form_1[lastKey]?.f3d.toc || "",
                    "When was it diagnosed? ": row.Form_1[lastKey]?.f3d.wd || "",
                    "Did they undergo treatment?  ": mapping(row.Form_1[lastKey]?.f3d.ut) || "",
                    "Status   ": mapping(row.Form_1[lastKey]?.f3d.sts) || "",

                    "Warning signs of cancer - if any of the following complaints are present / persistent, please tick all the options that apply to you": MoWsoc(row.Form_1[lastKey]?.wsoc) || "",
                    "Female specific symptoms": Mofss(row.Form_1[lastKey]?.fss) || "",
                    "Menstruation stage": mapping(row.Form_1[lastKey]?.ms) || "",
                    "Age of menarche": row.Form_1[lastKey]?.age_me || "",
                    "Last menstrual period": row.Form_1[lastKey]?.lmp || "",
                    Menstruation: mapping(row.Form_1[lastKey]?.mens) || "",
                    "If irregular, since when?": row.Form_1[lastKey]?.misw || "",
                    "Reason for hysterectomy": mapping(row.Form_1[lastKey]?.hystrtmy_rsn) || "",
                    "Age at hysterectomy": row.Form_1[lastKey]?.aah || "",
                    "Age at menopause": row.Form_1[lastKey]?.age_m || "",
                    Gravida: row.Form_1[lastKey]?.gvd || "",
                    Para: row.Form_1[lastKey]?.para || "",
                    Living: row.Form_1[lastKey]?.lvng || "",
                    Abortion: row.Form_1[lastKey]?.abrt || "",
                    "Age at first child": row.Form_1[lastKey]?.afc || "",
                    "1st Child": row.Form_1[lastKey]?.bfh.ch1 || "",
                    "2nd Child": row.Form_1[lastKey]?.bfh.ch2 || "",
                    "3rd Child": row.Form_1[lastKey]?.bfh.ch3 || "",
                    "4th Child": row.Form_1[lastKey]?.bfh.ch4 || "",
                    "5th Child": row.Form_1[lastKey]?.bfh.ch5 || "",
                    "6th Child": row.Form_1[lastKey]?.bfh.ch6 || "",
                    "Other comments": row.Form_1[lastKey]?.oc || "",
                    "Hypertension present": mapping(row.Form_1[lastKey]?.ht_p) || "",
                    "K/C/O HTN": row.Form_1[lastKey]?.k_c_o.htval || "",
                    "Diabetes present": mapping(row.Form_1[lastKey]?.dia_p) || "",
                    "K/C/O DM": row.Form_1[lastKey]?.k_c_o.dval || "",
                    "Cancer present": mapping(row.Form_1[lastKey]?.ca_p) || "",
                    "K/C/O Cancer": row.Form_1[lastKey]?.k_c_o.cval || "",
                    "Alternate contact number": row.patients1.alt_ctc_no || "",

                    // Manual Vital Data
                    "Screening Timestamp": f3lastKey ? new Date((Number(f3lastKey) + 19800) * 1000).toISOString().replace("T", " ").replace(/\..+/, "").replace(/-/g, "/") : "",
                    "Heart Rate": row.manual_vital_data[mlastKey]?.hr || "",
                    SPO2: row.manual_vital_data[mlastKey]?.spo || "",
                    BP: row.manual_vital_data[mlastKey]?.bp || "",
                    GRBS: row.manual_vital_data[mlastKey]?.grbs || "",
                    "Total Body Fat": row.manual_vital_data[mlastKey]?.tbf || "",
                    "Subcutaneous Body Fat": row.manual_vital_data[mlastKey]?.sbf || "",
                    "Visceral Body Fat": row.manual_vital_data[mlastKey]?.vbf || "",
                    "Waist Circumference(in cm)": row.manual_vital_data[mlastKey]?.wc || "",
                    "Hip Circumference(in cm)": row.manual_vital_data[mlastKey]?.hc || "",

                    // //Form3
                    "Doctor's Name": row.Form_3[f3lastKey]?.dr_name || "",
                    "Screening done for": Mosdf(row.Form_3[f3lastKey]?.scr_dne_for) || "",
                    Findings: Mofndgs(row.Form_3[f3lastKey]?.fndgs) || "",
                    "Oral cavity Photos": extractPhotoURLs(row.Form_3[f3lastKey]?.gpa) || "",
                    "Homogenous leukoplakia": Mohl(row.Form_3[f3lastKey]?.hl) || "",
                    "Homogenous leukoplakia - Lesion dimension": Mohl_ld(row.Form_3[f3lastKey]?.hl) || "",
                    "Non homogenous leukoplakia": Monhl(row.Form_3[f3lastKey]?.nhl) || "",
                    "Non homogenous leukoplakia - Lesion dimension": Monhl_ld(row.Form_3[f3lastKey]?.nhl) || "",
                    Erythroleukoplakia: Moelp(row.Form_3[f3lastKey]?.elp) || "",
                    "Erythroleukoplakia - Lesion dimension": Moelp_ld(row.Form_3[f3lastKey]?.elp) || "",
                    Erythroplakia: Moep(row.Form_3[f3lastKey]?.ep) || "",
                    "Erythroplakia - Lesion dimension": Moep_ld(row.Form_3[f3lastKey]?.ep) || "",
                    OSMF: MoOSMF(row.Form_3[f3lastKey]?.osmf) || "",
                    "Lichen planus present": MoLpp(row.Form_3[f3lastKey]?.lpp) || "",
                    "Lichen planus present - Lesion location": MoLpp_ld(row.Form_3[f3lastKey]?.lpp) || "",
                    "Suspicious ulcer present": MoSugrwth(row.Form_3[f3lastKey]?.sugrwth) || "",
                    "Suspicious ulcer present - Lesion size": MoSugrwth_ld(row.Form_3[f3lastKey]?.sugrwth) || "",
                    "Suspicious growth": MoSus_grwth(row.Form_3[f3lastKey]?.sus_grwth) || "",
                    "Suspicious growth present - Lesion size": MoSus_grwth_ld(row.Form_3[f3lastKey]?.sus_grwth) || "",
                    "Neck Nodes Level": row.Form_3[f3lastKey]?.nnl || "",
                    "Smokers Palate": MOSmkrsPalate(row.Form_3[f3lastKey]?.smkrspalate) || "",
                    "Oral punch biopsy indicated": mapping(row.Form_3[f3lastKey]?.pnchbi) || "",
                    "Laser procedure advised": mapping(row.Form_3[f3lastKey]?.lpa) || "",
                    "Breast Examination Right breast": MObrst_exm(row.Form_3[f3lastKey]?.brst_exm?.r_b) || "",
                    "Breast Examination Left breast": MObrst_exm(row.Form_3[f3lastKey]?.brst_exm?.l_b) || "",
                    "Abnormality location Right breast": MOabn_det(row.Form_3[f3lastKey]?.abn_det?.abn_rb) || "",
                    "Abnormality location Left breast": MOabn_det(row.Form_3[f3lastKey]?.abn_det?.abn_lb) || "",
                    "Breast Photos": extractPhotoURLs(row.Form_3[f3lastKey]?.bpa) || "",
                    "Nipple discharge": MOnd(row.Form_3[f3lastKey]?.nd) || "",
                    "Advised bilateral screening mammography": bilMoSrcFunc(row.Form_3[f3lastKey]?.adv_mgphy) || "",
                    "Mammography comment (If Other is selected in previous question)": bilMoSrcOth(row.Form_3[f3lastKey]?.adv_mgphy) || "",
                    "Advised bilateral screening ultrasound": bilUsSrcFunc(row.Form_3[f3lastKey]?.adv_mgphy) || "",
                    "Ultrasound comment (If Other is selected in previous question) ": bilUsSrcOth(row.Form_3[f3lastKey]?.adv_mgphy) || "",
                    "FNAC done when indicated": fnacDnIn(row.Form_3[f3lastKey]?.fnac_dn_in) || "",
                    "FNAC comment (If Other is selected in previous question) ": row.Form_3[f3lastKey]?.fnac_dne || "",
                    "Nipple discharge smear taken when indicated": mapping(row.Form_3[f3lastKey]?.ndstwi) || "",
                    "Nipple discharge comment (If Other is selected in previous question)": mapping(row.Form_3[f3lastKey]?.nsov) || "",
                    Information: MOinfrmn(row.Form_3[f3lastKey]?.infrmn) || "",
                    "Per Speculum": MOperspec(row.Form_3[f3lastKey]?.perspec) || "",
                    VIA: mapping(row.Form_3[f3lastKey]?.via) || "",
                    "Releveant images": extractPhotoURLs(row.Form_3[f3lastKey]?.cpa) || "",
                    "Pap smear taken": mapping(row.Form_3[f3lastKey]?.trtpap) || "",
                    "Cervical Punch biopsy indicated": mapping(row.Form_3[f3lastKey]?.pbti) || "",
                    Recommendation: recFunc(),
                    "Next screening date": row.Form_3[f3lastKey]?.nsd || "",
                    "Referrals , if any": row.Form_3[f3lastKey]?.refiany || "",
                    "Other Comments": row.Form_3[f3lastKey]?.othr_cmnts || "",

                    //Tcc Form
                    "TCC Timestamp": tcclastKey ? new Date((Number(tcclastKey) + 19800) * 1000).toISOString().replace("T", " ").replace(/\..+/, "").replace(/-/g, "/") : "",
                    "TCC done by ": row.tcc_form[tcclastKey]?.psyname || "",
                    "Alternate contact Number": tcclastKey ? row.patients1?.alt_ctc_no || "" : "",
                    "Amount spent on tobacco per day": row.tcc_form[tcclastKey]?.ad || "",
                    "Types of tobacco consumption ": MOTCC(row.tcc_form[tcclastKey]?.type_tc) || "",
                    "Frequency of use / day [Smoked tobacco - beedi, cigarettes] ": row.tcc_form[tcclastKey]?.ae.smoked_tobacco_beedi_cigarettes || "",
                    "Frequency of use / day [Smokeless tobacco - ghutka, hans, pan masala, snuff] ": row.tcc_form[tcclastKey]?.ae.smokeless_tobacco_ghutka_hans_pan_masala_snuff || "",
                    "Frequency of use / day [Betel quid with tobacco (kaddipudi, hogesoppu)] ": row.tcc_form[tcclastKey]?.ae.betel_quid_with_tobacco || "",
                    "Frequency of use / day [Betel quid without tobacco] ": row.tcc_form[tcclastKey]?.ae.betel_quid_without_tobacco || "",
                    "Frequency of use / day [Others ]	": row.tcc_form[tcclastKey]?.ae.other || "",
                    "Tobacco Habit details": row.tcc_form[tcclastKey]?.thd || "",
                    "For how many years have you had the habit?": row.tcc_form[tcclastKey]?.yh || "",
                    "Other Substances used ": row.tcc_form[tcclastKey]?.af || "",
                    "Family history of Tobacco use": mapping(row.tcc_form[tcclastKey]?.ag.tu) || "",
                    "Family history of Substance use": mapping(row.tcc_form[tcclastKey]?.ag.su) || "",
                    "Family history of Mental disorder use": mapping(row.tcc_form[tcclastKey]?.ag.md) || "",
                    "If,Others": row.tcc_form[tcclastKey]?.ag.oth || "",
                    "Age of uptake": row.tcc_form[tcclastKey]?.age || "",
                    "Reason for uptake / Starting the habit": ReasonForUptake(row.tcc_form[tcclastKey]?.ba) || "",
                    "If 'Others' , specify the reason": ORBA(row.tcc_form[tcclastKey]?.ba) || "",
                    "I smoke to keep myself alert": mapping(row.tcc_form[tcclastKey]?.ca) || "",
                    "Smoking is pleasant and relaxing": mapping(row.tcc_form[tcclastKey]?.cb) || "",
                    "I smoke when I am upset about something": mapping(row.tcc_form[tcclastKey]?.cc) || "",
                    "I smoke out of boredom": mapping(row.tcc_form[tcclastKey]?.cd) || "",
                    "If I run out of cigarette/beedi, I find it unbearable.": mapping(row.tcc_form[tcclastKey]?.ce) || "",
                    "I smoke automatically without being aware of it.": mapping(row.tcc_form[tcclastKey]?.cf) || "",
                    "I smoke to perk myself up.": mapping(row.tcc_form[tcclastKey]?.cg) || "",
                    "I find it difficult to go about my job without smoking": mapping(row.tcc_form[tcclastKey]?.ch) || "",
                    "I need to smoke in order to pass motion.": mapping(row.tcc_form[tcclastKey]?.ci) || "",
                    "I get real cravings for cigarette/beedi when I haven't used in a while": mapping(row.tcc_form[tcclastKey]?.cj) || "",
                    "If,Others ": row.tcc_form[tcclastKey]?.ck || "",
                    "I use it to keep from slowing down": mapping(row.tcc_form[tcclastKey]?.ea) || "",
                    "I like the texture and taste of it in my mouth.": mapping(row.tcc_form[tcclastKey]?.eb) || "",
                    "I find it pleasant and relaxing": mapping(row.tcc_form[tcclastKey]?.ec) || "",
                    "I use it when I am upset about something": mapping(row.tcc_form[tcclastKey]?.ed) || "",
                    "I chew it out of boredom.": mapping(row.tcc_form[tcclastKey]?.ee) || "",
                    "If I run out of it, I find it unbearable.": mapping(row.tcc_form[tcclastKey]?.ef) || "",
                    "I believe that it provides calcium.": mapping(row.tcc_form[tcclastKey]?.eg) || "",
                    "I use it to perk myself up.": mapping(row.tcc_form[tcclastKey]?.eh) || "",
                    "It relieves pain in my jaw/teeth.": mapping(row.tcc_form[tcclastKey]?.ei) || "",
                    "I find it difficult to go about with my job without it.": mapping(row.tcc_form[tcclastKey]?.ej) || "",
                    "If,Others  ": row.tcc_form[tcclastKey]?.ek || "",
                    "Fagerstorm Test for Nicotine Dependence - How soon after you wake up do you smoke your first cigarette?": mapping(row.tcc_form[tcclastKey]?.da) || "",
                    "Fagerstorm Test for Nicotine Dependence - Do you find it difficult to refrain from smoking in places where it is forbidden, e.g., temples, during an outing with family, during village festivities?":
                      mapping(row.tcc_form[tcclastKey]?.db) || "",
                    "Fagerstorm Test for Nicotine Dependence - Which cigarette would you hate most to give up?": mapping(row.tcc_form[tcclastKey]?.dc) || "",
                    "Fagerstorm Test for Nicotine Dependence - How many cigarettes per day do you smoke?": mapping(row.tcc_form[tcclastKey]?.dd) || "",
                    "Fagerstorm Test for Nicotine Dependence - Do you smoke more frequently during the first hours of waking than during the rest of the day?":
                      mapping(row.tcc_form[tcclastKey]?.de) || "",
                    "Fagerstorm Test for Nicotine Dependence - Do you smoke even if you are sick in bed?": mapping(row.tcc_form[tcclastKey]?.df) || "",
                    "Modified Fagerstorm Test - How soon after you wake up do you place your first dip?": mapping(row.tcc_form[tcclastKey]?.fa) || "",
                    "Modified Fagerstorm Test - How often do you intentionally swallow its juice?": Mapping2(row.tcc_form[tcclastKey]?.fb) || "",
                    "Modified Fagerstorm Test - Which chew would you hate most to give up?": mapping(row.tcc_form[tcclastKey]?.fc) || "",
                    "Modified Fagerstorm Test - How many cans/pouches per week do you use?": mapping5(row.tcc_form[tcclastKey]?.fd) || "",
                    "Modified Fagerstorm Test - Do you chew more frequently during the first hours after waking than during the rest of the day?": mapping(row.tcc_form[tcclastKey]?.fe) || "",
                    "Modified Fagerstorm Test - Do you chew even if you are sick in the bed?": mapping(row.tcc_form[tcclastKey]?.ff) || "",
                    "Do you intend to quit the habit": mapping(row.tcc_form[tcclastKey]?.fg) || "",
                    "Have you previously attempted to quit the habit?": mapping(row.tcc_form[tcclastKey]?.fh) || "",
                    "what among the following were the barriers to quit?": barriers_To_Quit(row.tcc_form[tcclastKey]?.fi) || "",
                    "If,Others   ": ORFI(row.tcc_form[tcclastKey]?.fi) || "",
                    "Do you often forget the intention behind quitting?": mapping(row.tcc_form[tcclastKey]?.fj) || "",
                    "Did you have the right social support?": mapping(row.tcc_form[tcclastKey]?.fk) || "",
                    "Are you fearful of what might happen if you quit?": mapping(row.tcc_form[tcclastKey]?.fl) || "",
                    "Are you anticipating sadness when you quit?": mapping(row.tcc_form[tcclastKey]?.fm) || "",
                    "Do you find yourself thinking about death?": mapping(row.tcc_form[tcclastKey]?.fo) || "",
                    "Do you wish to live a healthy life?": mapping(row.tcc_form[tcclastKey]?.fp) || "",
                    "Do you believe that using tobacco is healthy?": mapping(row.tcc_form[tcclastKey]?.fq) || "",
                    "Does anyone in the family believe your habits are unhealthy?": mapping(row.tcc_form[tcclastKey]?.fr) || "",
                    "Would you agree if someone told you that use of tobacco in any form is not healthy?": mapping(row.tcc_form[tcclastKey]?.fs) || "",
                    "Are you thinking of quitting the habit now?": mapping(row.tcc_form[tcclastKey]?.ft) || "",
                    "Do you think that quitting takes a lot of effort?": mapping(row.tcc_form[tcclastKey]?.ga) || "",
                    "Do your family support you in quitting the habit?": mapping(row.tcc_form[tcclastKey]?.gb) || "",
                    "Do your friends support you in quitting the habit?": mapping(row.tcc_form[tcclastKey]?.gc) || "",
                    "Would you be willing to quit if someone from the family puts in the same effort to help?": mapping(row.tcc_form[tcclastKey]?.gd) || "",
                    "Would it be helpful if the counsellor gave you a nudge every now and then?": mapping(row.tcc_form[tcclastKey]?.ge) || "",
                    "Would you need some time to think whether you want to quit or not?": mapping(row.tcc_form[tcclastKey]?.gf) || "",
                    "Do you believe you are capable of quitting?": mapping(row.tcc_form[tcclastKey]?.gg) || "",
                    "Do you believe you can quit on your own?": mapping(row.tcc_form[tcclastKey]?.gh) || "",
                    "If there were professionals to help you out would you make an effort to quit?": mapping(row.tcc_form[tcclastKey]?.gi) || "",
                    "Which form of professional intervention would you prefer ?": mapping(row.tcc_form[tcclastKey]?.gj) || "",
                    "Which mode of therapy would you prefer?": mapping(row.tcc_form[tcclastKey]?.gk) || "",
                    "Dependency score for smoke tobacco": Mapping2(row.tcc_form[tcclastKey]?.ha) || "",
                    "Dependency level for smoke tobacco": mapping(row.tcc_form[tcclastKey]?.hb) || "",
                    "Dependency score for chewing habits": Mapping2(row.tcc_form[tcclastKey]?.hc) || "",
                    "Dependency level for smokeless tobacco": mapping(row.tcc_form[tcclastKey]?.hd) || "",
                    "Motivation stage assessed": mapping(row.tcc_form[tcclastKey]?.he) || "",
                    "Psychiatric Prognosis": row.tcc_form[tcclastKey]?.hf || "",
                    "Substance use disorder": row.tcc_form[tcclastKey]?.hg || "",
                    "Counselling Techniques": mapping(row.tcc_form[tcclastKey]?.hh) || "",
                    "Treatment plan": row.tcc_form[tcclastKey]?.ib || "",
                    "Additional Comments": row.tcc_form[tcclastKey]?.ic || "",
                  };
                });

                // 1. Create workbook and worksheet
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet("Sheet 1");

                // 2. Prepare headers and data
                const headers = Object.keys(excelData[0] || {});
                const allRows = [headers, ...excelData.map((row) => headers.map((h) => row[h]))];

                // 3. Track max column width
                const colWidths = headers.map((h) => h.length);

                // 4. Add rows and style in one loop
                allRows.forEach((rowArr, rowIdx) => {
                  const row = worksheet.addRow(rowArr);

                  rowArr.forEach((cellValue, colIdx) => {
                    const cell = row.getCell(colIdx + 1);

                    // Update max column width
                    const cellStr = cellValue ? cellValue.toString() : "";
                    if (cellStr.length > colWidths[colIdx]) colWidths[colIdx] = cellStr.length;

                    // Make header row bold
                    if (rowIdx === 0) {
                      cell.font = { bold: true };
                    }

                    // Example: Add double border to all cells
                    cell.border = {
                      top: { style: "thin" },
                      left: { style: "thin" },
                      bottom: { style: "thin" },
                      right: { style: "thin" },
                    };
                  });
                });

                // 5. Set column widths
                worksheet.columns.forEach((col, idx) => {
                  col.width = colWidths[idx] + 2;
                });

                // 6. Trigger the download (browser)
                workbook.xlsx.writeBuffer().then((buffer) => {
                  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;

                  a.download = `Sarvarakshana_${Math.floor(new Date().getTime() / 1000.0)}.xlsx`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                  toast.success("Excel file generated successfully");
                });
              } else {
                toast.error("No data available to export");
              }

              const endExcelTime = performance.now();
              console.log("Excel generation time:", endExcelTime - startExcelTime, "ms");
            }
          } catch (parseError) {
            console.error("Error parsing response:", parseError);
            continue;
          }
        }
      } catch (readError) {
        console.error("Error reading stream:", readError);
        toast.error("Error while sending data to the server");
      }
    }
  } catch (error) {
    console.error("QueryFetch error:", error);
    // Handle different types of errors
    if (error.name === "AbortError") {
      toast.error("Request timed out. Please try again.");
    } else if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      toast.error("Server is not reachable. Please check if the server is running.");
    } else if (error.message.includes("Connection lost")) {
      toast.error("Connection lost during data processing. Please try again.");
    } else {
      toast.error(error.message || "Something went wrong");
    }
  } finally {
    setProcessingNode("");
    setRecivedLength(0);
    setIsReciving(false);
    setIsLoading(false);
    const endTime = performance.now();
    console.log("Total QueryFetch time:", endTime - startTime, "ms");
  }
}
