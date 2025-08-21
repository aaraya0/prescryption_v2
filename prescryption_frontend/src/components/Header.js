import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/styles.css";
import logo from "../styles/prescryption_transparent.png";
import { FaArrowLeft } from "react-icons/fa";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Handle back navigation depending on current path
  const handleBackClick = () => {
    if (location.pathname === "/login" || location.pathname === "/register") {
      // From login/register → go back to main menu
      navigate("/");
    } else if (location.pathname === "/issue-prescription") {
      // From issue-prescription → go back to doctor dashboard
      navigate("/dashboard/doctor");
    } else {
      window.history.back();
    }
  };

  return (
    <header className="header">
      <button className="back-button-aesthetic" onClick={handleBackClick}>
        <FaArrowLeft className="back-icon" /> Volver
      </button>
      <div className="mainMenuContainer">
        <img src={logo} alt="Prescryption Logo" className="top-right-logo" />
      </div>
    </header>
  );
};

export default Header;
