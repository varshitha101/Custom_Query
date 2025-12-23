import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
export default function PhaseDateSelector({ option }) {
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
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {option === "Phase 1" ? (
        <DatePicker label="Last Date for Phase 1" format="DD/MM/YYYY" value={dayjs("2023-12-31")} sx={styles} disabled={true} />
      ) : (
        <DatePicker label="Start Date for Phase 2" format="DD/MM/YYYY" value={dayjs("2024-01-01")} sx={styles} disabled={true} />
      )}
    </LocalizationProvider>
  );
}
