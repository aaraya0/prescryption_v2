import React from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';


function PharmacyType() {
    const navigate = useNavigate();

    const handleSelection = (tipo) => {
        document.cookie = `userType=${tipo}`;
        navigate('/login');
    };

    return (
        <div className="formUserOptions">
            <h2 className="title">Elegí el tipo de usuario</h2>
            <div className="buttons">
                <button className="patientButton" onClick={() => handleSelection('pharmacist')}>Usuario de Farmacia</button>
                <button className="doctorsButton" onClick={() => handleSelection('pharmacyAdmin')}>Farmacia (Administrador)</button>
            </div>
        </div>
    );
}

export default PharmacyType;
