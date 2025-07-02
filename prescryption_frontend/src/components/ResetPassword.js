import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../AxiosConfig";
import "./styles.css";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("http://localhost:3001/api/auth/reset-password", { token, newPassword });
      setMessage("✅ Contraseña actualizada correctamente.");
    } catch (err) {
      setMessage("❌ Token inválido o expirado.");
    }
  };

  return (
    <div className="formLogin">
      <h2>Ingresá tu nueva contraseña</h2>
      <form onSubmit={handleSubmit}>
        <p className="inputTitle">Nueva contraseña</p>
        <input
          className="loginInput"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button className="loginButton" type="submit">Restablecer</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default ResetPassword;
