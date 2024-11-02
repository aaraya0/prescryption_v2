import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Pharmacy = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [patientNidSearch, setPatientNidSearch] = useState(''); // Campo para búsqueda por NID de paciente
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

    // Función para manejar la búsqueda por NID de paciente
    const handleSearch = (e) => {
        setPatientNidSearch(e.target.value);
    };

    // Filtrar recetas por NID del paciente
    const filteredPrescriptions = prescriptions.filter(prescription => 
        prescription.patient.nid.includes(patientNidSearch)
    );

    return (
        <div>
            <h3>Recetas de Farmacia</h3>
            
            {/* Búsqueda por NID del paciente */}
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
                        <strong>Diagnóstico:</strong> {prescription.meds.diagnosis}<br />
                        <strong>Afiliado:</strong> {prescription.insurance.affiliateNum}<br />
                        <strong>Obra Social:</strong> {prescription.insurance.insuranceName}, Plan: {prescription.insurance.insurancePlan}<br />
                        <strong>Médico:</strong> {prescription.doctor.name} {prescription.doctor.surname}, Especialidad: {prescription.doctor.specialty} (NID: {prescription.doctor.nid})<br />
                        <strong>Fecha de Emisión:</strong> {prescription.issueDate}<br />
                        <strong>Fecha de Expiración:</strong> {prescription.expirationDate}<br />
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Pharmacy;
