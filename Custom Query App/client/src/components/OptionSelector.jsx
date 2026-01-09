import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

import { useCallback, useState, useEffect } from "react";

import { multiSelectFields, rangeSelectFields, rangeSelectPlusEnterFields } from "../services/utils/specialCaseFields";

import OptionSelectorHeader from "./ui/OptionSelectorHeader";
import SelectorOption1 from "./ui/SelectorOption1";
import SelectorOption2 from "./ui/SelectorOption2";
import SingleOptionSelect from "./ui/SingleOptionSelect";
import DateSelector from "./ui/DateSelector";
import RangeSelector from "./ui/RangeSelector";
import RangeInputSelector from "./ui/RangeInputSelector";
import MultiSelect from "./ui/MultiSelect";

export default function OptionSelector({ id, data, onDelete, errorSelectors, selectors, setSelectors, onAdd, setExpression, isDateSelect }) {
  const selector = selectors.find((s) => s.id === id);
  const [inputValue1, setInputValue1] = useState("");
  const [inputValue2, setInputValue2] = useState("");
  const [inputValue3, setInputValue3] = useState("");
  const [errorOption1, seterrorOption1] = useState(false);
  const [errorOption2, seterrorOption2] = useState(false);
  const [errorOption3, seterrorOption3] = useState(false);
  const selectedOptions2 = selectors.map((s) => s.selectedOption2);
  const disableDate = selectedOptions2.includes("Coverage Status");
  const disablePhase = selectedOptions2.includes("Date");

  const disabledOptions = [];
  if (disableDate) disabledOptions.push("Date");
  if (disablePhase) disabledOptions.push("Coverage Status");

  // Reset error states when selector changes
  useEffect(() => {
    if (selector?.selectedOption1 !== null) {
      seterrorOption1(false);
    }
    if (selector?.selectedOption2 !== null) {
      seterrorOption2(false);
    }
    if (selector?.selectedOption3 !== null) {
      seterrorOption3(false);
    }
  }, [selector?.selectedOption1, selector?.selectedOption2, selector?.selectedOption3]);

  // Set initial values from errorSelectors
  useEffect(() => {
    const err = errorSelectors.find((e) => e.id === id);
    if (err) {
      seterrorOption1(err.selectedOptions[0]);
      seterrorOption2(err.selectedOptions[1]);
      seterrorOption3(err.selectedOptions[2]);
    }
  }, [errorSelectors, id]);

  const handleInputChange1 = (event, newInputValue) => setInputValue1(newInputValue);
  const handleInputChange2 = (event, newInputValue) => setInputValue2(newInputValue);
  const handleInputChange3 = (event, newInputValue) => setInputValue3(newInputValue);

  /**
   * Handles the change of the first option selector.
   * It resets the input values and expression, and updates the selectors state.
   * @param {Object} event - The event object from the change event.
   * @param {Object} newSelectedOption1 - The new selected option for the first selector.
   * @param {Function} setSelectors - Function to update the selectors state.
   * @param {Function} setExpression - Function to reset the expression state.
   * @returns {void}
   */
  const handleSelectedOption1Change = useCallback(
    (event, newSelectedOption1) => {
      setInputValue3("");
      setInputValue2("");
      setExpression([]);
      setSelectors((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                selectedOption1: newSelectedOption1,
                selectedOption2: null,
                selectedOption3: null,
              }
            : s
        )
      );
    },
    [id, setExpression, setSelectors]
  );

  /**
   * Handles the change of the second option selector.
   * It resets the input value for the third selector and updates the selectors state.
   * @param {Object} event - The event object from the change event.
   * @param {string} newSelectedOption2 - The new selected option for the second selector.
   * @param {Function} setSelectors - Function to update the selectors state.
   * @param {Function} setExpression - Function to reset the expression state.
   * @return {void}
   */
  const handleSelectedOption2Change = useCallback(
    (event, newSelectedOption2) => {
      setInputValue3("");
      setExpression([]);

      setSelectors((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                selectedOption2: newSelectedOption2,
                selectedOption3: null,
              }
            : s
        )
      );
    },
    [id, setExpression, setSelectors]
  );

  /**
   * Handles the change of the third option selector.
   * It updates the selectors state based on the type of change (date or value).
   * @param {Object|Date} eOrDate - The event object or date from the change event.
   * @param {string|Object} newValOrType - The new value or type of change (e.g., "SDate", "LDate").
   * @param {Function} setSelectors - Function to update the selectors state.
   * @param {Function} setExpression - Function to reset the expression state.
   * @return {void}
   */
  const handleSelectedOption3Change = useCallback(
    (eOrDate, newValOrType) => {
      setExpression([]);
      // If called from DatePicker, eOrDate is the date, newValOrType is "SDate" or "LDate"
      // If called from Autocomplete/TextField, eOrDate is event, newValOrType is value

      // Check if this is a date change
      if (selector?.selectedOption2 === "Date" && (newValOrType === "SDate" || newValOrType === "LDate")) {
        const newDate = eOrDate;
        const type = newValOrType;

        setSelectors((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  selectedOption3: {
                    ...s.selectedOption3,
                    [type]: newDate,
                  },
                }
              : s
          )
        );
        return;
      }

      // Otherwise, handle as before
      const newVal = newValOrType;
      setSelectors((prev) =>
        prev.map((s) => {
          if (s.id !== id) {
            return s;
          }

          const current = s.selectedOption3 ?? {};

          if (rangeSelectFields.includes(s.selectedOption2)) {
            return {
              ...s,
              selectedOption3: {
                ...current,
                ...(typeof newVal === "object" ? newVal : { value: newVal }),
              },
            };
          }

          if (rangeSelectPlusEnterFields.includes(s.selectedOption2)) {
            return {
              ...s,
              selectedOption3: {
                ...current,
                ...(typeof newVal === "object" ? newVal : { value: newVal }),
              },
            };
          }

          return {
            ...s,
            selectedOption3: newVal,
          };
        })
      );

      if (typeof newVal === "string") {
        setInputValue3(newVal);
      } else if (newVal?.name || newVal?.id) {
        setInputValue3(newVal.name || newVal.id);
      }
    },
    [id, setExpression, setSelectors, selector?.selectedOption2]
  );

  /**
   *  Gets the fields of the selected option 2.
   *  If no option is selected, it returns an empty array.
   * @returns {Array} - Returns the fields of the selected option 1.
   */
  const getSelectedOption2 = () => selector?.selectedOption1?.fields || [];

  /**
   *  Gets the options for the third selector based on the selected options.
   *  It checks if the selected options are valid and returns the corresponding options.
   * @returns {Array} Returns the options for the third selector based on the selected options.
   * If no options are available, it returns an empty array.
   */
  const getSelectedOption3 = () => {
    if (!selector?.selectedOption1 || !selector?.selectedOption2) {
      return [];
    }

    const options = selector.selectedOption1.options?.[selector.selectedOption2];

    if (Array.isArray(options)) {
      // Check if the array contains objects or strings
      if (typeof options[0] === "object") {
        // Array of objects (e.g., Panchayath, Village)
        return options;
      } else if (typeof options[0] === "string") {
        // Array of strings
        return options.map((item) => ({ name: item, id: item }));
      }
    }

    return [];
  };

  /**
   * Gets the length of the selected option 3.
   * It checks if the selected option 3 is an array and returns its length.
   * @returns {number} Returns the length of the selected option 3.
   * If the selected option 3 is not an array, it returns 0.
   */
  const getSelectedOption3Length = () => (Array.isArray(getSelectedOption3()) ? getSelectedOption3().length : 0);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: {
          xs: "column",
          sm: "row",
        },
        justifyContent: "center",
        alignItems: "center",
        p: 1,
        gap: 1,
        flexWrap: "wrap",
        m: 0,
      }}>
      <OptionSelectorHeader id={id} />
      <SelectorOption1 value={selector?.selectedOption1} onChange={handleSelectedOption1Change} inputValue={inputValue1} onInputChange={handleInputChange1} options={data} error={errorOption1} />
      <SelectorOption2
        value={selector?.selectedOption2}
        onChange={handleSelectedOption2Change}
        inputValue={inputValue2}
        onInputChange={handleInputChange2}
        options={getSelectedOption2()}
        error={errorOption2}
        disabled={!selector?.selectedOption1}
        isDateSelect={isDateSelect}
        disabledOptions={disabledOptions}
      />

      {selector?.selectedOption2 === "Date" ? (
        // If the second option is "Date", render DateSelector
        <DateSelector value={selector?.selectedOption3} onChange={handleSelectedOption3Change} />
      ) : rangeSelectFields.includes(selector?.selectedOption2) ? (
        // If the second option is a range select field, render RangeSelector
        <RangeSelector
          value={selector?.selectedOption3}
          operator={selector?.selectedOption3?.operator || ""}
          options={getSelectedOption3()}
          onChange={handleSelectedOption3Change}
          inputValue={inputValue3}
          onInputChange={handleInputChange3}
          error={errorOption3}
        />
      ) : rangeSelectPlusEnterFields.includes(selector?.selectedOption2) ? (
        // If the second option is a range select plus enter field, render RangeInputSelector
        <RangeInputSelector
          value={selector?.selectedOption3}
          operator={selector?.selectedOption3?.operator || ""}
          onChange={handleSelectedOption3Change}
          inputValue={inputValue3}
          onInputChange={handleInputChange3}
          options={getSelectedOption3()}
          error={errorOption3}
        />
      ) : multiSelectFields.includes(selector?.selectedOption2) ? (
        // If the second option is a multi-select field, render MultiSelect
        <MultiSelect
          value={selector?.selectedOption3 || []}
          onChange={handleSelectedOption3Change}
          inputValue={inputValue3}
          onInputChange={handleInputChange3}
          options={getSelectedOption3()}
          error={errorOption3}
          disabled={!selector?.selectedOption2}
        />
      ) : getSelectedOption3Length() === 0 ? (
        // If there are no options for the third selector, render a TextField
        // This is to allow manual entry when no options are available
        <TextField
          disabled={!selector?.selectedOption2}
          value={selector?.selectedOption3?.value || ""}
          onChange={(e) =>
            handleSelectedOption3Change(e, {
              ...selector?.selectedOption3,
              value: e.target.value,
            })
          }
          label="Enter Value"
          sx={{ width: 360, height: 60, minHeight: 60, maxHeight: 60, "& .MuiInputBase-root": { height: 60, minHeight: 60, maxHeight: 60, boxSizing: "border-box" } }}
          error={!!errorOption3}
          helperText={errorOption3}
        />
      ) : (
        // If there are options for the third selector, render SingleOptionSelect
        // This allows selection from a predefined list
        <SingleOptionSelect
          value={selector?.selectedOption3}
          onChange={handleSelectedOption3Change}
          inputValue3={inputValue3}
          handleInputChange3={handleInputChange3}
          option={getSelectedOption3()}
          error={errorOption3}
        />
      )}
      <IconButton sx={{ border: 1 }} variant="outlined" aria-label="delete" onClick={() => onDelete(id)} color="primary">
        <DeleteIcon />
      </IconButton>

      <IconButton variant="outlined" sx={{ border: 1 }} aria-label="add" onClick={() => onAdd(id)} color="primary">
        <AddIcon />
      </IconButton>
    </Box>
  );
}
