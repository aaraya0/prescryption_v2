import React, { useEffect, useState } from "react";
import apii from "../AxiosConfig";
import { FaUser, FaToggleOn, FaToggleOff } from "react-icons/fa";
import "../styles/Pharmacy.css";

const PharmacyAdmin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const api = apii.create({
    baseURL: "http://localhost:3001/api/pharmacies",
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/users");
        setUsers(data);
      } catch {
        setError("No se pudo cargar la lista de usuarios");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleUser = async (id, active) => {
    const action = active ? "deactivate" : "activate";
    try {
      await api.patch(`/users/${id}/${action}`);
      setUsers(
        users.map((u) => (u._id === id ? { ...u, isActive: !active } : u))
      );
    } catch {
      alert("Error al cambiar estado del usuario");
    }
  };

  if (loading) return <p className="ph-admin__msg">Cargando usuarios…</p>;
  if (error)
    return <p className="ph-admin__msg ph-admin__msg--error">{error}</p>;

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
