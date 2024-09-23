import React from 'react';
import './styles.css'; 


const Header = () => {
    return (
        <header className="header">
            <button className="back-button" onClick={() => window.history.back()}>
                Volver
            </button>
            <h1 className="logo">PresCryption</h1>
        </header>
    );
};

export default Header;