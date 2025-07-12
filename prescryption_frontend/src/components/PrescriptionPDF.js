import React from "react";
import jsPDF from "jspdf";

const PrescriptionPDF = ({ receta }) => {
  const handleDownloadPDF = () => {
    if (!receta || !receta.meds) return console.error("Receta inválida");

    const doc = new jsPDF();
    let y = 20;

    // Header: PRESCRYPTION y título
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 102, 204); // azul
    doc.text("PRESCRYPTION", 20, y);

    doc.setTextColor(0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Receta Médica", 105, y, { align: "center" });

    y += 10;
    doc.setLineWidth(0.2);
    doc.line(20, y, 190, y);
    y += 10;

    // Fechas
    const issueDate = new Date(receta.issueDate);
    const expDate = new Date(receta.expirationDate);
    const issueText = isNaN(issueDate)
      ? "N/A"
      : issueDate.toLocaleDateString("es-AR");
    const expText = isNaN(expDate)
      ? "N/A"
      : expDate.toLocaleDateString("es-AR");

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Fecha de Emisión:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(issueText, 64, y);

    doc.setFont("helvetica", "bold");
    doc.text("Fecha de Expiración:", 110, y);
    doc.setFont("helvetica", "normal");
    doc.text(expText, 160, y);
    y += 20;

    // DATOS DEL PACIENTE (izquierda)
    let yLeft = y;
    doc.setFont("helvetica", "bold");
    doc.text("DNI del paciente:", 20, yLeft);
    doc.setFont("helvetica", "normal");
    doc.text(`${receta.patientNid}`, 64, yLeft);
    yLeft += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Nombre(s):", 20, yLeft);
    doc.setFont("helvetica", "normal");
    doc.text(`${receta.patientName}`, 64, yLeft);
    yLeft += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Apellido(s):", 20, yLeft);
    doc.setFont("helvetica", "normal");
    doc.text(`${receta.patientSurname}`, 64, yLeft);
    yLeft += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Número de Afiliado:", 20, yLeft);
    doc.setFont("helvetica", "normal");
    doc.text(`${receta.insurance?.affiliateNum || "N/A"}`, 64, yLeft);
    yLeft += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Obra Social:", 20, yLeft);
    doc.setFont("helvetica", "normal");
    doc.text(`${receta.insurance?.insuranceName || "N/A"}`, 64, yLeft);
    yLeft += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Plan de Obra Social:", 20, yLeft);
    doc.setFont("helvetica", "normal");
    doc.text(`${receta.insurance?.insurancePlan || "N/A"}`, 64, yLeft);
    yLeft += 12;

    // MEDICAMENTOS (derecha, eje independiente)
    let yRight = y;
    doc.setFont("helvetica", "bold");
    doc.text("Medicamento 1:", 110, yRight);
    doc.setFont("helvetica", "normal");
    const med1Lines = doc.splitTextToSize(`${receta.meds.med1}`, 45);
    doc.text(med1Lines, 160, yRight);
    yRight += med1Lines.length * 6;

    doc.setFont("helvetica", "bold");
    doc.text("Cantidad:", 110, yRight);
    doc.setFont("helvetica", "normal");
    doc.text(`${receta.meds.quantity1}`, 160, yRight);
    yRight += 6 + 4;

    if (receta.meds.med2 && receta.meds.quantity2 > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Medicamento 2:", 110, yRight);
      doc.setFont("helvetica", "normal");
      const med2Lines = doc.splitTextToSize(`${receta.meds.med2}`, 45);
      doc.text(med2Lines, 160, yRight);
      yRight += med2Lines.length * 6;

      doc.setFont("helvetica", "bold");
      doc.text("Cantidad:", 110, yRight);
      doc.setFont("helvetica", "normal");
      doc.text(`${receta.meds.quantity2}`, 160, yRight);
      yRight += 6 + 4;
    }

    // DIAGNÓSTICO Y OBSERVACIONES
    doc.setFont("helvetica", "bold");
    doc.text("Diagnóstico:", 110, yRight);
    doc.setFont("helvetica", "normal");
    doc.text(`${receta.meds.diagnosis}`, 160, yRight);
    yRight += 8;

    if (receta.meds.observations?.trim()) {
      doc.setFont("helvetica", "bold");
      doc.text("Observaciones:", 110, yRight);
      doc.setFont("helvetica", "normal");
      doc.text(`${receta.meds.observations}`, 160, yRight);
      yRight += 8;
    }

    // Firma con datos del profesional
    let yFirma = Math.max(yLeft, yRight) + 20;

    doc.setFont("helvetica", "normal");

    doc.text(`Dr. ${receta.doctorName} ${receta.doctorSurname}`, 155, yFirma, {
      align: "center",
    });
    yFirma += 6;

    doc.text(`Matrícula: ${receta.doctorLicense}`, 155, yFirma, {
      align: "center",
    });
    yFirma += 6;

    doc.text(`DNI: ${receta.doctorNid}`, 155, yFirma, {
      align: "center",
    });
    yFirma += 6;

    // Línea de firma
    doc.line(120, yFirma, 190, yFirma);
    yFirma += 5;

    doc.setFont("helvetica", "italic");
    doc.text("Firma del Profesional", 155, yFirma, { align: "center" });

    // Pie de página
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Obra Social: ${receta.insurance?.insuranceName || "N/A"}`,
      105,
      280,
      { align: "center" }
    );

    doc.save(`Receta_${receta.patientSurname}_${issueText}.pdf`);
  };

  return (
    <button onClick={handleDownloadPDF} className="buttonDescargarReceta">
      Descargar receta
    </button>
  );
};

export default PrescriptionPDF;
