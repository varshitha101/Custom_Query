import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

export default function SelectorOption2({ value, onChange, inputValue, onInputChange, options, error, disabled, isDateSelect }) {
  return (
    <Autocomplete
      disabled={disabled}
      value={value || null}
      onChange={onChange}
      inputValue={inputValue}
      onInputChange={onInputChange}
      options={options}
      getOptionLabel={(option) => option}
      isOptionEqualToValue={(a, b) => a === b}
      getOptionDisabled={(option) => isDateSelect && option === "Date" && value !== "Date"}
      sx={{ width: 200 }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Select"
          error={!!error}
          helperText={error}
          InputProps={{
            ...params.InputProps,
            style: { height: 60 },
          }}
        />
      )}
    />
  );
}
