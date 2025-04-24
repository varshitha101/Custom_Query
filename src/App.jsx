import Loader from "./components/Loader";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React, { lazy, Suspense } from "react";

const Login = lazy(() => import("./pages/Login"));
const Home = lazy(() => import("./pages/Home"));

export default function App() {
  return (
    <Router basename="/Custom_Query"> {/* Add basename here */}
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </Suspense>
    </Router>
  );
}