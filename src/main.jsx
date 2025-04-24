import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import CssBaseline from "@mui/material/CssBaseline";
import { NotificationsProvider } from "@toolpad/core/useNotifications";
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <NotificationsProvider
      slotProps={{
        snackbar: {
          anchorOrigin: { vertical: "top", horizontal: "center" },
          sx: {
            maxWidth: 500,
            mx: "auto",
          },
        },
      }}
    >
      <CssBaseline />
      <App />
    </NotificationsProvider>
  </StrictMode>
);
