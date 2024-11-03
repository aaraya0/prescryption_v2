import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './styles.css';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleBackClick = () => {
        if (location.pathname === '/login' || location.pathname === '/register') {
            navigate('/'); 
        }else {
            window.history.back(); 
        }
    };

    return (
        <header className="header">
            <button className="back-button" onClick={handleBackClick}>
                Volver
            </button>
            <h1 className="logo">PresCryption</h1>
        </header>
    );
};

export default Header;
