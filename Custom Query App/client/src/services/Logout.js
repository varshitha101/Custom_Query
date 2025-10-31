import { toast } from "react-toastify";

/**
 *  Function to handle user logout
 *  This function clears the session storage, displays a success message,
 * and navigates the user to the home page.
 * If an error occurs, it logs the error and displays an error message.
 * @param {NavigateFunction} navigate - The function to navigate to a different route.
 */
export default async function handleLogout(navigate, setIsLogoutClicked) {
  setIsLogoutClicked(true);
  try {
    sessionStorage.clear();
    localStorage.removeItem("_grecaptcha");
    toast.success("Logged out successfully");
    navigate("/");
  } catch (error) {
    console.log("error", error);
    toast.error("Logout failed, please try again.");
  } finally {
    setIsLogoutClicked(false);
  }
}
