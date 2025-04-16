import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Doctor from './Doctor';
import Patient from './Patient';
import Pharmacy from './Pharmacy';

function Dashboard({ userType }) {
    const navigate = useNavigate();

    // Verificar si hay un token en localStorage al cargar el componente
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('No estás autenticado. Por favor, inicia sesión.');
            navigate('/login');
        }
    }, [navigate]);

    const handleLogout = () => {
        // Eliminar el token de localStorage y cookies
        localStorage.removeItem('token');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'; // Elimina cookie de token
        navigate('/');
    };

    const renderMenu = () => {
        switch (userType) {
            case 'patient':
                return (
                    <div>
                        <Patient />
                    </div>
                );
            case 'doctor':
                return (
                    <div className="doctor-menu">
                        <Doctor userType={userType} />
                        {/* Botón para emitir receta solo para el médico */}
                        <button className="emitir-receta-btn" onClick={() => navigate('/issue-prescription')}>
                            Emitir Receta
                        </button>
                    </div>
                );
            case 'pharmacy':
                return (
                    <div>
                        <Pharmacy />
                    </div>
                );
            case 'insurance':
                return <p>Bienvenido al menú de la obra social.</p>;
            default:
                return <p>No se encontró el rol del usuario.</p>;
        }
    };

    return (
        <div>
            {/* Encabezado fijo con título, mensaje de bienvenida y botones */}
            <div className="fixed-header">
                <div className="header-text">
                    <h2>Menú de {userType}</h2>
                    <p>Bienvenido al menú del {userType === 'patient' ? 'paciente' : userType}</p>
                </div>
                
                <div className="top-right-buttons">
                    <button className="dashboard-button" onClick={() => navigate('/perfil')}>Ver Perfil</button>
                    <button className="dashboard-button" onClick={handleLogout}>Cerrar Sesión</button>
                </div>
            </div>
            
            {/* Contenido desplazable debajo del encabezado fijo */}
            <div className="content" style={{ paddingTop: '100px' }}>
                {renderMenu()}
            </div>
        </div>
    );
}

export default Dashboard;
