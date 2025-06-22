import React from "react";
import "./styles.css"; // Asegurate de tener los estilos

const Loader = ({ mensaje = "Cargando datos..." }) => {
  return (
    <div className="custom-loader-overlay">
      <div className="loader-content">
        <div className="spinner" />
        <p className="custom-message">{mensaje}</p>
      </div>
    </div>
  );
};

export default Loader;
