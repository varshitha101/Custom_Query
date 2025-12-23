import { patientNode, form_1Node, mvd, form3, Tcc } from "./option2MapDetails.js";
/**
 *  Validates the field value against the expected value based on the source and field type.
 * @param {string} field
 * @param {string} expectedValue
 * @param {string} dataInfo
 * @param {string} source
 * @returns {boolean} Returns true if the field value matches the expected value based on the source and field type.
 */
export default function option3Validator(field, expectedValue, dataInfo, source) {
  try {
    let data = [];
    if (source !== "patients1") {
      let keys = Object.keys(dataInfo);
      let lastKey = keys[keys.length - 1];
      data = dataInfo[lastKey];
    } else {
      data = dataInfo;
    }

    if (source === "patients1") {
      if (field === "Age") {
        const actualValue = data[patientNode[field]];
        if (actualValue !== undefined) {
          if (expectedValue.startsWith("< ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual < numExpected;
          } else if (expectedValue.startsWith("> ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual > numExpected;
          } else if (expectedValue.startsWith("= ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual === numExpected;
          }
        }
        return false;
      } else if (field === "ID Proof Type") {
        const actualValue = data[patientNode[field]];

        if (expectedValue === "Aadhar") {
          expectedValue = "aadhr";
        }
        if (expectedValue === "Ration Card") {
          expectedValue = "rtc";
        }
        if (expectedValue === "Voters ID") {
          expectedValue = "votid";
        }
        if (expectedValue === "Not available") {
          expectedValue = "na";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Number of family members") {
        const actualValue = data[patientNode[field]];
        if (actualValue !== undefined) {
          if (expectedValue.startsWith("< ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);
            return !isNaN(numActual) && numActual < numExpected;
          } else if (expectedValue.startsWith("> ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);
            return !isNaN(numActual) && numActual > numExpected;
          } else if (expectedValue.startsWith("= ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual === numExpected;
          }
        }
        return false;
      } else if (field === "Status") {
        const actualValue = data[patientNode[field]];
        if (expectedValue === "In Person") {
          expectedValue = "ip";
        }
        if (expectedValue === "Absent") {
          expectedValue = "absnt";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Gender") {
        const actualValue = data[patientNode[field]];
        if (expectedValue === "Male") {
          expectedValue = "m";
        }
        if (expectedValue === "Female") {
          expectedValue = "f";
        }

        if (actualValue !== undefined) {
          if (actualValue.toLowerCase() === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Marital Status") {
        const actualValue = data[patientNode[field]];

        if (actualValue !== undefined) {
          if (actualValue.toLowerCase() === expectedValue.toLowerCase()) {
            return true;
          }
        }
        return false;
      } else if (field === "Weight (in kgs)") {
        const actualValue = data[patientNode[field]];

        if (actualValue !== undefined) {
          if (expectedValue.startsWith("< ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual < numExpected;
          } else if (expectedValue.startsWith("> ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual > numExpected;
          } else if (expectedValue.startsWith("= ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual === numExpected;
          }
        }
        return false;
      } else if (field === "Height (in cms)") {
        const actualValue = data[patientNode[field]];
        if (actualValue !== undefined) {
          if (expectedValue.startsWith("< ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual < numExpected;
          } else if (expectedValue.startsWith("> ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual > numExpected;
          } else if (expectedValue.startsWith("= ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual === numExpected;
          }
        }
        return false;
      } else if (field === "Religion") {
        const actualValue = data[patientNode[field]];
        if (expectedValue === "Hindu") {
          expectedValue = "Hndu";
        }
        if (expectedValue === "Christian") {
          expectedValue = "Chrst";
        }
        if (expectedValue === "Buddhist") {
          expectedValue = "budst";
        }
        if (expectedValue === "Muslim") {
          expectedValue = "muslm";
        }
        if (expectedValue === "Others") {
          expectedValue = "others";
        }
        if (expectedValue === "Other") {
          expectedValue = "other";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Education") {
        const actualValue = data[patientNode[field]];
        if (expectedValue === "No schooling") {
          expectedValue = "No_sch";
        }
        if (expectedValue === "upto 5th Standard") {
          expectedValue = "upto_5th";
        }
        if (expectedValue === "upto 7th Standard") {
          expectedValue = "upto_7th";
        }
        if (expectedValue === "SSLC") {
          expectedValue = "sslc";
        }
        if (expectedValue === "PUC") {
          expectedValue = "puc";
        }
        if (expectedValue === "Diploma") {
          expectedValue = "dip";
        }
        if (expectedValue === "Graduation") {
          expectedValue = "grad";
        }
        if (expectedValue === "Post graduation") {
          expectedValue = "postgrad";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Occupation Group - According to NCO 2015") {
        const actualValue = data[patientNode[field]];
        if (expectedValue === "Legislators, Senior Officials and Managers - Group 1") {
          expectedValue = "grp1";
        }
        if (expectedValue === "Professionals - Group 2") {
          expectedValue = "grp2";
        }
        if (expectedValue === "Technicians and associate professionals - Group 3") {
          expectedValue = "grp3";
        }
        if (expectedValue === "Clerks/Clerical support workers - Group 4") {
          expectedValue = "grp4";
        }
        if (expectedValue === "Service and sales workers - Group 5") {
          expectedValue = "grp5";
        }
        if (expectedValue === "Skilled agricultural, forestry and fishery workers - Group 6") {
          expectedValue = "grp6";
        }
        if (expectedValue === "Craft and related trader workers - Group 7") {
          expectedValue = "grp7";
        }
        if (expectedValue === "Plant and machine operators and assemblers - Group 8") {
          expectedValue = "grp8";
        }
        if (expectedValue === "Elementary occupations - Group 9") {
          expectedValue = "grp9";
        }
        if (expectedValue === "Workers not classified by Occupations - Group 10") {
          expectedValue = "wkntclsby";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Estimated Annual Family Income") {
        const actualValue = data[patientNode[field]];

        if (expectedValue === "less than INR 1,25,000") {
          expectedValue = "lt12500";
        }

        if (expectedValue === "between INR 1,25,000 to INR 5,00,000") {
          expectedValue = "btw12500to50k";
        }

        if (expectedValue === "between INR 5,00,000 to INR 30,00,000") {
          expectedValue = "btw50kto3l";
        }

        if (expectedValue === "More than INR 30,00,000") {
          expectedValue = "gt3l";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      }
    } else if (source === "Form_1") {
      if (field === "Have you heard about cancer ?") {
        const actualValue = data[form_1Node[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }
        if (expectedValue === "Absent") {
          expectedValue = "absnt";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Are you aware of the symptoms/warning signs of cancer?") {
        const actualValue = data[form_1Node[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }
        if (expectedValue === "Absent") {
          expectedValue = "absnt";
        }
        if (actualValue !== undefined) {
          if (actualValue.toLowerCase() === expectedValue.toLowerCase()) {
            return true;
          }
        }
        return false;
      } else if (field === "Do you think tobacco causes cancer?") {
        const actualValue = data[form_1Node[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }
        if (expectedValue === "Absent") {
          expectedValue = "absnt";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Can cancer spread from one person to another?") {
        const actualValue = data[form_1Node[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }
        if (expectedValue === "Absent") {
          expectedValue = "absnt";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Is there treatment and cure for cancer?") {
        const actualValue = data[form_1Node[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }
        if (expectedValue === "Absent") {
          expectedValue = "absnt";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Exposure to second hand smoke") {
        const shsmData = data[form_1Node[field]];

        if (!shsmData) return false;

        const labelToKey = {
          "At place of work": "atw",
          "At home": "ath",
          "In public": "inpb",
          None: "none",
        };

        const expectedKeys = expectedValue.map((label) => labelToKey[label]);

        const allExpectedTrue = expectedKeys.some((key) => shsmData[key] === "tr");
        console.log("shsmData", shsmData, "expectedKeys", expectedKeys, "allExpectedTrue", allExpectedTrue);

        if (allExpectedTrue) {
          return true;
        }
        return false;
      } else if (field === "Do you currently use tobacco in any form?") {
        const actualValue = data[form_1Node[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "Not Now") {
          expectedValue = "nn";
        }
        if (expectedValue === "Never") {
          expectedValue = "nvr";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === 'If answered "yes" or "not now", for how many years have you had the habit? ') {
        const actualValue = data[form_1Node[field]];

        if (expectedValue === "less than 1 year") {
          expectedValue = "lt1yrs";
        }
        if (expectedValue === "1-5 years") {
          expectedValue = "otfyrs";
        }
        if (expectedValue === "6-10 years") {
          expectedValue = "sttyrs";
        }
        if (expectedValue === "11-20 years") {
          expectedValue = "ettyrs";
        }
        if (expectedValue === "20-40 years") {
          expectedValue = "tt40";
        }
        if (expectedValue === "> 40 years") {
          expectedValue = "gt40";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "If not now, how long has it been since you quit the habit? ") {
        const actualValue = data[form_1Node[field]];

        if (expectedValue === "less than 1 year") {
          expectedValue = "lt1yrs";
        }
        if (expectedValue === "1-5 years") {
          expectedValue = "otfyrs";
        }
        if (expectedValue === "6-10 years") {
          expectedValue = "sttyrs";
        }
        if (expectedValue === "11-20 years") {
          expectedValue = "ettyrs";
        }
        if (expectedValue === "> 20 years") {
          expectedValue = "gt20";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Types of tobacco consumption") {
        const actualValue = data[form_1Node[field]];

        if (actualValue !== undefined) {
          if (Array.isArray(expectedValue)) {
            const mappedExpectedValues = expectedValue
              .map((value) => {
                if (value === "Smoked tobacco - beedi, cigarettes") return "ttc1";
                if (value === "Smokeless tobacco - ghutka, hans, pan masala, snuff") return "ttc2";
                if (value === "Betel quid with tobacco (kaddipudi, hogesoppu)") return "ttc3";
                if (value === "Betel quid without tobacco") return "ttc4";
                if (value === "Other") return "ttc5";
                return null;
              })
              .filter(Boolean);

            const allMatch = mappedExpectedValues.some((key) => actualValue[key] === key);

            if (allMatch) {
              return true;
            }
          }
        }
        return false;
      } else if (field === "Frequency of use / day [Smoked tobacco - beedi, cigarettes]") {
        const temp = form_1Node[field].split(":");
        const node1 = temp[0];
        const node2 = temp[1];
        const actualValue = data[node1][node2];

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "Frequency of use / day [Smokeless tobacco - ghutka, hans, pan masala, snuff]") {
        const temp = form_1Node[field].split(":");
        const node1 = temp[0];
        const node2 = temp[1];
        const actualValue = data[node1][node2];
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "Frequency of use / day [Betel quid with tobacco (kaddipudi, hogesoppu)]") {
        const temp = form_1Node[field].split(":");
        const node1 = temp[0];
        const node2 = temp[1];
        const actualValue = data[node1][node2];
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "Frequency of use / day [Betel quid without tobacco]") {
        const temp = form_1Node[field].split(":");
        const node1 = temp[0];
        const node2 = temp[1];
        const actualValue = data[node1][node2];
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "Frequency of use / day [Others ]") {
        const temp = form_1Node[field].split(":");
        const node1 = temp[0];
        const node2 = temp[1];
        const actualValue = data[node1][node2];
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "Have you attempted to quit tobacco in the past ?") {
        const actualValue = data[form_1Node[field]];
        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "If yes, what was the method you adopted? ") {
        const actualValue = data[form_1Node[field]];

        if (expectedValue === "Substitution") {
          expectedValue = "subs";
        }
        if (expectedValue === "Self Control") {
          expectedValue = "slfctrl";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "For how many days did you quit the habit? ") {
        const actualValue = data[form_1Node[field]];

        if (expectedValue === "2-3 days") {
          expectedValue = "tttdays";
        }
        if (expectedValue === "1 week") {
          expectedValue = "owk";
        }
        if (expectedValue === "1 month") {
          expectedValue = "omnth";
        }
        if (expectedValue === "2-6 months") {
          expectedValue = "ttsmnths";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "What was the reason to quit the habit?") {
        const actualValue = data[form_1Node[field]];
        if (expectedValue === "Was not well") {
          expectedValue = "wnw";
        }
        if (expectedValue === "Admitted to the hospital") {
          expectedValue = "athosp";
        }
        if (expectedValue === "Family member had cancer") {
          expectedValue = "fmc";
        }
        if (expectedValue === "saw some cancer patients and got scareds") {
          expectedValue = "scpags";
        }
        if (expectedValue === "not good for health") {
          expectedValue = "ngfh";
        }
        if (expectedValue === "felt bad about my addiction") {
          expectedValue = "fbama";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "Alcohol consumption status") {
        const actualValue = data[form_1Node[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "Not now") {
          expectedValue = "nn";
        }
        if (expectedValue === "Never") {
          expectedValue = "nvr";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "If yes, since when") {
        const actualValue = data[form_1Node[field]];

        if (expectedValue === "less than 1 year") {
          expectedValue = "lt1yrs";
        }
        if (expectedValue === "1-5 years") {
          expectedValue = "otfyrs";
        }
        if (expectedValue === "6-10 years") {
          expectedValue = "sttyrs";
        }
        if (expectedValue === "11-20 years") {
          expectedValue = "ettyrs";
        }
        if (expectedValue === "20-40 years") {
          expectedValue = "tt40";
        }
        if (expectedValue === "> 40 years") {
          expectedValue = "gt40";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "If not now, how long has it been since you quit ") {
        const actualValue = data[form_1Node[field]];

        if (expectedValue === "less than 1 year") {
          expectedValue = "lt1yrs";
        }
        if (expectedValue === "1-5 years") {
          expectedValue = "otfyrs";
        }
        if (expectedValue === "6-10 years") {
          expectedValue = "sttyrs";
        }
        if (expectedValue === "11-20 years") {
          expectedValue = "ettyrs";
        }
        if (expectedValue === ">20 years") {
          expectedValue = "gt20yrs";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "For how long did you consume alcohol?") {
        const actualValue = data[form_1Node[field]];

        if (expectedValue === "less than 1 year") {
          expectedValue = "lt1yrs";
        }
        if (expectedValue === "1-5 years") {
          expectedValue = "otfyrs";
        }
        if (expectedValue === "6-10 years") {
          expectedValue = "sttyrs";
        }
        if (expectedValue === "11-20 years") {
          expectedValue = "ettyrs";
        }
        if (expectedValue === "> 20 years") {
          expectedValue = "gt20yrs";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Alcohol consumption frequency") {
        const actualValue = data[form_1Node[field]];

        if (expectedValue === "Daily") {
          expectedValue = "dly";
        }
        if (expectedValue === "Weekly") {
          expectedValue = "wkly";
        }
        if (expectedValue === "Monthly") {
          expectedValue = "mntly";
        }
        if (expectedValue === "Occasionally") {
          expectedValue = "ocsnly";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "Have you undergone any cancer screening tests before?") {
        const actualValue = data[form_1Node[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }
        if (expectedValue === "Absent") {
          expectedValue = "absnt";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "If yes, when? ") {
        const actualValue = data[form_1Node[field]];

        if (expectedValue === "less than a year") {
          expectedValue = "ltay";
        }
        if (expectedValue === "1-3 years") {
          expectedValue = "ot3yrs";
        }
        if (expectedValue === "more than 3 years") {
          expectedValue = "mt3yrs";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Which cancer were you screened for?") {
        const csfData = data[form_1Node[field]];
        if (!csfData) return false;
        const labelToKey = {
          Breast: "bst",
          Colorectal: "crl",
          Cervix: "cvx",
          "Oral Cavity": "oc",
          "Oesophagus and stomach": "os",
          Prostate: "pstate",
          Other: "oth",
        };
        const expectedKeys = expectedValue.map((label) => labelToKey[label]);

        const allExpectedTrue = expectedKeys.some((key) => csfData[key] === "tr");

        if (allExpectedTrue) {
          return true;
        }
        return false;
      } else if (field === "What was the reason for screening?") {
        const actualValue = data[form_1Node[field]];

        if (expectedValue === "Free camp") {
          expectedValue = "fcmp";
        }
        if (expectedValue === "Suspected symptoms") {
          expectedValue = "sussymp";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Was any blood related family member diagnosed with cancer?") {
        const actualValue = data[form_1Node[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "If yes, how many? ") {
        const isFilled = (section) => {
          return section && Object.values(section).some((val) => val !== "");
        };
        let count = 0;
        if (isFilled(data.f1d)) count++;
        if (isFilled(data.f2d)) count++;
        if (isFilled(data.f3d)) count++;

        if (expectedValue === "1" && count === 1) {
          return true;
        }
        if (expectedValue === "2" && count === 2) {
          return true;
        }
        if (expectedValue === "3 or more" && count === 3) {
          return true;
        }
        return false;
      } else if (field === "Warning signs of cancer - if any of the following complaints are present / persistent, please tick all the options that apply to you") {
        const wsocData = data[form_1Node[field]];
        if (!wsocData) return false;

        const labelToKey = {
          "Any mass or growth in the body": "amogwth",
          "A mole or blemish or wart that enlarges, changes in colour, bleeds or itches": "amole",
          "black sticky motion": "bsm",
          "Blood in urine or stools": "bus",
          "cough up bloody sputum": "cbs",
          "Frequent changes in bowel and bladder habits": "fbb",
          "Peristent cough or hoarseness of voice": "pcohv",
          "persistent difficulty in swallowing": "pds",
          "Rapid weight loss without apparent cause": "rwl",
          "Unusual bleeding or discharge from genital, urinary or digestive tract": "ub",
          "a scab, sore or ulcer that fails to heal in three weeks": "ufw",
        };
        const expectedKeys = expectedValue.map((label) => labelToKey[label]);

        const allExpectedTrue = expectedKeys.some((key) => wsocData[key] === "tr");

        if (allExpectedTrue) {
          return true;
        }
        return false;
      } else if (field === "Female specific symptoms") {
        const fssData = data[form_1Node[field]];
        if (!fssData) return false;

        const labelToKey = {
          "A thickening or lump in breast or elsewhere": "tlb",
          "Bleeding or dischage from the nipple": "bdn",
          "Irregular/post menopausal bleeding": "ipmb",
          "Unusual white discharge": "uwd",
        };

        const expectedValuesArray = Array.isArray(expectedValue) ? expectedValue : [expectedValue];

        const expectedKeys = expectedValuesArray.map((label) => labelToKey[label]);

        const allExpectedTrue = expectedKeys.some((key) => fssData[key] === "tr");

        if (allExpectedTrue) {
          return true;
        }
        return false;
      } else if (field === "Menstruation stage") {
        const actualValue = data[form_1Node[field]];

        if (expectedValue === "Premenopausal") {
          expectedValue = "prem";
        }
        if (expectedValue === "Perimenopausal") {
          expectedValue = "perm";
        }
        if (expectedValue === "Post menopausal") {
          expectedValue = "pom";
        }
        if (expectedValue === "Post hysterectomy") {
          expectedValue = "phys";
        }
        if (expectedValue === "Absent") {
          expectedValue = "absnt";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Age of menarche") {
        const actualValue = data[form_1Node[field]];

        if (actualValue !== undefined) {
          if (expectedValue.startsWith("< ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual < numExpected;
          } else if (expectedValue.startsWith("> ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual > numExpected;
          } else if (expectedValue.startsWith("= ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual === numExpected;
          }
        }
        return false;
      } else if (field === "Last menstrual period") {
        const actualValue = data[form_1Node[field]].split(" ")[0];

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Menstruation") {
        const actualValue = data[form_1Node[field]];

        if (expectedValue === "Regular") {
          expectedValue = "reg";
        }
        if (expectedValue === "Irregular") {
          expectedValue = "irreg";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Reason for hysterectomy") {
        const actualValue = data[form_1Node[field]];

        if (expectedValue === "prolapsed uterus") {
          expectedValue = "pu1";
        }
        if (expectedValue === "excessive bleeding") {
          expectedValue = "eb1";
        }
        if (expectedValue === "excessive white dischage") {
          expectedValue = "ewd";
        }
        if (expectedValue === "post coital bleeding") {
          expectedValue = "pcb";
        }
        if (expectedValue === "ovarian cysts") {
          expectedValue = "ocyst";
        }
        if (expectedValue === "other issues") {
          expectedValue = "oiss";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Age at hysterectomy") {
        const actualValue = data[form_1Node[field]];

        if (actualValue !== undefined) {
          if (expectedValue.startsWith("< ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual < numExpected;
          } else if (expectedValue.startsWith("> ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual > numExpected;
          } else if (expectedValue.startsWith("= ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual === numExpected;
          }
        }
        return false;
      } else if (field === "Age at menopause") {
        const actualValue = data[form_1Node[field]];

        if (actualValue !== undefined) {
          if (expectedValue.startsWith("< ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual < numExpected;
          } else if (expectedValue.startsWith("> ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual > numExpected;
          } else if (expectedValue.startsWith("= ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual === numExpected;
          }
        }
        return false;
      } else if (field === "Gravida") {
        const actualValue = data[form_1Node[field]];

        if (actualValue !== undefined) {
          if (expectedValue.startsWith("< ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual < numExpected;
          } else if (expectedValue.startsWith("> ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual > numExpected;
          } else if (expectedValue.startsWith("= ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual === numExpected;
          }
        }
        return false;
      } else if (field === "Para") {
        const actualValue = data[form_1Node[field]];

        if (actualValue !== undefined) {
          if (expectedValue.startsWith("< ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual < numExpected;
          } else if (expectedValue.startsWith("> ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual > numExpected;
          } else if (expectedValue.startsWith("= ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual === numExpected;
          }
        }
        return false;
      } else if (field === "Living") {
        const actualValue = data[form_1Node[field]];

        if (actualValue !== undefined) {
          if (expectedValue.startsWith("< ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual < numExpected;
          } else if (expectedValue.startsWith("> ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual > numExpected;
          } else if (expectedValue.startsWith("= ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual === numExpected;
          }
        }
        return false;
      } else if (field === "Abortion") {
        const actualValue = data[form_1Node[field]];

        if (actualValue !== undefined) {
          if (expectedValue.startsWith("< ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual < numExpected;
          } else if (expectedValue.startsWith("> ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual > numExpected;
          } else if (expectedValue.startsWith("= ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual === numExpected;
          }
        }
        return false;
      } else if (field === "Age at first child") {
        const actualValue = data[form_1Node[field]];

        if (actualValue !== undefined) {
          if (expectedValue.startsWith("< ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual < numExpected;
          } else if (expectedValue.startsWith("> ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual > numExpected;
          } else if (expectedValue.startsWith("= ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual === numExpected;
          }
        }
        return false;
      } else if (field === "1st Child") {
        const [node1, node2] = form_1Node[field].split(":");
        const actualValue = data[node1][node2];

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "2nd Child") {
        const [node1, node2] = form_1Node[field].split(":");
        const actualValue = data[node1][node2];

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "3rd Child") {
        const [node1, node2] = form_1Node[field].split(":");
        const actualValue = data[node1][node2];

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "4th Child") {
        const [node1, node2] = form_1Node[field].split(":");
        const actualValue = data[node1][node2];

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "5th Child") {
        const [node1, node2] = form_1Node[field].split(":");
        const actualValue = data[node1][node2];

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "6th Child") {
        const [node1, node2] = form_1Node[field].split(":");
        const actualValue = data[node1][node2];

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Hypertension present") {
        const actualValue = data[form_1Node[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "K/C/O HTN") {
        const [node1, node2] = form_1Node[field].split(":");

        const actualValue = data[node1][node2];

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Diabetes present") {
        const actualValue = data[form_1Node[field]];
        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "K/C/O DM") {
        const [node1, node2] = form_1Node[field].split(":");

        const actualValue = data[node1][node2];

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Cancer present") {
        const actualValue = data[form_1Node[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "K/C/O Cancer") {
        const [node1, node2] = form_1Node[field].split(":");

        const actualValue = data[node1][node2];

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      }
    } else if (source === "manual_vital_data") {
      if (field === "Heart Rate") {
        const actualValue = data[mvd[field]];

        if (actualValue !== undefined) {
          if (expectedValue.startsWith("< ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual < numExpected;
          } else if (expectedValue.startsWith("> ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual > numExpected;
          } else if (expectedValue.startsWith("= ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual === numExpected;
          }
        }
        return false;
      } else if (field === "BP/SBP") {
        const actualValue = data[mvd[field]];

        if (actualValue !== undefined) {
          const splitValue = actualValue.split("/");
          const sbp = splitValue[0];

          const numExpected = parseFloat(expectedValue.substring(2));

          if (expectedValue.startsWith("< ")) {
            const numActual = parseFloat(sbp);
            return !isNaN(numActual) && numActual < numExpected;
          } else if (expectedValue.startsWith("> ")) {
            const numActual = parseFloat(sbp);
            return !isNaN(numActual) && numActual > numExpected;
          } else if (expectedValue.startsWith("= ")) {
            const numActual = parseFloat(sbp);
            return !isNaN(numActual) && numActual === numExpected;
          }
        }
        return false;
      } else if (field === "BP/DBP") {
        const actualValue = data[mvd[field]];
        if (actualValue !== undefined) {
          const splitValue = actualValue.split("/");
          const dbp = splitValue[1];
          if (expectedValue.startsWith("< ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(dbp);
            return !isNaN(numActual) && numActual < numExpected;
          } else if (expectedValue.startsWith("> ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(dbp);
            return !isNaN(numActual) && numActual > numExpected;
          } else if (expectedValue.startsWith("= ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(dbp);
            return !isNaN(numActual) && numActual === numExpected;
          }
        }
        return false;
      } else if (field === "SPO2") {
        const actualValue = data[mvd[field]];

        if (actualValue !== undefined) {
          if (expectedValue.startsWith("< ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual < numExpected;
          } else if (expectedValue.startsWith("> ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);
            return !isNaN(numActual) && numActual > numExpected;
          } else if (expectedValue.startsWith("= ")) {
            console.log("actualValue, expectedValue: ", actualValue, ": ", expectedValue);

            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);
            console.log(numActual, numExpected, "is", numActual === numExpected);

            return !isNaN(numActual) && numActual === numExpected;
          }
        }
        return false;
      } else if (field === "GRBS") {
        const actualValue = data[mvd[field]];

        if (actualValue !== undefined) {
          if (expectedValue.startsWith("< ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual < numExpected;
          } else if (expectedValue.startsWith("> ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual > numExpected;
          } else if (expectedValue.startsWith("= ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual === numExpected;
          }
        }
        return false;
      } else if (field === "Total Body Fat") {
        const actualValue = data[mvd[field]];

        if (actualValue !== undefined) {
          if (expectedValue.startsWith("< ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);
            return !isNaN(numActual) && numActual < numExpected;
          } else if (expectedValue.startsWith("> ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);
            return !isNaN(numActual) && numActual > numExpected;
          } else if (expectedValue.startsWith("= ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual === numExpected;
          }
        }
        return false;
      } else if (field === "Subcutaneous Body Fat") {
        const actualValue = data[mvd[field]];

        if (actualValue !== undefined) {
          if (expectedValue.startsWith("< ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual < numExpected;
          } else if (expectedValue.startsWith("> ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual > numExpected;
          } else if (expectedValue.startsWith("= ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual === numExpected;
          }
        }
        return false;
      } else if (field === "Visceral Body Fat") {
        const actualValue = data[mvd[field]];

        if (actualValue !== undefined) {
          if (expectedValue.startsWith("< ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual < numExpected;
          } else if (expectedValue.startsWith("> ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual > numExpected;
          } else if (expectedValue.startsWith("= ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual === numExpected;
          }
        }
        return false;
      } else if (field === "Waist Circumference(in cm)") {
        const actualValue = data[mvd[field]];
        if (actualValue !== undefined) {
          if (expectedValue.startsWith("< ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);
            return !isNaN(numActual) && numActual < numExpected;
          } else if (expectedValue.startsWith("> ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);
            return !isNaN(numActual) && numActual > numExpected;
          } else if (expectedValue.startsWith("= ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);
            return !isNaN(numActual) && numActual === numExpected;
          }
        }
        return false;
      } else if (field === "Hip Circumference(in cm)") {
        const actualValue = data[mvd[field]];

        if (actualValue !== undefined) {
          if (expectedValue.startsWith("< ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual < numExpected;
          } else if (expectedValue.startsWith("> ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual > numExpected;
          } else if (expectedValue.startsWith("= ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual === numExpected;
          }
        }
        return false;
      }
    } else if (source === "Form_3") {
      if (field === "Screening done for") {
        const scrData = data[form3[field]];
        if (!scrData) return false;
        const labelToKey = {
          "Oral Cancer": "oc",
          "Breast Cancer": "bc",
          "Cervical Cancer": "cc",
          "General check only": "gco",
        };

        const expectedKeys = expectedValue.map((label) => labelToKey[label]);

        const allExpectedTrue = expectedKeys.some((key) => scrData[key] === true);

        if (allExpectedTrue) {
          return true;
        }

        return false;
      } else if (field === "Findings") {
        const fndgsData = data[form3[field]];
        if (!fndgsData) {
          return false;
        }

        const labelToKey = {
          Erythroleukoplakia: "elp",
          Erythroplakia: "ep",
          growth: "gwth",
          homogenous_Leukoplakia: "hl",
          "Lichen Planus": "lp",
          NAD: "nad",
          "Neck Nodes": "ncknde",
          "Non homogenous leukoplakia": "nhl",
          smokers_Palate: "sp",
          submucous_Fibrosis: "sf",
          suspicious_ulcer: "su",
        };
        const expectedKeys = expectedValue.map((label) => labelToKey[label]);

        const allExpectedTrue = expectedKeys.some((key) => fndgsData[key] === true);

        if (allExpectedTrue) {
          return true;
        }
        return false;
      } else if (field === "Oral cavity Photos") {
        const actualValue = data[form3[field]];

        if (actualValue !== undefined) {
          if (expectedValue === "With photo" && Object.keys(actualValue).length > 0 && actualValue[0] !== "123") {
            return true;
          } else if (expectedValue === "Without photo" && Object.keys(actualValue).length === 1 && actualValue[0] === "123") {
            return true;
          }
        }
        return false;
      } else if (field === "Homogenous leukoplakia") {
        const hlData = data[form3[field]];

        if (!hlData) return false;
        const labelToKey = {
          "Anterior vestibule lower": "avl",
          "Anterior vestibule upper": "avu",
          "Floor of the mouth": "fm",
          "Hard palate": "hp",
          "Lateral border of tongue left": "lbtl",
          "Lateral border of tongue right": "lbtr",
          "Lower left GBS": "llgbs",
          "Lower labial mucosa": "llm",
          "Lower right GBS": "lrgbs",
          "Right buccal mucosa": "rbm",
          "Retro molar trigone": "rmt",
          "Soft palate": "sp",
          "Upper left GBS": "ulgbs",
          "Upper labial mucosa": "ulm",
          "Upper right GBS": "urgbs",
          "Left buccal mucosa": "lbm",
        };
        const expectedKeys = expectedValue.map((label) => labelToKey[label]);
        const allExpectedTrue = expectedKeys.some((key) => hlData[key] !== "");

        if (allExpectedTrue) {
          return true;
        }
        return false;
      } else if (field === "Homogenous leukoplakia - Lesion dimension") {
        const hlData = data[form3[field]];

        if (!hlData || typeof hlData !== "object") return false;

        if (expectedValue === "Less than 2 cm diameter") {
          expectedValue = "lt2cm";
        }
        if (expectedValue === "2-4 cm diameter") {
          expectedValue = "tt4cm";
        }
        if (expectedValue === "more than 4cm diameter") {
          expectedValue = "mt4cm";
        }
        if (expectedValue === "diffused") {
          expectedValue = "dfusd";
        }
        const allExpectedTrue = Object.keys(hlData).some((key) => hlData[key] === expectedValue);

        if (allExpectedTrue) {
          return true;
        }
        return false;
      } else if (field === "Non homogenous leukoplakia") {
        const nhlData = data[form3[field]];

        if (!nhlData) return false;
        const labelToKey = {
          "Anterior vestibule lower": "avl",
          "Anterior vestibule upper": "avu",
          "Floor of the mouth": "fm",
          "Hard palate": "hp",
          "Left buccal mucosa": "lbm",
          "Lateral border of tongue left": "lbtl",
          "Lateral border of tongue right": "lbtr",
          "Lower left GBS": "llgbs",
          "Lower labial mucosa": "llm",
          "Lower right GBS": "lrgbs",
          "Right buccal mucosa": "rbm",
          "Retro molar trigone": "rmt",
          "Soft palate": "sp",
          "Upper left GBS": "ulgbs",
          "Upper labial mucosa": "ulm",
          "Upper right GBS": "urgbs",
        };
        const expectedKeys = expectedValue.map((label) => labelToKey[label]);
        const allExpectedTrue = expectedKeys.some((key) => nhlData[key] !== "");

        if (allExpectedTrue) {
          return true;
        }
        return false;
      } else if (field === "Non homogenous leukoplakia - Lesion dimension") {
        const nhlData = data[form3[field]];

        if (expectedValue === "Less than 2 cm diameter") {
          expectedValue = "lt2cm";
        }
        if (expectedValue === "2-4 cm diameter") {
          expectedValue = "tt4cm";
        }
        if (expectedValue === "more than 4cm diameter") {
          expectedValue = "mt4cm";
        }
        if (expectedValue === "diffused") {
          expectedValue = "dfusd";
        }
        if (!nhlData || typeof nhlData !== "object") return false;
        const allExpectedTrue = Object.keys(nhlData).some((key) => nhlData[key] === expectedValue);

        if (allExpectedTrue) {
          return true;
        }
        return false;
      } else if (field === "Erythroleukoplakia") {
        const elpData = data[form3[field]];

        if (!elpData) return false;
        const labelToKey = {
          "Anterior vestibule lower": "avl",
          "Anterior vestibule upper": "avu",
          "Floor of the mouth": "fm",
          "Hard palate": "hp",
          "Left buccal mucosa": "lbm",
          "Lateral border of tongue left": "lbtl",
          "Lateral border of tongue right": "lbtr",
          "Lower left GBS": "llgbs",
          "Lower labial mucosa": "llm",
          "Lower right GBS": "lrgbs",
          "Right buccal mucosa": "rbm",
          "Retro molar trigone": "rmt",
          "Soft palate": "sp",
          "Upper left GBS": "ulgbs",
          "Upper labial mucosa": "ulm",
          "Upper right GBS": "urgbs",
        };
        const expectedKeys = expectedValue.map((label) => labelToKey[label]);
        const allExpectedTrue = expectedKeys.some((key) => elpData[key] !== "");

        if (allExpectedTrue) {
          return true;
        }
        return false;
      } else if (field === "Erythroleukoplakia - Lesion dimension") {
        const elpData = data[form3[field]];

        if (expectedValue === "Less than 2 cm diameter") {
          expectedValue = "lt2cm";
        }
        if (expectedValue === "2-4 cm diameter") {
          expectedValue = "tt4cm";
        }
        if (expectedValue === "more than 4cm diameter") {
          expectedValue = "mt4cm";
        }
        if (expectedValue === "diffused") {
          expectedValue = "dfusd";
        }
        if (!elpData || typeof elpData !== "object") return false;
        const allExpectedTrue = Object.keys(elpData).some((key) => elpData[key] === expectedValue);

        if (allExpectedTrue) {
          return true;
        }
        return false;
      } else if (field === "Erythroplakia") {
        const epData = data[form3[field]];

        if (!epData) return false;
        const labelToKey = {
          "Anterior vestibule lower": "avl",
          "Anterior vestibule upper": "avu",
          "Floor of the mouth": "fm",
          "Hard palate": "hp",
          "Left buccal mucosa": "lbm",
          "Lateral border of tongue left": "lbtl",
          "Lateral border of tongue right": "lbtr",
          "Lower left GBS": "llgbs",
          "Lower labial mucosa": "llm",
          "Lower right GBS": "lrgbs",
          "Right buccal mucosa": "rbm",
          "Retro molar trigone": "rmt",
          "Soft palate": "sp",
          "Upper left GBS": "ulgbs",
          "Upper labial mucosa": "ulm",
          "Upper right GBS": "urgbs",
        };
        const expectedKeys = expectedValue.map((label) => labelToKey[label]);
        const allExpectedTrue = expectedKeys.some((key) => epData[key] !== "");

        if (allExpectedTrue) {
          return true;
        }
        return false;
      } else if (field === "Erythroplakia - Lesion dimension") {
        const epData = data[form3[field]];

        if (expectedValue === "Less than 2 cm diameter") {
          expectedValue = "lt2cm";
        }
        if (expectedValue === "2-4 cm diameter") {
          expectedValue = "tt4cm";
        }
        if (expectedValue === "more than 4cm diameter") {
          expectedValue = "mt4cm";
        }
        if (expectedValue === "diffused") {
          expectedValue = "dfusd";
        }
        if (!epData || typeof epData !== "object") return false;
        const allExpectedTrue = Object.keys(epData).some((key) => epData[key] === expectedValue);

        if (allExpectedTrue) {
          return true;
        }
        return false;
      } else if (field === "OSMF") {
        const osmfData = data[form3[field]];
        if (!osmfData) return false;
        const labelToKey = {
          "Atrophic glossitis": "a_gloss",
          blanching: "blchng",
          "Burning mouth": "bm",
          "Palpable fibrous bands": "pfb",
          "Restricted mouth opening": "rmo",
          "Restricted tongue movement": "rtm",
          "Shrunken uvula": "sv",
        };
        const expectedKeys = expectedValue.map((label) => labelToKey[label]);

        const allExpectedTrue = expectedKeys.some((key) => osmfData[key] === true);

        if (allExpectedTrue) {
          return true;
        }
        return false;
      } else if (field === "Lichen planus present") {
        const lppData = data[form3[field]];

        const labelToKey = {
          "Atrophic LP": "alp",
          "Bullous LP": "blp",
          "Erosive LP": "elp",
          "Papular LP": "plp",
          "Plaque LP": "plqp",
          "Reticular LP": "rlp",
        };

        const expectedKeys = Array.isArray(expectedValue) ? expectedValue.map((label) => labelToKey[label]).filter(Boolean) : [labelToKey[expectedValue]].filter(Boolean);

        if (expectedKeys.length === 0) {
          return false;
        }
        if (!lppData || typeof lppData !== "object") return false;

        const allExpectedTrue = expectedKeys.some((key) => lppData[key] && lppData[key] !== "");

        if (allExpectedTrue) {
          return true;
        }

        return false;
      } else if (field === "Lichen planus present - Lesion location") {
        const lppData = data[form3[field]];
        if (!lppData || typeof lppData !== "object") return false;

        if (expectedValue === "left buccal mucosa") {
          expectedValue = "lbm";
        }
        if (expectedValue === "right buccal mucosa") {
          expectedValue = "rbm";
        }
        const allExpectedTrue = Object.keys(lppData).some((key) => lppData[key] === expectedValue);

        if (allExpectedTrue) {
          return true;
        }
        return false;
      } else if (field === "Suspicious ulcer present") {
        const sugrwthData = data[form3[field]];

        if (!sugrwthData) return false;
        const labelToKey = {
          "Anterior vestibule lower": "avl",
          "Anterior vestibule upper": "avu",
          "Floor of the mouth": "fm",
          "Hard palate": "hp",
          "Left buccal mucosa": "lbm",
          "Lateral border of tongue left": "lbtl",
          "Lateral border of tongue right": "lbtr",
          "Lower left GBS": "llgbs",
          "Lower labial mucosa": "llm",
          "Lower right GBS": "lrgbs",
          "Light buccal mucosa": "rbm",
          "Retro molar trigone": "rmt",
          "Right buccal mucosa": "rbm",
          "Soft palate": "sp",
          "Upper left GBS": "ulgbs",
          "Upper labial mucosa": "ulm",
          "Upper right GBS": "urgbs",
        };
        const expectedKeys = expectedValue.map((label) => labelToKey[label]);
        const allExpectedTrue = expectedKeys.some((key) => sugrwthData[key] !== "");

        if (allExpectedTrue) {
          return true;
        }
        return false;
      } else if (field === "Suspicious ulcer present - Lesion size") {
        const sugrwthData = data[form3[field]];
        if (expectedValue === "Less than 2 cm diameter") {
          expectedValue = "lt2cm";
        }
        if (expectedValue === "2-4 cm diameter") {
          expectedValue = "tt4cm";
        }
        if (expectedValue === "more than 4cm diameter") {
          expectedValue = "mt4cm";
        }

        const allExpectedTrue = Object.keys(sugrwthData).some((key) => sugrwthData[key] === expectedValue);

        if (allExpectedTrue) {
          return true;
        }
        return false;
      } else if (field === "Suspicious growth") {
        const sus_grwthData = data[form3[field]];

        if (!sus_grwthData) return false;
        const labelToKey = {
          "Anterior vestibule lower": "avl",
          "Anterior vestibule upper": "avu",
          "Floor of the mouth": "fm",
          "Hard palate": "hp",
          "Left buccal mucosa": "lbm",
          "Lateral border of tongue left": "lbtl",
          "Lateral border of tongue right": "lbtr",
          "Lower left GBS": "llgbs",
          "Lower labial mucosa": "llm",
          "Lower right GBS": "lrgbs",
          "Light buccal mucosa": "rbm",
          "Retro molar trigone": "rmt",
          "Right buccal mucosa": "rbm",
          "Soft palate": "sp",
          "Upper left GBS": "ulgbs",
          "Upper labial mucosa": "ulm",
          "Upper right GBS": "urgbs",
        };
        const expectedKeys = expectedValue.map((label) => labelToKey[label]);

        const allExpectedTrue = expectedKeys.some((key) => sus_grwthData[key] !== "");

        if (allExpectedTrue) {
          return true;
        }
        return false;
      } else if (field === "Suspicious growth present - Lesion size") {
        const sus_grwthData = data[form3[field]];

        if (expectedValue === "Less than 2 cm diameter") {
          expectedValue = "lt2cm";
        }
        if (expectedValue === "2-4 cm diameter") {
          expectedValue = "tt4cm";
        }
        if (expectedValue === "more than 4cm diameter") {
          expectedValue = "mt4cm";
        }
        if (!sus_grwthData || typeof sus_grwthData !== "object") return false;
        const allExpectedTrue = Object.keys(sus_grwthData).some((key) => sus_grwthData[key] === expectedValue);

        if (allExpectedTrue) {
          return true;
        }
        return false;
      } else if (field === "Smokers Palate") {
        const smkrspalateData = data[form3[field]];

        if (!smkrspalateData) return false;
        const labelToKey = {
          "Soft palate": "sp",
          "Hard palate": "hp",
        };

        const expectedKeys = expectedValue.map((label) => labelToKey[label]);

        const allExpectedTrue = expectedKeys.some((key) => smkrspalateData[key] === true);

        if (allExpectedTrue) {
          return true;
        }

        return false;
      } else if (field === "Oral punch biopsy indicated") {
        const actualValue = data[form3[field]];

        if (expectedValue === "Yes and willing") {
          expectedValue = "yaw";
        }
        if (expectedValue === "Yes and unwilling") {
          expectedValue = "yauw";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Laser procedure advised") {
        const actualValue = data[form3[field]];

        if (expectedValue === "Excision") {
          expectedValue = "exsn";
        }
        if (expectedValue === "Ablation") {
          expectedValue = "abln";
        }
        if (expectedValue === "NA") {
          expectedValue = "naa";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Breast Examination Right breast") {
        const [node0, node1] = form3[field].split("/");
        const rbData = data[node0] && data[node0][node1] ? data[node0][node1] : undefined;

        if (!rbData) return false;
        const labelToKey = {
          "Axillary Nodes palpable": "a_n_p",
          "Fixed Suspicious Lump": "f_s_l",
          "Freely Mobile Lump": "f_m_l",
          "Nipple Discharge": "n_d",
          Normal: "nml",
          Thickening: "thkng",
        };
        const expectedKeys = expectedValue.map((label) => labelToKey[label]);

        const allExpectedTrue = expectedKeys.some((key) => rbData[key] === true);

        if (allExpectedTrue) {
          return true;
        }
        return false;
      } else if (field === "Breast Examination Left breast") {
        const [node0, node1] = form3[field].split("/");
        const lbData = data[node0] && data[node0][node1] ? data[node0][node1] : undefined;
        if (!lbData) return false;
        const labelToKey = {
          "Axillary Nodes palpable": "a_n_p",
          "Fixed Suspicious Lump": "f_s_l",
          "Freely Mobile Lump": "f_m_l",
          "Nipple Discharge": "n_d",
          Normal: "nml",
          Thickening: "thkng",
        };
        const expectedKeys = expectedValue.map((label) => labelToKey[label]);
        const allExpectedTrue = expectedKeys.some((key) => lbData[key] === true);

        if (allExpectedTrue) {
          return true;
        }
        return false;
      } else if (field === "Abnormality location Right breast") {
        const [node0, node1] = form3[field].split("/");
        const arbData = data[node0] && data[node0][node1] ? data[node0][node1] : undefined;
        if (!arbData) return false;
        const labelToKey = {
          "Inner lower quadrant": "ilq",
          "Inner upper quadrant": "iuq",
          "Outer lower quadrant": "olq",
          "Outer upper quadrant": "ouq",
        };
        const expectedKeys = expectedValue.map((label) => labelToKey[label]);
        const allExpectedTrue = expectedKeys.some((key) => arbData[key] === true);

        if (allExpectedTrue) {
          return true;
        }
        return false;
      } else if (field === "Abnormality location Left breast") {
        const [node0, node1] = form3[field].split("/");

        const albData = data[node0] && data[node0][node1] ? data[node0][node1] : undefined;
        if (!albData) return false;
        const labelToKey = {
          "Inner lower quadrant": "ilq",
          "Inner upper quadrant": "iuq",
          "Outer lower quadrant": "olq",
          "Outer upper quadrant": "ouq",
        };
        const expectedKeys = expectedValue.map((label) => labelToKey[label]);
        const allExpectedTrue = expectedKeys.some((key) => albData[key] === true);

        if (allExpectedTrue) {
          return true;
        }
        return false;
      } else if (field === "Breast Photos") {
        const actualValue = data[form3[field]];

        if (actualValue !== undefined) {
          if (expectedValue === "With photo" && Object.keys(actualValue).length > 0 && actualValue[0] !== "123") {
            return true;
          } else if (expectedValue === "Without photo" && Object.keys(actualValue).length === 1 && actualValue[0] === "123") {
            return true;
          }
        }
        return false;
      } else if (field === "Nipple discharge") {
        const ndData = data[form3[field]];
        if (!ndData) return false;
        const labelToKey = {
          "Blood stained": "bs",
          Grumous: "grm",
          "Multiple Duct": "md",
          "Single Duct": "sd",
          Serous: "serous",
        };
        const expectedKeys = expectedValue.map((label) => labelToKey[label]);
        const allExpectedTrue = expectedKeys.some((key) => ndData[key] === true);

        if (allExpectedTrue) {
          return true;
        }
        return false;
      } else if (field === "Advised bilateral screening mammography") {
        const actualValue = data[form3[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }
        if (expectedValue === "Other") {
          expectedValue = "ttc5";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Advised bilateral screening ultrasound") {
        const actualValue = data[form3[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }
        if (expectedValue === "Other") {
          expectedValue = "ttc5";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "FNAC done when indicated") {
        const actualValue = data[form3[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }
        if (expectedValue === "Other") {
          expectedValue = "ttc5";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Nipple discharge smear taken when indicated") {
        const actualValue = data[form3[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }
        if (expectedValue === "Other") {
          expectedValue = "othr";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Information") {
        const infrmnData = data[form3[field]];

        if (!infrmnData) return false;

        const labelToKey = {
          "Irregular menstruation": "irrm",
          "Post hysterectomy status": "phs",
          "Under menstruation": "uce",
          "Unwilling for cervical examination": "um",
          WDPV: "wdpv",
        };
        const expectedKeys = expectedValue.map((label) => labelToKey[label]);
        const allExpectedTrue = expectedKeys.some((key) => infrmnData[key] === true);

        if (allExpectedTrue) {
          return true;
        }
        return false;
      } else if (field === "Per Speculum") {
        const perspecData = data[form3[field]];
        if (!perspecData) return false;
        const labelToKey = {
          "Bloody discharge present": "bdp",
          "Endocervical polyp present": "epp",
          "Erosion present": "ersnp",
          "Growth present": "grwthp",
          "Lesion Present": "lsnp",
          "Nabothian cyst present": "ncp",
          "Requires further test": "rft",
          "Strawberry cervix": "sc",
          "SCJ fully visible": "sfv",
          "SCJ not visible": "snv",
          "SCJ partially visible": "spv",
          "VIA done last year": "vdly",
          "White discharge present": "wdp",
        };
        const expectedKeys = expectedValue.map((label) => labelToKey[label]);
        const allExpectedTrue = expectedKeys.some((key) => perspecData[key] === true);

        if (allExpectedTrue) {
          return true;
        }
        return false;
      } else if (field === "VIA") {
        const actualValue = data[form3[field]];

        if (expectedValue === "Positive") {
          expectedValue = "pos";
        }
        if (expectedValue === "Negative") {
          expectedValue = "neg";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Releveant images") {
        const actualValue = data[form3[field]];

        if (actualValue !== undefined) {
          if (expectedValue === "With photo" && Object.keys(actualValue).length > 0 && actualValue[0] !== "123") {
            return true;
          } else if (expectedValue === "Without photo" && Object.keys(actualValue).length === 1 && actualValue[0] === "123") {
            return true;
          }
        }
        return false;
      } else if (field === "Pap smear taken") {
        const actualValue = data[form3[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "Unwilling") {
          expectedValue = "unwg";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Cervical Punch biopsy indicated") {
        const actualValue = data[form3[field]];

        if (expectedValue === "Yes and willing") {
          expectedValue = "yaw";
        }
        if (expectedValue === "Yes and unwilling") {
          expectedValue = "yauw";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Recommendation") {
        const [node0, node1] = form3[field].split("/");
        const actualValue1 = data[node0];
        const actualValue2 = data[node1];

        const recdnMap = {
          "No intervention": "nointrvn",
          "Recommendation to hospital": "rth",
          "Next screening date": "nsd",
        };

        const recmdMap = {
          "Local Procedure-Laser": "lsr",
          "Local Procedure-Ultrasound": "ulsnd",
          "Local Procedure-Mammography": "mghpy",
          "Local Procedure-Colposcopy": "cpscy",
        };

        const normalizedRecdnValue = recdnMap[expectedValue];
        const normalizedRecmdValue = recmdMap[expectedValue];

        if (actualValue1 !== undefined && normalizedRecdnValue) {
          if (actualValue1 === normalizedRecdnValue) {
            return true;
          }
        }

        if (actualValue2 !== undefined && normalizedRecmdValue) {
          if (actualValue2[normalizedRecmdValue] === true) {
            return true;
          }
        }

        return false;
      }
    } else if (source === "tcc_form") {
      if (field === "Amount spent on tobacco per day") {
        const actualValue = data[Tcc[field]];

        if (actualValue !== undefined) {
          const splitValue = actualValue.split(" ");
          const val = splitValue[0];

          if (expectedValue.startsWith("< ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(val);
            return !isNaN(numActual) && numActual < numExpected;
          } else if (expectedValue.startsWith("> ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(val);
            return !isNaN(numActual) && numActual > numExpected;
          } else if (expectedValue.startsWith("= ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(val);
            return !isNaN(numActual) && numActual === numExpected;
          }
        }
        return false;
      } else if (field === "Types of tobacco consumption") {
        const actualValue = data[Tcc[field]];

        if (actualValue !== undefined) {
          if (Array.isArray(expectedValue)) {
            const expectedMap = {
              "Smoked tobacco - beedi, cigarettes": "types_of_tobacco_consumption1",
              "Smokeless tobacco - ghutka, hans, pan masala, snuff": "types_of_tobacco_consumption2",
              "Betel quid with tobacco (kaddipudi, hogesoppu)": "types_of_tobacco_consumption3",
              "Betel quid without tobacco": "types_of_tobacco_consumption4",
              Other: "types_of_tobacco_consumption5",
            };

            for (const exp of expectedValue) {
              const key = expectedMap[exp];
              if (key && actualValue[key] && actualValue[key].includes(exp)) {
                return true;
              }
            }
          }
        }
        return false;
      } else if (field === "Frequency of use / day [Smoked tobacco - beedi, cigarettes]") {
        const [node0, node1] = Tcc[field].split("/");
        const actualValue = data[node0] && data[node0][node1] ? data[node0][node1] : undefined;
        console.log("actualValue: ", actualValue);

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Frequency of use / day [Smokeless tobacco - ghutka, hans, pan masala, snuff]") {
        const [node0, node1] = Tcc[field].split("/");
        const actualValue = data[node0] && data[node0][node1] ? data[node0][node1] : undefined;

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Frequency of use / day [Betel quid with tobacco (kaddipudi, hogesoppu)]") {
        const [node0, node1] = Tcc[field].split("/");

        const actualValue = data[node0] && data[node0][node1] ? data[node0][node1] : undefined;

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Frequency of use / day [Betel quid without tobacco]") {
        const [node0, node1] = Tcc[field].split("/");
        const actualValue = data[node0] && data[node0][node1] ? data[node0][node1] : undefined;

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Frequency of use / day [Others ]") {
        const [node0, node1] = Tcc[field].split("/");
        const actualValue = data[node0] && data[node0][node1] ? data[node0][node1] : undefined;

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "For how many years have you had the habit?") {
        const actualValue = data[Tcc[field]];

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Family history of Tobacco use") {
        const [node0, node1] = Tcc[field].split("/");
        const actualValue = data[node0] && data[node0][node1] ? data[node0][node1] : undefined;

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }
        if (expectedValue === "Not Known") {
          expectedValue = "nk";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "Family history of Substance use") {
        const [node0, node1] = Tcc[field].split("/");
        const actualValue = data[node0] && data[node0][node1] ? data[node0][node1] : undefined;

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }
        if (expectedValue === "Not Known") {
          expectedValue = "nk";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "Family history of Mental disorder use") {
        const [node0, node1] = Tcc[field].split("/");
        const actualValue = data[node0] && data[node0][node1] ? data[node0][node1] : undefined;

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }
        if (expectedValue === "Not Known") {
          expectedValue = "nk";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "Age of uptake") {
        const actualValue = data[Tcc[field]];

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "Reason for uptake / Starting the habit") {
        const actualValue = data[Tcc[field]];

        if (Array.isArray(expectedValue)) {
          const expectedMap = {
            "Due to work stress": "ws",
            "Dental issues": "dntl",
            "Learnt from elders of the family": "lef",
            "Peer influence": "pinf",
            "Family problems": "fprb",
            "Sleep issues": "slpissue",
            Boredom: "bdm",
            "During or after pregnancy": "doap",
            "Not known": "nk",
            "Since childhood": "sc",
            Others: "oth",
          };

          const expectedKeys = expectedValue.map((item) => expectedMap[item]).filter(Boolean);

          const actualKeys = actualValue.split(",").map((item) => item.trim());

          const allMatch = expectedKeys.some((key) => actualKeys.some((actual) => actual.startsWith(key)));

          if (allMatch) {
            return true;
          }
        }
        return false;
      } else if (field === "I smoke to keep myself alert") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Often") {
          expectedValue = "a";
        }
        if (expectedValue === "Occasionally") {
          expectedValue = "b";
        }
        if (expectedValue === "Always") {
          expectedValue = "c";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Smoking is pleasant and relaxing") {
        const actualValue = data[Tcc[field]];
        if (expectedValue === "Often") {
          expectedValue = "a";
        }
        if (expectedValue === "Occasionally") {
          expectedValue = "b";
        }
        if (expectedValue === "Always") {
          expectedValue = "c";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "I smoke when I am upset about something") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Often") {
          expectedValue = "a";
        }
        if (expectedValue === "Occasionally") {
          expectedValue = "b";
        }
        if (expectedValue === "Always") {
          expectedValue = "c";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "I smoke out of boredom") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Often") {
          expectedValue = "a";
        }
        if (expectedValue === "Occasionally") {
          expectedValue = "b";
        }
        if (expectedValue === "Always") {
          expectedValue = "c";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "If I run out of cigarette/beedi, I find it unbearable.") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Often") {
          expectedValue = "a";
        }
        if (expectedValue === "Occasionally") {
          expectedValue = "b";
        }
        if (expectedValue === "Always") {
          expectedValue = "c";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "I smoke automatically without being aware of it.") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Often") {
          expectedValue = "a";
        }
        if (expectedValue === "Occasionally") {
          expectedValue = "b";
        }
        if (expectedValue === "Always") {
          expectedValue = "c";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "I smoke to perk myself up.") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Often") {
          expectedValue = "a";
        }
        if (expectedValue === "Occasionally") {
          expectedValue = "b";
        }
        if (expectedValue === "Always") {
          expectedValue = "c";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "I find it difficult to go about my job without smoking") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Often") {
          expectedValue = "a";
        }
        if (expectedValue === "Occasionally") {
          expectedValue = "b";
        }
        if (expectedValue === "Always") {
          expectedValue = "c";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "I need to smoke in order to pass motion.") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Often") {
          expectedValue = "a";
        }
        if (expectedValue === "Occasionally") {
          expectedValue = "b";
        }
        if (expectedValue === "Always") {
          expectedValue = "c";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "I get real cravings for cigarette/beedi when I haven't used in a while") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Often") {
          expectedValue = "a";
        }
        if (expectedValue === "Occasionally") {
          expectedValue = "b";
        }
        if (expectedValue === "Always") {
          expectedValue = "c";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "I use it to keep from slowing down") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Often") {
          expectedValue = "a";
        }
        if (expectedValue === "Occasionally") {
          expectedValue = "b";
        }
        if (expectedValue === "Always") {
          expectedValue = "c";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "I like the texture and taste of it in my mouth.") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Often") {
          expectedValue = "a";
        }
        if (expectedValue === "Occasionally") {
          expectedValue = "b";
        }
        if (expectedValue === "Always") {
          expectedValue = "c";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "I find it pleasant and relaxing") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Often") {
          expectedValue = "a";
        }
        if (expectedValue === "Occasionally") {
          expectedValue = "b";
        }
        if (expectedValue === "Always") {
          expectedValue = "c";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "I use it when I am upset about something") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Often") {
          expectedValue = "a";
        }
        if (expectedValue === "Occasionally") {
          expectedValue = "b";
        }
        if (expectedValue === "Always") {
          expectedValue = "c";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "I chew it out of boredom.") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Often") {
          expectedValue = "a";
        }
        if (expectedValue === "Occasionally") {
          expectedValue = "b";
        }
        if (expectedValue === "Always") {
          expectedValue = "c";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "If I run out of it, I find it unbearable.") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Often") {
          expectedValue = "a";
        }
        if (expectedValue === "Occasionally") {
          expectedValue = "b";
        }
        if (expectedValue === "Always") {
          expectedValue = "c";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "I believe that it provides calcium.") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Often") {
          expectedValue = "a";
        }
        if (expectedValue === "Occasionally") {
          expectedValue = "b";
        }
        if (expectedValue === "Always") {
          expectedValue = "c";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "I use it to perk myself up.") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Often") {
          expectedValue = "a";
        }
        if (expectedValue === "Occasionally") {
          expectedValue = "b";
        }
        if (expectedValue === "Always") {
          expectedValue = "c";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "It relieves pain in my jaw/teeth.") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Often") {
          expectedValue = "a";
        }
        if (expectedValue === "Occasionally") {
          expectedValue = "b";
        }
        if (expectedValue === "Always") {
          expectedValue = "c";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "I find it difficult to go about with my job without it.") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Often") {
          expectedValue = "a";
        }
        if (expectedValue === "Occasionally") {
          expectedValue = "b";
        }
        if (expectedValue === "Always") {
          expectedValue = "c";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "Fagerstorm Test for Nicotine Dependence - How soon after you wake up do you smoke your first cigarette?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Within 5 minutes") {
          expectedValue = "d";
        }
        if (expectedValue === "6-30 minutes") {
          expectedValue = "fab";
        }
        if (expectedValue === "31-60 minutes") {
          expectedValue = "fac";
        }
        if (expectedValue === "After 60 minutes") {
          expectedValue = "e";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (
        field ===
        "Fagerstorm Test for Nicotine Dependence - Do you find it difficult to refrain from smoking in places where it is forbidden, e.g., temples, during an outing with family, during village festivities?"
      ) {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Fagerstorm Test for Nicotine Dependence - Which cigarette would you hate most to give up?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "The first one in the morning") {
          expectedValue = "first_one";
        }
        if (expectedValue === "Any other") {
          expectedValue = "any_other";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Fagerstorm Test for Nicotine Dependence - How many cigarettes per day do you smoke?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Thirty one or more") {
          expectedValue = "dda";
        }
        if (expectedValue === "Twenty one-Thirty") {
          expectedValue = "ddb";
        }
        if (expectedValue === "Eleven-Twenty") {
          expectedValue = "ddc";
        }
        if (expectedValue === "Ten or less") {
          expectedValue = "ddd";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Fagerstorm Test for Nicotine Dependence - Do you smoke more frequently during the first hours of waking than during the rest of the day?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Fagerstorm Test for Nicotine Dependence - Do you smoke even if you are sick in bed?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Modified Fagerstorm Test - How soon after you wake up do you place your first dip?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Within 5 minutes") {
          expectedValue = "d";
        }
        if (expectedValue === "6-30 minutes") {
          expectedValue = "fab";
        }
        if (expectedValue === "31-60 minutes") {
          expectedValue = "fac";
        }
        if (expectedValue === "After 60 minutes") {
          expectedValue = "e";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Modified Fagerstorm Test - How often do you intentionally swallow its juice?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Always") {
          expectedValue = "c";
        }
        if (expectedValue === "Sometimes") {
          expectedValue = "fbb";
        }
        if (expectedValue === "Never") {
          expectedValue = "fbc";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "Modified Fagerstorm Test - Which chew would you hate most to give up?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "The first one in the morning") {
          expectedValue = "first_one";
        }
        if (expectedValue === "Any other") {
          expectedValue = "any_other";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Modified Fagerstorm Test - How many cans/pouches per week do you use?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "More than Three") {
          expectedValue = "fda";
        }
        if (expectedValue === "Two-Three") {
          expectedValue = "fdb";
        }
        if (expectedValue === "One") {
          expectedValue = "fdc";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Modified Fagerstorm Test - Do you chew more frequently during the first hours after waking than during the rest of the day?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Modified Fagerstorm Test - Do you chew even if you are sick in the bed?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Do you intend to quit the habit") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
      } else if (field === "Have you previously attempted to quit the habit?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "what among the following were the barriers to quit?") {
        const actualValue = data[Tcc[field]];

        if (Array.isArray(expectedValue)) {
          const expectedMap = {
            Stress: "fi1",
            Craving: "fi2",
            Sleeplessness: "fi3",
            "Disinterest in work": "fi4",
            Irritability: "fi5",
            Anxiety: "fi6",
            "Unable to pass bowel movements": "fi7",
            Boredom: "bdm",
            "Peer pressure": "fi9",
            Headache: "fi10",
            Others: "fi11",
          };

          const expectedKeys = expectedValue.map((item) => expectedMap[item]).filter(Boolean);
          const actualKeys = actualValue.split(",").map((item) => item.trim().split(":")[0].trim());

          const allMatch = expectedKeys.some((key) => actualKeys.includes(key));

          if (allMatch) {
            return true;
          }
        }
        return false;
      } else if (field === "Do you often forget the intention behind quitting?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Did you have the right social support?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Are you fearful of what might happen if you quit?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Are you anticipating sadness when you quit?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Do you find yourself thinking about death?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Do you wish to live a healthy life?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Do you believe that using tobacco is healthy?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Does anyone in the family believe your habits are unhealthy?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Would you agree if someone told you that use of tobacco in any form is not healthy?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Are you thinking of quitting the habit now?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Do you think that quitting takes a lot of effort?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Do your family support you in quitting the habit?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }

        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Do your friends support you in quitting the habit?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Would you be willing to quit if someone from the family puts in the same effort to help?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Would it be helpful if the counsellor gave you a nudge every now and then?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Would you need some time to think whether you want to quit or not?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Do you believe you are capable of quitting?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Do you believe you can quit on your own?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "If there were professionals to help you out would you make an effort to quit?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Yes") {
          expectedValue = "y";
        }
        if (expectedValue === "No") {
          expectedValue = "n";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Which form of professional intervention would you prefer ?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Individualized") {
          expectedValue = "gja";
        }
        if (expectedValue === "Peer Group") {
          expectedValue = "gjb";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Which mode of therapy would you prefer?") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Inperson") {
          expectedValue = "gka";
        }
        if (expectedValue === "Telephonic") {
          expectedValue = "gkb";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Dependency score for smoke tobacco") {
        const actualValue = data[Tcc[field]];

        if (actualValue !== undefined) {
          if (expectedValue.startsWith("< ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual < numExpected;
          } else if (expectedValue.startsWith("> ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual > numExpected;
          } else if (expectedValue.startsWith("= ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual === numExpected;
          }
        }
        return false;
      } else if (field === "Dependency level for smoke tobacco") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Low dependence") {
          expectedValue = "hbda";
        }
        if (expectedValue === "Low to moderate dependence") {
          expectedValue = "hbdb";
        }
        if (expectedValue === "Moderate dependence") {
          expectedValue = "hbdc";
        }
        if (expectedValue === "High dependence") {
          expectedValue = "hbdd";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Dependency score for chewing habits") {
        const actualValue = data[Tcc[field]];

        if (actualValue !== undefined) {
          if (expectedValue.startsWith("< ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual < numExpected;
          } else if (expectedValue.startsWith("> ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual > numExpected;
          } else if (expectedValue.startsWith("= ")) {
            const numExpected = parseFloat(expectedValue.substring(2));
            const numActual = parseFloat(actualValue);

            return !isNaN(numActual) && numActual === numExpected;
          }
        }
        return false;
      } else if (field === "Dependency level for smokeless tobacco") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Low dependence") {
          expectedValue = "hbda";
        }
        if (expectedValue === "Low to moderate dependence") {
          expectedValue = "hbdb";
        }
        if (expectedValue === "Moderate dependence") {
          expectedValue = "hbdc";
        }
        if (expectedValue === "High dependence") {
          expectedValue = "hbdd";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Motivation stage assessed") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Pre-Contemplation") {
          expectedValue = "he1";
        }
        if (expectedValue === "Contemplation") {
          expectedValue = "he2";
        }
        if (expectedValue === "Action") {
          expectedValue = "he3";
        }
        if (expectedValue === "Maintenance") {
          expectedValue = "he4";
        }
        if (expectedValue === "Preparation") {
          expectedValue = "he5";
        }
        if (expectedValue === "Relapse") {
          expectedValue = "he6";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      } else if (field === "Counselling Techniques") {
        const actualValue = data[Tcc[field]];

        if (expectedValue === "Solution Focused Brief Therapy Techniques") {
          expectedValue = "hh1";
        }
        if (expectedValue === "Motivational Enhancement techniques") {
          expectedValue = "hh2";
        }
        if (expectedValue === "Brief advice") {
          expectedValue = "hh3";
        }
        if (actualValue !== undefined) {
          if (actualValue === expectedValue) {
            return true;
          }
        }
        return false;
      }
    }
  } catch (err) {
    console.error("Error in option3Validator: ", err);
    return false;
  }
}
