import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Patient = () => {
    const [recetas, setRecetas] = useState([]);
    const [alias, setAlias] = useState(''); 
    const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(null);
    const token = localStorage.getItem('token');
    const [deletedPrescriptions, setDeletedPrescriptions] = useState(
        JSON.parse(localStorage.getItem('deletedPrescriptions')) || []
    );
    const [showDeleted, setShowDeleted] = useState(false); // Estado para alternar entre mostrar o no las recetas eliminadas

    useEffect(() => {
        axios.get('http://localhost:3001/api/pr_by_patient', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            if (Array.isArray(response.data.prescriptions)) {
                let filteredPrescriptions = response.data.prescriptions;
                if (!showDeleted) {
                    filteredPrescriptions = filteredPrescriptions.filter(
                        receta => !deletedPrescriptions.includes(receta.prescriptionId)
                    );
                }
                setRecetas(filteredPrescriptions);
            } else {
                setRecetas([]);
            }
        })
        .catch(error => console.error('Error al obtener las recetas:', error));
    }, [token, deletedPrescriptions, showDeleted]);

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
        } catch (error) {
            console.error('Error al transferir la receta:', error);
            alert('Error al transferir la receta.');
        }
    };

    const handleDelete = (prescriptionId) => {
        const updatedDeletedPrescriptions = [...deletedPrescriptions, prescriptionId];
        setDeletedPrescriptions(updatedDeletedPrescriptions);
        localStorage.setItem('deletedPrescriptions', JSON.stringify(updatedDeletedPrescriptions));

        setRecetas(recetas.filter(receta => receta.prescriptionId !== prescriptionId));
    };

    // Función para restaurar las recetas eliminadas
    const restoreDeletedPrescriptions = () => {
        setShowDeleted(!showDeleted);
    };

    return (
        <div>
            <h3>Mis Recetas</h3>
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
                        
                        {receta.status === "Expirada" ? (
                            <button onClick={() => handleDelete(receta.prescriptionId)}>Eliminar</button>
                        ) : (
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
            <button onClick={restoreDeletedPrescriptions}>
                {showDeleted ? 'Ocultar Recetas Eliminadas' : 'Mostrar Recetas Eliminadas'}
            </button>
        </div>
    );
};

export default Patient;
