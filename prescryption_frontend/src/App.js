import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import MainMenu from './components/MainMenu';
import Dashboard from './components/Dashboard';
import Perfil from './components/Perfil';
import EmitirReceta from './components/Prescription';
import Header from './components/Header';

function App() {
    const noHeaderRoutes = ["/"];
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
                    <Route path="/perfil/:userType" element={<Perfil />} /> {/* Ruta para el perfil */}
                    <Route path="/issue-prescription" element={<EmitirReceta />} />
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
