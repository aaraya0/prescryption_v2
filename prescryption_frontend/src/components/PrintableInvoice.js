import React from 'react';

const PrintableInvoice = ({ prescription, validationResult, invoiceData }) => {
    return (
        <div style={{ padding: '20px', fontSize: '14px' }}>
            <h2>Factura de Receta</h2>
            <h3>Datos de la Receta</h3>
            <p><strong>Paciente:</strong> {prescription?.patient?.name} {prescription?.patient?.surname}</p>
            <p><strong>Médico:</strong> {prescription?.doctor?.name} {prescription?.doctor?.surname}</p>
            <p><strong>Medicamento 1:</strong> {prescription?.meds?.med1}, Cantidad: {prescription?.meds?.quantity1}</p>
            <p><strong>Medicamento 2:</strong> {prescription?.meds?.med2}, Cantidad: {prescription?.meds?.quantity2}</p>
            <p><strong>Observaciones:</strong> {prescription?.meds?.observations}</p>

            <h3>Resultados de Validación</h3>
            {validationResult.map((med, index) => (
                <div key={index}>
                    <p><strong>Medicamento:</strong> {med.drugName}</p>
                    <p><strong>Marca:</strong> {med.brand}</p>
                    <p><strong>Cobertura:</strong> {med.coveragePercentage}%</p>
                    <p><strong>Precio Original:</strong> ${med.originalPrice}</p>
                    <p><strong>Monto Cubierto:</strong> ${med.coveredAmount}</p>
                    <p><strong>Precio Final:</strong> ${med.finalPrice}</p>
                    <hr />
                </div>
            ))}

            <h3>Detalles de la Factura</h3>
            <p><strong>Número de Factura:</strong> {invoiceData?.invoice_number}</p>
            <p><strong>Paciente:</strong> {invoiceData?.patient_name}</p>
            <p><strong>Fecha de Emisión:</strong> {invoiceData?.date}</p>
            <p><strong>Total:</strong> {invoiceData?.total_price}</p>

            {/* Espacio para troqueles */}
            <h3>Espacio para Troqueles</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <div style={{ border: '1px solid black', width: '100px', height: '50px' }}></div>
                <div style={{ border: '1px solid black', width: '100px', height: '50px' }}></div>
                <div style={{ border: '1px solid black', width: '100px', height: '50px' }}></div>
                <div style={{ border: '1px solid black', width: '100px', height: '50px' }}></div>
            </div>
        </div>
    );
};

export default PrintableInvoice;
