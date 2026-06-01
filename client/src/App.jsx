import Loader from "./components/Loader";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ToastContainer } from "react-toastify";
const Login = lazy(() => import("./pages/Login"));
const Home = lazy(() => import("./pages/Home"));
import "./App.css"; // Import your custom CSS for toast width

export default function App() {
  return (
    <Router>
      <ToastContainer position="top-center" autoClose={1000} toastClassName="custom-toast-width" />
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
