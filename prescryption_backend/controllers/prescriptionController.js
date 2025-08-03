const blockchainService = require("../services/blockchainService");

const Patient = require("../models/Patient");
// controllers/doctorController.js
const medicationScraper = require("../services/medicationScraper");

function formatMedicationString({ brandName, details }) {
  const presentation = details?.presentation?.trim() || "";
  const laboratory = details?.laboratory?.trim() || "";

  return [brandName.trim(), presentation, laboratory]
    .filter(Boolean)
    .join(" + ");
}

exports.searchMedications = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res
        .status(400)
        .json({ message: "❌ Query parameter 'query' is required." });
    }

    const results = await medicationScraper.scrapeMedicationData(query);

    const simplified = results.map(
      ({ brandName, genericName, activeComponentsList, details }) => ({
        brandName,
        genericName,
        activeComponentsList,
        details: {
          presentation: details.presentation,
          laboratory: details.laboratory,
          route: details.route,
          action: details.action,
          saleType: details.saleType,
          origin: details.origin,
        },
      })
    );

    return res.status(200).json({ results: simplified });
  } catch (error) {
    console.error("❌ Error in searchMedications:", error);
    return res
      .status(500)
      .json({ message: "Error retrieving medication list." });
  }
};

/*exports.issuePrescription = async (req, res) => {
    const {
        patientName,
        patientSurname,
        patientNid,
        affiliateNum,
        insuranceName,
        insurancePlan,
        med1,
        quantity1,
        med2,
        quantity2,
        diagnosis,
        observations
    } = req.body;

    const { nid } = req.user; // NID del doctor autenticado

    try {
        // Validaciones
        if (!patientName || !patientSurname || !patientNid || !affiliateNum || !insuranceName || !insurancePlan || !med1 || !quantity1 || !diagnosis) {
            return res.status(400).send('Missing necessary data.');
        }

        // Buscar el paciente en la base de datos
        const patient = await Patient.findOne({ nid: patientNid });
        if (!patient) {
            return res.status(404).send('Patient not found.');
        }

        // Preparar los datos de la receta
        const prescriptionData = {
            patientName,
            patientSurname,
            patientNid,
            meds: {
                med1,
                quantity1,
                med2: med2 || "N/A",
                quantity2: quantity2 || 0,
                diagnosis,
                observations: observations || " "
            },
            insurance: {
                affiliateNum,
                insuranceName,
                insurancePlan
            },
            patientAddress: patient.address // Dirección obtenida automáticamente
        };

        // Enviar la receta al servicio
        const receipt = await blockchainService.issuePrescription(prescriptionData, nid);
        res.json(receipt);

    } catch (err) {
        console.error('Error issuing prescription:', err);
        res.status(500).send('Error issuing prescription. Details: ' + err.message);
    }
};*/

exports.issuePrescription = async (req, res) => {
  const {
    patientName,
    patientSurname,
    patientNid,
    affiliateNum,
    insuranceName,
    insurancePlan,
    med1,
    quantity1,
    med2,
    quantity2,
    diagnosis,
    observations,
  } = req.body;

  const { nid } = req.user;

  try {
    if (
      !patientName ||
      !patientSurname ||
      !patientNid ||
      !affiliateNum ||
      !insuranceName ||
      !insurancePlan ||
      !med1 ||
      !quantity1 ||
      !diagnosis
    ) {
      return res.status(400).send("Missing required fields.");
    }

    // Validación med1
    if (
      !med1.brandName ||
      !med1.details ||
      (!med1.details.saleType?.includes("Venta Libre") &&
        !med1.details.presentation)
    ) {
      return res
        .status(400)
        .send(
          "Med1 incompleto: presentación requerida si no es de venta libre."
        );
    }

    // Validación opcional med2
    if (med2) {
      if (
        !med2.brandName ||
        !med2.details ||
        (!med2.details.saleType?.includes("Venta Libre") &&
          !med2.details.presentation)
      ) {
        return res
          .status(400)
          .send(
            "Med2 incompleto: presentación requerida si no es de venta libre."
          );
      }
    }

    const patient = await Patient.findOne({ nid: patientNid });
    if (!patient) return res.status(404).send("Patient not found.");

    const prescriptionData = {
      patientName,
      patientSurname,
      patientNid,
      meds: {
        med1: formatMedicationString(med1),
        quantity1,
        med2: med2 ? formatMedicationString(med2) : "N/A",
        quantity2: quantity2 || 0,
        diagnosis,
        observations: observations || " ",
      },
      insurance: {
        affiliateNum,
        insuranceName,
        insurancePlan,
      },
      patientAddress: patient.address,
    };

    const receipt = await blockchainService.issuePrescription(
      prescriptionData,
      nid
    );
    return res.json(receipt);
  } catch (err) {
    console.error("❌ Error issuing prescription:", err);
    return res
      .status(500)
      .send("Error issuing prescription. Details: " + err.message);
  }
};

exports.getAllPrescriptions = async (req, res) => {
  try {
    const prescriptions = await blockchainService.getAllPrescriptions();
    res.json(prescriptions);
  } catch (err) {
    console.error("Error retrieving prescriptions:", err);
    res
      .status(500)
      .send("Error retrieving prescriptions. Details: " + err.message);
  }
};
