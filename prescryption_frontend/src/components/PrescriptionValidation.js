import React, { useState } from 'react';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';

const PrescriptionValidation = ({ prescription }) => {
    const [validationResult, setValidationResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [brand, setBrand] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [invoiceData, setInvoiceData] = useState(null);

    // Function to validate the prescription
    const handleValidate = async () => {
        try {
            const response = await axios.post('http://localhost:3001/api/pr_validate', {
                prescriptionId: prescription?.prescriptionId,
                brand: brand || 'Genérico'
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setValidationResult(response.data);
            setErrorMessage('');
            setShowModal(true); // Show the modal with validation result
        } catch (error) {
            console.error('Error validating prescription:', error);
            setErrorMessage('Error validating prescription. Please try again.');
        }
    };

    // Function to generate the invoice
    const handleGenerateInvoice = async () => {
        try {
            const response = await axios.post('http://localhost:3001/api/pr_invoice', {
                prescriptionId: prescription?.prescriptionId,
                patientName: prescription?.patient?.name,
                totalPrice: validationResult?.originalPrice,
                coveragePercentage: validationResult?.coveragePercentage,
                finalPrice: validationResult?.finalPrice
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setInvoiceData(response.data.invoice); // Save invoice data to state
            alert('Factura generada exitosamente');
        } catch (error) {
            console.error('Error generating invoice:', error);
            alert('Error generating invoice. Please try again.');
        }
    };

    // Render only if a prescription is passed to the component
    if (!prescription) return null;

    return (
        <div>
            <h3>Prescription Details</h3>
            <p>Patient: {prescription?.patient?.name} {prescription?.patient?.surname}</p>
            <p>Medication: {prescription?.meds?.med1}</p>
            <p>Quantity: {prescription?.meds?.quantity1}</p>
            <input 
                type="text" 
                placeholder="Enter Brand or Generic" 
                value={brand} 
                onChange={(e) => setBrand(e.target.value)} 
            />
            <button onClick={handleValidate}>Validate Prescription</button>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Validation and Invoice Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {validationResult && !invoiceData && (
                        <div>
                            <p><strong>Patient:</strong> {prescription?.patient?.name} {prescription?.patient?.surname}</p>
                            <p><strong>Medication:</strong> {prescription?.meds?.med1}</p>
                            <p><strong>Quantity:</strong> {prescription?.meds?.quantity1}</p>
                            <p><strong>Selected Brand:</strong> {brand || 'Genérico'}</p>
                            <h4>Validation Result</h4>
                            <p><strong>Cobertura:</strong> {validationResult.coveragePercentage}%</p>
                            <p><strong>Precio total:</strong> ${validationResult.originalPrice}</p>
                            <p><strong>Monto cubierto:</strong> ${validationResult.coveredAmount}</p>
                            <p><strong>Precio final a pagar:</strong> ${validationResult.finalPrice}</p>
                        </div>
                    )}

                    {invoiceData && (
                        <div>
                            <h4>Invoice Details</h4>
                            <p><strong>Invoice Number:</strong> {invoiceData.invoiceNumber}</p>
                            <p><strong>Patient Name:</strong> {invoiceData.patientName}</p>
                            <p><strong>Date Issued:</strong> {invoiceData.dateIssued}</p>
                            <p><strong>Total Amount:</strong> ${invoiceData.totalAmount}</p>
                            <p><strong>Coverage Percentage:</strong> {invoiceData.coveragePercentage}%</p>
                            <p><strong>Amount Covered:</strong> ${invoiceData.amountCovered}</p>
                            <p><strong>Amount to Pay:</strong> ${invoiceData.amountToPay}</p>
                        </div>
                    )}

                    {errorMessage && <p className="error">{errorMessage}</p>}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
                    {!invoiceData && <Button variant="primary" onClick={handleGenerateInvoice}>Generar Factura</Button>}
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default PrescriptionValidation;
