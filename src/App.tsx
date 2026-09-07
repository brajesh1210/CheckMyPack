import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import AppFlow from "./pages/AppFlow";
import OfficerPortal from "./pages/OfficerPortal";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app/*" element={<AppFlow />} />
      <Route path="/officer" element={<OfficerPortal />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
