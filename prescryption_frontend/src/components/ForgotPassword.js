import React, { useState } from "react";
import api from "../AxiosConfig";
import "./styles.css";

function ForgotPassword() {
  const [nid, setNid] = useState("");
  const [userType, setUserType] = useState("patient");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("http://localhost:3001/api/auth/forgot-password", { nid, userType });
      setMessage("Si el usuario existe, se envió un mail con instrucciones.");
    } catch (err) {
      setMessage("Error al intentar enviar el correo.");
    }
  };

  return (
    <div className="formLogin">
      <h2>Recuperar contraseña</h2>
      <form onSubmit={handleSubmit}>
        <p className="inputTitle">DNI</p>
        <input className="loginInput" value={nid} onChange={(e) => setNid(e.target.value)} />

        <p className="inputTitle">Tipo de usuario</p>
        <select className="loginInput" value={userType} onChange={(e) => setUserType(e.target.value)}>
          <option value="patient">Paciente</option>
          <option value="doctor">Médico</option>
          <option value="pharmacyUser">Farmacéutico</option>
          <option value="pharmacy">Farmacia</option>
          <option value="insurance">Obra Social</option>
          <option value="admin">Administrador</option>
        </select>

        <button className="loginButton" type="submit">Enviar</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default ForgotPassword;
