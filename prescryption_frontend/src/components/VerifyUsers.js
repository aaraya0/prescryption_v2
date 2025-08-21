import React, { useEffect, useState } from "react";
import api from "../AxiosConfig";
import "../styles/styles.css";

function VerifyUsers() {
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Fetch all pending insurances from backend
    const fetchPending = async () => {
      try {
        if (!token) {
          setError("❌ No estás autenticado como Admin.");
          setLoading(false);
          return;
        }

        // Call backend: GET /api/admin/insurances/pending
        const { data } = await api.get("/api/admin/insurances/pending", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Save pending list (fallback to empty if undefined)
        setPendingList(data.pending || []);
      } catch (err) {
        console.error("Error trayendo pendientes:", err);
        setError(
          err.response?.data?.message ||
            "Hubo un error al obtener las obras sociales pendientes."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPending();
  }, [token]);

  // Handle verification action for a single insurance
  const handleVerify = async (insuranceNid) => {
    try {
      await api.patch(
        `/api/admin/insurances/${insuranceNid}/verify`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
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

  if (loading) return <p className="ph-admin__msg">Cargando pendientes…</p>;
  if (error)
    return <p className="ph-admin__msg ph-admin__msg--error">{error}</p>;

  return (
    <div className="ph-admin">
      <h2 className="ph-admin__title">
        Obras Sociales Pendientes de Verificación
      </h2>

      {pendingList.length === 0 ? (
        <p className="ph-admin__msg">
          No hay obras sociales pendientes en este momento.
        </p>
      ) : (
        <div className="ph-admin__table-wrap">
          <table className="ph-admin__table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>CUIT (NID)</th>
                <th>Correo</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {pendingList.map((ins) => (
                <tr key={ins.insurance_nid}>
                  <td>{ins.insurance_name || "–"}</td>
                  <td>{ins.insurance_nid}</td>
                  <td>{ins.mail || "–"}</td>
                  <td className="ph-admin__center">
                    <button
                      className="ph-admin__btn ph-admin__btn--on ph-admin__btn--verify"
                      onClick={() => handleVerify(ins.insurance_nid)}
                      title="Verificar obra social"
                    >
                      Verificar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default VerifyUsers;
