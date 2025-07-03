import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Modal } from "react-bootstrap";
import api from "../AxiosConfig";
import "./styles.css";

const agruparMedicamentos = (lista) => {
  const mapa = new Map();

  lista.forEach((med) => {
    const key = `${med.activeComponentsList}-${med.brandName}-${med.details?.laboratory}`;
    if (!mapa.has(key)) {
      mapa.set(key, {
        activeComponentsList: med.activeComponentsList,
        brandName: med.brandName,
        laboratory: med.details?.laboratory || "",
        saleType: med.details?.saleType || "",
        presentaciones: [], // ahora serán objetos completos
      });
    }

    mapa.get(key).presentaciones.push(med); // guardamos el objeto entero
  });

  return Array.from(mapa.values());
};

function MedicationSearcher() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [modalData, setModalData] = useState(null);
  const navigate = useNavigate();
  const campo = new URLSearchParams(useLocation().search).get("campo");

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (query.length < 3) {
        setResults([]);
        return;
      }

      const token = localStorage.getItem("token");
      try {
        const response = await fetch(
          `http://localhost:3001/api/prescriptions/search-medications?query=${encodeURIComponent(
            query
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        if (data && data.results) {
          const agrupados = agruparMedicamentos(data.results.slice(0, 50));
          setResults(agrupados);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error("Error al buscar medicamentos:", err);
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleFinalSelection = (presentacion) => {
    localStorage.setItem(campo, JSON.stringify(presentacion));
    setModalData(null);
    navigate("/issue-prescription");
  };

  return (
    <div className="receta-container">
      <div className="form-container" style={{ width: "600px" }}>
        <h2>Buscar Medicamento</h2>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Escribí el nombre del medicamento..."
        />

        <div className="medications-scroll-vertical">
          {results.map((med, idx) => (
            <div
              key={idx}
              className="medication-card"
              onClick={() => {
                setModalData(med);
              }}
            >
              <h4>{med.brandName}</h4>
              <p>
                {Array.isArray(med.activeComponentsList)
                  ? med.activeComponentsList.join(" + ")
                  : med.activeComponentsList || "No especificado"}
              </p>
              {med.saleType && <p className="tipoventa">{med.saleType}</p>}
            </div>
          ))}
        </div>
      </div>
      {/* ✅ MODAL CON BOOTSTRAP */}
      <Modal
        show={!!modalData}
        onHide={() => setModalData(null)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Elegí una presentación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ul style={{ padding: 0, listStyle: "none" }}>
            {modalData?.presentaciones.map((objetoOriginal, idx) => (
              <li
                key={idx}
                onClick={() => handleFinalSelection(objetoOriginal)}
                style={{
                  cursor: "pointer",
                  padding: "10px",
                  marginBottom: "8px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  backgroundColor: "#f8f9fa",
                }}
              >
                {objetoOriginal.details?.presentation ||
                  "Presentación no disponible"}
              </li>
            ))}
          </ul>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default MedicationSearcher;
