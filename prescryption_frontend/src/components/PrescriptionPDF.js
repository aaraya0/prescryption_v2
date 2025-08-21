import React from "react";
import jsPDF from "jspdf";
import logo from "../styles/prescryption_transparent.png";

const PrescriptionPDF = ({ receta }) => {
  const handleDownloadPDF = () => {
    if (!receta || !receta.meds) return console.error("Receta inválida");

    const doc = new jsPDF();

    const img = new Image();
    img.src = logo;

    img.onload = () => {
      let y = 20;

      // Keep original proportions of the logo
      const originalWidth = img.width;
      const originalHeight = img.height;

      const pdfWidth = 40; //
      const pdfHeight = (originalHeight / originalWidth) * pdfWidth;

      // Add logo
      doc.addImage(img, "PNG", 20, 0, pdfWidth, pdfHeight);

      // Title on the right
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Receta Médica", 190, y, { align: "right" });

      // Divider line
      y += 10;
      doc.setLineWidth(0.2);
      doc.line(20, y, 190, y);
      y += 10;

      // Dates
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

      // Patient data
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

      // Medications
      let yRight = y;
      doc.setFont("helvetica", "bold");
      doc.text("Medicamento 1:", 110, yRight);
      doc.setFont("helvetica", "normal");
      const med1Lines = doc.splitTextToSize(`${receta.meds.med1}`, 45);
      doc.text(med1Lines, 150, yRight);
      yRight += med1Lines.length * 6;

      doc.setFont("helvetica", "bold");
      doc.text("Cantidad:", 110, yRight);
      doc.setFont("helvetica", "normal");
      doc.text(`${receta.meds.quantity1}`, 150, yRight);
      yRight += 10;

      if (receta.meds.med2 && receta.meds.quantity2 > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("Medicamento 2:", 110, yRight);
        doc.setFont("helvetica", "normal");
        const med2Lines = doc.splitTextToSize(`${receta.meds.med2}`, 45);
        doc.text(med2Lines, 150, yRight);
        yRight += med2Lines.length * 6;

        doc.setFont("helvetica", "bold");
        doc.text("Cantidad:", 110, yRight);
        doc.setFont("helvetica", "normal");
        doc.text(`${receta.meds.quantity2}`, 150, yRight);
        yRight += 10;
      }

      // Diagnosis y Observations
      let yFirma;

      if (receta.meds.med2 && receta.meds.quantity2 > 0) {
        let yBottom = Math.max(yLeft, yRight) + 10;

        doc.setFont("helvetica", "bold");
        doc.text("Diagnóstico:", 20, yBottom);
        doc.setFont("helvetica", "normal");
        const diagnosisLines = doc.splitTextToSize(
          `${receta.meds.diagnosis}`,
          170
        );
        doc.text(diagnosisLines, 20, yBottom + 6);
        yBottom += diagnosisLines.length * 6 + 10;

        if (receta.meds.observations?.trim()) {
          doc.setFont("helvetica", "bold");
          doc.text("Observaciones:", 20, yBottom);
          doc.setFont("helvetica", "normal");
          const obsLines = doc.splitTextToSize(
            `${receta.meds.observations}`,
            170
          );
          doc.text(obsLines, 20, yBottom + 6);
          yBottom += obsLines.length * 6;
        }

        yFirma = yBottom + 20;
      } else {
        doc.setFont("helvetica", "bold");
        doc.text("Diagnóstico:", 110, yRight);
        doc.setFont("helvetica", "normal");
        const diagnosisLines = doc.splitTextToSize(
          `${receta.meds.diagnosis}`,
          45
        );
        doc.text(diagnosisLines, 150, yRight);
        yRight += diagnosisLines.length * 6;

        if (receta.meds.observations?.trim()) {
          doc.setFont("helvetica", "bold");
          doc.text("Observaciones:", 110, yRight);
          doc.setFont("helvetica", "normal");
          const obsLines = doc.splitTextToSize(
            `${receta.meds.observations}`,
            45
          );
          doc.text(obsLines, 150, yRight);
          yRight += obsLines.length * 6;
        }

        yFirma = Math.max(yLeft, yRight) + 20;
      }

      // Doctor signature
      doc.setFont("helvetica", "normal");
      doc.text(
        `Dr. ${receta.doctorName} ${receta.doctorSurname}`,
        155,
        yFirma,
        {
          align: "center",
        }
      );
      yFirma += 6;

      doc.text(
        ` ${receta.doctorSpecialty} - ${receta.doctorLicense}`,
        155,
        yFirma,
        {
          align: "center",
        }
      );
      yFirma += 6;

      // Signature line
      doc.line(120, yFirma, 190, yFirma);
      yFirma += 5;

      doc.setFont("helvetica", "italic");
      doc.text("Firma del Profesional", 155, yFirma, { align: "center" });

      doc.save(`Receta_${receta.patientSurname}_${issueText}.pdf`);
    };
  };

  return (
    <button onClick={handleDownloadPDF} className="buttonDescargarReceta">
      Descargar receta
    </button>
  );
};

export default PrescriptionPDF;
