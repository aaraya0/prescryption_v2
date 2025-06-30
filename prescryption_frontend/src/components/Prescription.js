import React, { useState } from "react";
import api from "../AxiosConfig";
import { useNavigate } from "react-router-dom";
import MedicationAutocomplete from "./MedicationAutocomplete";
import "./styles.css";

function EmitirReceta() {
  const [formData, setFormData] = useState({
    patientName: "",
    patientSurname: "",
    patientNid: "",
    affiliateNum: "",
    insuranceName: "",
    insurancePlan: "",
    quantity1: "",
    quantity2: "",
    diagnosis: "",
    observations: "",
  });

  const [med1, setMed1] = useState(null);
  const [med2, setMed2] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearchPatient = async () => {
    console.log("Buscando paciente con NID:", formData.patientNid);
    const token = localStorage.getItem("token");
    if (!token) {
      alert("No estás autenticado. Por favor, inicia sesión nuevamente.");
      return;
    }

    try {
      const response = await api.get(
        `http://localhost:3001/api/doctors/patients/${formData.patientNid}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const patientData = response.data.profile;

      setFormData((prev) => ({
        ...prev,
        patientName: patientData.name || "",
        patientSurname: patientData.surname || "",
        affiliateNum: patientData.affiliate_num || "",
        insuranceName: patientData.insurance_name || "",
        insurancePlan: patientData.insurance_plan || "",
      }));
    } catch (error) {
      console.error("Error al buscar datos del paciente:", error);
      alert("Paciente no encontrado.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("No estás autenticado. Por favor, inicia sesión nuevamente.");
      return;
    }

    const {
      patientName,
      patientSurname,
      patientNid,
      affiliateNum,
      insuranceName,
      insurancePlan,
      quantity1,
      quantity2,
      diagnosis,
      observations,
    } = formData;

    if (
      !patientName ||
      !patientSurname ||
      !patientNid ||
      !affiliateNum ||
      !insuranceName ||
      !insurancePlan ||
      !med1 ||
      !quantity1 ||
      !diagnosis
    ) {
      alert("Por favor, completa todos los campos obligatorios.");
      return;
    }

    try {
      await api.post(
        "http://localhost:3001/api/prescriptions/issue",
        {
          ...formData,
          med1,
          med2: med2 || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage({ text: "Receta emitida con éxito", type: "success" });

      setTimeout(() => {
        setMessage({ text: "", type: "" });
        navigate("/dashboard/doctor");
      }, 1500);
    } catch (error) {
      console.error("Error al emitir la receta:", error);
      setMessage({ text: "Error al emitir la receta.", type: "error" });

      setTimeout(() => {
        setMessage({ text: "", type: "" });
      }, 4000);
    }
  };

  return (
    <div className="receta-container">
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="receipt_left">
            <div className="form-group">
              <label>DNI del paciente</label>
              <div style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="text"
                  name="patientNid"
                  placeholder="DNI (sin puntos)"
                  onChange={handleChange}
                  value={formData.patientNid}
                  required
                />
                <button
                  onClick={handleSearchPatient}
                  className="search-patient-button"
                  title="Buscar paciente"
                  type="button"
                >
                  🔍
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Nombre(s)</label>
              <input
                type="text"
                name="patientName"
                value={formData.patientName}
                onChange={handleChange}
                readOnly
                required
              />
            </div>
            <div className="form-group">
              <label>Apellido(s)</label>
              <input
                type="text"
                name="patientSurname"
                value={formData.patientSurname}
                onChange={handleChange}
                readOnly
                required
              />
            </div>
            <div className="form-group">
              <label>Número de Afiliado</label>
              <input
                type="text"
                name="affiliateNum"
                value={formData.affiliateNum}
                onChange={handleChange}
                readOnly
                required
              />
            </div>
            <div className="form-group">
              <label>Obra Social</label>
              <input
                type="text"
                name="insuranceName"
                value={formData.insuranceName}
                onChange={handleChange}
                readOnly
                required
              />
            </div>
            <div className="form-group">
              <label>Plan de Obra Social</label>
              <input
                type="text"
                name="insurancePlan"
                value={formData.insurancePlan}
                onChange={handleChange}
                readOnly
                required
              />
            </div>
          </div>

          <div className="receipt_right">
            <MedicationAutocomplete label="Medicamento 1" onMedicationSelected={setMed1} />
            <input
              type="number"
              name="quantity1"
              placeholder="Cantidad"
              onChange={handleChange}
              required
            />

            <MedicationAutocomplete label="Medicamento 2 (opcional)" onMedicationSelected={setMed2} />
            <input
              type="number"
              name="quantity2"
              placeholder="Cantidad"
              onChange={handleChange}
            />

            <div className="form-group">
              <label>Diagnóstico</label>
              <textarea
                name="diagnosis"
                className="textarea"
                placeholder="Ingresar diagnóstico"
                onChange={handleChange}
                required
              ></textarea>
            </div>
            <div className="form-group">
              <label>Observaciones</label>
              <textarea
                name="observations"
                className="textarea"
                placeholder="Ingresar observaciones (opcional)"
                onChange={handleChange}
              ></textarea>
            </div>
          </div>
          <div className="buttonGenerarReceta">
            <button type="submit" className="button">
              Generar Receta
            </button>
          </div>
        </form>
      </div>

      {message.text && (
        <>
          {message.type === "success" && <div className="notification-backdrop"></div>}
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
        <h2>¡Éxito!</h2>
        <p>{message}</p>
      </div>
    );
  }

  return <div className={`notification ${type}`}>{message}</div>;
}

export default EmitirReceta;
