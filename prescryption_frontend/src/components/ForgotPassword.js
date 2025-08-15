import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../AxiosConfig";
import Loader from "./Loader"; // ✅ Importamos Loader
import "../styles/styles.css";

function ForgotPassword() {
  const location = useLocation();
  const initialType = location.state?.userType || ""; // Traído desde Login
  const [nid, setNid] = useState("");
  const [userType] = useState(initialType); // ✅ Lo usamos pero NO lo mostramos
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // ✅ Controlamos Loader

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nid) {
      setError("Por favor ingresá tu DNI.");
      return;
    }
    if (!userType) {
      setError("Tipo de usuario no detectado.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/api/auth/forgot-password", {
        nid,
        userType,
      });
      setMessage(
        "✅ Si el usuario existe, se envió un mail con instrucciones."
      );
      setError("");
    } catch (err) {
      console.error(err);
      setMessage("");
      setError("❌ Error al intentar enviar el correo.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loader mensaje="Enviando correo..." />;
  }

  return (
    <div className="formLogin">
      <h2 className="loginTitle">Recuperar Contraseña</h2>
      <form onSubmit={handleSubmit}>
        <p className="inputTitle">DNI</p>
        <input
          className="loginInput"
          placeholder="DNI (sin puntos)"
          value={nid}
          onChange={(e) => setNid(e.target.value)}
        />

        {/* ✅ Eliminamos el select y NO mostramos el tipo de usuario */}
        {/* userType sigue existiendo en el state y se envía al backend */}

        <button className="loginButton" type="submit">
          Enviar
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}
    </div>
  );
}

export default ForgotPassword;
