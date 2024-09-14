import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function MainMenu() {
    const [userType, setUserType] = useState('');
    const navigate = useNavigate();

    const handleSelection = () => {
        if (userType) {
            document.cookie = `userType=${userType}; path=/`; // Guardar en cookie
            navigate('/login'); // Redirigir a la pantalla de inicio de sesión
        } else {
            alert('Por favor, selecciona un tipo de usuario.');
        }
    };

    return (
        <div>
            <h2>Seleccione el tipo de usuario</h2>
            <select value={userType} onChange={e => setUserType(e.target.value)}>
                <option value="">Selecciona...</option>
                <option value="medico">Médico</option>
                <option value="farmaceutico">Farmacéutico</option>
                <option value="paciente">Paciente</option>
                <option value="obra_social">Obra Social</option>
            </select>
            <button onClick={handleSelection}>Continuar</button>
        </div>
    );
}

export default MainMenu;
