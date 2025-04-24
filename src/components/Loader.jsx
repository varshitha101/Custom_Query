import { Box } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import * as React from "react";

export default function Loader() {
  return (
    <Box
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={0} height={0}>
        <defs>
          <linearGradient id="my_gradient">
            <stop offset="0%" stopColor="#e01cd5" />
            <stop offset="100%" stopColor="#1CB5E0" />
          </linearGradient>
        </defs>
      </svg>
      <CircularProgress
        sx={{ "svg circle": { stroke: "url(#my_gradient)" } }}
      />
    </Box>
  );
}
