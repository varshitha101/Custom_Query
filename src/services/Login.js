// import axios from "axios";

export default async function handleLogin(
  userEmail,
  userPassword,
  isRememberMe,
  navigate,
  notifications
) {
  if (!userEmail || !userPassword) {
    notifications.show("Provide Email and Password", {
      severity: "error",
      autoHideDuration: 3000,
    });
    return;
  }

  try {
    if (!userEmail.endsWith("@ts.com")) {
      userEmail += "@ts.com";
    }
    navigate("/home");
    // const response = await axios.post(
    //   `${import.meta.env.VITE_BASE_SERVER_URL}/auth/login`,
    //   { userEmail, userPassword }
    // );
    // console.log(response);

    // if (response.status === 200) {
    //   notifications.show(response.data.message, {
    //     severity: "success",
    //     autoHideDuration: 3000,
    //   });
    //   sessionStorage.setItem("userUID", response.data.user);
    //   if (isRememberMe) {
    //     localStorage.setItem("userEmail", userEmail);
    //     localStorage.setItem("userPassword", userPassword);
    //     localStorage.setItem("isRememberMe", isRememberMe);
    //   } else {
    //     localStorage.clear();
    //   }
    //   navigate("/home");
    // } else {
    //   notifications.show(response.data.message, {
    //     severity: "error",
    //     autoHideDuration: 3000,
    //   });
    // }
  } catch (error) {
    console.error("Login error:", error);
    if (error.status === 401) {
      notifications.show(error.data.message, {
        severity: "error",
        autoHideDuration: 3000,
      });
    }
  }
}
