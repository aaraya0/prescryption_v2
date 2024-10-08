import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Doctor from './Doctor';
import Patient from './Patient'; // Importamos el componente de Patient

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
        navigate('/login');
    };

    const renderMenu = () => {
        switch (userType) {
            case 'paciente':
                return (
                    <div>
                        <p>Bienvenido al menú del paciente.</p>
                        {/* Mostrar las recetas del paciente */}
                        <Patient />
                    </div>
                );
            case 'medico':
                return (
                    <div>
                        <p>Bienvenido al menú del médico.</p>
                        {/* Botón para emitir receta solo para el médico */}
                        <button onClick={() => navigate('/issue-prescription')}>Emitir Receta</button>
                        <Doctor />
                    </div>
                );
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
