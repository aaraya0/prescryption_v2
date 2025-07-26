// src/components/VerifyUsers.jsx
import React, { useEffect, useState } from "react";
import api from "../AxiosConfig";
import "../styles/styles.css";

function VerifyUsers() {
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  // 1) Fetch inicial de las obras sociales pendientes
  useEffect(() => {
    const fetchPending = async () => {
      try {
        if (!token) {
          setError("❌ No estás autenticado como Admin.");
          setLoading(false);
          return;
        }
        const response = await api.get(
          "http://localhost:3001/api/admin/insurances/pending",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        // La API responde: { pending: [ ... ] }
        setPendingList(response.data.pending || []);
      } catch (err) {
        console.error("Error trayendo pendientes:", err);
        setError(
          err.response?.data?.message ||
            "Hubo un error al obtener las Insurances pendientes."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPending();
  }, [token]);

  // 2) Función para verificar una obra social en particular
  const handleVerify = async (insuranceNid) => {
    try {
      // Llamada PATCH a /api/admin/insurances/:insurance_nid/verify
      await api.patch(
        `http://localhost:3001/api/admin/insurances/${insuranceNid}/verify`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      // Suponemos éxito, recargamos la lista
      setPendingList((prev) =>
        prev.filter((item) => item.insurance_nid !== insuranceNid)
      );
    } catch (err) {
      console.error("Error verificando Insurance:", err);
      alert(
        err.response?.data?.message ||
          "No se pudo verificar la obra social. Intenta más tarde."
      );
    }
  };

  if (loading) {
    return (
      <p className="perfil-loading">Cargando obras sociales pendientes…</p>
    );
  }
  if (error) {
    return <p className="perfil-error">{error}</p>;
  }

  return (
    <div className="verify-users-container">
      <h2>Obras Sociales Pendientes de Verificación</h2>
      {pendingList.length === 0 ? (
        <p>No hay obras sociales pendientes en este momento.</p>
      ) : (
        <ul className="pending-list">
          {pendingList.map((ins) => (
            <li key={ins.insurance_nid} className="pending-item">
              <div className="pending-details">
                <p>
                  <strong>Nombre:</strong> {ins.insurance_name || "–"}
                </p>
                <p>
                  <strong>CUIT (NID):</strong> {ins.insurance_nid}
                </p>
                <p>
                  <strong>Correo:</strong> {ins.mail}
                </p>
              </div>
              <button
                className="verify-button"
                onClick={() => handleVerify(ins.insurance_nid)}
              >
                Verificar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default VerifyUsers;
