import React, { useEffect, useState, useRef } from "react";
import api from "../AxiosConfig";
import "../styles/styles.css";
import { Accordion, Button } from "react-bootstrap";
import PrescriptionPDF from "./PrescriptionPDF";
import PrintableInvoice from "./PrintableInvoice";
import html2pdf from "html2pdf.js";

function Insurance() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [searchPaciente, setSearchPaciente] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [error, setError] = useState("");
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
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setPrescriptions(response.data.prescriptions);
      } catch (err) {
        console.error("Error fetching used prescriptions:", err);
        if (err.response && err.response.status === 401) {
          setError("No estás autenticado");
        } else if (err.response && err.response.status === 403) {
          setError(
            "Tu cuenta está pendiente de verificación o no tienes permisos"
          );
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

    // Filtrar por paciente
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

    // Ordenar por fecha de emisión
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
                    <strong>Medicamentos:</strong> {p.meds.med1}{" "}
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
                  {p.invoiceNumber && (
                    <p>
                      <strong>Factura N°:</strong> {p.invoiceNumber}
                    </p>
                  )}
                  <hr />

                  {/* ✅ Botón para descargar receta */}
                  <div className="download-button-container">
                    <PrescriptionPDF receta={p} />
                  </div>

                  {/* ✅ Botón para descargar documentos (si tiene factura) */}
                  {p.invoiceNumber && (
                    <>
                      <div className="download-button-container">
                        <Button
                          onClick={() => {
                            setTimeout(
                              () => downloadValidationProof(p.id),
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
