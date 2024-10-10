const Pharmacy = require('./models/Pharmacy');
const Patient = require('./models/Patient'); // Asegúrate de tener el modelo Patient importado

exports.sendPrescriptionToPharmacy = async (req, res) => {
    const { alias, prescriptionId } = req.body;
    const patientNid = req.user; // NID del paciente

    try {
        // Buscar la farmacia por alias
        const pharmacy = await Pharmacy.findOne({ alias });
        if (!pharmacy) {
            return res.status(404).json({ message: 'Pharmacy not found' });
        }

        // Buscar la dirección del paciente usando su NID
        const patient = await Patient.findOne({ nid: patientNid });
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        const patientAddress = patient.address; // Obtener la dirección del paciente

        // 1. Buscar la receta en la blockchain usando su ID
        const prescriptionData = await prescriptionContract.methods
            .getPrescription(prescriptionId) // Asegúrate de que esta función exista en tu contrato
            .call();
        
        if (!prescriptionData) {
            return res.status(404).json({ message: 'Prescription not found in blockchain' });
        }

        // 2. Modificar la receta agregando la dirección de la farmacia
        const updatedPrescription = {
            ...prescriptionData,
            pharmacyAddress: pharmacy.address // Agregar el nuevo campo
        };

        // 3. Enviar la receta modificada de nuevo a la blockchain
        const receipt = await prescriptionContract.methods
            .updatePrescription(prescriptionId, updatedPrescription) // Asegúrate de que esta función exista en tu contrato
            .send({ from: patientAddress });

        if (receipt.status) {
            res.json({ message: 'Prescription sent to pharmacy', transactionHash: receipt.transactionHash });
        } else {
            res.status(500).json({ message: 'Error sending prescription' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error sending prescription', error: error.message });
    }
};
