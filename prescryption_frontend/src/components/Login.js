import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../AxiosConfig";
import Loader from "./Loader";
import { FiEye, FiEyeOff } from "react-icons/fi";
import "../styles/styles.css";

function Login() {
  const [nid, setNid] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/login/admin") {
      setUserType("admin");
      document.cookie = "userType=admin; path=/";
    } else {
      const cookieType = document.cookie
        .split("; ")
        .find((row) => row.startsWith("userType="))
        ?.split("=")[1];

      if (!cookieType) {
        setMessage({
          text: "No se seleccionó un tipo de usuario. Volvé al menú principal.",
          type: "error",
        });
        setTimeout(() => navigate("/"), 1500);
      } else {
        setUserType(cookieType);
      }
    }
  }, [location.pathname, navigate]);

  const userTypeMap = {
    patient: "Iniciar Sesión como Paciente",
    doctor: "¡Que bueno tenerte de vuelta!",
    pharmacist: "Iniciar Sesión como Farmacéutico",
    pharmacy: "Iniciar Sesión como Farmacia (Administrador)",
    insurance: "Iniciar Sesión como Obra Social",
    admin: "Iniciar Sesión como Administrador",
  };

  const displayUserType = userTypeMap[userType] || "Iniciar Sesión";

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      if (userType === "admin") {
        const response = await api.post(
          "http://localhost:3001/api/public/admin/login",
          { nid, password },
          { headers: { "Content-Type": "application/json" } }
        );
        const token = response.data.token;
        localStorage.setItem("token", token);
        setMessage({ text: "Login exitoso (Admin)", type: "success" });
        setTimeout(() => {
          setIsLoading(false);
          navigate("/dashboard/admin");
        }, 800);
        return;
      }
      const response = await api.post("http://localhost:3001/api/auth/login", {
        nid,
        password,
        userType,
      });

      const token = response.data.token;
      localStorage.setItem("token", token);
      document.cookie = `userType=${userType}; path=/`;
      setMessage({ text: "Login exitoso", type: "success" });

      setTimeout(() => {
        setIsLoading(false);
        navigate(`/dashboard/${userType}`);
      }, 1000);
    } catch (error) {
      setIsLoading(false);
      if (error.response && error.response.status === 429) {
        setMessage({
          text: "Has excedido el número de intentos. Esperá 15 minutos.",
          type: "error",
        });
      } else if (error.response && error.response.status === 401) {
        setMessage({
          text: "Credenciales inválidas. Verificá tu DNI y contraseña.",
          type: "error",
        });
      } else {
        console.error(error);
        setMessage({
          text: "Hubo un error en el servidor. Intentalo más tarde.",
          type: "error",
        });
      }

      setTimeout(() => {
        setMessage({ text: "", type: "" });
      }, 4000);
    }
  };

  const handleRegister = () => {
    navigate("/register");
  };

  if (isLoading) {
    return <Loader mensaje="Ingresando..." />;
  }

  return (
    <div className="formLogin">
      <h2 className="loginTitle">{displayUserType}</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
      >
        <p className="inputTitle">DNI</p>
        <input
          className="loginInput"
          type="text"
          placeholder="DNI (sin puntos)"
          value={nid}
          onChange={(e) => setNid(e.target.value)}
        />

        <p className="inputTitle">Contraseña</p>

        <div className="password-container">
          <input
            className="loginInput password-field"
            type={showPassword ? "text" : "password"}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span
            className="eye-icon"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </span>
        </div>

        <button className="loginButton" type="submit">
          Ingresar
        </button>
      </form>
      <button
        className="RecordarButton"
        onClick={() => navigate("/forgot-password", { state: { userType } })}
      >
        Recordar Contraseña
      </button>

      {(userType === "patient" ||
        userType === "doctor" ||
        userType === "insurance") && (
        <p>
          ¿No tenés una cuenta?{" "}
          <button className="RegistrateButton" onClick={handleRegister}>
            Registrate
          </button>
        </p>
      )}
      {(userType === "pharmacyUser" || userType === "pharmacy") && (
        <>
          <p className="TextoRegistrateButton">
            ¿Tu farmacia aún no está registrada?
          </p>
          <button
            className="RegistrateButton"
            onClick={() => {
              document.cookie = "userType=pharmacy; path=/";
              navigate("/register");
            }}
          >
            Registrar farmacia
          </button>

          <p className="TextoRegistrateButton">
            ¿Todavía no te registraste y sos farmacéutico?
          </p>
          <button
            className="RegistrateButton"
            onClick={() => navigate("/register")}
          >
            Registrate como usuario
          </button>
        </>
      )}

      {message.text && (
        <>
          {message.type === "success" && (
            <div className="notification-backdrop"></div>
          )}
          <Notification message={message.text} type={message.type} />
        </>
      )}
    </div>
  );
}

function Notification({ message, type }) {
  if (type === "success") {
    return (
      <div className="login-success">
        <div className="checkmark-circle">
          <span className="checkmark">&#10003;</span>
        </div>
        <h2>¡Bienvenido!</h2>
        <p>{message}</p>
      </div>
    );
  }

  return <div className={`notification ${type}`}>{message}</div>;
}

export default Login;
