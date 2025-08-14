import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";

import { useCallback } from "react";

export default function MultiSelect({ value, options, onChange, inputValue, onInputChange, error }) {
  /**
   * Function to truncate a string to a maximum of 10 characters and append ellipsis if it exceeds that length.
   * This is useful for displaying long names or IDs in a compact format.
   * @param {string} str
   * @returns {string} Returns a truncated string with ellipsis if it exceeds 10 characters.
   */
  function truncateWithDots(str) {
    return str.length > 10 ? str.slice(0, 25) + "..." : str;
  }
  const styles = {
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
  const renderTags = useCallback(
    (value) => (
      <span>
        {value.length > 1 ? `${truncateWithDots(value[0]?.name || value[0]?.id || "")} +${value.length - 1}` : value.length === 1 ? truncateWithDots(value[0]?.name || value[0]?.id || "") : "Select"}
      </span>
    ),
    []
  );
  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      value={value}
      onChange={onChange}
      inputValue={inputValue}
      onInputChange={onInputChange}
      options={options}
      getOptionLabel={(option) => option?.name || option?.id || ""}
      isOptionEqualToValue={(a, b) => a?.id === b?.id}
      sx={styles}
      renderOption={(props, option, { selected }) => {
        const { key, ...rest } = props;
        return (
          <li key={key} {...rest}>
            <Checkbox style={{ marginRight: 8 }} checked={selected} />
            <ListItemText primary={option?.name || option?.id || ""} />
          </li>
        );
      }}
      renderTags={renderTags}
      renderInput={(params) => <TextField {...params} label="Select Multiple" sx={styles} error={!!error} helperText={error} />}
    />
  );
}
