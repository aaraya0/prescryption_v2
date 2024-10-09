import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Doctor = () => {
    const [recetas, setRecetas] = useState([]);
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

    return (
        <div>
            <h3>Recetas Emitidas</h3>
            <ul>
                {recetas.map((receta, index) => (
                    <li key={index}>
                        <strong>Paciente:</strong> {receta.patientName}<br />
                        <strong>Medicamento 1:</strong> {receta.meds.med1}, Cantidad: {receta.meds.quantity1}<br />
                        <strong>Medicamento 2:</strong> {receta.meds.med2}, Cantidad: {receta.meds.quantity2}<br />
                        <strong>Diagnóstico:</strong> {receta.meds.diagnosis}<br />
                        <strong>Fecha de Emisión:</strong> {new Date(receta.issueDate).toLocaleDateString()}<br />
                        <strong>Fecha de Expiración:</strong> {new Date(receta.expirationDate).toLocaleDateString()}<br />
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Doctor;
