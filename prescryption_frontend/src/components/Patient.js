import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Patient = () => {
    const [recetas, setRecetas] = useState([]);
    const token = localStorage.getItem('token');

    useEffect(() => {
        // Obtener recetas del paciente cuando el componente se monta
        axios.get('http://localhost:3001/api/pr_by_patient', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            console.log('Response data:', response.data);  // Verificar la estructura de la respuesta
            // Verificar si response.data.prescriptions existe y es un array
            if (Array.isArray(response.data.prescriptions)) {
                setRecetas(response.data.prescriptions);
            } else {
                setRecetas([]);  // Si no es un array, inicializamos como un array vacío
            }
        })
        .catch(error => console.error('Error al obtener las recetas:', error));
    }, [token]);

    return (
        <div>
            <h3>Mis Recetas</h3>
            <ul>
                {recetas.map((receta, index) => (
                    <li key={index}>
                        <strong>Médico:</strong> {receta.doctorNid}<br />
                        <strong>Medicamento 1:</strong> {receta.med1}, Cantidad: {receta.quantity1}<br />
                        <strong>Medicamento 2:</strong> {receta.med2}, Cantidad: {receta.quantity2}<br />
                        <strong>Diagnóstico:</strong> {receta.diagnosis}<br />
                        <strong>Estado:</strong>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Patient;
