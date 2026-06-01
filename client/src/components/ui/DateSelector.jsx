import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

export default function DateSelector({ value, onChange }) {
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
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker label="Start Date" value={value?.SDate || null} format="DD/MM/YYYY" onChange={(newDate) => onChange(newDate, "SDate")} maxDate={value?.LDate || null} sx={styles} />
      <DatePicker label="Last Date" value={value?.LDate || null} format="DD/MM/YYYY" onChange={(newDate) => onChange(newDate, "LDate")} minDate={value?.SDate || null} sx={styles} />
    </LocalizationProvider>
  );
}
