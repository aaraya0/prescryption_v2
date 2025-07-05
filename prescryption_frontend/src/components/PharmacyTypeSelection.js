import React from "react";
import { useNavigate } from "react-router-dom";
import "./styles.css"; // si tenés estilos generales

function PharmacyTypeSelection() {
  const navigate = useNavigate();

  const handleAdminLogin = () => {
    document.cookie = "userType=pharmacy; path=/";
    navigate("/login");
  };

  const handleUserLogin = () => {
    document.cookie = "userType=pharmacyUser; path=/";
    navigate("/login");
  };

  return (
    <div className="formUserOptions">
      <h2 className="title">Ingresar como</h2>
      <div className="buttons">
        <button className="adminButton" onClick={handleAdminLogin}>
          Farmacia
        </button>
        <button className="userButton" onClick={handleUserLogin}>
          Farmacéutico
        </button>
      </div>
    </div>
  );
}

export default PharmacyTypeSelection;
