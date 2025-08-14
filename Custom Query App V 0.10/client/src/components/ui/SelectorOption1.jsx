import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

export default function SelectorOption1({ disableState, value, onChange, inputValue, onInputChange, options, error }) {
  return (
    <Autocomplete
      disabled={disableState}
      value={value}
      onChange={onChange}
      inputValue={inputValue}
      onInputChange={onInputChange}
      options={options}
      getOptionLabel={(option) => option?.msg || ""}
      isOptionEqualToValue={(a, b) => a?.id === b?.id}
      sx={{ width: 160 }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Select"
          error={!!error}
          helperText={error?.msg}
          InputProps={{
            ...params.InputProps,
            style: { height: 60, boxSizing: "border-box" },
          }}
        />
      )}
    />
  );
}
