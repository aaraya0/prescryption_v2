import { useNavigate } from "react-router-dom";
import logo from "../styles/prescryption_transparent.png";
import "../styles/styles.css";

function MainMenu() {
  const navigate = useNavigate();

  // Handle role selection and redirect
  const handleSelection = (userType) => {
    if (userType === "pharmacy") {
      navigate("/pharmacy/type");
    } else {
      // Save selected role in cookie and go to login
      document.cookie = `userType=${userType}; path=/`;
      navigate("/login");
    }
  };

  return (
    <div>
      <div className="mainMenuContainer">
        <img
          src={logo}
          alt="Prescryption Logo"
          className="top-right-logo-menu"
        />
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
            Médica/o
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
    </div>
  );
}

export default MainMenu;
