export default async function handleLogout(navigate, notifications) {
  try {
    sessionStorage.clear();
    notifications.show("Sign out Successful", {
      severity: "success",
      autoHideDuration: 3000,
    });
    navigate("/");
  } catch (error) {
    console.log("error", error);
    notifications.show(`Something went wrong`, {
      severity: "error",
      autoHideDuration: 3000,
    });
  }
}
