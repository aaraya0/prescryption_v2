import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles.css';

const Doctor = () => {
    const [recetas, setRecetas] = useState([]);
    const [filteredRecetas, setFilteredRecetas] = useState([]);
    const [expandedReceta, setExpandedReceta] = useState(null);
    const [searchPaciente, setSearchPaciente] = useState('');
    const [sortOrder, setSortOrder] = useState('asc'); // asc o desc
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
        // Filtrar y ordenar recetas cada vez que cambian el paciente o el orden
        let filtered = recetas.filter(receta => 
            receta.patientName.toLowerCase().includes(searchPaciente.toLowerCase())
        );
        
        // Ordenar las recetas por fecha de emisión
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
            <h3>Recetas Emitidas</h3>
            
            {/* Filtros */}
            <div className="filter-container">
                <input
                    type="text"
                    placeholder="Buscar por paciente"
                    value={searchPaciente}
                    onChange={(e) => setSearchPaciente(e.target.value)}
                    className="search-input"
                />
                <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="sort-select"
                >
                    <option value="asc">Fecha Ascendente</option>
                    <option value="desc">Fecha Descendente</option>
                </select>
            </div>

            <ul className="receta-list">
                {filteredRecetas.map((receta, index) => (
                    <li key={index} className="receta-item">
                        <div className="receta-box" onClick={() => toggleReceta(index)}>
                            <div className="receta-header">
                                <strong>Paciente:</strong> {receta.patientName || 'N/A'}
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
