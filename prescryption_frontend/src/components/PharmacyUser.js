import React, { useEffect, useState, useRef } from "react";
import api from "../AxiosConfig";
import Loader from "./Loader";
import { Accordion, Modal, Button, Form, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import "../styles/Pharmacy.css";
import { jwtDecode } from "jwt-decode";

const PharmacyUser = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("nid");
  const [sortOrder, setSortOrder] = useState("asc");
  const [loading, setLoading] = useState(false);
  const [finalPrices, setFinalPrices] = useState(null);
  const [invoiceVisible, setInvoiceVisible] = useState(false);
  const invoiceRef = useRef();

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const decoded = token ? jwtDecode(token) : {};
  const isAdmin = decoded.role === "admin";

  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [medOptions, setMedOptions] = useState([]);
  const [selectedMedicationId, setSelectedMedicationId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchPrescriptions = async () => {
    try {
      const response = await api.get(
        "http://localhost:3001/api/pharmacy-users/prescriptions",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPrescriptions(response.data.prescriptions || []);
    } catch (error) {
      console.error(
        "Error al obtener las recetas para el usuario de farmacia:",
        error
      );
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [token]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleOpenValidationModal = async (prescription) => {
    try {
      setLoading(true);
      console.log("Prescription data:", prescription);

      const response = await api.get(
        `http://localhost:3001/api/pharmacy-users/medications/search/${prescription.prescriptionId.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMedOptions(response.data.results);
      console.log(
        "Opciones de medicamentos después de asignar:",
        response.data.results
      );

      setSelectedPrescription(prescription);
      setShowValidationModal(true);
    } catch (error) {
      console.error("Error al obtener opciones de medicamento:", error);
    } finally {
      setLoading(false);
    }
  };

  /*const handleMedicationSelection = (medId) => {
    console.log("Medicamento seleccionado (ID):", medId);
    setSelectedMedicationId(medId);
  };*/

  const handleValidatePrescription = async (e) => {
    e.preventDefault();
    console.log(
      "Enviando validación...",
      selectedMedicationId,
      selectedPrescription
    );

    if (!selectedPrescription || !selectedMedicationId) return;

    try {
      const response = await api.post(
        "http://localhost:3001/api/pharmacy-users/validate_prescription",
        {
          prescriptionId: selectedPrescription.prescriptionId,
          selectedMedicationIds: [selectedMedicationId],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setFinalPrices(response.data.finalPrices);
      setSuccessMessage("✅ Receta validada exitosamente.");
      setTimeout(() => setSuccessMessage(""), 3000); // Se borra sola
    } catch (error) {
      console.error("❌ Error validando receta:", error);
      alert("❌ Error al validar la receta.");
    }
  };

  const handleProcessPurchase = async () => {
    if (!selectedPrescription || !finalPrices) return;

    try {
      // Mostrar info completa en el frontend
      const detailedMedications = finalPrices.map(
        ({ medication, finalPrice }) => ({
          name: medication.genericName,
          lab: medication.labName,
          presentation: medication.presentation,
          price: medication.price,
          finalPrice,
        })
      );

      // Enviar solo lo necesario al backend
      const medsToSend = finalPrices.map((item) => item.medication);
      const totalAmount = finalPrices.reduce(
        (acc, item) => acc + item.finalPrice,
        0
      );

      const response = await api.post(
        "http://localhost:3001/api/pharmacy-users/process_purchase",
        {
          prescriptionId: selectedPrescription.prescriptionId,
          selectedMedications: medsToSend,
          totalAmount,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("🧾 Receta usada y factura emitida correctamente.");
      setInvoiceVisible(true); // ✅ muestra la factura
      setShowValidationModal(false);
      setSelectedPrescription(null);
      setSelectedMedicationId("");
      // Guardar los meds detallados para mostrar en PDF
      setFinalPrices(detailedMedications);
      fetchPrescriptions();
    } catch (error) {
      console.error("❌ Error procesando la compra:", error);
      alert("❌ Error al usar y facturar la receta.");
    }
  };

  const downloadInvoice = () => {
    if (invoiceRef.current) {
      html2pdf()
        .set({ margin: 1, filename: "factura.pdf" })
        .from(invoiceRef.current)
        .save();
    }
  };

  const filteredPrescriptions = prescriptions
    .filter((prescription) => {
      if (searchType === "nid") {
        return prescription.patientNid.includes(searchTerm);
      } else if (searchType === "insurance") {
        return prescription.insurance?.insuranceName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.issueDate);
      const dateB = new Date(b.issueDate);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  const formatDate = (isoDate) => {
    if (!isoDate) return "N/A";
    const date = new Date(isoDate);
    return date.toLocaleDateString("es-AR");
  };

  return (
    <>
      <div className={`pharmacyuser-menu ${loading ? "loading" : ""}`}>
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}
        {errorMessage && <div className="error-message">{errorMessage}</div>}

        <h3 className="Title">Recetas Asignadas</h3>

        <div className="filtros-container">
          <label>
            Buscar:
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder={
                searchType === "nid"
                  ? "Ingrese NID del paciente"
                  : "Ingrese nombre de la obra social"
              }
              className="input-nid"
            />
          </label>

          <label>
            Buscar por:
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="input-nid"
            >
              <option value="nid">NID del Paciente</option>
              <option value="insurance">Obra Social</option>
            </select>
          </label>

          <label>
            Ordenar por Fecha de Emisión:
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="asc">Ascendente</option>
              <option value="desc">Descendente</option>
            </select>
          </label>

          {isAdmin && (
            <button
              className="dashboard-button"
              onClick={() => navigate("/pharmacy/manage-users")}
            >
              Gestionar Usuarios
            </button>
          )}
        </div>

        <div className="receta-scroll">
          {filteredPrescriptions.length === 0 ? (
            <p>No hay recetas asignadas aún.</p>
          ) : (
            <Accordion defaultActiveKey="">
              {filteredPrescriptions.map((prescription, index) => (
                <Accordion.Item
                  eventKey={index.toString()}
                  key={index}
                  className="receta-item"
                >
                  <Accordion.Header>
                    <div className="receta-header-info">
                      <strong>Paciente:</strong> {prescription.patientName}{" "}
                      {prescription.patientSurname}
                      <strong> DNI:</strong> {prescription.patientNid}
                      <strong> Obra Social:</strong>{" "}
                      {prescription.insurance?.insuranceName || "N/A"}
                      <strong> Fecha de Emisión:</strong>{" "}
                      {formatDate(prescription.issueDate)}
                    </div>
                  </Accordion.Header>
                  <Accordion.Body className="receta-details">
                    <p>
                      <strong>Medicamento:</strong> {prescription.meds.med1}
                    </p>
                    <p>
                      <strong>Cantidad:</strong> {prescription.meds.quantity1}
                    </p>
                    {prescription.meds.med2 !== "N/A" &&
                      prescription.meds.quantity2 > 0 && (
                        <>
                          <p>
                            <strong>Medicamento:</strong>{" "}
                            {prescription.meds.med2}
                          </p>
                          <p>
                            <strong>Cantidad:</strong>{" "}
                            {prescription.meds.quantity2}
                          </p>
                        </>
                      )}
                    <p>
                      <strong>Diagnóstico:</strong>{" "}
                      {prescription.meds.diagnosis}
                    </p>
                    {prescription.meds.observations &&
                      prescription.meds.observations.trim() !== "" && (
                        <p>
                          <strong>Observaciones:</strong>{" "}
                          {prescription.meds.observations}
                        </p>
                      )}
                    <p>
                      <strong>Estado:</strong>{" "}
                      {prescription.used ? (
                        <span className="status-dispensada">Dispensada</span>
                      ) : (
                        <span className="status-valid">Válida</span>
                      )}
                    </p>
                    <p>
                      <strong>Fecha de Expiración:</strong>{" "}
                      {formatDate(prescription.expirationDate)}
                    </p>

                    {!prescription.used && (
                      <button
                        className="validate-button"
                        onClick={() => handleOpenValidationModal(prescription)}
                      >
                        Buscar medicamentos
                      </button>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          )}
        </div>

        <Modal
          show={showValidationModal}
          onHide={() => setShowValidationModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Seleccionar Medicamento</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {medOptions.length === 0 ? (
              <p>No se encontraron medicamentos relacionados.</p>
            ) : (
              <Form onSubmit={handleValidatePrescription}>
                <div className="med-card-container">
                  {medOptions.map((med, index) => {
                    const medIdString = String(med._id || med.id);
                    const isSelected = selectedMedicationId === medIdString;

                    return (
                      <div
                        key={`${medIdString}-${index}`}
                        className={`med-card selectable-card ${
                          isSelected ? "selected" : ""
                        }`}
                        onClick={() => {
                          setSelectedMedicationId(medIdString);
                        }}
                      >
                        <Form.Check
                          type="radio"
                          name="medication"
                          value={medIdString}
                          checked={isSelected}
                          readOnly
                          style={{ display: "none" }}
                        />
                        <p className="brand-name">{med.brandName}</p>
                        <p>
                          <strong>Genérico:</strong> {med.genericName}
                        </p>
                        <p>
                          <strong>Componentes:</strong>{" "}
                          {med.activeComponentsList?.join(", ") ||
                            "No especificados"}
                        </p>
                        <p>
                          <strong>Precio:</strong> ${med.price}
                        </p>
                        <p>
                          <strong>Precio PAMI:</strong>{" "}
                          {med.pamiPrice > 0
                            ? `$${med.pamiPrice}`
                            : "No especificado"}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <Button type="submit" className="validate-button-rosa">
                  Validar con Obra Social
                </Button>

                {finalPrices && (
                  <Button
                    className="mt-2"
                    variant="success"
                    onClick={handleProcessPurchase}
                  >
                    Usar y Facturar receta
                  </Button>
                )}
              </Form>
            )}
          </Modal.Body>
        </Modal>
        {invoiceVisible && finalPrices && selectedPrescription && (
          <div className="invoice-preview">
            <div ref={invoiceRef} className="invoice-content">
              <h4>Factura de Receta</h4>
              <p>
                <strong>Paciente:</strong> {selectedPrescription.patientName}{" "}
                {selectedPrescription.patientSurname}
              </p>
              <p>
                <strong>NID:</strong> {selectedPrescription.patientNid}
              </p>
              <p>
                <strong>Fecha:</strong> {formatDate(new Date())}
              </p>
              <hr />
              {finalPrices.map((item, i) => (
                <p key={i}>
                  {item.medication.genericName} - ${item.finalPrice}
                </p>
              ))}
              <p>
                <strong>Total:</strong> $
                {finalPrices.reduce((acc, item) => acc + item.finalPrice, 0)}
              </p>
            </div>
            <Button onClick={downloadInvoice} className="mt-2">
              Descargar PDF
            </Button>
          </div>
        )}
      </div>
      {loading && <Loader mensaje="Buscando opciones disponibles..." />}
    </>
  );
};

export default PharmacyUser;
