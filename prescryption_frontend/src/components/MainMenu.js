import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import logo from "../styles/prescryption_transparent.png";
import "../styles/styles.css";

function MainMenu() {
  const navigate = useNavigate();
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  useEffect(() => {
    const expired = localStorage.getItem("sessionExpired");
    if (expired === "true") {
      setShowExpiredModal(true);
      localStorage.removeItem("sessionExpired");
    }
  }, []);

  const handleSelection = (userType) => {
    if (userType === "pharmacy") {
      navigate("/pharmacy/type");
    } else {
      document.cookie = `userType=${userType}; path=/`;
      navigate("/login");
    }
  };

  return (
    <div>
      <div className="mainMenuContainer">
        <img src={logo} alt="Prescryption Logo" className="top-right-logo" />
      </div>
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
        {/* Modal de sesión expirada */}
        <Modal
          show={showExpiredModal}
          onHide={() => setShowExpiredModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Sesión expirada</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>⚠️ Tu sesión expiró. Por favor, volvé a iniciar sesión.</p>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="primary"
              onClick={() => setShowExpiredModal(false)}
            >
              Entendido
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
}

export default MainMenu;
