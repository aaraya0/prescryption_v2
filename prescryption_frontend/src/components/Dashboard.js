import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Doctor from "./Doctor";
import Patient from "./Patient";
import PharmacyUser from "./PharmacyUser";
import Insurance from "./Insurance";
import "./styles.css";

function Dashboard() {
  const { userType } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("No estás autenticado. Por favor, inicia sesión.");
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    navigate("/");
  };

  const renderMenu = () => {
    switch (userType) {
      case "patient":
        return (
          <div>
            <Patient />
          </div>
        );
      case "doctor":
        return (
          <div className="doctor-menu">
            <Doctor userType={userType} />
            <button
              className="emitir-receta-btn"
              onClick={() => navigate("/issue-prescription")}
            >
              Emitir Receta
            </button>
          </div>
        );
      case "pharmacyUser":
      case "pharmacy":
        return (
          <div>
            <PharmacyUser />
          </div>
        );
      case "insurance":
        return (
          <div>
            <Insurance />
          </div>
        );

      case "admin":
        return (
          <div className="admin-menu-container">
            <h3 className="admin-title">Panel de Administrador</h3>
            <div className="admin-buttons-grid">
              <button
                className="admin-btn"
                onClick={() => navigate("/dashboard/admin/prescriptions")}
              >
                Recetas
              </button>

              <button
                className="admin-btn"
                onClick={() => navigate("/dashboard/admin/verify-users")}
              >
                Usuarios y Verificaciones
              </button>

              <button
                className="admin-btn"
                onClick={() => navigate("/dashboard/admin/settings")}
              >
                Configuraciones
              </button>

              <button
                className="admin-btn"
                onClick={() => navigate("/dashboard/admin/other")}
              >
                Soporte y Logs
              </button>
            </div>
          </div>
        );

      default:
        return <p>No se encontró el rol del usuario.</p>;
    }
  };

  return (
    <div>
      <div className="fixed-header">
        <div className="header-text">
          <h2>Menú de {userType}</h2>
          <p>
            Bienvenido al menú del{" "}
            {userType === "patient"
              ? "paciente"
              : userType === "doctor"
              ? "médico"
              : userType === "pharmacyUser"
              ? "farmacéutico"
              : userType === "pharmacy"
              ? "la farmacia"
              : userType === "insurance"
              ? "obra social"
              : userType === "admin"
              ? "administrador"
              : userType}
          </p>
        </div>

        <div className="top-right-buttons">
          <button
            className="dashboard-button"
            onClick={() => navigate("/perfil")}
          >
            Ver Perfil
          </button>
          <button className="dashboard-button" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="content" style={{ paddingTop: "100px" }}>
        {renderMenu()}
      </div>
    </div>
  );
}

export default Dashboard;
