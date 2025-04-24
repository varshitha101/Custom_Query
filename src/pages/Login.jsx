import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import { useNotifications } from "@toolpad/core/useNotifications";
import logo from "../assets/logo.png";
import logo2 from "../assets/logo2.png";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import handleLogin from "../services/Login";
import PersonIcon from "@mui/icons-material/Person";
import FormControlLabel from "@mui/material/FormControlLabel";

export default function Login() {
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRememberMe, setIsRememberMe] = useState(false);
  const navigate = useNavigate();
  const notifications = useNotifications();

  const handleSubmit = async (e) => {
    e.preventDefault();
    handleLogin(userEmail, userPassword, isRememberMe, navigate, notifications);
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => event.preventDefault();
  const handleMouseUpPassword = (event) => event.preventDefault();
  useEffect(() => {
    if (localStorage.getItem("isRememberMe") === "true") {
      setUserEmail(localStorage.getItem("userEmail"));
      setUserPassword(localStorage.getItem("userPassword"));
      setIsRememberMe(true);
    }
  }, []);
  return (
    <Box
      sx={{
        bgcolor: "#25b2f394",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        minHeight: "100vh",
        p: { xs: 2, md: 8 },
        gap: 4,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: { xs: "100%", md: "60%" },
        }}
      >
        <Box
          sx={{
            textAlign: "center",
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            mb: 4,
            gap: 2,
          }}
        >
          <img
            src={logo}
            alt="logo1"
            style={{ width: "90%", maxWidth: 400 }}
          />
          <img
            src={logo2}
            alt="logo2"
            style={{ width: "100%", maxWidth: 200 }}
          />
        </Box>
        <Typography
          sx={{ color: "white", fontSize: "1rem", textAlign: "justify" }}
        >
          Sri Shankara National Centre for Cancer Prevention and Research is a
          leading centre for oncology research in India and is committed to
          advancing the strategies for cancer prevention, cancer detection and
          cancer treatment to alleviate the burden of cancer across the globe.
          Under Sri Shankara Cancer Foundation, Sri Shankara National Centre for
          Cancer Prevention & Research is recognised as a Scientific &
          Industrial Research Organisation by DSIR, Government of India.
          <br />
          <br />
          "Svasthya" is a Bio-informatics platform for remote health discovery
          and delivery. Svasthya enables automation of complex clinical
          workflows along with the time coordinated bio vitals measurement.
          Svasthya enables remote review of the users vitals, context & other
          details enabling effective triaging & screening.
        </Typography>
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: { xs: "100%", md: "40%" },
          gap: 3,
          p: 4,
        }}
      >
        <FormControl fullWidth variant="outlined">
          <TextField
            label="Email"
            variant="outlined"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <PersonIcon sx={{ color: "white" }} />
                </InputAdornment>
              ),
              style: { backgroundColor: "white" },
            }}
            sx={{
              "& .MuiInputBase-root": {
                backgroundColor: "white",
              },
              "& .MuiInputLabel-root": {
                color: "black",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "black",
              },
              "& .MuiSvgIcon-root": {
                color: "black",
              },
            }}
          />
        </FormControl>

        <FormControl fullWidth variant="outlined">
          <InputLabel
            sx={{ color: "black" }}
            htmlFor="outlined-adornment-password"
          >
            Password
          </InputLabel>
          <OutlinedInput
            type={showPassword ? "text" : "password"}
            value={userPassword}
            onChange={(e) => setUserPassword(e.target.value)}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  onMouseUp={handleMouseUpPassword}
                  edge="end"
                >
                  {showPassword ? (
                    <VisibilityOff sx={{ color: "black" }} />
                  ) : (
                    <Visibility sx={{ color: "black" }} />
                  )}
                </IconButton>
              </InputAdornment>
            }
            label="Password"
            sx={{
              "& .MuiOutlinedInput-input": {
                backgroundColor: "white",
              },
              bgcolor: "white",
              "& .MuiOutlinedInput-root": {
                backgroundColor: "white",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "black",
              },
            }}
          />
        </FormControl>

        <FormControlLabel
          control={
            <Checkbox
              onClick={() => setIsRememberMe((prev) => !prev)}
              checked={isRememberMe}
              sx={{
                color: "white",
                "&.Mui-checked": { color: "white" },
              }}
            />
          }
          label="Remember Me"
          sx={{ alignSelf: "flex-start", color: "white" }}
        />
        <Button
          type="submit"
          variant="contained"
          sx={{
            bgcolor: "white",
            color: "black",
          }}
        >
          Login
        </Button>
      </Box>
    </Box>
  );
}
