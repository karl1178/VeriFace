import React from "react";
import { createRoot } from "react-dom/client";
import AttendancePage from "./pages/AttendancePage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ManageEmployeesPage from "./pages/ManageEmployeesPage.jsx";
import "./index.css";

const routes = {
  "/dashboard": DashboardPage,
  "/scanner": AttendancePage,
  "/register": RegisterPage,
  "/manage": ManageEmployeesPage,
};
const path = window.location.pathname === "/" ? "/scanner" : window.location.pathname;

if (path !== window.location.pathname) {
  window.history.replaceState(null, "", path);
}

const Page = routes[path] ?? AttendancePage;

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>,
);
