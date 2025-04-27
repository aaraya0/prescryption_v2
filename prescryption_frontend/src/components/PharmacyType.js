import React from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';


const PharmacyType = () => {
    const navigate = useNavigate();

    const handleSelect = (type) => {
        if (type === 'user') {
            document.cookie = `userType=pharmacyUser; path=/;`;
        } else if (type === 'admin') {
            document.cookie = `userType=pharmacy; path=/;`;
        }
        navigate('/login');
    };

    return (
        <div className="formUserOptions">
            <h2 className="title">Elegí el tipo de usuario</h2>
            <div className="buttons">
            <button className="patientButton" onClick={() => handleSelect('user')}>
                    Usuario de Farmacia
                </button>
                <button className="osButton" onClick={() => handleSelect('admin')}>
                    Farmacia (Administrador)
                </button>
            </div>
        </div>
    );
}

export default PharmacyType;



