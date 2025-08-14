import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

export default function RangeSelector({ value, operator, options, onChange, inputValue, onInputChange, error }) {
  const operatorOptions = [
    { label: "Greater than", value: ">" },
    { label: "Less than", value: "<" },
    { label: "Equal", value: "=" },
  ];
  const operatorStyles = {
    width: 175,
    "& .MuiInputBase-root": { height: 60, boxSizing: "border-box" },
  };

  const valueStyles = {
    width: 175,
    height: 60,
    minHeight: 60,
    maxHeight: 60,
    "& .MuiInputBase-root": { height: 60, minHeight: 60, maxHeight: 60, boxSizing: "border-box" },
  };
  return (
    <>
      <Autocomplete
        disableClearable
        value={operatorOptions.find((op) => op.value === operator) || null}
        onChange={(e, newVal) => onChange(e, { ...value, operator: newVal?.value || "" })}
        options={operatorOptions}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(a, b) => a.value === b.value}
        sx={operatorStyles}
        renderInput={(params) => <TextField {...params} label="Operator" error={!!error} helperText={error} />}
      />

      <Autocomplete
        disableClearable
        value={value}
        onChange={onChange}
        inputValue={inputValue}
        onInputChange={onInputChange}
        options={options}
        getOptionLabel={(option) => option?.name || option?.id || ""}
        isOptionEqualToValue={(a, b) => a?.id === b?.id}
        sx={valueStyles}
        renderInput={(params) => <TextField {...params} label="Select" error={!!error} helperText={error} />}
      />
    </>
  );
}
