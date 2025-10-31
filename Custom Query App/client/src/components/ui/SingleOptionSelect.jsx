import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

export default function SingleOptionSelect({ value, onChange, inputValue3, handleInputChange3, option, error }) {
  const style = {
    width: 360,
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
    <Autocomplete
      disableClearable
      value={value}
      onChange={onChange}
      inputValue={inputValue3}
      onInputChange={handleInputChange3}
      options={option}
      getOptionLabel={(option) => option?.name || option?.id || ""}
      isOptionEqualToValue={(a, b) => a?.id === b?.id}
      sx={style}
      renderInput={(params) => <TextField {...params} label="Select" error={error} helperText={error} />}
    />
  );
}
