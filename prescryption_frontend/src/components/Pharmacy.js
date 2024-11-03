import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PrescriptionValidation from './PrescriptionValidation'; // Importar componente de validación de receta

const Pharmacy = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [patientNidSearch, setPatientNidSearch] = useState('');
    const [selectedPrescription, setSelectedPrescription] = useState(null); // Para la receta seleccionada
    const [token] = useState(localStorage.getItem('token'));

    useEffect(() => {
        axios.get('http://localhost:3001/api/pr_by_pharmacy', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            if (Array.isArray(response.data.prescriptions)) {
                setPrescriptions(response.data.prescriptions);
            } else {
                setPrescriptions([]);
            }
        })
        .catch(error => console.error('Error al obtener las recetas:', error));
    }, [token]);

    const handleSearch = (e) => {
        setPatientNidSearch(e.target.value);
    };

    const handleValidate = (prescription) => {
        setSelectedPrescription(prescription); // Establece la receta seleccionada para validación
    };

    const filteredPrescriptions = prescriptions.filter(prescription => 
        prescription.patient.nid.includes(patientNidSearch)
    );

    return (
        <div>
            <h3>Recetas de Farmacia</h3>
            
            <label>
                Buscar por NID del Paciente:
                <input 
                    type="text" 
                    value={patientNidSearch} 
                    onChange={handleSearch} 
                    placeholder="Ingrese NID del paciente" 
                />
            </label>

            <ul>
                {filteredPrescriptions.map((prescription, index) => (
                    <li key={index}>
                        <strong>ID de Receta:</strong> {prescription.prescriptionId}<br />
                        <strong>Paciente:</strong> {prescription.patient.name} {prescription.patient.surname} (NID: {prescription.patient.nid})<br />
                        <strong>Medicamento 1:</strong> {prescription.meds.med1}, Cantidad: {prescription.meds.quantity1}<br />
                        <strong>Medicamento 2:</strong> {prescription.meds.med2}, Cantidad: {prescription.meds.quantity2}<br />
                        <button onClick={() => handleValidate(prescription)}>Validar Receta</button>
                    </li>
                ))}
            </ul>

            {selectedPrescription && (
                <PrescriptionValidation prescription={selectedPrescription} />
            )}
        </div>
    );
};

export default Pharmacy;
