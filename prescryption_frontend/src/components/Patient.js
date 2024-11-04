import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const Patient = () => {
    const [recetas, setRecetas] = useState([]);
    const [alias, setAlias] = useState('');
    const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(null);
    const token = localStorage.getItem('token');
    const [statusFilter, setStatusFilter] = useState('');
    const [specialtyFilter, setSpecialtyFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('asc');
    const [availableSpecialties, setAvailableSpecialties] = useState([]);
    const navigate = useNavigate();

    // Actualizar recetas periódicamente
    useEffect(() => {
        const fetchPrescriptions = async () => {
            try {
                const response = await axios.get('http://localhost:3001/api/pr_by_patient', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                let filteredPrescriptions = response.data.prescriptions;

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
            } catch (error) {
                console.error('Error al obtener las recetas:', error);
            }
        };

        fetchPrescriptions();
        const intervalId = setInterval(fetchPrescriptions, 10000);

        return () => clearInterval(intervalId);
    }, [token, specialtyFilter, statusFilter, sortOrder]);

    // Establecer la cookie al enviar la receta
    const handleTransfer = (prescriptionId) => {
        setSelectedPrescriptionId(prescriptionId);
        Cookies.set(`pendingPrescription_${prescriptionId}`, 'true', { expires: 1 / 720 }); // 2 minutos
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPrescriptionId || !alias) return;

        try {
            await axios.post('http://localhost:3001/api/pr_to_pharmacy', {
                alias,
                prescriptionId: selectedPrescriptionId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setRecetas(prevRecetas =>
                prevRecetas.filter(receta => receta.prescriptionId !== selectedPrescriptionId)
            );

            alert('Receta transferida a la farmacia.');
            setAlias('');
            setSelectedPrescriptionId(null);
            navigate('/dashboard/patient');
        } catch (error) {
            console.error('Error al transferir la receta:', error);
            alert('Error al transferir la receta.');
        }
    };

    // Verificar y eliminar recetas expiradas
    useEffect(() => {
        const checkPendingPrescriptions = async () => {
            recetas.forEach(async receta => {
                if (Cookies.get(`pendingPrescription_${receta.prescriptionId}`)) {
                    try {
                        const response = await axios.get(`http://localhost:3001/api/pr_by_patient`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });

                        const prescription = response.data.prescriptions.find(p => p.prescriptionId === receta.prescriptionId);

                        // Si la receta todavía es "Valid", restablece la dirección de la farmacia
                        if (prescription && prescription.status === "Valid") {
                            await axios.post('http://localhost:3001/api/address_reset', {
                                prescriptionId: receta.prescriptionId
                            }, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            Cookies.remove(`pendingPrescription_${receta.prescriptionId}`);
                            setRecetas(prevRecetas =>
                                prevRecetas.map(r => 
                                    r.prescriptionId === receta.prescriptionId ? { ...r, status: "Valid" } : r
                                )
                            );
                        }
                    } catch (error) {
                        console.error('Error al verificar receta pendiente:', error);
                    }
                }
            });
        };

        const intervalId = setInterval(checkPendingPrescriptions, 10000);
        return () => clearInterval(intervalId);
    }, [recetas, token]);

    return (
        <div>
            <h3>Mis Recetas</h3>
            
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

            <ul>
                {recetas.map((receta, index) => (
                    <li key={index}>
                        <strong>Médico:</strong> {receta.doctorName} ({receta.doctorSpecialty})<br />
                        <strong>Medicamento 1:</strong> {receta.meds.med1}, Cantidad: {receta.meds.quantity1}<br />
                        <strong>Medicamento 2:</strong> {receta.meds.med2}, Cantidad: {receta.meds.quantity2}<br />
                        <strong>Diagnóstico:</strong> {receta.meds.diagnosis}<br />
                        <strong>Estado:</strong> {receta.status}<br />
                        <strong>Fecha de Emisión:</strong> {receta.issueDate}<br />
                        <strong>Fecha de Expiración:</strong> {receta.expirationDate}<br />
                        
                        {!Cookies.get(`pendingPrescription_${receta.prescriptionId}`) && receta.status === "Valid" && (
                            <button onClick={() => handleTransfer(receta.prescriptionId)}>Transferir Receta</button>
                        )}
                    </li>
                ))}
            </ul>

            {selectedPrescriptionId && (
                <form onSubmit={handleSubmit}>
                    <h4>Transferir Receta ID: {selectedPrescriptionId}</h4>
                    <label>
                        Alias de la Farmacia:
                        <input 
                            type="text" 
                            value={alias} 
                            onChange={(e) => setAlias(e.target.value)} 
                            required 
                        />
                    </label>
                    <button type="submit">Enviar</button>
                </form>
            )}
        </div>
    );
};

export default Patient;
