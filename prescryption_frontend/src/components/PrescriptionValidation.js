import React, { useState } from "react";
import api from "../AxiosConfig";
import { Modal, Button } from "react-bootstrap";
import PrintableInvoice from "./PrintableInvoice";
import { jsPDF } from "jspdf";
import ReactDOMServer from "react-dom/server";

const PrescriptionValidation = ({ prescription, onClose }) => {
  const [validationResult, setValidationResult] = useState([]);
  const [invoiceData, setInvoiceData] = useState(null);
  const [showModal, setShowModal] = useState(true);
  const [brands, setBrands] = useState({ brand1: "", brand2: "" });

  // Función para validar la receta
  const handleValidate = async () => {
    try {
      const response = await api.post(
        "/api/pr_validate",
        {
          prescriptionId: prescription?.prescriptionId,
          brand1: brands.brand1 || "Genérico",
          brand2: brands.brand2 || "Genérico",
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      setValidationResult(response.data.validatedMeds);
      setShowModal(true);
    } catch (error) {
      console.error("Error al validar la receta:", error);
    }
  };

  // Función para resetear la dirección de la farmacia
  const handleResetPharmacyAddress = async () => {
    try {
      await api.post(
        "/api/address_reset",
        {
          prescriptionId: prescription?.prescriptionId,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      // Cerrar el modal y refrescar la lista de recetas
      handleCloseAndRefresh();
    } catch (error) {
      console.error("Error al resetear la dirección de la farmacia:", error);
    }
  };

  // Función para generar la factura
  const handleGenerateInvoice = async () => {
    try {
      const response = await api.post(
        "/api/pr_invoice",
        {
          prescriptionId: prescription?.prescriptionId,
          patientName: prescription?.patient?.name,
          validatedMeds: validationResult,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      setInvoiceData(response.data.invoice);
    } catch (error) {
      console.error("Error al generar la factura:", error);
    }
  };

  // Función para generar el PDF
  const handleGeneratePDF = () => {
    const doc = new jsPDF("p", "pt", "a4");
    const content = (
      <PrintableInvoice
        prescription={prescription}
        validationResult={validationResult}
        invoiceData={invoiceData}
      />
    );
    const htmlString = ReactDOMServer.renderToString(content);

    doc.html(htmlString, {
      callback: function (doc) {
        doc.save("FacturaReceta.pdf");
      },
      x: 10,
      y: 10,
    });
  };

  // Función para cerrar el modal y actualizar la lista de recetas
  const handleCloseAndRefresh = () => {
    setShowModal(false);
    onClose();
  };

  return (
    <Modal show={showModal} onHide={handleCloseAndRefresh}>
      <Modal.Header closeButton>
        <Modal.Title>Detalles de Validación y Factura</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h4>Datos de la Receta</h4>
        <p>
          <strong>Paciente:</strong> {prescription?.patient?.name}{" "}
          {prescription?.patient?.surname}
        </p>
        <p>
          <strong>Medicamento 1:</strong> {prescription?.meds?.med1}, Cantidad:{" "}
          {prescription?.meds?.quantity1}
        </p>
        <input
          type="text"
          placeholder="Marca o Genérico para Medicamento 1"
          value={brands.brand1}
          onChange={(e) => setBrands({ ...brands, brand1: e.target.value })}
        />
        <p>
          <strong>Medicamento 2:</strong> {prescription?.meds?.med2}, Cantidad:{" "}
          {prescription?.meds?.quantity2}
        </p>
        <input
          type="text"
          placeholder="Marca o Genérico para Medicamento 2"
          value={brands.brand2}
          onChange={(e) => setBrands({ ...brands, brand2: e.target.value })}
        />
        <Button onClick={handleValidate} variant="primary" className="mt-3">
          Validar Receta
        </Button>

        {validationResult.length > 0 && (
          <div>
            <h4>Resultados de Validación</h4>
            {validationResult.map((med, index) => (
              <div key={index}>
                <p>
                  <strong>Medicamento:</strong> {med.drugName}
                </p>
                <p>
                  <strong>Marca:</strong> {med.brand}
                </p>
                <p>
                  <strong>Cobertura:</strong> {med.coveragePercentage}%
                </p>
                <p>
                  <strong>Precio Original:</strong> ${med.originalPrice}
                </p>
                <p>
                  <strong>Monto Cubierto:</strong> ${med.coveredAmount}
                </p>
                <p>
                  <strong>Precio Final:</strong> ${med.finalPrice}
                </p>
                <hr />
              </div>
            ))}
            <Button onClick={handleResetPharmacyAddress} variant="warning">
              Cancelar Dispensación
            </Button>
          </div>
        )}

        {invoiceData && (
          <div>
            <h4>Detalles de la Factura</h4>
            <p>
              <strong>Número de Factura:</strong> {invoiceData.invoice_number}
            </p>
            <p>
              <strong>Paciente:</strong> {invoiceData.patient_name}
            </p>
            <p>
              <strong>Fecha de Emisión:</strong> {invoiceData.date}
            </p>
            <p>
              <strong>Total:</strong> {invoiceData.total_price}
            </p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        {!invoiceData ? (
          <Button variant="primary" onClick={handleGenerateInvoice}>
            Generar Factura
          </Button>
        ) : (
          <Button variant="primary" onClick={handleGeneratePDF}>
            Guardar como PDF
          </Button>
        )}
        <Button variant="secondary" onClick={handleCloseAndRefresh}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PrescriptionValidation;
