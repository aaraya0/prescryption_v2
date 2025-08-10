// PrintableInvoice.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/PrintableInvoice.css";

const PrintableInvoice = ({
  prescription,
  validationResult: propValidation,
  invoiceData: propInvoice,
  roleOverride, // opcional, por si querés forzar el rol desde el padre
}) => {
  const [validationResult, setValidationResult] = useState(propValidation || []);
  const [invoiceData, setInvoiceData] = useState(propInvoice || null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // 🔧 Config de API (normaliza evitando /api doble)
  const RAW_BASE = (process.env.REACT_APP_API_BASE_URL || "http://localhost:3001").replace(/\/+$/, "");
  const API_ROOT = /\/api$/i.test(RAW_BASE) ? RAW_BASE : `${RAW_BASE}/api`;

  // 🛠️ Helper: leer rol desde token si no está en localStorage
  const getRoleFromToken = (token) => {
    try {
      if (!token) return null;
      const [, payload] = token.split(".");
      if (!payload) return null;
      const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
      return (json?.role || json?.userRole || json?.userType || "").toString();
    } catch {
      return null;
    }
  };

  // 🗺️ Mapea rol → basePath
  const resolveBasePath = () => {
    const token = localStorage.getItem("token");
    const storedRole = roleOverride || localStorage.getItem("role") || getRoleFromToken(token);
    const normalized = String(storedRole || "").trim().toLowerCase();
    const roleToPath = {
      pharmacyuser: "pharmacy-users",
      pharmacy: "pharmacy-users",
      insurance: "insurances",
    };
    return roleToPath[normalized] || "pharmacy-users";
  };

  // 🔹 Consultar validación/factura persistida si existe
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
        const url = `${API_ROOT}/${basePath}/pr_validation/${pid}`;
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response?.data) {
          setValidationResult(response.data.validatedMeds || propValidation || []);
          setInvoiceData(response.data.invoiceData || propInvoice || null);
        } else {
          setValidationResult(propValidation || []);
          setInvoiceData(propInvoice || null);
        }
      } catch (error) {
        console.warn("⚠️ No se encontró validación persistida. Usando props.", error);
        setFetchError(error?.response?.data?.message || error.message || "Error al obtener validación.");
        setValidationResult(propValidation || []);
        setInvoiceData(propInvoice || null);
      } finally {
        setLoading(false);
      }
    };

    fetchValidationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prescription?.id, prescription?.prescriptionId, roleOverride]);

  // 🧮 Total de factura (preferir total persistido)
  const totalFactura = (() => {
    if (invoiceData?.totalAmount != null) {
      const n = Number(invoiceData.totalAmount);
      return Number.isFinite(n) ? n : 0;
    }
    const src = invoiceData?.medications?.length ? invoiceData.medications : validationResult || [];
    const sum = src.reduce((acc, it) => acc + (Number(it?.finalPrice) || 0), 0);
    return Number.isFinite(sum) ? sum : 0;
  })();

  // 🕒 Helpers de fecha seguros
  const safeDate = (d) => (d ? new Date(d) : null);
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("es-AR") : "N/A");
  const money = (v) => (Number.isFinite(Number(v)) ? Number(v).toFixed(2) : "0.00");

  if (loading) return <p>Cargando datos de validación...</p>;

  // 🧱 Fuente de items a mostrar: si hay invoiceData.medications uso esa, sino validationResult
  const items = (invoiceData?.medications?.length ? invoiceData.medications : validationResult) || [];

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

      {/* Cuadrante 2: Detalles de la factura */}
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

      {/* Cuadrante 3: Troqueles */}
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
        {items.length > 0 ? (
          items.map((raw, index) => {
            // 🔄 Normalización para soportar ambas fuentes
            const qty = Number(raw.quantity ?? raw?.medication?.quantity ?? 1);

            let priceUnit = Number(
              raw.priceUnit ??
              raw?.medication?.priceUnit ??
              raw?.medication?.price ??
              0
            );

            let grossPrice = Number(
              raw.grossPrice ??
              raw?.medication?.grossPrice ??
              raw?.medication?.price ??
              0
            );

            // Fallbacks consistentes
            if (!Number.isFinite(priceUnit) || priceUnit === 0) {
              if (Number.isFinite(grossPrice) && grossPrice > 0) {
                priceUnit = grossPrice / (qty || 1);
              }
            }
            if (!Number.isFinite(grossPrice) || grossPrice === 0) {
              if (Number.isFinite(priceUnit) && priceUnit > 0) {
                grossPrice = priceUnit * (qty || 1);
              }
            }

            const finalPrice = Number(raw.finalPrice ?? 0);
            const coverage = Number(raw.coverage ?? raw.finalCoverage ?? raw.coveragePercentage ?? 0);

            const name =
              raw.name ||
              raw?.medication?.brandName ||
              raw?.medication?.genericName ||
              "N/A";

            const presentation =
              raw.presentation ||
              raw?.medication?.details?.presentation ||
              "N/A";

            const laboratory =
              raw.laboratory ||
              raw?.medication?.details?.laboratory ||
              "N/A";

            const discount = Math.max(grossPrice - finalPrice, 0);

            return (
              <div key={index} style={{ marginBottom: "1rem" }}>
                <p><strong>Medicamento:</strong> {name}</p>
                <p><strong>Presentación:</strong> {presentation}</p>
                <p><strong>Laboratorio:</strong> {laboratory}</p>
                <p><strong>Cantidad:</strong> {qty}</p>
                <p><strong>Precio Unitario:</strong> ${money(priceUnit)}</p>
                <p><strong>Costo total:</strong> ${money(grossPrice)}</p>
                <p><strong>Cobertura Obra Social:</strong> {Number.isFinite(coverage) ? coverage : 0}%</p>
                <p><strong>Descuento:</strong> ${money(discount)}</p>
                <p><strong>Precio Final (a pagar):</strong> ${money(finalPrice)}</p>
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
