import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

export default function SelectorOption2({ value, onChange, inputValue, onInputChange, options, error, disabled, isDateSelect, disabledOptions = [] }) {
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
      getOptionDisabled={(option) => disabledOptions.includes(option) || (isDateSelect && option === "Date")}
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
