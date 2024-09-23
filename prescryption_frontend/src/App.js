import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import MainMenu from './components/MainMenu';
import Dashboard from './components/Dashboard';
import Perfil from './components/Perfil';
import EmitirReceta from './components/Prescription';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<MainMenu />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard/paciente" element={<Dashboard userType="paciente" />} />
                    <Route path="/dashboard/medico" element={<Dashboard userType="medico" />} />
                    <Route path="/dashboard/farmaceutico" element={<Dashboard userType="farmaceutico" />} />
                    <Route path="/dashboard/obra_social" element={<Dashboard userType="obra_social" />} />
                    <Route path="/perfil/:userType" element={<Perfil />} /> {/* Ruta para el perfil */}
                    <Route path="/issue-prescription" element={<EmitirReceta />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
