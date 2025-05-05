// PharmacyUser.js mejorado con opción de gestionar usuarios para admin y validar recetas

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Accordion, Modal, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import '../styles/Pharmacy.css';
import { jwtDecode } from 'jwt-decode';

const PharmacyUser = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('nid');
    const [sortOrder, setSortOrder] = useState('asc');
    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    const decoded = token ? jwtDecode(token) : {};
    const isAdmin = decoded.role === 'admin';

    const [showValidationModal, setShowValidationModal] = useState(false);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [medOptions, setMedOptions] = useState([]);
    const [selectedMedicationIds, setSelectedMedicationIds] = useState([]);

    const fetchPrescriptions = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/pharmacies/prescriptions', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPrescriptions(response.data.prescriptions || []);
        } catch (error) {
            console.error('Error al obtener las recetas para el usuario de farmacia:', error);
        }
    };

    useEffect(() => {
        fetchPrescriptions();
    }, [token]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleOpenValidationModal = async (prescription) => {
        try {
            const response = await axios.get(`http://localhost:3001/api/pharmacies/medications/search/${prescription.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMedOptions(response.data.results);
            setSelectedPrescription(prescription);
            setShowValidationModal(true);
        } catch (error) {
            console.error("Error al obtener opciones de medicamento:", error);
        }
    };

    const handleValidatePrescription = async (e) => {
        e.preventDefault();
        if (!selectedPrescription || selectedMedicationIds.length === 0) return;

        try {
            const response = await axios.post('http://localhost:3001/api/pharmacies/validate_prescription', {
                prescriptionId: selectedPrescription.id,
                selectedMedicationIds
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('✅ Receta validada exitosamente.');
            setShowValidationModal(false);
            setSelectedPrescription(null);
            setSelectedMedicationIds([]);
            fetchPrescriptions();
        } catch (error) {
            console.error("❌ Error validando receta:", error);
            alert('❌ Error al validar la receta.');
        }
    };

    const filteredPrescriptions = prescriptions.filter(prescription => {
        if (searchType === 'nid') {
            return prescription.patientNid.includes(searchTerm);
        } else if (searchType === 'insurance') {
            return prescription.insurance?.insuranceName?.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return true;
    }).sort((a, b) => {
        const dateA = new Date(a.issueDate);
        const dateB = new Date(b.issueDate);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    const formatDate = (isoDate) => {
        if (!isoDate) return 'N/A';
        const date = new Date(isoDate);
        return date.toLocaleDateString('es-AR');
    };

    return (
        <div className="receta-list-container pharmacyuser-menu">
            <h3>Recetas Asignadas</h3>

            <div className="filtros-container">
                <label>
                    Buscar por:
                    <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
                        <option value="nid">NID del Paciente</option>
                        <option value="insurance">Obra Social</option>
                    </select>
                </label>

                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder={searchType === 'nid' ? 'Ingrese NID del paciente' : 'Ingrese nombre de la obra social'}
                    className="search-input"
                />

                <label>
                    Ordenar por Fecha de Emisión:
                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                        <option value="asc">Ascendente</option>
                        <option value="desc">Descendente</option>
                    </select>
                </label>

                {isAdmin && (
                    <button className="dashboard-button" onClick={() => navigate('/pharmacy/manage-users')}>
                        Gestionar Usuarios
                    </button>
                )}
            </div>

            <div className="receta-scroll">
                {filteredPrescriptions.length === 0 ? (
                    <p>No hay recetas asignadas aún.</p>
                ) : (
                    <Accordion defaultActiveKey="">
                        {filteredPrescriptions.map((prescription, index) => (
                            <Accordion.Item eventKey={index.toString()} key={index} className="receta-item">
                                <Accordion.Header>
                                    <div className="receta-header-info">
                                        <strong>Paciente:</strong> {prescription.patientName} {prescription.patientSurname} 
                                        <strong> DNI:</strong> {prescription.patientNid} 
                                        <strong> Obra Social:</strong> {prescription.insurance?.insuranceName || 'N/A'}
                                        <strong> Fecha de Emisión:</strong> {formatDate(prescription.issueDate)}
                                    </div>
                                </Accordion.Header>
                                <Accordion.Body className="receta-details">
                                    <p><strong>Medicamento:</strong> {prescription.meds.med1}</p>
                                    <p><strong>Cantidad:</strong> {prescription.meds.quantity1}</p>
                                    {prescription.meds.med2 !== 'N/A' && prescription.meds.quantity2 > 0 && (
                                        <>
                                            <p><strong>Medicamento:</strong> {prescription.meds.med2}</p>
                                            <p><strong>Cantidad:</strong> {prescription.meds.quantity2}</p>
                                        </>
                                    )}
                                    <p><strong>Diagnóstico:</strong> {prescription.meds.diagnosis}</p>
                                    {prescription.meds.observations && prescription.meds.observations.trim() !== '' && (
                                        <p><strong>Observaciones:</strong> {prescription.meds.observations}</p>
                                    )}
                                    <p><strong>Estado:</strong> {prescription.used ? (
                                        <span className="status-dispensada">Dispensada</span>
                                    ) : (
                                        <span className="status-valid">Válida</span>
                                    )}</p>
                                    <p><strong>Fecha de Expiración:</strong> {formatDate(prescription.expirationDate)}</p>

                                    {!prescription.used && (
                                        <button
                                            className="validate-button"
                                            onClick={() => handleOpenValidationModal(prescription)}
                                        >
                                            Validar Receta
                                        </button>
                                    )}
                                </Accordion.Body>
                            </Accordion.Item>
                        ))}
                    </Accordion>
                )}
            </div>

            <Modal show={showValidationModal} onHide={() => setShowValidationModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Validar Receta ID: {selectedPrescription?.id}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleValidatePrescription}>
                        {medOptions.map((med) => (
                            <Form.Check 
                                key={med._id}
                                type="checkbox"
                                label={`${med.genericName} - $${med.price}`}
                                value={med._id}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    const id = e.target.value;
                                    setSelectedMedicationIds((prev) =>
                                        checked ? [...prev, id] : prev.filter((m) => m !== id)
                                    );
                                }}
                            />
                        ))}
                        <Button type="submit" className="mt-3">Confirmar Validación</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default PharmacyUser;