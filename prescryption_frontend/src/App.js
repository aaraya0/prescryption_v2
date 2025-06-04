import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import MainMenu from "./components/MainMenu";
import PharmacyTypeSelection from "./components/PharmacyTypeSelection";
import Dashboard from "./components/Dashboard";
import EmitirReceta from "./components/Prescription";
import PrescriptionValidation from "./components/PrescriptionValidation";
import Header from "./components/Header";
import Perfil from "./components/Perfil";
import VerifyUsers from "./components/VerifyUsers";
import AdminPrescriptions from "./components/AdminPrescriptions";
import AdminSettings from "./components/AdminSettings";
import AdminLogs from "./components/AdminLogs";

function App() {
  const noHeaderRoutes = [
    "/",
    "/dashboard/patient",
    "/dashboard/doctor",
    "/dashboard/pharmacy",
    "/dashboard/pharmacyUser",
    "/dashboard/insurance",
    "/dashboard/admin",
  ];

  return (
    <Router>
      <div>
        <ConditionalHeader noHeaderRoutes={noHeaderRoutes} />
      </div>
      <div className="App">
        <Routes>
          {/* Home: elegir rol */}
          <Route path="/" element={<MainMenu />} />
          {/* Pantalla de “¿Farmacia o Farmacéutico?” */}
          <Route path="/pharmacy/type" element={<PharmacyTypeSelection />} />
          {/* Login y Register dinámico según rol */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login/admin" element={<Login />} />
          {/* Dashboard dinámico según rol */}
          <Route path="/dashboard/:userType" element={<Dashboard />} />
          {/* Perfil genérico */}
          <Route path="/perfil" element={<Perfil />} />
          {/* Rutas extra */}
          <Route path="/issue-prescription" element={<EmitirReceta />} />
          <Route
            path="/validate-prescription"
            element={<PrescriptionValidation />}
          />
          {/* Sub‐rutas de admin aquí:  */}
          <Route
            path="/dashboard/admin/prescriptions"
            element={<AdminPrescriptions />}
          />
          <Route
            path="/dashboard/admin/verify-users"
            element={<VerifyUsers />}
          />
          <Route path="/dashboard/admin/settings" element={<AdminSettings />} />
          <Route path="/dashboard/admin/other" element={<AdminLogs />} />
        </Routes>
      </div>
    </Router>
  );
}

function ConditionalHeader({ noHeaderRoutes }) {
  const location = useLocation();
  const shouldShowHeader = !noHeaderRoutes.includes(location.pathname);
  return shouldShowHeader ? <Header /> : null;
}

export default App;
