import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Patient = () => {
    const [recetas, setRecetas] = useState([]);
    const [alias, setAlias] = useState(''); // Estado para almacenar el alias de la farmacia
    const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(null); // Estado para almacenar el ID de la receta seleccionada
    const token = localStorage.getItem('token');

    useEffect(() => {
        // Obtener recetas del paciente cuando el componente se monta
        axios.get('http://localhost:3001/api/pr_by_patient', {
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

    const handleTransfer = async (prescriptionId) => {
        setSelectedPrescriptionId(prescriptionId); // Almacena el ID de la receta seleccionada
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPrescriptionId || !alias) return; // Verifica que se haya seleccionado una receta y se haya ingresado un alias

        try {
            const response = await axios.post('http://localhost:3001/api/pr_to_pharmacy', {
                alias,
                prescriptionId: selectedPrescriptionId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Receta transferida a la farmacia. Transacción hash: ' + response.data.transactionHash);
            setAlias(''); // Reiniciar el alias después de la transferencia
            setSelectedPrescriptionId(null); // Reiniciar la receta seleccionada
        } catch (error) {
            console.error('Error al transferir la receta:', error);
            alert('Error al transferir la receta.');
        }
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
                        <button onClick={() => handleTransfer(receta.prescriptionId)}>Transferir Receta</button>
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
