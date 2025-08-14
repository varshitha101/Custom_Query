import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import fs from "fs";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    https: {
      key: fs.readFileSync("./certs/192.168.1.123+3-key.pem"),
      cert: fs.readFileSync("./certs/192.168.1.123+3.pem"),
    },
    proxy: {
      "/api": {
        target: "http://192.168.1.123:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        secure: false,
      },
    },
  },
});












