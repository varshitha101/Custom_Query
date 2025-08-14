import axios from "axios";
import { toast } from "react-toastify";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

import maskPhoneNumber from "../utils/MaskPhoneNubmber";
import { auth } from "./utils/firebase";

/**
 * Function to handle user login
 * This function performs the following actions:
 * 1. Validates user input (email and password).
 * 2. Sends a login request to the server.
 * 3. Handles the response from the server:
 *  - If login is successful, it stores user information in session storage and navigates to the home page.
 *  - If OTP verification is required, it sets up the phone number for OTP and initiates the Firebase phone authentication process.
 * 4. Handles errors during the login process and displays appropriate messages to the user.
 *
 * @param {string} userEmail - The user's email address.
 * @param {string} userPassword - The user's password.
 * @param {boolean} setIsSubmitClick - State to indicate if the submit button is clicked.
 * @param {boolean} setShowOtpDialog - State to control the visibility of the OTP dialog.
 * @param {string} setPhoneNumber - State to set the user's phone number for OTP verification.
 * @param {boolean} setConfirmationResult - State to store the confirmation result from Firebase phone authentication.
 * @param {boolean} setIsSucessfullSigninwithPhoneNumber - State to indicate if the phone number sign-in was successful.
 * @param {boolean} isRememberMe - State to indicate if the user wants to be remembered (stay logged in).
 * @param {NavigateFunction} navigate - The function to navigate to a different route after login.
 * @param {string} winID - The unique identifier for the user's session or window.
 * @param {string} setUserUID - State to set the user's unique identifier (UID) after successful login.
 * @returns
 */
export default async function handleLogin(
  userEmail,
  userPassword,
  setIsSubmitClick,
  setShowOtpDialog,
  setPhoneNumber,
  setConfirmationResult,
  setIsSucessfullSigninwithPhoneNumber,
  isRememberMe,
  navigate,
  userWinID,
  setUserUID
) {
  if (!userEmail || !userPassword) {
    toast.error("Please enter both email and password.");
    return;
  }

  try {
    setIsSubmitClick(true);
    let fullUserEmail = "";
    if (!userEmail.endsWith("@ts.com")) {
      fullUserEmail = userEmail + "@ts.com";
    } else {
      fullUserEmail = userEmail;
    }

    const response = await axios.post(`${import.meta.env.VITE_BASE_SERVER_URL}/auth/login`, { fullUserEmail, userPassword, userWinID });
    console.log("response", response);
    if (response.status === 200) {
      setUserUID(response.data.user);
      sessionStorage.setItem("userUID", response.data.user);
      if (response.data.message === "User authenticated successfully") {
        localStorage.setItem("winID", userWinID);
        toast.success("Login successful!");
        if (isRememberMe) {
          localStorage.setItem("userEmail", userEmail);
          localStorage.setItem("userPassword", userPassword);
          localStorage.setItem("isRememberMe", "true");
        }

        setIsSubmitClick(false);
        setShowOtpDialog(false);
        navigate("/home");
      } else if (
        response.data.message === "Login time updated successfully. Please verify OTP." ||
        response.data.message === "PC identifier updated successfully. Please verify OTP." ||
        response.data.message === "Login time and PC identifier updated successfully. Please verify OTP."
      ) {
        if (!response.data.phone) {
          toast.error("Phone number not found for user. Please contact support.");
          return;
        }
        let formattedPhone = String(response.data.phone);
        if (formattedPhone && !formattedPhone.startsWith("+91")) {
          formattedPhone = "+91" + formattedPhone;
        }
        setPhoneNumber(formattedPhone);
        const phoneRegex = /^\+91\d{10}$/;
        if (!phoneRegex.test(formattedPhone)) {
          toast.error("Phone number is not valid.");
          return;
        }
        try {
          if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
              size: "invisible",
              callback: (response) => {
                console.log("Recaptcha verified: " + response);
              },
            });
          }
          const appVerifier = window.recaptchaVerifier;
          setShowOtpDialog(true);
          toast.info(`Sending OTP to ${maskPhoneNumber(formattedPhone)}`);

          try {
            console.log("auth", auth);
            console.log("Formatted Phone:", formattedPhone);
            console.log("App Verifier:", appVerifier);

            const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            console.log("Result from signInWithPhoneNumber:", result);

            if (result && result.verificationId) {
              console.log("Verification ID:", result);
              setIsSucessfullSigninwithPhoneNumber(true);
              setShowOtpDialog(true);
              toast.success("OTP sent successfully. Please check your phone.");
            }
            setConfirmationResult(result);
            console.log("Flag 4");
          } catch (error) {
            setIsSucessfullSigninwithPhoneNumber(false);
            setShowOtpDialog(false);
            toast.error("Failed to send OTP. Please try again.");
            console.error("Error during phone number sign-in:", error);
            if (error.code === "auth/too-many-requests") {
              toast.error("Too many requests. Please try again later.");
              console.error("Too many requests:", error);
              return;
            }
            if (error.code === "auth/captcha-check-failed") {
              toast.error("Captcha verification failed. Please try again.");
              console.error("Captcha verification failed:", error);
              return;
            }
          }
        } catch (error) {
          console.error("Error sending OTP:", error);
          toast.error("Failed to send OTP, please try again.");
          setShowOtpDialog(false);
          return;
        }
      }
    }
  } catch (error) {
    console.error("Login error:", error);
    if (error.status === 401) {
      toast.error("Invalid email or password.");
    } else {
      toast.error("An error occurred during login. Please try again later.");
    }
  } finally {
    setIsSubmitClick(false);
  }
}
