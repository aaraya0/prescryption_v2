// PrintableInvoice.js
import React from 'react';
import '../styles/PrintableInvoice.css';

const PrintableInvoice = ({ prescription, validationResult, invoiceData }) => {
    return (
        <div className="container">
            {/* Cuadrante 1: Datos de la Receta */}
            <div className="quadrant">
                <h3>Datos de la Receta</h3>
                <div>
                    <p><strong>Paciente:</strong> {prescription?.patient?.name} {prescription?.patient?.surname}</p>
                    <p><strong>Médico:</strong> {prescription?.doctor?.name} {prescription?.doctor?.surname}</p>
                    <p><strong>Medicamento 1:</strong> {prescription?.meds?.med1}, Cantidad: {prescription?.meds?.quantity1}</p>
                    <p><strong>Medicamento 2:</strong> {prescription?.meds?.med2}, Cantidad: {prescription?.meds?.quantity2}</p>
                    <p><strong>Observaciones:</strong> {prescription?.meds?.observations}</p>
                </div>
            </div>

            {/* Cuadrante 2: Resultados de Validación */}
            <div className="quadrant">
                <h3>Resultados de Validación</h3>
                <div>
                    {validationResult.map((med, index) => (
                        <div key={index} className="validation-item">
                            <p><strong>Medicamento:</strong> {med.drugName}</p>
                            <p><strong>Marca:</strong> {med.brand}</p>
                            <p><strong>Cobertura:</strong> {med.coveragePercentage}%</p>
                            <p><strong>Precio Original:</strong> ${med.originalPrice}</p>
                            <p><strong>Monto Cubierto:</strong> ${med.coveredAmount}</p>
                            <p><strong>Precio Final:</strong> ${med.finalPrice}</p>
                            <hr style={{ margin: '5px 0' }} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Cuadrante 3: Detalles de la Factura */}
            <div className="quadrant">
                <h3>Detalles de la Factura</h3>
                <div>
                    <p><strong>Número de Factura:</strong> {invoiceData?.invoice_number}</p>
                    <p><strong>Paciente:</strong> {invoiceData?.patient_name}</p>
                    <p><strong>Fecha de Emisión:</strong> {invoiceData?.date}</p>
                    <p><strong>Total:</strong> {invoiceData?.total_price}</p>
                </div>
            </div>

            {/* Cuadrante 4: Espacio para Troqueles */}
            <div className="quadrant">
                <h3>Espacio para Troqueles</h3>
                <div id="troqueles-container">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
            </div>
        </div>
    );
};

export default PrintableInvoice;
