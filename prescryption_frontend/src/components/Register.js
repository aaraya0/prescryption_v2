// src/pages/Register.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import api from "../AxiosConfig";

function Register() {
  const [formData, setFormData] = useState({
    // Para pacientes, el backend requiere insurance_name,
    // si el usuario no tiene obra social, usar "PARTICULAR".
    insurance_name: "PARTICULAR",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showError, setShowError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const userType = document.cookie
    .split("; ")
    .find((row) => row.startsWith("userType="))
    ?.split("=")[1];

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async () => {
    try {
      setShowError(false);
      setErrorMessage("");

      // Endpoint base por tipo
      let endpoint = `${process.env.REACT_APP_API_BASE_URL}/api/public/${userType}s/register`;
      let payload = { ...formData };

      if (userType === "patient") {
        // Enviar sólo lo que el backend espera y valida.
        // El backend valida insurance_name y, si no es "PARTICULAR",
        // consulta a verify_insurance y setea affiliate_num/insurance_plan adentro.
        // (No enviamos affiliate_num ni insurance_plan desde el front).
        const required = [
          "name",
          "surname",
          "nid",
          "birth_date",
          "sex",
          "insurance_name",
          "password",
          "mail",
        ];

        // Normaliza insurance_name vacío a "PARTICULAR"
        if (!payload.insurance_name) payload.insurance_name = "PARTICULAR";

        // Validación rápida en front para mejor UX
        const missing = required.filter((k) => !payload[k]);
        if (missing.length) {
          setErrorMessage(
            `Faltan campos obligatorios: ${missing.join(", ")}.`
          );
          setShowError(true);
          return;
        }

        // Limpiar cualquier campo ajeno que pudiera venir del estado anterior
        delete payload.affiliate_num;
        delete payload.insurance_plan;
      }

      if (userType === "insurance") {
        // Seguro: mapear a lo que espera tu backend público de insurance
        payload = {
          insurance_name: formData.insurance_name,
          insurance_nid: formData.insurance_nid,
          password: formData.password,
          mail: formData.mail,
        };
      }

      if (userType === "pharmacy") {
        endpoint = `${process.env.REACT_APP_API_BASE_URL}/api/public/pharmacies/register`;
        const res = await api.post(endpoint, payload);
        setVerificationCode(res.data.verificationCode || "");
        setShowSuccess(true);
        return;
      }

      if (userType === "pharmacyUser") {
        endpoint = `${process.env.REACT_APP_API_BASE_URL}/api/public/pharmacies/users/register`;
      }

      await api.post(endpoint, payload);
      setShowSuccess(true);
    } catch (error) {
      console.error("❌ Error al registrar:", error.response?.data || error);
      const backendMsg =
        error.response?.data?.message ||
        error.response?.data ||
        "Error en el registro.";
      setErrorMessage(
        typeof backendMsg === "string" ? backendMsg : "Error en el registro."
      );
      setShowError(true);
    }
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const renderFields = () => {
    switch (userType) {
      case "patient":
        return (
          <>
            <p className="inputTitle">Nombre</p>
            <input
              className="form-input"
              type="text"
              name="name"
              placeholder="Nombre"
              onChange={handleChange}
            />

            <p className="inputTitle">Apellido</p>
            <input
              className="form-input"
              type="text"
              name="surname"
              placeholder="Apellido"
              onChange={handleChange}
            />

            <p className="inputTitle">DNI</p>
            <input
              className="form-input"
              type="text"
              name="nid"
              placeholder="DNI"
              onChange={handleChange}
            />

            <div className="form-radio">
              <label className="optionsTitle">Sexo</label>
              <label>
                <input
                  type="radio"
                  name="sex"
                  value="F"
                  onChange={handleChange}
                />
                F
              </label>
              <label>
                <input
                  type="radio"
                  name="sex"
                  value="M"
                  onChange={handleChange}
                />
                M
              </label>
              <label>
                <input
                  type="radio"
                  name="sex"
                  value="X"
                  onChange={handleChange}
                />
                X
              </label>
            </div>

            <p className="inputTitle">Fecha de Nacimiento</p>
            <input
              className="form-input"
              type="date"
              name="birth_date"
              placeholder="Fecha de Nacimiento"
              onChange={handleChange}
            />

            <p className="inputTitle">Obra Social</p>
            <input
              className="form-input"
              type="text"
              name="insurance_name"
              placeholder='Ej.: "PARTICULAR", "SWISS MEDICAL", etc.'
              value={formData.insurance_name || ""}
              onChange={handleChange}
            />
            <small className="hint">
              Si no tenés obra social, dejá “PARTICULAR”. La afiliación y plan
              se verifican automáticamente en el backend si corresponde.
            </small>

            <p className="inputTitle">Correo Electrónico</p>
            <input
              className="form-input"
              type="email"
              name="mail"
              placeholder="Email"
              onChange={handleChange}
            />

            <p className="inputTitle">Contraseña</p>
            <div className="password-container-register">
              <input
                className="form-input-password-field"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Contraseña"
                onChange={handleChange}
              />
              <span
                className="eye-icon-register"
                onClick={() => setShowPassword(!showPassword)}
                title={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </span>
            </div>
          </>
        );

      case "doctor":
        return (
          <>
            <p className="inputTitle">Nombre</p>
            <input
              className="form-input"
              type="text"
              name="name"
              placeholder="Nombre"
              onChange={handleChange}
            />
            <p className="inputTitle">Apellido</p>
            <input
              className="form-input"
              type="text"
              name="surname"
              placeholder="Apellido"
              onChange={handleChange}
            />
            <p className="inputTitle">DNI</p>
            <input
              className="form-input"
              type="text"
              name="nid"
              placeholder="DNI"
              onChange={handleChange}
            />
            <p className="inputTitle">Matrícula</p>
            <input
              className="form-input"
              type="text"
              name="license"
              placeholder="Matrícula"
              onChange={handleChange}
            />
            <p className="inputTitle">Especialidad</p>
            <input
              className="form-input"
              type="text"
              name="specialty"
              placeholder="Especialidad"
              onChange={handleChange}
            />
            <p className="inputTitle">Correo Electrónico</p>
            <input
              className="form-input"
              type="email"
              name="mail"
              placeholder="Email"
              onChange={handleChange}
            />
            <p className="inputTitle">Contraseña</p>
            <div className="password-container-register">
              <input
                className="form-input-password-field"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Contraseña"
                onChange={handleChange}
              />
              <span
                className="eye-icon-register"
                onClick={() => setShowPassword(!showPassword)}
                title={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </span>
            </div>
          </>
        );

      case "insurance":
        return (
          <>
            <p className="inputTitle">Nombre de la Obra Social</p>
            <input
              className="form-input"
              type="text"
              name="insurance_name"
              placeholder="Nombre de la Obra Social"
              onChange={handleChange}
            />

            <p className="inputTitle">CUIT de la Obra Social</p>
            <input
              className="form-input"
              type="text"
              name="insurance_nid"
              placeholder="CUIT"
              onChange={handleChange}
            />

            <p className="inputTitle">Correo Electrónico</p>
            <input
              className="form-input"
              type="email"
              name="mail"
              placeholder="Email"
              onChange={handleChange}
            />

            <p className="inputTitle">Contraseña</p>
            <div className="password-container-register">
              <input
                className="form-input-password-field"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Contraseña"
                onChange={handleChange}
              />
              <span
                className="eye-icon-register"
                onClick={() => setShowPassword(!showPassword)}
                title={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </span>
            </div>
          </>
        );

      case "pharmacy":
        return (
          <>
            <p className="inputTitle">CUIT / NID de la Farmacia</p>
            <input
              className="form-input"
              type="text"
              name="nid"
              onChange={handleChange}
            />
            <p className="inputTitle">Nombre de la Farmacia</p>
            <input
              className="form-input"
              type="text"
              name="pharmacy_name"
              onChange={handleChange}
            />
            <p className="inputTitle">Correo Electrónico</p>
            <input
              className="form-input"
              type="email"
              name="mail"
              onChange={handleChange}
            />
            <p className="inputTitle">Contraseña</p>
            <div className="password-container-register">
              <input
                className="form-input-password-field"
                type={showPassword ? "text" : "password"}
                name="password"
                onChange={handleChange}
              />
              <span
                className="eye-icon-register"
                onClick={() => setShowPassword(!showPassword)}
                title={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </span>
            </div>
            <p className="inputTitle">Dirección Física</p>
            <input
              className="form-input"
              type="text"
              name="physicalAddress"
              onChange={handleChange}
            />
            <p className="inputTitle">Información de Contacto</p>
            <input
              className="form-input"
              type="text"
              name="contactInfo"
              onChange={handleChange}
            />
          </>
        );

      case "pharmacyUser":
        return (
          <>
            <p className="inputTitle">Nombre</p>
            <input
              className="form-input"
              type="text"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
            />
            <p className="inputTitle">Apellido</p>
            <input
              className="form-input"
              type="text"
              name="surname"
              value={formData.surname || ""}
              onChange={handleChange}
            />
            <p className="inputTitle">DNI</p>
            <input
              className="form-input"
              type="text"
              name="nid"
              value={formData.nid || ""}
              onChange={handleChange}
            />
            <p className="inputTitle">Matrícula</p>
            <input
              className="form-input"
              type="text"
              name="license"
              value={formData.license || ""}
              onChange={handleChange}
            />
            <p className="inputTitle">Email</p>
            <input
              className="form-input"
              type="email"
              name="email"
              value={formData.email || ""}
              onChange={handleChange}
            />
            <p className="inputTitle">Contraseña</p>
            <div className="password-container-register">
              <input
                className="form-input-password-field"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password || ""}
                onChange={handleChange}
              />
              <span
                className="eye-icon-register"
                onClick={() => setShowPassword(!showPassword)}
                title={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </span>
            </div>
            <p className="inputTitle">CUIT de la Farmacia</p>
            <input
              className="form-input"
              type="text"
              name="pharmacyNid"
              value={formData.pharmacyNid || ""}
              onChange={handleChange}
            />
            <p className="inputTitle">Código de Verificación</p>
            <input
              className="form-input"
              type="text"
              name="verificationCode"
              value={formData.verificationCode || ""}
              onChange={handleChange}
            />
          </>
        );

      default:
        return <p>Por favor, seleccioná un tipo de usuario.</p>;
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-container register-scrollable">
        <div className="form-header">
          <h2>Formulario de Registro de {userType}</h2>
        </div>

        <div className="form-body">
          {renderFields()}

          <button className="register-button" onClick={handleRegister}>
            Registrarme
          </button>

          <p>
            ¿Ya tenés una cuenta?
            <button className="login-link" onClick={handleLogin}>
              Ingresar
            </button>
          </p>
        </div>
      </div>

      {showSuccess && (
        <div className="login-success">
          <button
            className="close-button"
            onClick={() => navigate("/")}
            title="Cerrar"
          >
            ✖
          </button>
          <div className="checkmark-circle">
            <span className="checkmark">✓</span>
          </div>
          <h2>Registro exitoso</h2>

          {userType === "pharmacy" ? (
            <>
              <p>¡Farmacia registrada!</p>
              <p>Tu código de verificación es:</p>
              <code>{verificationCode}</code>
              <p>
                Guardalo para registrar a los farmacéuticos que trabajan en tu
                farmacia.
              </p>
            </>
          ) : (
            <p>Presioná la ❌ para continuar.</p>
          )}
        </div>
      )}

      {showError && (
        <div
          className="login-success"
          style={{ backgroundColor: "#fcebea", color: "#c53030" }}
        >
          <button
            className="close-button"
            onClick={() => {
              setShowError(false);
            }}
            title="Cerrar"
          >
            ✖
          </button>
          <div
            className="checkmark-circle"
            style={{ backgroundColor: "#c53030" }}
          >
            <span className="checkmark">✖</span>
          </div>
          <h2>Error en el registro</h2>
          <p>{errorMessage || "Verificá los datos ingresados."}</p>
        </div>
      )}
    </div>
  );
}

export default Register;
