import React, { useEffect, useState, useRef } from "react";
import api from "../AxiosConfig";
import Loader from "./Loader";
import { Accordion, Modal, Button, Form, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import "../styles/Pharmacy.css";
import { jwtDecode } from "jwt-decode";
import PrintableInvoice from "./PrintableInvoice";
import PrescriptionPDF from "./PrescriptionPDF";

const PharmacyUser = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("nid");
  const [sortOrder, setSortOrder] = useState("asc");
  const [loading, setLoading] = useState(false);
  const [finalPrices, setFinalPrices] = useState(null);
  const [invoiceVisible, setInvoiceVisible] = useState(false);
  const invoiceRef = useRef({});

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const decoded = token ? jwtDecode(token) : {};
  const isAdmin = decoded.userType === "pharmacy";
  //const validationRef = useRef();

  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [medOptions, setMedOptions] = useState([]);
  const [selectedMedicationIds, setSelectedMedicationIds] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [invoiceData, setInvoiceData] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [purchaseMessage, setPurchaseMessage] = useState({
    text: "",
    type: "",
  });
  const [isConsultaMode, setIsConsultaMode] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const fetchPrescriptions = async () => {
    try {
      const response = await api.get(
        "/api/pharmacy-users/prescriptions",
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

  const handleOpenValidationModal = async (prescription, consulta = false) => {
    let response;
    try {
      setLoading(true);
      setIsConsultaMode(consulta);
      console.log("Prescription data:", prescription);

      response = await api.get(
        `/api/pharmacy-users/medications/search/${prescription.prescriptionId.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("🧪 Recibidos del backend:", response.data.results);

      setMedOptions(Array.isArray(response.data.results) ? response.data.results : []);
      console.log(
        "Opciones de medicamentos después de asignar:",
        response.data.results
      );

      setSelectedPrescription(prescription);
      setShowValidationModal(true);
    } catch (error) {
      console.error("❌ Error al obtener opciones de medicamento:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseValidationModal = () => {
    setShowValidationModal(false);
    setFinalPrices(null);
    setSelectedMedicationIds([]);
    setMedOptions([]);
    setSelectedPrescription(null);
  };

  const handleValidatePrescription = async (e) => {
    e.preventDefault();
    console.log("Enviando validación...", selectedMedicationIds);

    if (!selectedPrescription || !selectedMedicationIds.length) {
      alert("⚠️ Debe seleccionar al menos un medicamento.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/api/pharmacy-users/validate_prescription",
        {
          prescriptionId: selectedPrescription.prescriptionId,
          selectedMedicationIds,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const normalized = Array.isArray(response.data.finalPrices)
        ? response.data.finalPrices
        : [];

      setFinalPrices(normalized);
      setSelectedPrescription((prev) => ({
        ...prev,
        finalPrices: normalized,
      }));
      setPrescriptions((prev) =>
        prev.map((p) =>
          p.prescriptionId === selectedPrescription.prescriptionId
            ? {
                ...p,
                finalPrices: normalized,
              }
            : p
        )
      );

      console.log("📦 Respuesta completa del backend:", response.data);
    } catch (error) {
      console.error("❌ Error validando receta:", error);

      const msg =
        error.response?.data?.message ||
        error.response?.data?.details ||
        "❌ Error al validar la receta.";

      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(""), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPurchase = async () => {
    if (!selectedPrescription || !finalPrices) return;

    try {
      setLoading(true);

      const medsToSend = finalPrices.map((item) => item.medication);

      const response = await api.post(
        "/api/pharmacy-users/process_purchase",
        {
          prescriptionId: selectedPrescription.prescriptionId,
          selectedMedications: medsToSend,
          totalAmount: finalPrices.reduce(
            (acc, item) => acc + Number(item.finalPrice || 0),
            0
          ),
          finalPrices,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Respuesta de la compra:", response);

      // ✅ Usamos el totalAmount real del backend
      setInvoiceData({
        ...response.data.invoice,
        totalAmount: response.data.totalAmount,
      });
      setInvoiceVisible(true);

      handleCloseValidationModal();

      // ✅ Actualizar lista de recetas localmente con datos completos
      setPrescriptions((prev) =>
        prev.map((p) =>
          p.prescriptionId === selectedPrescription.prescriptionId
            ? {
                ...p,
                used: true,
                finalPrices: response.data.finalPrices,
                invoiceNumber: response.data.invoice.invoiceNumber, // corregido
                invoiceData: {
                  ...response.data.invoice,
                  totalAmount: response.data.totalAmount,
                },
              }
            : p
        )
      );

      // ✅ Mostrar mensaje de éxito
      setPurchaseMessage({
        text: "¡La compra se procesó correctamente! Ya podés descargar el comprobante.",
        type: "success",
      });

      setTimeout(() => {
        setPurchaseMessage({ text: "", type: "" });
      }, 4000);

      fetchPrescriptions();
    } catch (error) {
      console.error("❌ Error procesando la compra:", error);
      alert("❌ Error al usar y facturar la receta.");
    } finally {
      setLoading(false);
    }
  };

  const downloadValidationProof = (prescriptionId) => {
    const element = invoiceRef.current[prescriptionId];

    if (element) {
      setTimeout(() => {
        html2pdf()
          .set({
            margin: 1,
            filename: `comprobante-validacion-${prescriptionId}.pdf`,
          })
          .from(element)
          .save();
      }, 150);
    } else {
      console.error(
        `⚠️ No se encontró el comprobante para la receta con ID ${prescriptionId}`
      );
    }
  };

  const filteredPrescriptions = prescriptions
    .filter((prescription) => {
      if (!statusFilter) return true;

      if (statusFilter === "Dispensada") return prescription.used === true;
      if (statusFilter === "Válida") return prescription.used === false;
      if (statusFilter === "Expirada")
        return new Date(prescription.expirationDate) < new Date();

      return true;
    })
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

  function formatDate(fechaISO) {
    const date = new Date(fechaISO);
    if (isNaN(date)) return "Fecha inválida";
    return date.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
  }

  const handleCancelValidation = async () => {
    try {
      setLoading(true);
      const response = await api.post(
        "/api/pharmacy-users/cancel_validation",
        { prescriptionId: selectedPrescription.prescriptionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        setShowCancelModal(false);
        setPurchaseMessage({
          text: "Se devolvió la receta al paciente",
          type: "success",
        });
        setPrescriptions((prev) =>
          prev.filter(
            (p) => p.prescriptionId !== selectedPrescription.prescriptionId
          )
        );
        fetchPrescriptions();
        setTimeout(() => setPurchaseMessage({ text: "", type: "" }), 4000);
      }
    } catch (error) {
      console.error("❌ Error cancelando validación:", error);
      alert("❌ No se pudo cancelar la validación.");
    } finally {
      setLoading(false);
    }
  };

  // Helper para formatear dinero sin romper si falta el valor
  const money = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(2) : "0.00";
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
            Filtrar por Estado:
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="Válida">Válida</option>
              <option value="Expirada">Expirada</option>
              <option value="Dispensada">Dispensada</option>
            </select>
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
                    {/* Botón principal */}
                    {!prescription.used && (
                      <button
                        className="validate-button"
                        onClick={() =>
                          handleOpenValidationModal(prescription, false)
                        }
                      >
                        Buscar medicamentos
                      </button>
                    )}

                    <div className="actions-container">
                      {/* Consultar precios */}
                      {!prescription.used && (
                        <button
                          className="consulta-button"
                          onClick={() =>
                            handleOpenValidationModal(prescription, true)
                          }
                        >
                          Consultar precios
                        </button>
                      )}

                      {/* Descargar receta */}
                      <div className="download-button-container-pharmacy-btn">
                        <PrescriptionPDF receta={prescription} />
                      </div>

                      {/* Descargar documentos */}
                      <Button
                        onClick={() => {
                          if (prescription.used) {
                            setTimeout(
                              () =>
                                downloadValidationProof(
                                  prescription.prescriptionId
                                ),
                              100
                            );
                          }
                        }}
                        className="btn btn-primary"
                        disabled={!prescription.used}
                      >
                        Descargar comprobante
                      </Button>
                      {/* Contenedor oculto para impresión */}
                      <div style={{ display: "none" }}>
                        <div
                          ref={(el) =>
                            (invoiceRef.current[prescription.prescriptionId] =
                              el)
                          }
                        >
                          <PrintableInvoice
                            prescription={prescription}
                            validationResult={prescription.finalPrices || []}
                            invoiceData={prescription.invoiceData}
                          />
                        </div>
                      </div>

                      {/* Devolver al paciente */}
                      {!prescription.used &&
                        prescription.isPendingValidation && (
                          <button
                            className="cancel-button"
                            onClick={() => {
                              setSelectedPrescription(prescription);
                              setShowCancelModal(true);
                            }}
                          >
                            Devolver al paciente
                          </button>
                        )}
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          )}
        </div>

        <Modal
          show={showValidationModal}
          onHide={handleCloseValidationModal}
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
                    const medIdString = String(med._id);
                    const isSelected =
                      selectedMedicationIds.includes(medIdString);

                    return (
                      <div
                        key={`${medIdString}-${index}`}
                        className={`med-card selectable-card ${
                          isSelected ? "selected" : ""
                        }`}
                        onClick={() => {
                          setSelectedMedicationIds((prev) =>
                            prev.includes(medIdString)
                              ? prev.filter((id) => id !== medIdString)
                              : [...prev, medIdString]
                          );
                        }}
                      >
                        <Form.Check
                          type="checkbox"
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
                          <strong>Precio:</strong> ${money(med.price)}
                        </p>
                        <p>
                          <strong>Precio PAMI:</strong>{" "}
                          {Number(med.pamiPrice) > 0
                            ? `$${money(med.pamiPrice)}`
                            : "No especificado"}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {!finalPrices && (
                  <Button type="submit" className="validate-button-rosa">
                    {isConsultaMode
                      ? "Simular validación"
                      : "Validar con Obra Social"}
                  </Button>
                )}

                {finalPrices &&
                  finalPrices.map((item, i) => {
                    const { medication = {}, finalPrice, finalCoverage } = item || {};
                    // Campos defensivos
                    const priceUnit = Number(medication.priceUnit ?? medication.price ?? 0);
                    const grossPrice = Number(item.grossPrice ?? medication.grossPrice ?? 0);
                    const final = Number(finalPrice ?? 0);
                    const descuento = Math.max(0, grossPrice - final);
                    const coverage = Number(finalCoverage ?? 0);

                    return (
                      <div key={i}>
                        <p>
                          <strong>Medicamento:</strong> {medication.brandName}
                        </p>
                        <p>
                          <strong>Presentación:</strong>{" "}
                          {medication.details?.presentation || "N/A"}
                        </p>
                        <p>
                          <strong>Laboratorio:</strong>{" "}
                          {medication.details?.laboratory || "N/A"}
                        </p>
                        <p>
                          <strong>Precio Unitario:</strong> $
                          {money(priceUnit)}
                        </p>
                        <p>
                          <strong>Precio Total:</strong> $
                          {money(grossPrice)}
                        </p>
                        <p>
                          <strong>Cobertura Obra Social:</strong>{" "}
                          {Number.isFinite(coverage) ? coverage : 0}%
                        </p>
                        <p>
                          <strong>Descuento:</strong> ${money(descuento)}
                        </p>
                        <p>
                          <strong>Precio Final (a pagar):</strong> $
                          {money(final)}
                        </p>
                        <hr />
                      </div>
                    );
                  })}

                {finalPrices &&
                  !isConsultaMode &&
                  selectedPrescription?.isPendingValidation &&
                  !selectedPrescription?.used && (
                    <>
                      <Button
                        onClick={handleProcessPurchase}
                        className="btn btn-success mt-2"
                      >
                        Usar y Facturar receta
                      </Button>
                    </>
                  )}
              </Form>
            )}
          </Modal.Body>
        </Modal>
      </div>
      <Modal
        show={showCancelModal}
        onHide={() => setShowCancelModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirmar devolución</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Seguro que querés devolver esta receta al paciente?
        </Modal.Body>
        <Modal.Footer>
          <Button className="btn-devolver" onClick={handleCancelValidation}>
            Devolver al paciente
          </Button>
        </Modal.Footer>
      </Modal>

      {loading && <Loader mensaje="Cargando..." />}

      {/* ✅ Notificación */}
      {purchaseMessage.text && (
        <>
          {purchaseMessage.type === "success" && (
            <div className="notification-backdrop"></div>
          )}
          <Notification
            message={purchaseMessage.text}
            type={purchaseMessage.type}
          />
        </>
      )}
    </>
  );
};
// ✅ Componente Notification reutilizable
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

export default PharmacyUser;
