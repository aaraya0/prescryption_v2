// src/components/Doctor.js
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
        .then(response => setRecetas(response.data))
        .catch(error => console.error('Error al obtener las recetas:', error));
    }, [token]);

    return (
        <div>
            <h3>Recetas Emitidas</h3>
            <ul>
                {recetas.map((receta, index) => (
                    <li key={index}>
                        <strong>Paciente:</strong> {receta.nombrePaciente}<br />
                        <strong>Medicamento 1:</strong> {receta.medicamento1}, Cantidad: {receta.cantidad1}<br />
                        <strong>Medicamento 2:</strong> {receta.medicamento2}, Cantidad: {receta.cantidad2}<br />
                        <strong>Diagnóstico:</strong> {receta.diagnostico}<br />
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Doctor;
