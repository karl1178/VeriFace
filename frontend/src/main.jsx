import React from "react";
import { createRoot } from "react-dom/client";
import AttendancePage from "./pages/AttendancePage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ManageEmployeesPage from "./pages/ManageEmployeesPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import AttendanceHistoryPage from "./pages/AttendanceHistoryPage.jsx";
import EmployeePerformancePage from "./pages/EmployeePerformancePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import { apiRequest } from "./api.js";
import "./index.css";

const routes = {
  "/dashboard": DashboardPage,
  "/scanner": AttendancePage,
  "/attendance": AttendanceHistoryPage,
  "/performance": EmployeePerformancePage,
  "/register": RegisterPage,
  "/manage": ManageEmployeesPage,
  "/login": LoginPage,
  "/signup": SignupPage,
  "/settings": SettingsPage,
};
const path = window.location.pathname === "/" ? "/scanner" : window.location.pathname;

if (path !== window.location.pathname) {
  window.history.replaceState(null, "", path);
}

async function bootstrap() {
  const authOnlyPaths = new Set(["/login", "/signup"]);

  if (authOnlyPaths.has(path)) {
    try {
      await apiRequest("/api/auth/me");
      if (path === "/login" || path === "/signup") {
        window.location.replace("/dashboard");
        return;
      }
    } catch {
      // Authentication pages remain accessible.
    }
  } else {
    try {
      await apiRequest("/api/auth/me");
    } catch {
      window.location.replace("/login");
      return;
    }
  }

  const Page = routes[path];
  createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <Page />
    </React.StrictMode>,
  );
}

if (!routes[path]) {
  createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <NotFoundPage />
    </React.StrictMode>,
  );
} else {
  bootstrap();
}
