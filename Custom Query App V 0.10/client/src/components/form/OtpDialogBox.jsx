import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import OTPInput from "../ui/OTPInput";
import maskPhoneNumber from "../../utils/MaskPhoneNubmber";

export default function OtpDialog({ open, isSucessfullSigninwithPhoneNumber, phoneNumber, onClose, onVerify, loading }) {
  const [otp, setOtp] = useState("");

  const handleVerify = () => {
    onVerify(otp, setOtp);
  };

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason !== "backdropClick") {
          onClose();
        }
      }}>
      <DialogTitle sx={{ textAlign: "center" }}>OTP Verification</DialogTitle>
      <DialogContent>
        <Box sx={{ padding: 3, gap: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Typography variant="h6">{isSucessfullSigninwithPhoneNumber ? `We have sent an OTP to ${maskPhoneNumber(phoneNumber)}` : ""}</Typography>
          <OTPInput
            value={otp}
            onChange={setOtp}
            length={6} // or whatever length you need
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleVerify} disabled={otp.length < 6 || loading}>
          {loading ? "Verifying..." : "Verify"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
