import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/styles.css";

// Component for selecting pharmacy login type (Admin or Pharmacist)
function PharmacyTypeSelection() {
  const navigate = useNavigate();

  // Handle login as Pharmacy (Admin)
  const handleAdminLogin = () => {
    document.cookie = "userType=pharmacy; path=/";
    navigate("/login");
  };

  // Handle login as Pharmacist (User of a pharmacy)
  const handleUserLogin = () => {
    document.cookie = "userType=pharmacyUser; path=/";
    navigate("/login");
  };

  return (
    <div className="pharmacy-type-page">
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
    </div>
  );
}

export default PharmacyTypeSelection;
