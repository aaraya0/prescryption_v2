import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../AxiosConfig";
import "../styles/styles.css";
import { Accordion, Button, Dropdown } from "react-bootstrap";
import PrescriptionPDF from "./PrescriptionPDF";
import PrintableInvoice from "./PrintableInvoice";
import html2pdf from "html2pdf.js";
import * as XLSX from "xlsx";

function Insurance() {
  const navigate = useNavigate();
  const MENU_PATH = "/";
  const redirectOnAuthFail = (msg = "No estás autenticado") => {
    setError(msg);
    localStorage.removeItem("token");
    setTimeout(() => navigate(MENU_PATH), 1200);
  };

  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [searchPaciente, setSearchPaciente] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState({});
  const token = localStorage.getItem("token");
  const invoiceRef = useRef({});

  // Fetch used prescriptions
  useEffect(() => {
    const fetchUsedPrescriptions = async () => {
      try {
        if (!token) {
          redirectOnAuthFail("No estás autenticado");
          return;
        }
        const response = await api.get("/api/insurances/prescriptions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPrescriptions(response.data.prescriptions || []);
      } catch (err) {
        console.error("Error fetching used prescriptions:", err);
        if (err.response?.status === 401) {
          redirectOnAuthFail("No estás autenticado");
        } else if (err.response?.status === 403) {
          redirectOnAuthFail(
            "Tu cuenta está pendiente de verificación o no tienes permisos"
          );
        } else {
          setError("Error al cargar las recetas usadas");
        }
      }
    };
    fetchUsedPrescriptions();
  }, [token]);

  // Client-side filter + sort whenever inputs change
  useEffect(() => {
    let temp = [...prescriptions];

    // Patient filter: name, surname, or DNI
    if (searchPaciente.trim() !== "") {
      const term = searchPaciente.toLowerCase();
      temp = temp.filter((p) => {
        const nombre = p.patientName?.toLowerCase() || "";
        const apellido = p.patientSurname?.toLowerCase() || "";
        const dni = p.patientNid?.toString() || "";
        return (
          nombre.includes(term) || apellido.includes(term) || dni.includes(term)
        );
      });
    }

    // Sort by issue date
    temp.sort((a, b) => {
      const dateA = new Date(a.issueDate);
      const dateB = new Date(b.issueDate);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    setFilteredPrescriptions(temp);
  }, [prescriptions, searchPaciente, sortOrder]);

  // Format dates for display
  const formatDate = (isoDate) => {
    if (!isoDate) return "N/A";
    const date = new Date(isoDate);
    return date.toLocaleDateString("es-AR");
  };

  // Selection helpers
  const toggle = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  const allIds = useMemo(
    () => filteredPrescriptions.map((p) => p.id),
    [filteredPrescriptions]
  );
  const selectedCount = useMemo(
    () => allIds.filter((id) => selected[id]).length,
    [allIds, selected]
  );

  const selectAll = () => {
    setSelected((prev) => {
      const next = { ...prev };
      allIds.forEach((id) => (next[id] = true));
      return next;
    });
  };
  const isAllSelected = allIds.length > 0 && selectedCount === allIds.length;

  const deselectAll = () => setSelected({});

  const masterRef = useRef(null);

  // Show indeterminate state for partial selection
  useEffect(() => {
    if (masterRef.current) {
      masterRef.current.indeterminate =
        selectedCount > 0 && selectedCount < allIds.length;
    }
  }, [selectedCount, allIds.length]);

  // Fallback to all filtered if nothing selected for export
  const currentSelection = useMemo(
    () => filteredPrescriptions.filter((p) => selected[p.id]),
    [filteredPrescriptions, selected]
  );

  // Row normalization for exports (CSV/XLSX)
  const mapToRow = (p) => {
    const totalFinal = Array.isArray(p.finalPrices)
      ? p.finalPrices.reduce(
          (acc, item) => acc + (Number(item?.finalPrice) || 0),
          0
        )
      : "";

    // Extract pharmacyUserNID from invoiceNumber "FACT|pharmaNID"
    const pharmacyUserNID = p.invoiceNumber?.includes("|")
      ? p.invoiceNumber.split("|")[1]
      : "";

    const row = {
      prescriptionId: p.id || "",
      issueDate: p.issueDate
        ? new Date(p.issueDate).toISOString().slice(0, 10)
        : "",
      patientName: p.patientName || "",
      patientSurname: p.patientSurname || "",
      patientDNI: p.patientNid || "",
      doctorNID: p.doctorNid || "",
      insuranceName: p.insurance?.insuranceName || "",
      affiliateNum: p.insurance?.affiliateNum || "",
      insurancePlan: p.insurance?.insurancePlan || "",
      pharmacyNID: p.pharmacy?.nid || "",
      pharmacyUserNID,
      med1: p.meds?.med1 || "",
      med2: p.meds?.med2 || "",
      invoiceNumber: p.invoiceNumber || "",
      totalFinal,
    };

    // Strip empty fields to keep exports clean
    Object.keys(row).forEach((key) => {
      if (row[key] === "" || row[key] === null) {
        delete row[key];
      }
    });

    return row;
  };
  // Parse invoice string into display parts
  const splitInvoice = (invoice) => {
    if (!invoice) return { factura: "", pharmaNID: "" };
    const [factura, pharmaNID] = String(invoice).split("|");
    return { factura, pharmaNID };
  };

  // Export CSV
  const exportCSV = () => {
    const source = currentSelection.length
      ? currentSelection
      : filteredPrescriptions;
    if (!source.length) return alert("No hay recetas para exportar.");

    const rows = source.map(mapToRow);
    const headers = Object.keys(rows[0] || {});
    const esc = (v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`;
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `reporte_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Export Excel
  const exportExcel = () => {
    const source = currentSelection.length
      ? currentSelection
      : filteredPrescriptions;
    if (!source.length) return alert("No hay recetas para exportar.");
    const rows = source.map(mapToRow);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, `reporte_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Generates a PDF validation proof for a given prescription.
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

  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="receta-list-container">
      <h3>Historial de Recetas</h3>
      <div className="filtros-container-insurance">
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
          Ordenar por fecha emisión:
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="select-ordenar"
          >
            <option value="asc">Ascendente</option>
            <option value="desc">Descendente</option>
          </select>
        </label>

        <div className="table-toolbar">
          <label className="select-all">
            <input
              ref={masterRef}
              type="checkbox"
              checked={allIds.length > 0 && selectedCount === allIds.length}
              onChange={(e) => (e.target.checked ? selectAll() : deselectAll())}
            />
          </label>

          <div className="actions">
            {!isAllSelected ? (
              <Button
                className="clear-btn"
                onClick={selectAll}
                disabled={!allIds.length}
              >
                Seleccionar todo
              </Button>
            ) : (
              <Button className="clear-btn" onClick={deselectAll}>
                Limpiar selección
              </Button>
            )}

            <Dropdown align="end">
              <Dropdown.Toggle
                className="Exportar"
                disabled={!filteredPrescriptions.length && !selectedCount}
              >
                Exportar
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={exportCSV}>CSV</Dropdown.Item>
                <Dropdown.Item onClick={exportExcel}>Excel</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
        {selectedCount > 0 && (
          <div className="selection-summary">
            {selectedCount} recetas seleccionadas
          </div>
        )}
      </div>
      <div className="receta-scroll">
        {filteredPrescriptions.length === 0 ? (
          <p>No hay recetas usadas registradas aún.</p>
        ) : (
          <Accordion defaultActiveKey="">
            {filteredPrescriptions.map((p) => (
              <Accordion.Item
                eventKey={p.id.toString()}
                key={p.id}
                className="receta-item"
              >
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
                    <strong>Paciente:</strong> {p.patientName}{" "}
                    {p.patientSurname}
                    <strong> DNI Paciente:</strong> {p.patientNid}
                    <strong> Nº Afiliado :</strong> {p.insurance?.affiliateNum}
                  </div>
                </Accordion.Header>

                <Accordion.Body className="receta-details">
                  <p>
                    <strong>Medicamentos:</strong> {p.meds.med1}
                    {p.meds.med2 !== "N/A" ? `, ${p.meds.med2}` : ""}
                  </p>
                  <p>
                    <strong>Fecha emisión:</strong> {formatDate(p.issueDate)}
                  </p>
                  <p>
                    <strong>Plan Afiliado:</strong> {p.insurance?.affiliateNum}{" "}
                    – {p.insurance?.insurancePlan}
                  </p>
                  <p>
                    <strong>DNI Doctor:</strong> {p.doctorNid}
                  </p>
                  {p.invoiceNumber &&
                    (() => {
                      const { factura, pharmaNID } = splitInvoice(
                        p.invoiceNumber
                      );
                      return (
                        <>
                          <p>
                            <strong>Factura N°:</strong> {factura}
                          </p>
                          {pharmaNID && (
                            <p>
                              <strong>DNI farmacéutico:</strong> {pharmaNID}
                            </p>
                          )}
                        </>
                      );
                    })()}
                  <hr />

                  <div className="download-button-container">
                    <PrescriptionPDF receta={p} />
                  </div>

                  {p.invoiceNumber && (
                    <>
                      <div className="download-button-container">
                        <Button
                          onClick={() =>
                            setTimeout(() => downloadValidationProof(p.id), 100)
                          }
                          className="button_descargar-documentos"
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
                                p.finalPrices?.reduce(
                                  (acc, item) => acc + item.finalPrice,
                                  0
                                ) || "-",
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
