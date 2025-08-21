import { useState, useEffect } from "react";
import api from "../AxiosConfig";
import Loader from "../components/Loader";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaTrashAlt } from "react-icons/fa";
import "../styles/styles.css";

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
  const [isLoading, setIsLoading] = useState(false);

  const [med1, setMed1] = useState(null);
  const [med2, setMed2] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });

  const navigate = useNavigate();

  // Restore saved form and medication data from localStorage when returning from search
  useEffect(() => {
    const med1Saved = localStorage.getItem("med1");
    const med2Saved = localStorage.getItem("med2");
    const savedFormData = localStorage.getItem("formData");

    if (med1Saved) {
      setMed1(JSON.parse(med1Saved));
      localStorage.removeItem("med1");
    }

    if (med2Saved) {
      setMed2(JSON.parse(med2Saved));
      localStorage.removeItem("med2");
    }

    if (savedFormData) {
      setFormData(JSON.parse(savedFormData));
      localStorage.removeItem("formData");
    }
  }, []);

  // Navigate to medication search page and save current form state
  const handleGoToSearch = (campo) => {
    const updatedFormData = { ...formData };

    updatedFormData.quantity1 =
      document.querySelector('input[name="quantity1"]')?.value || "";
    updatedFormData.quantity2 =
      document.querySelector('input[name="quantity2"]')?.value || "";
    updatedFormData.diagnosis =
      document.querySelector('textarea[name="diagnosis"]')?.value || "";
    updatedFormData.observations =
      document.querySelector('textarea[name="observations"]')?.value || "";

    localStorage.setItem("formData", JSON.stringify(updatedFormData));
    if (med1) localStorage.setItem("med1", JSON.stringify(med1));
    if (med2) localStorage.setItem("med2", JSON.stringify(med2));

    navigate(`/buscar-medicamento?campo=${campo}`);
  };

  // Handle input changes and restrict medication quantities between 1 and 2
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "quantity1" || name === "quantity2") {
      let num = Number(value);

      if (num > 2) num = 2;
      if (num < 1 && value !== "") num = 1;

      setFormData({
        ...formData,
        [name]: value === "" ? "" : num,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Fetch patient information from API by DNI (NID)
  const handleSearchPatient = async () => {
    console.log("Buscando paciente con NID:", formData.patientNid);
    const token = localStorage.getItem("token");
    if (!token) {
      alert("No estás autenticado. Por favor, inicia sesión nuevamente.");
      return;
    }

    try {
      const response = await api.get(
        `/api/doctors/patients/${formData.patientNid}`,
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

  // Submit prescription to API after validation
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
      diagnosis,
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
      setIsLoading(true);
      await api.post(
        "/api/prescriptions/issue",
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="receta-container">
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="receipt_left">
            <div className="form-group">
              <label>DNI del paciente</label>
              <div className="dni-search-container">
                <input
                  type="text"
                  name="patientNid"
                  placeholder="DNI (sin puntos)"
                  onChange={handleChange}
                  value={formData.patientNid}
                  required
                  inputMode="numeric"
                  pattern="\d*"
                  aria-label="DNI del paciente"
                />
                <button
                  onClick={handleSearchPatient}
                  className="search-patient-button"
                  title="Buscar paciente"
                  type="button"
                >
                  <FaSearch />
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
            <div className="medication-block">
              <label>Medicamento 1</label>
              {!med1 ? (
                <button
                  type="button"
                  className="BuscarMedButton"
                  onClick={() => handleGoToSearch("med1")}
                >
                  Buscar Medicamento
                </button>
              ) : (
                <div className="medication-selection">
                  <div className="med-formatted">
                    <p style={{ marginBottom: 2 }}>
                      <strong>{med1.brandName}</strong>
                      {med1.details?.laboratory &&
                        ` (${med1.details.laboratory})`}
                    </p>
                    <p style={{ marginTop: 0 }}>
                      {Array.isArray(med1.activeComponentsList)
                        ? med1.activeComponentsList.join("+")
                        : med1.activeComponentsList}
                      {med1.details?.presentation &&
                        `, ${med1.details.presentation}`}
                      {med1.details?.power && ` - (${med1.details.power})`}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="trash-button"
                    onClick={() => setMed1(null)}
                    title="Eliminar medicamento"
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              )}

              <input
                type="number"
                name="quantity1"
                placeholder="Cantidad"
                onChange={handleChange}
                value={formData.quantity1}
                required
                min="1"
                max="2"
              />
            </div>
            <div className="medication-block">
              <label>Medicamento 2</label>
              {!med2 ? (
                <button
                  type="button"
                  className="BuscarMedButton"
                  onClick={() => handleGoToSearch("med2")}
                >
                  Buscar Medicamento
                </button>
              ) : (
                <div className="medication-selection">
                  <div className="med-formatted">
                    <p style={{ marginBottom: 2 }}>
                      <strong>{med2.brandName}</strong>
                      {med2.details?.laboratory &&
                        `, ${med2.details.laboratory}`}
                    </p>
                    <p style={{ marginTop: 0 }}>
                      {Array.isArray(med2.activeComponentsList)
                        ? med2.activeComponentsList.join("+")
                        : med2.activeComponentsList}
                      {med2.details?.presentation &&
                        `, ${med2.details.presentation}`}
                      {med2.details?.power && ` - (${med2.details.power})`}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="trash-button"
                    onClick={() => setMed2(null)}
                    title="Eliminar medicamento"
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              )}

              <input
                type="number"
                name="quantity2"
                placeholder="Cantidad"
                onChange={handleChange}
                value={formData.quantity2}
                min="1"
                max="2"
              />
            </div>
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
          {message.type === "success" && (
            <div className="notification-backdrop"></div>
          )}
          <Notification message={message.text} type={message.type} />
        </>
      )}
      {/* Loading overlay */}
      {isLoading && (
        <div className="loader-overlay-modal">
          <Loader mensaje="Generando receta..." />
        </div>
      )}{" "}
    </div>
  );
}

// Reusable Notification component
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
