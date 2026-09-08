import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import RoleSelect from "./pages/RoleSelect";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Complaint from "./pages/Complaint";
import Profile from "./pages/Profile";
import Scan from "./pages/Scan";
import Processing from "./pages/Processing";
import Result from "./pages/Result";
import DetailedReport from "./pages/DetailedReport";
import Guidelines from "./pages/Guidelines";
import Retake from "./pages/Retake";
import OfficerDashboard from "./pages/OfficerDashboard";
import Heatmap from "./pages/Heatmap";
import OfficerReports from "./pages/OfficerReports";
import Inspections from "./pages/Inspections";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/role" element={<RoleSelect />} />

      {/* Consumer app */}
      <Route path="/app/home" element={<Dashboard />} />
      <Route path="/app/history" element={<History />} />
      <Route path="/app/complaint" element={<Complaint />} />
      <Route path="/app/profile" element={<Profile />} />

      {/* Scan flow */}
      <Route path="/app/scan" element={<Scan />} />
      <Route path="/app/processing" element={<Processing />} />
      <Route path="/app/result" element={<Result />} />
      <Route path="/app/report" element={<DetailedReport />} />
      <Route path="/app/retake" element={<Retake />} />
      <Route path="/app/guidelines" element={<Guidelines />} />

      {/* Officer */}
      <Route path="/app/officer" element={<OfficerDashboard />} />
      <Route path="/app/inspections" element={<Inspections />} />
      <Route path="/app/heatmap" element={<Heatmap />} />
      <Route path="/app/reports" element={<OfficerReports />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
