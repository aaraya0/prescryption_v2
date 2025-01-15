const axios = require('axios');

exports.generateInvoice = async (prescriptionId, patientName, validatedMeds) => {
    const totalPrice = validatedMeds.reduce((sum, med) => sum + med.originalPrice, 0);
    const totalCoverage = validatedMeds.reduce((sum, med) => sum + med.coveredAmount, 0);
    const finalPrice = totalPrice - totalCoverage;

    const response = await axios.post('http://localhost:4002/api/generate_invoice', {
        prescription_id: prescriptionId,
        patient_name: patientName,
        total_price: totalPrice,
        coverage_percentage: (totalCoverage / totalPrice) * 100,
        final_price: finalPrice
    });

    return response.data;
};
