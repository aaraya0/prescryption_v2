import React, { useState, useEffect } from "react";

function MedicationAutocomplete({ label, onMedicationSelected }) {
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedMed, setSelectedMed] = useState(null);
  const [presentation, setPresentation] = useState("");
  const [laboratory, setLaboratory] = useState("");

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const token = localStorage.getItem("token");

      if (searchText.length > 2 && token) {
        fetch(`http://localhost:3001/api/prescriptions/search-medications?query=${encodeURIComponent(searchText)}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        })
          .then(res => res.json())
          .then(data => {
            if (data && data.results) {
              setSuggestions(data.results);
            } else {
              setSuggestions([]);
            }
          })
          .catch(err => {
            console.error("Error al buscar medicamentos:", err);
            setSuggestions([]);
          });
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchText]);

  useEffect(() => {
    if (!selectedMed) return;

    const saleType = selectedMed.details?.saleType || "";
    const isVentaLibre = saleType.includes("Venta Libre");

    const med = {
      brandName: selectedMed.brandName,
      details: {
        ...selectedMed.details,
        presentation: isVentaLibre ? "" : presentation,
        laboratory: isVentaLibre ? "" : laboratory,
      },
    };

    onMedicationSelected(med);
  }, [selectedMed, presentation, laboratory]);

  const handleSelect = (med) => {
    setSelectedMed(med);
    setSearchText(med.brandName);
    setPresentation("");
    setLaboratory("");
  };

  const getUnique = (array, key) => {
    return [...new Set(array.map((item) => item.details[key]).filter(Boolean))];
  };

  const variants = selectedMed
    ? suggestions.filter(m => m.brandName === selectedMed.brandName)
    : [];

  const saleType = selectedMed?.details?.saleType || "";
  const isVentaLibre = saleType.includes("Venta Libre");

  return (
    <div className="form-group">
      <label>{label}</label>
      <input
        type="text"
        placeholder="Buscar medicamento..."
        value={searchText}
        onChange={(e) => {
          setSearchText(e.target.value);
          setSelectedMed(null);
        }}
      />

      {suggestions.length > 0 && !selectedMed && (
        <ul className="suggestion-list">
          {suggestions.map((med, index) => (
            <li key={index} onClick={() => handleSelect(med)}>
              {med.brandName} – {med.details.saleType}
            </li>
          ))}
        </ul>
      )}

      {selectedMed && !isVentaLibre && (
        <>
          <select
            value={presentation}
            onChange={(e) => setPresentation(e.target.value)}
            required
          >
            <option value="">Seleccionar Presentación</option>
            {getUnique(variants, "presentation").map((p, i) => (
              <option key={i} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={laboratory}
            onChange={(e) => setLaboratory(e.target.value)}
            required
          >
            <option value="">Seleccionar Laboratorio</option>
            {getUnique(variants, "laboratory").map((l, i) => (
              <option key={i} value={l}>{l}</option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}

export default MedicationAutocomplete;
