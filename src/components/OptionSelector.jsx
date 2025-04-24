import { Box, TextField, Autocomplete, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useCallback, useState, useEffect } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import {
  multiSelectFields,
  rangeSelectFields,
  rangeSelectPlusEnterFields,
} from "../utils/specialCaseFields";
import ListItemText from "@mui/material/ListItemText";
import Checkbox from "@mui/material/Checkbox";

export default function OptionSelector({
  id,
  data,
  onDelete,
  errorSelectors,
  selectors,
  setSelectors,
  onAdd,
  setExpression,
}) {
  const selector = selectors.find((s) => s.id === id);
  const [inputValue1, setInputValue1] = useState("");
  const [inputValue2, setInputValue2] = useState("");
  const [inputValue3, setInputValue3] = useState("");
  const [errorOption1, seterrorOption1] = useState(false);
  const [errorOption2, seterrorOption2] = useState(false);
  const [errorOption3, seterrorOption3] = useState(false);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

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
  }, [
    selector?.selectedOption1,
    selector?.selectedOption2,
    selector?.selectedOption3,
  ]);

  useEffect(() => {
    const err = errorSelectors.find((e) => e.id === id);

    if (err) {
      seterrorOption1(err.selectedOptions[0]);
      seterrorOption2(err.selectedOptions[1]);
      seterrorOption3(err.selectedOptions[2]);
    }
  }, [errorSelectors, id]);

  const handleSelectedOption1Change = useCallback(
    (event, newSelectedOption1) => {
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
      setInputValue3("");
      setInputValue2("");
      setExpression([]);
    },
    [id, setExpression, setSelectors]
  );

  const handleSelectedOption2Change = useCallback(
    (event, newSelectedOption2) => {
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
      setInputValue3("");
      setExpression([]);
    },
    [id, setExpression, setSelectors]
  );

  const handleSelectedOption3Change = useCallback(
    (e, newVal) => {
      setSelectors((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;

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
      setExpression([]);
    },
    [id, setExpression, setSelectors]
  );

  const handleInputChange1 = (event, newInputValue) =>
    setInputValue1(newInputValue);
  const handleInputChange2 = (event, newInputValue) =>
    setInputValue2(newInputValue);
  const handleInputChange3 = (event, newInputValue) => {
    setInputValue3(newInputValue);
  };

  const handleDateChange = useCallback(
    (newDate, type) => {
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
      if (type === "SDate") {
        setStartDate(newDate);
      } else if (type === "LDate") {
        setEndDate(newDate);
      }
    },
    [id, setSelectors]
  );

  const getSelectedOption2 = () => selector?.selectedOption1?.fields || [];
  const getSelectedOption3 = () => {
    if (!selector?.selectedOption1 || !selector?.selectedOption2) {
      return [];
    }

    const options =
      selector.selectedOption1.options?.[selector.selectedOption2];

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

  const getSelectedOption3Length = () =>
    Array.isArray(getSelectedOption3()) ? getSelectedOption3().length : 0;

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
      }}
    >
      <TextField
        sx={{ width: 60, textAlign: "center" }}
        label={`Q${id + 1}`}
        disabled
        variant="outlined"
      />

      <Autocomplete
        value={selector?.selectedOption1 || null}
        onChange={handleSelectedOption1Change}
        inputValue={inputValue1}
        onInputChange={handleInputChange1}
        options={data}
        getOptionLabel={(option) => option?.msg || ""}
        isOptionEqualToValue={(a, b) => a?.id === b?.id}
        sx={{ width: 160 }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select"
            error={!!errorOption1}
            helperText={errorOption1?.msg}
          />
        )}
      />
      <Autocomplete
        disabled={!selector?.selectedOption1}
        value={selector?.selectedOption2 || null}
        onChange={handleSelectedOption2Change}
        inputValue={inputValue2}
        onInputChange={handleInputChange2}
        options={getSelectedOption2()}
        getOptionLabel={(option) => option}
        isOptionEqualToValue={(a, b) => a === b}
        sx={{ width: 200 }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select"
            error={!!errorOption2}
            helperText={errorOption2}
          />
        )}
      />
      {selector?.selectedOption2 === "Date" ? (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Start Date"
            value={startDate}
            sx={{ width: 175 }}
            onChange={(newDate) => handleDateChange(newDate, "SDate")}
            maxDate={endDate}
          />
          <DatePicker
            label="Last Date"
            value={endDate}
            sx={{ width: 175 }}
            onChange={(newDate) => handleDateChange(newDate, "LDate")}
            minDate={startDate}
          />
        </LocalizationProvider>
      ) : rangeSelectFields.includes(selector?.selectedOption2) ? (
        <>
          <Autocomplete
            disableClearable
            value={
              [
                { label: "Greater than", value: ">" },
                { label: "Less than", value: "<" },
                { label: "Equal", value: "=" },
                
              ].find(
                (op) => op.value === selector?.selectedOption3?.operator
              ) || null
            }
            onChange={(e, newVal) =>
              handleSelectedOption3Change(e, {
                ...selector.selectedOption3,
                operator: newVal?.value || "",
              })
            }
            options={[
              { label: "Greater than", value: ">" },
              { label: "Less than", value: "<" },
              { label: "Equal", value: "=" },
              
            ]}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) =>
              option.value === value.value
            }
            sx={{ width: 175 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Operator"
                error={!!errorOption3}
                helperText={errorOption3}
              />
            )}
          />

          <Autocomplete
            disabled={!selector?.selectedOption2}
            value={selector?.selectedOption3 || ""}
            onChange={handleSelectedOption3Change}
            inputValue={inputValue3}
            onInputChange={handleInputChange3}
            options={getSelectedOption3()}
            getOptionLabel={(option) => option?.name || option?.id || ""}
            isOptionEqualToValue={(a, b) => a?.id === b?.id}
            sx={{ width: 175 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select"
                error={!!errorOption3}
                helperText={errorOption3}
              />
            )}
          />
        </>
      ) : rangeSelectPlusEnterFields.includes(selector?.selectedOption2) ? (
        <>
          <Autocomplete
            disableClearable
            value={
              [
                { label: "Greater than", value: ">" },
                { label: "Less than", value: "<" },
                { label: "Greater than or equal", value: ">=" },
                { label: "Less than or equal", value: "<=" },
              ].find(
                (op) => op.value === selector?.selectedOption3?.operator
              ) || null
            }
            onChange={(e, newVal) =>
              handleSelectedOption3Change(e, {
                ...selector.selectedOption3,
                operator: newVal?.value || "",
              })
            }
            options={[
              { label: "Greater than", value: ">" },
              { label: "Less than", value: "<" },
              { label: "Greater than or equal", value: ">=" },
              { label: "Less than or equal", value: "<=" },
            ]}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) =>
              option.value === value.value
            }
            sx={{ width: 175 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Operator"
                error={!!errorOption3}
                helperText={errorOption3}
              />
            )}
          />

          <TextField
            value={selector?.selectedOption3?.value || ""}
            onChange={(e) =>
              handleSelectedOption3Change(e, {
                ...selector?.selectedOption3,
                value: e.target.value,
              })
            }
            label="Enter Value"
            sx={{ width: 175 }}
            error={!!errorOption3}
            helperText={errorOption3}
          />
        </>
      ) : multiSelectFields.includes(selector?.selectedOption2) ? (
        <Autocomplete
          multiple
          disableCloseOnSelect
          disabled={!selector?.selectedOption2}
          value={selector?.selectedOption3 || []}
          onChange={handleSelectedOption3Change}
          inputValue={inputValue3}
          onInputChange={handleInputChange3}
          options={getSelectedOption3()}
          getOptionLabel={(option) => option?.name || option?.id || ""}
          isOptionEqualToValue={(a, b) => a?.id === b?.id}
          sx={{ width: 360 }}
          renderOption={(props, option, { selected }) => (
            <li {...props}>
              <Checkbox style={{ marginRight: 8 }} checked={selected} />
              <ListItemText primary={option?.name || option?.id || ""} />
            </li>
          )}
          renderTags={(value) => (
            <span
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {value.length > 1
                ? `${value[0]?.name || value[0]?.id || ""} +${value.length - 1}`
                : value.length === 1
                  ? value[0]?.name || value[0]?.id || ""
                  : "Select"}
            </span>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Multiple"
              error={!!errorOption3}
              helperText={errorOption3}
            />
          )}
        />
      ) : getSelectedOption3Length() === 0 ? (
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
          sx={{ width: 360 }}
          error={!!errorOption3}
          helperText={errorOption3}
        />
      ) : (
        <Autocomplete
          disabled={!selector?.selectedOption2}
          value={selector?.selectedOption3 || ""}
          onChange={handleSelectedOption3Change}
          inputValue={inputValue3}
          onInputChange={handleInputChange3}
          options={getSelectedOption3()}
          getOptionLabel={(option) => option?.name || option?.id || ""}
          isOptionEqualToValue={(a, b) => a?.id === b?.id}
          sx={{ width: 360 }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select"
              error={!!errorOption3}
              helperText={errorOption3}
            />
          )}
        />
      )}
      <IconButton
        sx={{ border: 1 }}
        variant="outlined"
        aria-label="delete"
        onClick={() => onDelete(id)}
        color="primary"
      >
        <DeleteIcon />
      </IconButton>

      <IconButton
        variant="outlined"
        sx={{ border: 1 }}
        aria-label="add"
        onClick={() => onAdd(id)}
        color="primary"
      >
        <AddIcon />
      </IconButton>
    </Box>
  );
}
