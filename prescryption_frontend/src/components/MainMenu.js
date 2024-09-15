import React from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css'; 

function MainMenu() {
    const navigate = useNavigate();

    const handleSelection = (userType) => {
        document.cookie = `userType=${userType}; path=/`; 
        navigate('/login'); 
    };

    return (
        <div className="formUserOptions">
            <h2 className="title">Elija su tipo de usuario</h2>
            <div className="buttons">
                <button className="patientButton" onClick={() => handleSelection('paciente')}>Paciente</button>
                <button className="doctorsButton" onClick={() => handleSelection('medico')}>Médico</button>
                <button className="pharmacistButton" onClick={() => handleSelection('farmaceutico')}>Farmacéutico</button>
                <button className="osButton" onClick={() => handleSelection('obra_social')}>Obra Social</button>
            </div>
        </div>
    );
}

export default MainMenu;
