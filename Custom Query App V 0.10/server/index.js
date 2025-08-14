import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import authRoutes from "./router/authRouter.js";
import queryRoutes from "./router/queryFetchRouter.js";

dotenv.config(); // Initialize dotenv

const app = express();

app.use(
  cors({
    origin: "*", // Allow all origins (for testing purposes)
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRoutes);
app.use("/query", queryRoutes); // Ensure this route is correct
const ipAddress = process.env.IP_ADDRESS || "localhost"; // Default to localhost if not set
const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => console.log(`Server is live on http://${ipAddress}:${port}`));
