// src/components/MainMenu.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./styles.css";

function MainMenu() {
  const navigate = useNavigate();

  const handleSelection = (userType) => {
    if (userType === "pharmacy") {
      // En lugar de ir directamente a /login, vamos a una pantalla intermedia:
      navigate("/pharmacy/type");
    } else {
      // Para patient, doctor, pharmacyUser y insurance, seguimos igual:
      document.cookie = `userType=${userType}; path=/`;
      navigate("/login");
    }
  };

  return (
    <div className="formUserOptions">
      <h2 className="title">Elegí el tipo de usuario</h2>
      <div className="buttons">
        <button
          className="patientButton"
          onClick={() => handleSelection("patient")}
        >
          Paciente
        </button>
        <button
          className="doctorsButton"
          onClick={() => handleSelection("doctor")}
        >
          Médico
        </button>
        <button
          className="pharmacistButton"
          onClick={() => handleSelection("pharmacy")}
        >
          Farmacia
        </button>
        <button
          className="osButton"
          onClick={() => handleSelection("insurance")}
        >
          Obra Social
        </button>
      </div>
    </div>
  );
}

export default MainMenu;
