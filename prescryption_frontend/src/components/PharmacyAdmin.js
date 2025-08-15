import React, { useEffect, useState } from "react";
import api from "../AxiosConfig"; // instancia global con baseURL desde .env y token por interceptor
import { FaUser, FaToggleOn, FaToggleOff } from "react-icons/fa";
import "../styles/Pharmacy.css";

const PH_BASE = "/api/pharmacies"; // prefijo de endpoints para este módulo

const PharmacyAdmin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`${PH_BASE}/users`);
        setUsers(data);
      } catch (e) {
        console.error("❌ No se pudo cargar la lista de usuarios:", e);
        setError("No se pudo cargar la lista de usuarios");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleUser = async (id, active) => {
    const action = active ? "deactivate" : "activate";
    try {
      await api.patch(`${PH_BASE}/users/${id}/${action}`);
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, isActive: !active } : u))
      );
    } catch (e) {
      console.error("❌ Error al cambiar estado del usuario:", e);
      alert("Error al cambiar estado del usuario");
    }
  };

  if (loading) return <p className="ph-admin__msg">Cargando usuarios…</p>;
  if (error) return <p className="ph-admin__msg ph-admin__msg--error">{error}</p>;

  return (
    <div className="ph-admin">
      <h2 className="ph-admin__title">Gestión de Usuarios de Farmacia</h2>
      {users.length === 0 ? (
        <p className="ph-admin__msg">No hay usuarios registrados.</p>
      ) : (
        <div className="ph-admin__table-wrap">
          <table className="ph-admin__table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>DNI</th>
                <th>Correo Electrónico</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    {u.name} {u.surname}
                  </td>
                  <td>{u.nid}</td>
                  <td>{u.email}</td>
                  <td className="ph-admin__center">
                    <button
                      className={`ph-admin__btn ${
                        u.isActive ? "ph-admin__btn--off" : "ph-admin__btn--on"
                      }`}
                      onClick={() => toggleUser(u._id, u.isActive)}
                    >
                      {u.isActive ? "Desactivar" : "Activar"}
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
};

export default PharmacyAdmin;
