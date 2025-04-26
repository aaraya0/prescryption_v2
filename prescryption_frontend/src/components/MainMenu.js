import React from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css'; 

function MainMenu() {
    const navigate = useNavigate();

    const handleSelection = (userType) => {
        if (userType === 'pharmacySelection') {
            navigate('/pharmacy/type');
            
        } else {
            document.cookie = `userType=${userType}`;
            navigate('/login');
        }
    };

    return (
        <div className="formUserOptions">
            <h2 className="title">Elegí el tipo de usuario</h2>
            <div className="buttons">
                <button className="patientButton" onClick={() => handleSelection('patient')}>Paciente</button>
                <button className="doctorsButton" onClick={() => handleSelection('doctor')}>Médico</button>
                <button className="pharmacistButton" onClick={() => handleSelection('pharmacySelection')}>Farmacia</button>
                <button className="osButton" onClick={() => handleSelection('insurance')}>Obra Social</button>
            </div>
        </div>
    );
}

export default MainMenu;
