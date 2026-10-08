import React from "react";
import { createRoot } from "react-dom/client";
import AttendancePage from "./pages/AttendancePage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import "./index.css";

const Page = window.location.pathname.endsWith("/dashboard.html") ? DashboardPage : AttendancePage;

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>,
);
