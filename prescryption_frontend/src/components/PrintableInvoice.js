// PrintableInvoice.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/PrintableInvoice.css";

const PrintableInvoice = ({ prescription, validationResult: propValidation, invoiceData: propInvoice }) => {
  const [validationResult, setValidationResult] = useState(propValidation || []);
  const [invoiceData, setInvoiceData] = useState(propInvoice || null);
  const [loading, setLoading] = useState(true);

  // 🔹 Consultar datos persistidos de validación/factura si existen
  useEffect(() => {
    const fetchValidationData = async () => {
      try {
        if (!prescription?.id && !prescription?.prescriptionId) {
          console.warn("⚠️ No hay ID de receta para buscar validación.");
          setLoading(false);
          return;
        }

        const prescriptionId = prescription?.id || prescription?.prescriptionId;

        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:3001/api/pharmacy-users/pr_validation/${prescriptionId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data) {
          setValidationResult(response.data.validatedMeds || propValidation);
          setInvoiceData(response.data.invoiceData || propInvoice);
        }
      } catch (error) {
        console.warn("⚠️ No se encontró validación persistida. Usando props.");
      } finally {
        setLoading(false);
      }
    };

    fetchValidationData();
  }, [prescription]);

  const totalFactura = invoiceData?.totalAmount
    ? Number(invoiceData.totalAmount)
    : validationResult?.reduce((acc, item) => acc + (item.finalPrice || 0), 0) || 0;

  if (loading) {
    return <p>Cargando datos de validación...</p>;
  }

  return (
    <div className="container">
      {/* Cuadrante 1: Datos de la receta */}
      <div className="quadrant">
        <h3>Datos de la Receta</h3>
        <div>
          <p><strong>Fecha de Emisión:</strong> {new Date(prescription?.issueDate).toLocaleDateString("es-AR")}</p>
          <p><strong>Fecha de Expiración:</strong> {new Date(prescription?.expirationDate).toLocaleDateString("es-AR")}</p>
          <p><strong>Nombre(s):</strong> {prescription?.patientName}</p>
          <p><strong>Apellido(s):</strong> {prescription?.patientSurname}</p>
          <p><strong>DNI del paciente:</strong> {prescription?.patientNid}</p>
          <p><strong>Obra Social:</strong> {prescription?.insurance?.insuranceName || "N/A"}</p>
          <p><strong>Plan de Obra Social:</strong> {prescription?.insurance?.insurancePlan || "N/A"}</p>
          <p><strong>Número de Afiliado:</strong> {prescription?.insurance?.affiliateNum || "N/A"}</p>
          <p><strong>Medicamento 1:</strong> {prescription?.meds?.med1}, Cantidad: {prescription?.meds?.quantity1}</p>
          {prescription?.meds?.med2 && prescription?.meds?.med2 !== "N/A" && (
            <p><strong>Medicamento 2:</strong> {prescription?.meds?.med2}, Cantidad: {prescription?.meds?.quantity2}</p>
          )}
          <p><strong>Diagnóstico:</strong> {prescription?.meds?.diagnosis}</p>
          {prescription?.meds?.observations?.trim() && (
            <p><strong>Observaciones:</strong> {prescription?.meds?.observations}</p>
          )}
          <br />
          <p><strong>Dr.:</strong> {prescription?.doctorName} {prescription?.doctorSurname}</p>
          <p><strong>Matrícula:</strong> {prescription?.doctorLicense}</p>
          <p><strong>Especialidad:</strong> {prescription?.doctorSpecialty}</p>
        </div>
      </div>

      {/* Cuadrante 2: Detalle de Factura */}
      <div className="quadrant">
        <h3>Detalles de la Factura</h3>
        <div>
          <p><strong>Número de Factura:</strong> {invoiceData?.invoiceNumber || prescription.invoiceNumber || "N/A"}</p>
          <p><strong>Paciente:</strong> {invoiceData?.patient?.name || prescription.patientName || "N/A"} {invoiceData?.patient?.surname || prescription.patientSurname || "N/A"}</p>
          <p><strong>Fecha de Emisión:</strong> {new Date(prescription?.issueDate).toLocaleDateString("es-AR")}</p>
          <p><strong>Total:</strong> {totalFactura.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</p>
        </div>
      </div>

      {/* Cuadrante 3: Espacio para Troqueles */}
      <div className="quadrant">
        <h3>Espacio para Troqueles</h3>
        <div id="troqueles-container">
          <div></div>
          <div></div>
        </div>
      </div>

      {/* Cuadrante 4: Resultados de Validación */}
      <div className="quadrant">
        <h3>Resultado de Validación</h3>
        {validationResult && validationResult.length > 0 ? (
          validationResult.map((item, index) => {
            const precioOriginal = item.medication?.price || item.medication?.originalPrice || 0;
            const finalCoverage = item.finalCoverage || item.coveragePercentage || 0;
            const descuento = precioOriginal - (item.finalPrice || 0);

            return (
              <div key={index} style={{ marginBottom: "1rem" }}>
                <p><strong>Medicamento:</strong> {item.medication?.brandName || item.brand}</p>
                <p><strong>Presentación:</strong> {item.medication?.details?.presentation || "N/A"}</p>
                <p><strong>Laboratorio:</strong> {item.medication?.details?.laboratory || "N/A"}</p>
                <p><strong>Precio Lista:</strong> ${precioOriginal.toFixed(2)}</p>
                <p><strong>Cobertura Obra Social:</strong> {finalCoverage}%</p>
                <p><strong>Descuento:</strong> ${descuento.toFixed(2)}</p>
                <p><strong>Precio Final (a pagar):</strong> ${(item.finalPrice || 0).toFixed(2)}</p>
              </div>
            );
          })
        ) : (
          <p>No hay datos de validación disponibles.</p>
        )}
      </div>
    </div>
  );
};

export default PrintableInvoice;
