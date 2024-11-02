import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles.css';

const Doctor = () => {
    const [recetas, setRecetas] = useState([]);
    const [expandedReceta, setExpandedReceta] = useState(null); // Estado para controlar qué receta está expandida
    const token = localStorage.getItem('token');

    useEffect(() => {
        // Obtener recetas del médico cuando el componente se monta
        axios.get('http://localhost:3001/api/pr_by_doctor', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            console.log('Response data:', response.data);
            if (Array.isArray(response.data.prescriptions)) {
                setRecetas(response.data.prescriptions);
            } else {
                setRecetas([]);
            }
        })
        .catch(error => console.error('Error al obtener las recetas:', error));
    }, [token]);

    // Función para alternar la expansión de una receta
    const toggleReceta = (index) => {
        setExpandedReceta(expandedReceta === index ? null : index);
    };

    return (
        <div className="receta-list-container">
            <h3>Recetas Emitidas</h3>
            <ul className="receta-list">
                {recetas.map((receta, index) => (
                    <li key={index} className="receta-item">
                        <div className="receta-header" onClick={() => toggleReceta(index)}>
                            <strong>Paciente:</strong> {receta.patientName}
                        </div>
                        {expandedReceta === index && ( // Mostrar solo si está expandida
                            <div className="receta-details">
                                <p><strong>Medicamento 1:</strong> {receta.meds.med1}, Cantidad: {receta.meds.quantity1}</p>
                                <p><strong>Medicamento 2:</strong> {receta.meds.med2}, Cantidad: {receta.meds.quantity2}</p>
                                <p><strong>Diagnóstico:</strong> {receta.meds.diagnosis}</p>
                                <p><strong>Fecha de Emisión:</strong> {new Date(receta.issueDate).toLocaleDateString()}</p>
                                <p><strong>Fecha de Expiración:</strong> {new Date(receta.expirationDate).toLocaleDateString()}</p>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Doctor;
