import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Patient = () => {
    const [recetas, setRecetas] = useState([]);
    const [alias, setAlias] = useState('');
    const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(null);
    const token = localStorage.getItem('token');
    const [statusFilter, setStatusFilter] = useState(''); // Filtro por estado
    const [specialtyFilter, setSpecialtyFilter] = useState(''); // Filtro por especialidad
    const [sortOrder, setSortOrder] = useState('asc'); // Orden por fecha
    const [availableSpecialties, setAvailableSpecialties] = useState([]); // Almacenar las especialidades disponibles
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('http://localhost:3001/api/pr_by_patient', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            if (Array.isArray(response.data.prescriptions)) {
                let filteredPrescriptions = response.data.prescriptions;

                // Obtener todas las especialidades disponibles de las recetas
                const specialties = [...new Set(filteredPrescriptions.map(receta => receta.doctorSpecialty))];
                setAvailableSpecialties(specialties);

                // Filtrar por especialidad si está seleccionado
                if (specialtyFilter) {
                    filteredPrescriptions = filteredPrescriptions.filter(
                        receta => receta.doctorSpecialty === specialtyFilter
                    );
                }

                // Filtrar por estado si está seleccionado
                if (statusFilter) {
                    filteredPrescriptions = filteredPrescriptions.filter(
                        receta => receta.status === statusFilter
                    );
                }

                // Ordenar por fecha de emisión
                filteredPrescriptions = filteredPrescriptions.sort((a, b) => {
                    const dateA = new Date(a.issueDate.split('/').reverse().join('-'));
                    const dateB = new Date(b.issueDate.split('/').reverse().join('-'));
                    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
                });

                setRecetas(filteredPrescriptions);
            } else {
                setRecetas([]);
            }
        })
        .catch(error => console.error('Error al obtener las recetas:', error));
    }, [token, specialtyFilter, statusFilter, sortOrder]);

    const handleTransfer = async (prescriptionId) => {
        setSelectedPrescriptionId(prescriptionId);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPrescriptionId || !alias) return;

        try {
            const response = await axios.post('http://localhost:3001/api/pr_to_pharmacy', {
                alias,
                prescriptionId: selectedPrescriptionId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Receta transferida a la farmacia. Transacción hash: ' + response.data.transactionHash);
            setAlias('');
            setSelectedPrescriptionId(null);
            navigate('/dashboard/patient');
        } catch (error) {
            console.error('Error al transferir la receta:', error);
            alert('Error al transferir la receta.');
        }
    };

    return (
        <div>
            <h3>Mis Recetas</h3>
            
            {/* Filtro por especialidad */}
            <label>
                Filtrar por Especialidad:
                <select value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)}>
                    <option value="">Todas</option>
                    {availableSpecialties.map((specialty, index) => (
                        <option key={index} value={specialty}>{specialty}</option>
                    ))}
                </select>
            </label>

            {/* Filtro por estado */}
            <label>
                Filtrar por Estado:
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">Todos</option>
                    <option value="Valid">Válido</option>
                    <option value="Expired">Expirada</option>
                    <option value="Dispensed">Dispensada</option>
                </select>
            </label>

            {/* Ordenar por fecha */}
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
                        
                        {receta.status !== "Dispensed" && (
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
