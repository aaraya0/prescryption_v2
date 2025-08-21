import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiArrowRightCircle } from "react-icons/fi";
import api from "../AxiosConfig";
import Loader from "../components/Loader";
import "../styles/styles.css";

function Register() {
  const [formData, setFormData] = useState({});
  const [insurancePlan, setInsurancePlan] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showError, setShowError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [planHint, setPlanHint] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const userType = document.cookie
    .split("; ")
    .find((row) => row.startsWith("userType="))
    ?.split("=")[1];

  const navigate = useNavigate();
  const BASE = (process.env.REACT_APP_API_BASE_URL || "").replace(/\/+$/, "");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "insurance_name" ? value.toUpperCase() : value,
    }));
  };

  // 👉 Detectar plan (botón al lado del afiliado): usa nid + insurance_name
  const handleDetectPlan = async () => {
    try {
      setPlanHint("");
      setIsLoading(true);
      const nid = (formData.nid || "").trim();
      const insurance_name = (formData.insurance_name || "").trim();

      if (!nid || !insurance_name) {
        setPlanHint("Completá DNI y Obra Social para detectar el plan.");
        return;
      }

      const res = await fetch(`${BASE}/api/public/patients/insurance_preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nid, insurance_name }),
      });

      if (!res.ok) {
        setPlanHint(
          res.status === 404
            ? "No se encontró un plan con esos datos."
            : "No pudimos verificar el plan."
        );
        return;
      }

      const data = await res.json().catch(() => ({}));
      const plan =
        data.insurance_plan ||
        data.plan ||
        (typeof data === "string" ? data : "");
      const affiliate = data.affiliate_number ?? data.affiliate_num ?? "";

      if (plan) {
        setFormData((prev) => ({
          ...prev,
          insurance_plan: plan,
          affiliate_num: prev.affiliate_num || affiliate || prev.affiliate_num,
        }));
        setInsurancePlan(plan); // mantiene compat con modal de éxito existente
        setPlanHint("Plan detectado y completado.");
      } else {
        setPlanHint("No se encontró un plan con esos datos.");
      }
    } catch (e) {
      setPlanHint("Error al verificar el plan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setShowError(false);
      setErrorMessage("");
      setIsLoading(true);

      let payload = { ...formData };
      let endpoint = `${BASE}/api/public/${userType}s/register`;

      // 👉 Forzamos el endpoint real de pacientes
      if (userType === "patient") {
        endpoint = `${BASE}/api/public/patients/register`;
      }

      if (userType === "insurance") {
        payload = {
          insurance_name: formData.insurance_name,
          insurance_nid: formData.insurance_nid,
          password: formData.password,
          mail: formData.mail,
        };
      }

      if (userType === "pharmacy") {
        endpoint = `${BASE}/api/public/pharmacies/register`;
        const res = await api.post(endpoint, payload);
        setVerificationCode(res.data?.verificationCode || "");
        setShowSuccess(true);
        return;
      }

      if (userType === "pharmacyUser") {
        endpoint = `${BASE}/api/public/pharmacies/users/register`;
      }

      const res = await api.post(endpoint, payload);

      // ⬇️ Si es paciente, refleja plan y afiliado que resolvió el backend
      if (userType === "patient") {
        const { insurance_plan, affiliate_num } = res?.data || {};
        if (insurance_plan) setInsurancePlan(insurance_plan);
        if (insurance_plan || affiliate_num) {
          setFormData((prev) => ({
            ...prev,
            insurance_plan: insurance_plan ?? prev.insurance_plan,
            affiliate_num: affiliate_num ?? prev.affiliate_num,
          }));
        }
      }

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
    } finally {
      setIsLoading(false);
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
              onChange={handleChange}
            />

            <p className="inputTitle">Número de Afiliado</p>
            <div className="affiliate-input-container">
              <input
                className="form-input"
                type="text"
                name="affiliate_num"
                placeholder="Número de Afiliado"
                onChange={handleChange}
                value={formData.affiliate_num || ""}
              />
              <button
                type="button"
                onClick={handleDetectPlan}
                className="fetch-plan-button"
                title="Detectar plan"
              >
                <FiArrowRightCircle />
              </button>
            </div>

            <p className="inputTitle">Plan de Obra Social</p>
            <input
              className="form-input"
              type="text"
              name="insurance_plan"
              placeholder="Plan de Obra Social"
              value={formData.insurance_plan || insurancePlan || ""}
              onChange={handleChange}
              readOnly
            />
            {planHint && <div className="plan-hint">{planHint}</div>}

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
              placeholder="CUIT (11 dígitos)"
              inputMode="numeric"
              autoComplete="off"
              value={formData.insurance_nid || ""}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                setFormData((prev) => ({ ...prev, insurance_nid: digits }));
              }}
              onKeyDown={(e) => {
                if (["+", "-", "e", "E", ".", ","].includes(e.key))
                  e.preventDefault();
              }}
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
          <h2> Formulario de Registro </h2>
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
            <>
              {userType === "patient" && <p></p>}
              <p>Presioná la ❌ para continuar.</p>
            </>
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
      {isLoading && (
        <div className="loader-overlay-modal">
          <Loader mensaje="Generando receta..." />
        </div>
      )}{" "}
    </div>
  );
}

export default Register;
