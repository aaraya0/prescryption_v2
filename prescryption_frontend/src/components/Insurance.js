import React, { useEffect, useState, useRef, useMemo } from "react";
import api from "../AxiosConfig";
import "../styles/styles.css";
import { Accordion, Button } from "react-bootstrap";
import PrescriptionPDF from "./PrescriptionPDF";
import PrintableInvoice from "./PrintableInvoice";
import html2pdf from "html2pdf.js";
import * as XLSX from "xlsx"; // para Excel

function Insurance() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [searchPaciente, setSearchPaciente] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState({});
  const token = localStorage.getItem("token");
  const invoiceRef = useRef({});

  // ✅ Traer recetas usadas
  useEffect(() => {
    const fetchUsedPrescriptions = async () => {
      try {
        if (!token) {
          setError("No estás autenticado");
          return;
        }
        const response = await api.get(
          "http://localhost:3001/api/insurances/prescriptions",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPrescriptions(response.data.prescriptions || []);
      } catch (err) {
        console.error("Error fetching used prescriptions:", err);
        if (err.response && err.response.status === 401) {
          setError("No estás autenticado");
        } else if (err.response && err.response.status === 403) {
          setError("Tu cuenta está pendiente de verificación o no tienes permisos");
        } else {
          setError("Error al cargar las recetas usadas");
        }
      }
    };
    fetchUsedPrescriptions();
  }, [token]);

  // ✅ Filtrar y ordenar
  useEffect(() => {
    let temp = [...prescriptions];

    if (searchPaciente.trim() !== "") {
      const term = searchPaciente.toLowerCase();
      temp = temp.filter((p) => {
        const nombre = p.patientName?.toLowerCase() || "";
        const apellido = p.patientSurname?.toLowerCase() || "";
        const dni = p.patientNid?.toString() || "";
        return nombre.includes(term) || apellido.includes(term) || dni.includes(term);
      });
    }

    temp.sort((a, b) => {
      const dateA = new Date(a.issueDate);
      const dateB = new Date(b.issueDate);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    setFilteredPrescriptions(temp);
  }, [prescriptions, searchPaciente, sortOrder]);

  const formatDate = (isoDate) => {
    if (!isoDate) return "N/A";
    const date = new Date(isoDate);
    return date.toLocaleDateString("es-AR");
  };

  // 👇 helpers selección
  const toggle = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const clearSelection = () => setSelected({});

  const currentSelection = useMemo(
    () => filteredPrescriptions.filter((p) => selected[p.id]),
    [filteredPrescriptions, selected]
  );

  // 👇 mapeo de una receta al “row exportable”
  const mapToRow = (p) => {
    const totalFinal =
      Array.isArray(p.finalPrices)
        ? p.finalPrices.reduce((acc, item) => acc + (Number(item?.finalPrice) || 0), 0)
        : "";

    // Extraer pharmacyUserNID del invoiceNumber
    const pharmacyUserNID = p.invoiceNumber?.includes("|")
      ? p.invoiceNumber.split("|")[1]
      : "";

    const row = {
      prescriptionId: p.id || "",
      issueDate: p.issueDate ? new Date(p.issueDate).toISOString().slice(0, 10) : "",
      patientName: p.patientName || "",
      patientSurname: p.patientSurname || "",
      patientDNI: p.patientNid || "",
      doctorNID: p.doctorNid || "",
      insuranceName: p.insurance?.insuranceName || "",
      affiliateNum: p.insurance?.affiliateNum || "",
      insurancePlan: p.insurance?.insurancePlan || "",
      pharmacyNID: p.pharmacy?.nid || "",
      pharmacyUserNID, // nueva columna
      med1: p.meds?.med1 || "",
      med2: p.meds?.med2 || "",
      invoiceNumber: p.invoiceNumber || "",
      totalFinal,
    };

    // Eliminar campos vacíos
    Object.keys(row).forEach((key) => {
      if (row[key] === "" || row[key] === null) {
        delete row[key];
      }
    });

    return row;
  };

  // 👇 export CSV
  const exportCSV = () => {
    const source = currentSelection.length ? currentSelection : filteredPrescriptions;
    if (!source.length) return alert("No hay recetas para exportar.");

    const rows = source.map(mapToRow);
    const headers = Object.keys(rows[0] || {});
    const esc = (v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`;
    const csv =
      [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `reporte_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // 👇 export Excel
  const exportExcel = () => {
    const source = currentSelection.length ? currentSelection : filteredPrescriptions;
    if (!source.length) return alert("No hay recetas para exportar.");
    const rows = source.map(mapToRow);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, `reporte_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const downloadValidationProof = (prescriptionId) => {
    const element = invoiceRef.current[prescriptionId];
    if (element) {
      setTimeout(() => {
        html2pdf()
          .set({ margin: 1, filename: `comprobante-validacion-${prescriptionId}.pdf` })
          .from(element)
          .save();
      }, 150);
    } else {
      console.error(`⚠️ No se encontró el comprobante para la receta con ID ${prescriptionId}`);
    }
  };

  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="receta-list-container">
      <h3>Historial de Recetas</h3>

      {/* 🔎 Filtros + botones export */}
      <div className="filtros-container">
        <label>
          Buscar por paciente:
          <input
            type="text"
            placeholder="Nombre, Apellido o DNI"
            value={searchPaciente}
            onChange={(e) => setSearchPaciente(e.target.value)}
            className="input-buscar"
          />
        </label>

        <label className="label-ordenar">
          Ordenar por Fecha de Emisión:
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="select-ordenar"
          >
            <option value="asc">Ascendente</option>
            <option value="desc">Descendente</option>
          </select>
        </label>

        <div className="d-flex gap-2" style={{ marginLeft: "auto" }}>
          <Button variant="success" onClick={exportCSV}>
            Exportar CSV
          </Button>
          <Button variant="outline-success" onClick={exportExcel}>
            Exportar Excel
          </Button>
          <Button variant="outline-secondary" onClick={clearSelection}>
            Limpiar selección
          </Button>
        </div>
      </div>

      <div className="receta-scroll">
        {filteredPrescriptions.length === 0 ? (
          <p>No hay recetas usadas registradas aún.</p>
        ) : (
          <Accordion defaultActiveKey="">
            {filteredPrescriptions.map((p) => (
              <Accordion.Item eventKey={p.id.toString()} key={p.id} className="receta-item">
                <Accordion.Header>
                  <input
                    type="checkbox"
                    className="form-check-input me-2"
                    checked={!!selected[p.id]}
                    onChange={() => toggle(p.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="receta-header-info">
                    <strong>ID Receta:</strong> {p.id} &nbsp;|&nbsp;
                    <strong>Paciente:</strong> {p.patientName} {p.patientSurname}
                    <strong> DNI Paciente:</strong> {p.patientNid}
                    <strong> Nº Afiliado :</strong> {p.insurance?.affiliateNum}
                  </div>
                </Accordion.Header>

                <Accordion.Body className="receta-details">
                  <p>
                    <strong>Medicamentos:</strong> {p.meds.med1}
                    {p.meds.med2 !== "N/A" ? `, ${p.meds.med2}` : ""}
                  </p>
                  <p><strong>Fecha emisión:</strong> {formatDate(p.issueDate)}</p>
                  <p>
                    <strong>Plan Afiliado:</strong> {p.insurance?.affiliateNum} – {p.insurance?.insurancePlan}
                  </p>
                  <p><strong>DNI Doctor:</strong> {p.doctorNid}</p>
                  {p.invoiceNumber && (
                    <p><strong>Factura N°:</strong> {p.invoiceNumber}</p>
                  )}
                  <hr />

                  <div className="download-button-container">
                    <PrescriptionPDF receta={p} />
                  </div>

                  {p.invoiceNumber && (
                    <>
                      <div className="download-button-container">
                        <Button
                          onClick={() => setTimeout(() => downloadValidationProof(p.id), 100)}
                          className="btn btn-primary mt-2"
                        >
                          Descargar documentos
                        </Button>
                      </div>

                      <div style={{ display: "none" }}>
                        <div ref={(el) => (invoiceRef.current[p.id] = el)}>
                          <PrintableInvoice
                            prescription={p}
                            validationResult={p.finalPrices || []}
                            invoiceData={{
                              invoice_number: p.invoiceNumber || "FACT-N/A",
                              patient_name: `${p.patientName} ${p.patientSurname}`,
                              date: formatDate(p.issueDate),
                              total_price:
                                p.finalPrices?.reduce((acc, item) => acc + item.finalPrice, 0) || "-",
                            }}
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
    </div>
  );
}

export default Insurance;
