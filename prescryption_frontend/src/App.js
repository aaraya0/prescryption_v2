import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import MainMenu from './components/MainMenu';
import Dashboard from './components/Dashboard';
import EmitirReceta from './components/Prescription';
import PrescriptionValidation from './components/PrescriptionValidation';
import Header from './components/Header';
import PatientProfile from './components/patientProfile';

function App() {
    const noHeaderRoutes = ["/", "/dashboard/patient", "/dashboard/doctor", "/dashboard/pharmacy", "/dashboard/insurance"];

    return (
        <Router>
            <div>
                <ConditionalHeader noHeaderRoutes={noHeaderRoutes} />
            </div>
            <div className="App">
                <Routes>
                    <Route path="/" element={<MainMenu />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard/patient" element={<Dashboard userType="patient" />} />
                    <Route path="/dashboard/doctor" element={<Dashboard userType="doctor" />} />
                    <Route path="/dashboard/pharmacy" element={<Dashboard userType="pharmacy" />} />
                    <Route path="/dashboard/insurance" element={<Dashboard userType="insurance" />} />
                    <Route path="/perfil/patient" element={<PatientProfile />} />
                    <Route path="/issue-prescription" element={<EmitirReceta />} />
                    <Route path="/validate-prescription" element={<PrescriptionValidation />} />
                </Routes>
            </div>
        </Router>
    );
}

function ConditionalHeader({ noHeaderRoutes }) {
    const location = useLocation();

    // Verifica si la ruta actual está en el arreglo noHeaderRoutes
    const shouldShowHeader = !noHeaderRoutes.includes(location.pathname);

    return shouldShowHeader ? <Header /> : null;
}

export default App;
