import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles.css';

const Doctor = () => {
    const [recetas, setRecetas] = useState([]);
    const [selectedReceta, setSelectedReceta] = useState(null); // Estado para la receta seleccionada para mostrar en el modal
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

    // Función para manejar el clic en una receta y mostrar el modal
    const handleRecetaClick = (receta) => {
        setSelectedReceta(receta);
    };

    // Función para cerrar el modal
    const closeModal = () => {
        setSelectedReceta(null);
    };

    return (
        <div className="receta-list-container">
            <h3>Recetas Emitidas</h3>
            <table className="recetas-table">
                <thead>
                    <tr>
                        <th>Obra Social</th>
                        <th>Nombre y Apellido</th>
                        <th>Fecha de Emisión</th>
                    </tr>
                </thead>
                <tbody>
                    {recetas.map((receta, index) => (
                        <tr key={index} onClick={() => handleRecetaClick(receta)}>
                            <td>{receta.insuranceName}</td>
                            <td>{receta.patientName}</td>
                            <td>{new Date(receta.issueDate).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Modal para mostrar detalles completos de la receta seleccionada */}
            {selectedReceta && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={closeModal}>&times;</span>
                        <h3>Detalles de la Receta</h3>
                        <p><strong>Paciente:</strong> {selectedReceta.patientName}</p>
                        <p><strong>Obra Social:</strong> {selectedReceta.insuranceName}</p>
                        <p><strong>Plan:</strong> {selectedReceta.insurancePlan}</p>
                        <p><strong>Diagnóstico:</strong> {selectedReceta.meds.diagnosis}</p>
                        <p><strong>Fecha de Emisión:</strong> {new Date(selectedReceta.issueDate).toLocaleDateString()}</p>
                        <p><strong>Fecha de Expiración:</strong> {new Date(selectedReceta.expirationDate).toLocaleDateString()}</p>
                        <p><strong>Medicamento 1:</strong> {selectedReceta.meds.med1}, <strong>Cantidad:</strong> {selectedReceta.meds.quantity1}</p>
                        <p><strong>Medicamento 2:</strong> {selectedReceta.meds.med2}, <strong>Cantidad:</strong> {selectedReceta.meds.quantity2}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Doctor;
