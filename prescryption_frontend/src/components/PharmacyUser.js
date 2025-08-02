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
  const validationRef = useRef();

  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [medOptions, setMedOptions] = useState([]);
  const [selectedMedicationIds, setSelectedMedicationIds] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [invoiceData, setInvoiceData] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchPrescriptions = async () => {
    try {
      const response = await api.get(
        "http://localhost:3001/api/pharmacy-users/prescriptions",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("📦 Recetas obtenidas:", response.data.prescriptions);

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
    let response;
    try {
      setLoading(true);
      console.log("Prescription data:", prescription);

      response = await api.get(
        `http://localhost:3001/api/pharmacy-users/medications/search/${prescription.prescriptionId.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("🧪 Recibidos del backend:", response.data.results); // ✅ AHORA sí se puede usar

      setMedOptions(response.data.results);
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

  const handleValidatePrescription = async (e) => {
    e.preventDefault();
    console.log("Enviando validación...", selectedMedicationIds);

    if (!selectedPrescription || !selectedMedicationIds.length) {
      alert("⚠️ Debe seleccionar al menos un medicamento.");
      return;
    }

    try {
      const response = await api.post(
        "http://localhost:3001/api/pharmacy-users/validate_prescription",
        {
          prescriptionId: selectedPrescription.prescriptionId,
          selectedMedicationIds,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setFinalPrices(response.data.finalPrices);
      setSelectedPrescription((prev) => ({
        ...prev,
        finalPrices: response.data.finalPrices,
      }));
      setPrescriptions((prev) =>
        prev.map((p) =>
          p.prescriptionId === selectedPrescription.prescriptionId
            ? {
                ...p,
                finalPrices: response.data.finalPrices,
              }
            : p
        )
      );

      console.log("📦 Respuesta completa del backend:", response.data);
      setSuccessMessage("✅ Receta validada exitosamente.");
      setTimeout(() => setSuccessMessage(""), 3000); // Se borra sola
    } catch (error) {
      console.error("❌ Error validando receta:", error);

      const msg =
        error.response?.data?.message ||
        error.response?.data?.details ||
        "❌ Error al validar la receta.";

      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(""), 4000);
    }
  };

  const handleProcessPurchase = async () => {
    if (!selectedPrescription || !finalPrices) return;

    try {
      setLoading(true);

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
      console.log("✅ Respuesta de la compra:", response);

      alert("🧾 Receta usada y factura emitida correctamente.");
      setInvoiceData(response.data.invoice); // ✅ guardamos la info de la factura
      setInvoiceVisible(true);
      setShowValidationModal(false);
      setSelectedPrescription(null);
      setSelectedMedicationIds([]);
      fetchPrescriptions();
      // ✅ Actualizar receta en la lista local para que el comprobante tenga datos
      setPrescriptions((prev) =>
        prev.map((p) =>
          p.prescriptionId === selectedPrescription.prescriptionId
            ? {
                ...p,
                used: true,
                finalPrices: response.data.finalPrices,
                invoiceNumber: response.data.invoice.invoice_number,
                invoiceData: response.data.invoice, // ✅ GUARDA TODO EL OBJETO REAL
              }
            : p
        )
      );
    } catch (error) {
      console.error("❌ Error procesando la compra:", error);
      console.log("🧪 Error response:", error.response);
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
      }, 150); // Espera breve para asegurar renderizado
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

  // revisar esta funcion no andaaaaaaaaaaaaaaaaaaa
  const handleCancelValidation = async () => {
    try {
      const response = await api.post("/pharmacies/cancel_validation", {
        prescriptionId:
          selectedPrescription.prescriptionId ||
          selectedPrescription.id ||
          selectedPrescription,
      });

      console.log("🟡 Respuesta del cancel:", response.data);

      if (response.status === 200) {
        alert("✅ Validación cancelada correctamente.");
        setShowValidationModal(false);
        fetchPrescriptions();
      }
    } catch (error) {
      console.error("❌ Error procesando la compra:", error);
      console.log("🧪 Error response:", error.response);
      alert("❌ Error al usar y facturar la receta.");
    }
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

                    {!prescription.used && (
                      <button
                        className="validate-button"
                        onClick={() => handleOpenValidationModal(prescription)}
                      >
                        Buscar medicamentos
                      </button>
                    )}

                    <div className="download-button-container">
                      <PrescriptionPDF receta={prescription} />
                    </div>

                    {prescription.used && (
                      <>
                        <div className="download-button-container">
                          <Button
                            onClick={() => {
                              setTimeout(
                                () =>
                                  downloadValidationProof(
                                    prescription.prescriptionId
                                  ),
                                100
                              );
                            }}
                            className="btn btn-primary mt-2"
                          >
                            Descargar documentos
                          </Button>
                        </div>

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
                              invoiceData={
                                prescription.invoiceData || invoiceData
                              } // ✅ fallback
                            />
                          </div>
                        </div>
                      </>
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

                {!finalPrices && (
                  <Button type="submit" className="validate-button-rosa">
                    Validar con Obra Social
                  </Button>
                )}

                {finalPrices &&
                  finalPrices.map((item, i) => {
                    const { medication, finalPrice, finalCoverage } = item;
                    const precioOriginal = medication.price || 0;
                    const descuento = precioOriginal - finalPrice;

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
                          <strong>Precio Lista:</strong> $
                          {precioOriginal.toFixed(2)}
                        </p>
                        <p>
                          <strong>Cobertura Obra Social:</strong>{" "}
                          {finalCoverage || 0}%
                        </p>
                        <p>
                          <strong>Descuento:</strong> ${descuento.toFixed(2)}
                        </p>
                        <p>
                          <strong>Precio Final (a pagar):</strong> $
                          {finalPrice.toFixed(2)}
                        </p>
                        <hr />
                      </div>
                    );
                  })}
                {finalPrices &&
                  selectedPrescription?.isPendingValidation &&
                  !selectedPrescription?.used && (
                    <>
                      <Button
                        onClick={handleProcessPurchase}
                        className="btn btn-success mt-2"
                      >
                        ✅ Usar y Facturar receta
                      </Button>

                      <button
                        onClick={handleCancelValidation}
                        className="btn btn-warning mt-2"
                      >
                        ❌ Cancelar validación
                      </button>
                    </>
                  )}
              </Form>
            )}
          </Modal.Body>
        </Modal>
      </div>
      {loading && <Loader mensaje="Cargando..." />}
    </>
  );
};

export default PharmacyUser;
