// PrintableInvoice.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/PrintableInvoice.css";

const PrintableInvoice = ({
  prescription,
  validationResult: propValidation,
  invoiceData: propInvoice,
  roleOverride // opcional, por si querés forzar el rol desde el padre
}) => {
  const [validationResult, setValidationResult] = useState(propValidation || []);
  const [invoiceData, setInvoiceData] = useState(propInvoice || null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // 🔧 Config de API
  const API_BASE =
    process.env.REACT_APP_API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";

  // 🛠️ Helper: intenta leer rol desde token si no está en localStorage
  const getRoleFromToken = (token) => {
    try {
      if (!token) return null;
      const [, payload] = token.split(".");
      if (!payload) return null;
      const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
      // 🔴 acá incluimos userType además de role / userRole
      return (json?.role || json?.userRole || json?.userType || "").toString();
    } catch {
      return null;
    }
  };

  // 🗺️ Mapea rol → basePath
  const resolveBasePath = () => {
    const token = localStorage.getItem("token");
    const storedRole =
      roleOverride || localStorage.getItem("role") || getRoleFromToken(token);

    // normalizamos a minúsculas
    const normalized = String(storedRole || "").trim().toLowerCase();

    const roleToPath = {
      pharmacyuser: "pharmacy-users",
      insurance: "insurances",
    };

    if (roleToPath[normalized]) return roleToPath[normalized];

    console.warn("Rol no reconocido; usando 'pharmacy-users' por defecto.");
    return "pharmacy-users";
  };

  // 🔹 Consultar datos persistidos de validación/factura si existen
  useEffect(() => {
    const fetchValidationData = async () => {
      setLoading(true);
      setFetchError(null);

      try {
        const pid = prescription?.id || prescription?.prescriptionId;
        if (!pid) {
          console.warn("⚠️ No hay ID de receta para buscar validación.");
          setLoading(false);
          return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
          console.warn("⚠️ No hay token en localStorage. No se puede consultar validación.");
          setLoading(false);
          return;
        }

        const basePath = resolveBasePath();
        const url = `${API_BASE}/api/${basePath}/pr_validation/${pid}`;
        console.debug("[PrintableInvoice] basePath:", basePath, "url:", url);

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response?.data) {
          setValidationResult(response.data.validatedMeds || propValidation || []);
          setInvoiceData(response.data.invoiceData || propInvoice || null);
        } else {
          // Sin data: usar props como fallback
          setValidationResult(propValidation || []);
          setInvoiceData(propInvoice || null);
        }
      } catch (error) {
        console.warn("⚠️ No se encontró validación persistida. Usando props.", error);
        setFetchError(
          error?.response?.data?.message || error.message || "Error al obtener validación."
        );
        // fallback a props
        setValidationResult(propValidation || []);
        setInvoiceData(propInvoice || null);
      } finally {
        setLoading(false);
      }
    };

    fetchValidationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prescription?.id, prescription?.prescriptionId, roleOverride]);

  // 🧮 Total de factura
  const totalFactura = (() => {
    if (invoiceData?.totalAmount != null) {
      const n = Number(invoiceData.totalAmount);
      return Number.isFinite(n) ? n : 0;
    }
    const sum =
      (validationResult || []).reduce(
        (acc, item) => acc + (Number(item?.finalPrice) || 0),
        0
      ) || 0;
    return sum;
  })();

  // 🕒 Helpers de fecha seguros
  const safeDate = (d) => (d ? new Date(d) : null);
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("es-AR") : "N/A");

  if (loading) {
    return <p>Cargando datos de validación...</p>;
  }

  return (
    <div className="container">
      {/* Cuadrante 1: Datos de la receta */}
      <div className="quadrant">
        <h3>Datos de la Receta</h3>
        <div>
          <p><strong>Fecha de Emisión:</strong> {fmtDate(safeDate(prescription?.issueDate))}</p>
          <p><strong>Fecha de Expiración:</strong> {fmtDate(safeDate(prescription?.expirationDate))}</p>
          <p><strong>Nombre(s):</strong> {prescription?.patientName || "N/A"}</p>
          <p><strong>Apellido(s):</strong> {prescription?.patientSurname || "N/A"}</p>
          <p><strong>DNI del paciente:</strong> {prescription?.patientNid || "N/A"}</p>
          <p><strong>Obra Social:</strong> {prescription?.insurance?.insuranceName || "N/A"}</p>
          <p><strong>Plan de Obra Social:</strong> {prescription?.insurance?.insurancePlan || "N/A"}</p>
          <p><strong>Número de Afiliado:</strong> {prescription?.insurance?.affiliateNum || "N/A"}</p>
          <p><strong>Medicamento 1:</strong> {prescription?.meds?.med1 || "N/A"}, Cantidad: {prescription?.meds?.quantity1 ?? "N/A"}</p>
          {prescription?.meds?.med2 && prescription?.meds?.med2 !== "N/A" && (
            <p><strong>Medicamento 2:</strong> {prescription?.meds?.med2}, Cantidad: {prescription?.meds?.quantity2 ?? "N/A"}</p>
          )}
          <p><strong>Diagnóstico:</strong> {prescription?.meds?.diagnosis || "N/A"}</p>
          {prescription?.meds?.observations?.trim() && (
            <p><strong>Observaciones:</strong> {prescription?.meds?.observations}</p>
          )}
          <br />
          <p><strong>Dr.:</strong> {`${prescription?.doctorName || ""} ${prescription?.doctorSurname || ""}`.trim() || "N/A"}</p>
          <p><strong>Matrícula:</strong> {prescription?.doctorLicense || "N/A"}</p>
          <p><strong>Especialidad:</strong> {prescription?.doctorSpecialty || "N/A"}</p>
        </div>
      </div>

      {/* Cuadrante 2: Detalle de Factura */}
      <div className="quadrant">
        <h3>Detalles de la Factura</h3>
        <div>
          <p><strong>Número de Factura:</strong> {invoiceData?.invoiceNumber || prescription?.invoiceNumber || "N/A"}</p>
          <p>
            <strong>Paciente:</strong>{" "}
            {invoiceData?.patient?.name || prescription?.patientName || "N/A"}{" "}
            {invoiceData?.patient?.surname || prescription?.patientSurname || ""}
          </p>
          <p><strong>Fecha de Emisión:</strong> {fmtDate(safeDate(prescription?.issueDate))}</p>
          <p><strong>Total:</strong> {totalFactura.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</p>
          {fetchError && (
            <p style={{ color: "#b00", marginTop: "0.5rem" }}>
              <strong>Aviso:</strong> {fetchError}
            </p>
          )}
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
            const precioOriginal =
              Number(item?.medication?.price) ||
              Number(item?.medication?.originalPrice) ||
              Number(item?.originalPrice) ||
              0;

            const finalCoverage =
              Number(item?.finalCoverage) ||
              Number(item?.coveragePercentage) ||
              0;

            const finalPrice = Number(item?.finalPrice) || 0;
            const descuento = Math.max(precioOriginal - finalPrice, 0);

            const brand =
              item?.medication?.brandName ||
              item?.brand ||
              item?.medication?.genericName ||
              "N/A";

            const presentation =
              item?.medication?.details?.presentation ||
              item?.presentation ||
              "N/A";

            const laboratory =
              item?.medication?.details?.laboratory ||
              item?.laboratory ||
              "N/A";

            return (
              <div key={index} style={{ marginBottom: "1rem" }}>
                <p><strong>Medicamento:</strong> {brand}</p>
                <p><strong>Presentación:</strong> {presentation}</p>
                <p><strong>Laboratorio:</strong> {laboratory}</p>
                <p><strong>Precio Lista:</strong> ${precioOriginal.toFixed(2)}</p>
                <p><strong>Cobertura Obra Social:</strong> {finalCoverage}%</p>
                <p><strong>Descuento:</strong> ${descuento.toFixed(2)}</p>
                <p><strong>Precio Final (a pagar):</strong> ${finalPrice.toFixed(2)}</p>
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
