import axios from "axios";
import { toast } from "react-toastify";

/**
 *  Function to verify Firebase OTP
 * This function performs the following actions:
 * 1. Sets the loading state to true while verifying the OTP.
 *  2. Confirms the OTP using the Firebase confirmation response.
 * 3. If the OTP is valid, it stores the user UID in session storage and displays a success message.
 * 4. If "Remember Me" is checked, it saves the user's email and password
 * to localStorage.
 * 5. Navigates the user to the home page or dashboard.
 * 6. If the OTP verification fails, it displays an error message.
 * 7. Finally, it resets the loading state and hides the OTP dialog.
 * @param {string} userEmail - The user's email address.
 * @param {string} userPassword - The user's password.
 * @param {boolean} isRememberMe - Indicates if the user wants to be remembered (stay logged in).
 * @param {string} otp - The OTP entered by the user.
 * @param {string} confirmationresponse - The confirmation response from Firebase after sending the OTP.
 * @param {boolean} setOtpLoading - State to set the loading state while verifying the OTP.
 * @param {boolean} setShowOtpDialog - State to control the visibility of the OTP dialog.
 * @param {NavigateFunction} navigate - The function to navigate to a different route after OTP verification.
 * @param {string} winID - The unique identifier for the user's session or window.
 * @param {string} userUID - The user's unique identifier (UID) after successful login.
 * @param {function} setOtp - Function to reset the OTP input field after verification.
 * @param {function} setIsSubmitClick - Function to reset the submit state after OTP verification.
 */
export default async function verifyFirebaseOtp(
  userEmail,
  userPassword,
  isRememberMe,
  otp,
  confirmationresponse,
  setOtpLoading,
  setShowOtpDialog,
  navigate,
  userWinID,
  userUID,
  setOtp,
  setIsSubmitClick
) {
  try {
    setOtpLoading(true);
    const response = await confirmationresponse.confirm(otp);
    console.log("OTP verification response:", response);

    if (response && response.user) {
      console.log(response.user.uid);
      console.log("User UID:", userUID);
      const res = await axios.post(`${import.meta.env.VITE_BASE_SERVER_URL}/auth/verify-otp`, {
        userWinID,
        userUID: userUID,
      });
      if (res.status === 200) {
        console.log("OTP verified successfully on server:", res.data);

        sessionStorage.setItem("userUID", userUID);
        console.log("User signed in successfully:", response.user);
        toast.success("OTP verified successfully. You are now logged in.");
        // Save user details to localStorage if "Remember Me" is checked
        if (isRememberMe) {
          localStorage.setItem("userEmail", userEmail);
          localStorage.setItem("userPassword", userPassword);
          localStorage.setItem("isRememberMe", "true");
        } else {
          localStorage.removeItem("userEmail");
          localStorage.removeItem("userPassword");
          localStorage.removeItem("isRememberMe");
        }
        // Navigate to the home page or dashboard
        localStorage.removeItem("_grecaptcha");
        localStorage.setItem("winID", userWinID);
        navigate("/home");
      }
    }
  } catch (error) {
    console.log("Error verifying OTP:", error);
    toast.error("Invalid OTP. Please try again.");
  } finally {
    setOtp("");
    setOtpLoading(false);
    setShowOtpDialog(false);
    setIsSubmitClick(false);
    localStorage.removeItem("_grecaptcha");
  }
}
