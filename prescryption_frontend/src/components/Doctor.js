import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles.css';

const Doctor = () => {
    const [recetas, setRecetas] = useState([]);
    const [filteredRecetas, setFilteredRecetas] = useState([]);
    const [expandedReceta, setExpandedReceta] = useState(null);
    const [searchPaciente, setSearchPaciente] = useState('');
    const [sortOrder, setSortOrder] = useState('asc');
    const token = localStorage.getItem('token');

    useEffect(() => {
        axios.get('http://localhost:3001/api/pr_by_doctor', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            if (Array.isArray(response.data.prescriptions)) {
                setRecetas(response.data.prescriptions);
                setFilteredRecetas(response.data.prescriptions);
            } else {
                setRecetas([]);
                setFilteredRecetas([]);
            }
        })
        .catch(error => console.error('Error al obtener las recetas:', error));
    }, [token]);

    useEffect(() => {
        let filtered = recetas.filter(receta => 
            receta.patientName.toLowerCase().includes(searchPaciente.toLowerCase()) ||
            (receta.patientSurname && receta.patientSurname.toLowerCase().includes(searchPaciente.toLowerCase())) ||
            (receta.patientNid && receta.patientNid.toString().includes(searchPaciente))
        );
        
        filtered = filtered.sort((a, b) => {
            const dateA = new Date(a.issueDate);
            const dateB = new Date(b.issueDate);
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

        setFilteredRecetas(filtered);
    }, [searchPaciente, sortOrder, recetas]);

    const toggleReceta = (index) => {
        setExpandedReceta(expandedReceta === index ? null : index);
    };

    return (
        <div className="receta-list-container">
            <h4>Recetas Emitidas</h4>
            
            {/* Filtros con descripciones */}
            <div className="filter-container">
                <div className="filter-item">
                    <label>Buscar por paciente (nombre, apellido, DNI):</label>
                    <input
                        type="text"
                        placeholder="Nombre, Apellido o DNI"
                        value={searchPaciente}
                        onChange={(e) => setSearchPaciente(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="filter-item">
                    <label>Ordenar por fecha:</label>
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="sort-select"
                    >
                        <option value="asc">Ascendente</option>
                        <option value="desc">Descendente</option>
                    </select>
                </div>
            </div>

            <ul className="receta-list">
                {filteredRecetas.map((receta, index) => (
                    <li key={index} className="receta-item">
                        <div className="receta-box" onClick={() => toggleReceta(index)}>
                            <div className="receta-header">
                                <strong>Paciente:</strong> {receta.patientName || 'N/A'} {receta.patientSurname || 'N/A'} <br />
                                <strong>DNI:</strong> {receta.patientNid || 'N/A'}
                            </div>
                            {expandedReceta === index && (
                                <div className="receta-details">
                                    {receta.meds && typeof receta.meds === 'object' ? (
                                        <>
                                            <p><strong>Medicamento 1:</strong> {receta.meds.med1 || 'N/A'}, Cantidad: {receta.meds.quantity1 || 'N/A'}</p>
                                            <p><strong>Medicamento 2:</strong> {receta.meds.med2 || 'N/A'}, Cantidad: {receta.meds.quantity2 || 'N/A'}</p>
                                            <p><strong>Diagnóstico:</strong> {receta.meds.diagnosis || 'N/A'}</p>
                                        </>
                                    ) : (
                                        <p>No se encontraron detalles de medicamentos.</p>
                                    )}
                                    <p><strong>Fecha de Emisión:</strong> {receta.issueDate ? new Date(receta.issueDate).toLocaleDateString() : 'N/A'}</p>
                                    <p><strong>Fecha de Expiración:</strong> {receta.expirationDate ? new Date(receta.expirationDate).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Doctor;
