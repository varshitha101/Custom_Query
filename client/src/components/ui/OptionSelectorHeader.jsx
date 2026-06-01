import TextField from "@mui/material/TextField";

export default function OptionSelectorHeader({ id }) {
  return (
    <TextField
      sx={{
        width: 60,
        height: 60,
        "& .MuiInputBase-root": {
          height: 60,
          boxSizing: "border-box",
        },
        textAlign: "center",
      }}
      label={`Q${id + 1}`}
      disabled
      variant="outlined"
    />
  );
}
