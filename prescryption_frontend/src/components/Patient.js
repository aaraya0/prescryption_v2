import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { Modal, Button, Form, Accordion } from 'react-bootstrap';
import '../styles/Patient.css';

const Patient = () => {
    const [recetas, setRecetas] = useState([]);
    const [pharmacyNid, setPharmacyNid] = useState('');
    const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const token = localStorage.getItem('token');
    const [statusFilter, setStatusFilter] = useState('');
    const [specialtyFilter, setSpecialtyFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('asc');
    const [availableSpecialties, setAvailableSpecialties] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPrescriptions = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:3001/api/patients/prescriptions', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                let filteredPrescriptions = Array.isArray(response.data) ? response.data : [];

                const specialties = [...new Set(filteredPrescriptions.map(receta => receta.doctorSpecialty))];
                setAvailableSpecialties(specialties);

                if (specialtyFilter) {
                    filteredPrescriptions = filteredPrescriptions.filter(
                        receta => receta.doctorSpecialty === specialtyFilter
                    );
                }

                if (statusFilter) {
                    filteredPrescriptions = filteredPrescriptions.filter(
                        receta => receta.status === statusFilter
                    );
                }

                filteredPrescriptions = filteredPrescriptions.sort((a, b) => {
                    const dateA = new Date(a.issueDate.split('/').reverse().join('-'));
                    const dateB = new Date(b.issueDate.split('/').reverse().join('-'));
                    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
                });

                setRecetas(filteredPrescriptions);
                setError('');
            } catch (error) {
                console.error('Error al obtener las recetas:', error);
                setError('Error al obtener tus recetas. Intentalo más tarde.');
            } finally {
                setLoading(false);
            }
        };

        fetchPrescriptions();
        const intervalId = setInterval(fetchPrescriptions, 10000);

        return () => clearInterval(intervalId);
    }, [token, specialtyFilter, statusFilter, sortOrder]);

    const handleTransfer = (prescriptionId) => {
        setSelectedPrescriptionId(prescriptionId);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPrescriptionId || !pharmacyNid) return;

        try {
            await axios.post('http://localhost:3001/api/patients/send_prescription', {
                pharmacyNid,
                prescriptionId: selectedPrescriptionId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowModal(false);
            setPharmacyNid('');
            setSelectedPrescriptionId(null);

            Cookies.set(`pendingPrescription_${selectedPrescriptionId}`, 'true', { expires: 1 / 720 }); 
            navigate('/dashboard/patient');
        } catch (error) {
            console.error('Error al transferir la receta:', error);
            alert('Error al transferir la receta.');
        }
    };

    useEffect(() => {
        const checkPendingPrescriptions = () => {
            setRecetas(prevRecetas =>
                prevRecetas.map((receta) => {
                    const isPending = Cookies.get(`pendingPrescription_${receta.prescriptionId}`);
                    return {
                        ...receta,
                        isPending: Boolean(isPending)
                    };
                })
            );
        };

        const intervalId = setInterval(checkPendingPrescriptions, 10000); 
        return () => clearInterval(intervalId);
    }, []);

    const getStatusClass = (status) => {
        switch (status) {
            case 'Valid': return 'status-valid';
            case 'Expired': return 'status-expired';
            case 'Dispensed': return 'status-dispensed';
            default: return '';
        }
    };

    const formatDate = (isoDate) => {
        if (!isoDate) return 'N/A';
        const date = new Date(isoDate);
        return date.toLocaleDateString('es-AR');
    };

    if (loading) return <p className="perfil-loading">Cargando recetas...</p>;
    if (error) return <p className="perfil-error">{error}</p>;
    if (recetas.length === 0) return (
        <div className="no-recetas-container">
            <p className="no-recetas-text">
                Todavía no tenés recetas emitidas.<br />
            </p>
        </div>
    );
    

    return (
        <div className="receta-list-container">
            <h3>Mis Recetas</h3>

            <div className="filtros-container">
                <label>
                    Filtrar por Especialidad:
                    <select value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)}>
                        <option value="">Todas</option>
                        {availableSpecialties.map((specialty, index) => (
                            <option key={index} value={specialty}>{specialty}</option>
                        ))}
                    </select>
                </label>

                <label>
                    Filtrar por Estado:
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">Todos</option>
                        <option value="Valid">Válido</option>
                        <option value="Expired">Expirada</option>
                        <option value="Dispensed">Dispensada</option>
                    </select>
                </label>

                <label>
                    Ordenar por Fecha de Emisión:
                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                        <option value="asc">Ascendente</option>
                        <option value="desc">Descendente</option>
                    </select>
                </label>
            </div>

            <Accordion defaultActiveKey="">
                {recetas.map((receta, index) => (
                    <Accordion.Item eventKey={index.toString()} key={index} className="receta-item">
                        <Accordion.Header>
                            <div style={{ width: '100%' }}>
                                <strong>Médico:</strong> {receta.doctorName} {receta.doctorSurname} ({receta.doctorSpecialty}) | <strong>Estado:</strong> <span className={getStatusClass(receta.status)}>{receta.status}</span> | <strong>Fecha:</strong> {formatDate(receta.issueDate)}
                            </div>
                        </Accordion.Header>
                        <Accordion.Body className="receta-details">
                            <p><strong>Médico NID:</strong> {receta.doctorNid}</p>
                            <p><strong>Medicamento 1:</strong> {receta.meds.med1}, Cantidad: {receta.meds.quantity1}</p>
                            {receta.meds.med2 !== 'N/A' && receta.meds.quantity2 > 0 && (
                                <p><strong>Medicamento 2:</strong> {receta.meds.med2}, Cantidad: {receta.meds.quantity2}</p>
                            )}
                            <p><strong>Diagnóstico:</strong> {receta.meds.diagnosis}</p>
                            {receta.meds.observations && receta.meds.observations.trim() !== '' && (
                                <p><strong>Observaciones:</strong> {receta.meds.observations}</p>
                            )}
                            <p><strong>Fecha de Expiración:</strong> {formatDate(receta.expirationDate)}</p>

                            {!receta.isPending && receta.status === "Valid" && (
                                <button className="button_t" onClick={() => handleTransfer(receta.prescriptionId)}>
                                    Transferir Receta
                                </button>
                            )}
                        </Accordion.Body>
                    </Accordion.Item>
                ))}
            </Accordion>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Transferir Receta ID: {selectedPrescriptionId}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group controlId="alias">
                            <Form.Label>Alias de la Farmacia:</Form.Label>
                            <Form.Control
                                type="text"
                                value={pharmacyNid}
                                onChange={(e) => setPharmacyNid(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Button variant="primary" type="submit" className="mt-3">
                            Enviar
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Patient;
