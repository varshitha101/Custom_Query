import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

export default function RangeInputSelector({ value, operator, onChange, error }) {
  const operatorOptions = [
    { label: "Greater than", value: ">" },
    { label: "Less than", value: "<" },
    { label: "Equal", value: "=" },
  ];
  const styles = {
    width: 175,
    height: 60,
    minHeight: 60,
    maxHeight: 60,
    "& .MuiInputBase-root": {
      height: 60,
      minHeight: 60,
      maxHeight: 60,
      boxSizing: "border-box",
    },
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
        sx={styles}
        renderInput={(params) => <TextField {...params} label="Operator" error={!!error} helperText={error} />}
      />

      <TextField value={value?.value || ""} onChange={(e) => onChange(e, { ...value, value: e.target.value })} label="Enter Value" sx={styles} error={!!error} helperText={error} />
    </>
  );
}
