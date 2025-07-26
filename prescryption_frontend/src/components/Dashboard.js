import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Doctor from "./Doctor";
import Patient from "./Patient";
import PharmacyUser from "./PharmacyUser";
import PharmacyAdmin from "./PharmacyAdmin";
import Insurance from "./Insurance";
import api from "../AxiosConfig";
import "../styles/styles.css";

function Dashboard() {
  const { userType } = useParams();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("No estás autenticado. Por favor, inicia sesión.");
      navigate("/");
      return;
    }
    const fetchNombre = async () => {
      try {
        const token = localStorage.getItem("token");
        let url;

        if (userType === "pharmacy") {
          url = "http://localhost:3001/api/pharmacies/pharmacy_profile";
        } else {
          const routeMap = {
            patient: "patients",
            doctor: "doctors",
            pharmacyUser: "pharmacy-users",
            insurance: "insurances",
            admin: "admins",
          };
          const route = routeMap[userType];
          url = `http://localhost:3001/api/${route}/profile`;
        }

        const response = await api.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const { name, pharmacy_name, insurance_name } = response.data;

        if (userType === "pharmacy") {
          setNombre(pharmacy_name);
        } else if (userType === "insurance") {
          setNombre(insurance_name);
        } else {
          setNombre(name);
        }
      } catch (err) {
        console.error("Error al obtener perfil:", err);
      }
    };

    fetchNombre();
  }, [navigate, userType]);

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
              type="button"
              className="emitir-receta-btn"
              onClick={() => navigate("/issue-prescription")}
            >
              Emitir Receta
            </button>
          </div>
        );
      case "pharmacyUser":
        return (
          <div>
            <PharmacyUser />
          </div>
        );
      case "pharmacy":
        return (
          <div>
            <PharmacyAdmin />
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
          <h2>¡Hola, {nombre || userType}!</h2>
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
