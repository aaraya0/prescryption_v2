import React, { useEffect, useState } from "react";
import api from "../AxiosConfig";
import { Modal, Button, Form, Accordion } from "react-bootstrap";
import "../styles/Patient.css";
import Loader from "./Loader";
import PrescriptionPDF from "./PrescriptionPDF";

const Patient = () => {
  //State management
  const [recetas, setRecetas] = useState([]);
  const [pharmacyNid, setPharmacyNid] = useState("");
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  // Filters and sorting
  const [statusFilter, setStatusFilter] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  // Available data for filters / modal
  const [availableSpecialties, setAvailableSpecialties] = useState([]);
  const [availablePharmacies, setAvailablePharmacies] = useState([]);
  const [selectedPharmacyName, setSelectedPharmacyName] = useState("");
  const [matchedPharmacies, setMatchedPharmacies] = useState([]);

  // Transfer state
  const [isSending, setIsSending] = useState(false);
  const [transferMessage, setTransferMessage] = useState({
    text: "",
    type: "",
  });

  useEffect(() => {
    if (!token) return;
    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        const response = await api.get("/api/patients/prescriptions", {
          headers: { Authorization: `Bearer ${token}` },
        });

        let filteredPrescriptions = Array.isArray(response.data)
          ? response.data
          : [];

        filteredPrescriptions = filteredPrescriptions.map((pres) => {
          let status = "Válida";
          if (pres.used) {
            status = "Dispensada";
          } else if (
            pres.pharmacyAddress !=
              "0x0000000000000000000000000000000000000000" &&
            !pres.used
          ) {
            status = "Pendiente";
          } else if (new Date(pres.expirationDate) < new Date()) {
            status = "Expirada";
          } else {
            status = "Válida";
          }
          return { ...pres, status };
        });

        const specialties = [
          ...new Set(
            filteredPrescriptions.map((receta) => receta.doctorSpecialty)
          ),
        ];
        setAvailableSpecialties(specialties);

        if (specialtyFilter) {
          filteredPrescriptions = filteredPrescriptions.filter(
            (receta) => receta.doctorSpecialty === specialtyFilter
          );
        }

        if (statusFilter) {
          filteredPrescriptions = filteredPrescriptions.filter(
            (receta) => receta.status === statusFilter
          );
        }

        filteredPrescriptions = filteredPrescriptions.sort((a, b) => {
          const dateA = new Date(a.issueDate.split("/").reverse().join("-"));
          const dateB = new Date(b.issueDate.split("/").reverse().join("-"));
          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        });

        setRecetas(filteredPrescriptions);
        setError("");
      } catch (error) {
        console.error("Error al obtener las recetas:", error);
        setError("Error al obtener tus recetas. Intentalo más tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [token, specialtyFilter, statusFilter, sortOrder]);

  useEffect(() => {
    if (showModal) {
      const fetchPharmacies = async () => {
        try {
          const response = await api.get("/api/patients/available", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setAvailablePharmacies(response.data || []);
        } catch (err) {
          console.error("Error al obtener farmacias:", err.message);
        }
      };

      fetchPharmacies();
    }
  }, [showModal, token]);

  // Handle prescription transfer (open modal)
  const handleTransfer = (prescriptionId) => {
    setSelectedPrescriptionId(prescriptionId);
    setShowModal(true);
  };
  // Submit transfer to backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPrescriptionId || !pharmacyNid) return;

    setIsSending(true);

    try {
      const response = await api.post(
        "/api/patients/send_prescription",
        {
          pharmacyNid,
          prescriptionId: selectedPrescriptionId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTransferMessage({
        text: "Receta enviada exitosamente.",
        type: "success",
      });

      setTimeout(() => {
        setTransferMessage({ text: "", type: "" });
      }, 3000);

      setErrorMessage("");
      setShowModal(false);
      setPharmacyNid("");
      setSelectedPrescriptionId(null);

      // ✅ Reflejar cambio localmente: actualizar solo esa receta
      setRecetas((prev) =>
        prev.map((r) =>
          r.id === selectedPrescriptionId ? { ...r, status: "Pendiente" } : r
        )
      );
    } catch (error) {
      console.error("Error al transferir la receta:", error);
      setErrorMessage(
        "❌ Error al transferir la receta. Ya podría estar transferida."
      );
      setSuccessMessage("");
    } finally {
      setIsSending(false);
    }
  };
  // Helpers for CSS classes by status
  const getStatusClass = (status) => {
    switch (status) {
      case "Valid":
      case "Válida":
        return "status-valid";
      case "Expired":
      case "Expirada":
        return "status-expired";
      case "Dispensed":
      case "Dispensada":
        return "status-dispensed";
      case "Pendiente":
        return "status-pending";
      default:
        return "";
    }
  };

  const getStatusBackground = (status) => {
    switch (status) {
      case "Valid":
      case "Válida":
        return "accordion-valid";
      case "Expired":
      case "Expirada":
        return "accordion-expired";
      case "Dispensed":
      case "Dispensada":
        return "accordion-dispensed";
      case "Pendiente":
        return "accordion-pending";
      default:
        return "";
    }
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return "N/A";
    const date = new Date(isoDate);
    return date.toLocaleDateString("es-AR");
  };

  // Conditional render states
  if (loading) return <p className="perfil-loading">Cargando recetas...</p>;
  if (error) return <p className="perfil-error">{error}</p>;
  if (recetas.length === 0)
    return (
      <div className="no-recetas-container">
        <p className="no-recetas-text">
          Todavía no tenés recetas emitidas.
          <br />
        </p>
      </div>
    );

  return (
    <div className="receta-list-container">
      <h3>Mis Recetas</h3>
      {successMessage && <div className="success-alert">{successMessage}</div>}
      {errorMessage && <div className="error-alert">{errorMessage}</div>}

      {/* Filters */}
      <div className="filtros-container">
        <label>
          Filtrar por Especialidad:
          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
          >
            <option value="">Todas</option>
            {availableSpecialties.map((specialty, index) => (
              <option key={index} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
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
          Ordenar por Fecha de Emisión:
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="asc">Ascendente</option>
            <option value="desc">Descendente</option>
          </select>
        </label>
      </div>

      {/* Prescriptions accordion */}
      <div className="receta-scroll">
        <Accordion defaultActiveKey="">
          {recetas.map((receta, index) => (
            <React.Fragment key={index}>
              <Accordion.Item
                eventKey={index.toString()}
                className={`receta-item ${getStatusBackground(receta.status)}`}
              >
                <Accordion.Header>
                  <div style={{ width: "100%" }}>
                    <strong>Médico: </strong> {receta.doctorName}{" "}
                    {receta.doctorSurname} | <strong>Especialidad: </strong>{" "}
                    {receta.doctorSpecialty} | <strong>Estado: </strong>
                    <span className={getStatusClass(receta.status)}>
                      {receta.status}
                    </span>{" "}
                    | <strong>Fecha de Emisión: </strong>{" "}
                    {formatDate(receta.issueDate)}
                  </div>
                </Accordion.Header>
                <Accordion.Body className="receta-details">
                  <p>
                    <strong>DNI del Médico:</strong> {receta.doctorNid}
                  </p>
                  <p>
                    <strong>Medicamento:</strong> {receta.meds.med1}
                  </p>
                  <p>
                    <strong>Cantidad: </strong> {receta.meds.quantity1}
                  </p>
                  {receta.meds.med2 !== "N/A" && receta.meds.quantity2 > 0 && (
                    <>
                      <p>
                        <strong>Medicamento:</strong> {receta.meds.med2}
                      </p>
                      <p>
                        <strong>Cantidad: </strong> {receta.meds.quantity2}
                      </p>
                    </>
                  )}
                  <p>
                    <strong>Diagnóstico:</strong> {receta.meds.diagnosis}
                  </p>
                  {receta.meds.observations &&
                    receta.meds.observations.trim() !== "" && (
                      <p>
                        <strong>Observaciones:</strong>{" "}
                        {receta.meds.observations}
                      </p>
                    )}
                  <p>
                    <strong>Fecha de Expiración:</strong>{" "}
                    {formatDate(receta.expirationDate)}
                  </p>

                  {/* Transfer option only if prescription is valid */}
                  {!receta.isPendingValidation &&
                    (receta.status === "Valid" ||
                      receta.status === "Válida") && (
                      <button
                        className="button_t"
                        onClick={() => handleTransfer(receta.id)}
                      >
                        Transferir Receta
                      </button>
                    )}

                  {/* Download PDF */}
                  <div className="download-button-container">
                    <PrescriptionPDF receta={receta} />
                  </div>
                </Accordion.Body>
              </Accordion.Item>
            </React.Fragment>
          ))}
        </Accordion>
      </div>

      <Modal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setPharmacyNid("");
          setSelectedPharmacyName("");
          setMatchedPharmacies([]);
        }}
        centered
      >
        {" "}
        <Modal.Header closeButton>
          <Modal.Title>Transferir Receta</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="pharmacyNid">
              <Form.Label>Buscá la Farmacia:</Form.Label>
              <div className="input-button-row">
                <Form.Control
                  type="text"
                  value={pharmacyNid}
                  onChange={(e) => {
                    const input = e.target.value.toLowerCase();
                    setPharmacyNid(input);

                    if (input.trim() === "") {
                      setSelectedPharmacyName("");
                      setMatchedPharmacies([]);
                      return;
                    }

                    const matches = availablePharmacies.filter(
                      (ph) =>
                        ph.nid.toLowerCase().includes(input) ||
                        ph.pharmacy_name.toLowerCase().includes(input)
                    );
                    setMatchedPharmacies(matches);
                  }}
                  placeholder="Ingresá el CUIT/Nombre de la Farmacia"
                  required
                />
                <Button type="submit" className="button-enviar-modal">
                  Enviar
                </Button>
              </div>

              {selectedPharmacyName && (
                <Form.Text className="text-selected-pharmacy">
                  Farmacia seleccionada: <strong>{selectedPharmacyName}</strong>
                </Form.Text>
              )}
              {pharmacyNid.trim() !== "" && matchedPharmacies.length > 0 && (
                <div className="pharmacy-card-container">
                  {matchedPharmacies.map((ph, i) => (
                    <div
                      key={i}
                      className="pharmacy-card"
                      onClick={() => {
                        setPharmacyNid(ph.nid);
                        setSelectedPharmacyName(ph.pharmacy_name);
                        setMatchedPharmacies([]);
                      }}
                    >
                      <h4 className="pharmacy-name">{ph.pharmacy_name}</h4>
                      <p className="pharmacy-nid">CUIT: {ph.nid}</p>
                      <p className="pharmacy-address">
                        Dirección: {ph.physicalAddress}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
      </Modal>
      {isSending && (
        <div className="loader-overlay-modal">
          <Loader mensaje="Enviando receta..." />
        </div>
      )}

      {transferMessage.text && (
        <>
          {transferMessage.type === "success" && (
            <div className="notification-backdrop"></div>
          )}
          <Notification
            message={transferMessage.text}
            type={transferMessage.type}
          />
        </>
      )}
    </div>
  );
};

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

export default Patient;
