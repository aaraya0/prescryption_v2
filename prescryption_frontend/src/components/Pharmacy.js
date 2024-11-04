import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PrescriptionValidation from './PrescriptionValidation';
import '../styles/Pharmacy.css';

const Pharmacy = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [patientNidSearch, setPatientNidSearch] = useState('');
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const token = localStorage.getItem('token');

    const fetchPrescriptions = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/pr_by_pharmacy', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPrescriptions(response.data.prescriptions || []);
        } catch (error) {
            console.error('Error al obtener las recetas:', error);
        }
    };

    useEffect(() => {
        fetchPrescriptions();
    }, [token]);

    const handleSearch = (e) => {
        setPatientNidSearch(e.target.value);
    };

    const handleValidate = (prescription) => {
        setSelectedPrescription(prescription);
    };

    const handleCloseModal = () => {
        setSelectedPrescription(null);
        fetchPrescriptions(); // Refresca la lista de recetas
    };

    const filteredPrescriptions = prescriptions.filter(prescription => 
        prescription.patient.nid.includes(patientNidSearch)
    );

    return (
        <div className="pharmacy-dashboard">
            <h3>Recetas de Farmacia</h3>
            <label>
                Buscar por NID del Paciente:
                <input 
                    type="text" 
                    value={patientNidSearch} 
                    onChange={handleSearch} 
                    placeholder="Ingrese NID del paciente" 
                    className="search-input"
                />
            </label>

            <ul className="prescription-list">
                {filteredPrescriptions.map((prescription, index) => (
                    <li key={index} className="prescription-item">
                        <strong>ID de Receta:</strong> {prescription.prescriptionId}<br />
                        <strong>Paciente:</strong> {prescription.patient.name} {prescription.patient.surname} (NID: {prescription.patient.nid})<br />
                        <strong>Medicamento 1:</strong> {prescription.meds.med1}, Cantidad: {prescription.meds.quantity1}<br />
                        <strong>Medicamento 2:</strong> {prescription.meds.med2}, Cantidad: {prescription.meds.quantity2}<br />
                        {prescription.used ? (
                            <div>
                                <span className="status-dispensada">Dispensada</span>
                                {prescription.invoiceNumber && (
                                    <div>
                                        <strong>Número de Factura:</strong> {prescription.invoiceNumber}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button className="validate-button" onClick={() => handleValidate(prescription)}>Validar Receta</button>
                        )}
                    </li>
                ))}
            </ul>

            {selectedPrescription && (
                <PrescriptionValidation 
                    prescription={selectedPrescription} 
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

export default Pharmacy;
