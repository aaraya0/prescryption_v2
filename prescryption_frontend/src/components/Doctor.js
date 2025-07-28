import React, { useEffect, useState } from "react";
import api from "../AxiosConfig";
import "../styles/styles.css";
import { Accordion } from "react-bootstrap";
import PrescriptionPDF from "./PrescriptionPDF";

const Doctor = () => {
  const [recetas, setRecetas] = useState([]);
  const [searchPaciente, setSearchPaciente] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  //const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        const [recetasRes, doctorRes] = await Promise.all([
          api.get("http://localhost:3001/api/doctors/prescriptions", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get("http://localhost:3001/api/doctors/profile", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const doctor = doctorRes.data;

        if (Array.isArray(recetasRes.data)) {
          // Agregamos los datos del doctor a cada receta
          const enrichedRecetas = recetasRes.data.map((r) => ({
            ...r,
            doctorName: doctor.name,
            doctorSurname: doctor.surname,
            doctorLicense: doctor.license,
            doctorNid: doctor.nid,
          }));

          setRecetas(enrichedRecetas);
        } else {
          setRecetas([]);
        }
      } catch (error) {
        console.error("Error al obtener recetas o perfil del doctor:", error);
      }
    };

    fetchData();
  }, []);

  const filteredRecetas = recetas
    .filter(
      (receta) =>
        receta.patientName
          ?.toLowerCase()
          .includes(searchPaciente.toLowerCase()) ||
        receta.patientSurname
          ?.toLowerCase()
          .includes(searchPaciente.toLowerCase()) ||
        receta.patientNid?.toString().includes(searchPaciente)
    )
    .sort((a, b) => {
      const dateA = new Date(a.issueDate);
      const dateB = new Date(b.issueDate);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  const formatDate = (isoDate) => {
    if (!isoDate) return "N/A";
    const date = new Date(isoDate);
    return date.toLocaleDateString("es-AR");
  };

  return (
    <div className="receta-list-container doctor-menu">
      <h3>Recetas Emitidas</h3>

      <div className="filtros-container">
        <label>
          Buscar por paciente:
          <input
            type="text"
            placeholder="Nombre, Apellido o DNI"
            value={searchPaciente}
            onChange={(e) => setSearchPaciente(e.target.value)}
          />
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

      {/* 👇 Scroll solo para el listado */}
      <div className="receta-scroll">
        {filteredRecetas.length === 0 ? (
          <p>No hay recetas emitidas aún.</p>
        ) : (
          <Accordion defaultActiveKey="">
            {filteredRecetas.map((receta, index) => (
              <Accordion.Item
                eventKey={index.toString()}
                key={index}
                className="receta-item"
              >
                <Accordion.Header>
                  {/*console.log("Receta:", receta)*/}
                  <div className="receta-header-info">
                    <strong>Paciente:</strong> {receta.patientName}{" "}
                    {receta.patientSurname}
                    <strong> DNI:</strong> {receta.patientNid}
                    <strong> Obra Social:</strong>{" "}
                    {receta.insurance?.[1] || "N/A"}
                    <strong> Fecha de Emisión:</strong>{" "}
                    {formatDate(receta.issueDate)}
                  </div>
                </Accordion.Header>
                <Accordion.Body className="receta-details">
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
                  <div className="download-button-container">
                    <PrescriptionPDF receta={receta} />
                  </div>
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
};

export default Doctor;
