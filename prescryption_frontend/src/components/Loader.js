import React from "react";
import "../styles/styles.css";
import logo from "../styles/prescryption_transparent.png";

const Loader = () => {
  return (
    <div className="custom-loader-overlay">
      <img src={logo} alt="Prescryption Logo" className="loader-logo" />
    </div>
  );
};

export default Loader;
