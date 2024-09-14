import React from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard({ userType }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        navigate('/login');
    };

    const renderMenu = () => {
        switch (userType) {
            case 'paciente':
                return <p>Bienvenido al menú del paciente.</p>;
            case 'medico':
                return <p>Bienvenido al menú del médico.</p>;
            case 'farmaceutico':
                return <p>Bienvenido al menú del farmacéutico.</p>;
            case 'obra_social':
                return <p>Bienvenido al menú de la obra social.</p>;
            default:
                return <p>No se encontró el rol del usuario.</p>;
        }
    };

    return (
        <div>
            <h2>Dashboard {userType}</h2>
            {renderMenu()}
            <button onClick={() => navigate(`/perfil/${userType}`)}>Ver Perfil</button>
            <button onClick={handleLogout}>Cerrar Sesión</button>
        </div>
    );
}

export default Dashboard;
