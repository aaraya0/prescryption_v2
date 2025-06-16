// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PrescriptionContract {
    struct MedicationInfo {
        string med1;
        uint quantity1;
        string med2;
        uint quantity2;
        string diagnosis;
        string observations;
    }

    struct InsuranceInfo {
        string affiliateNum;
        string insuranceName;
        string insurancePlan;
    }

    struct PatientInfo {
        string name;
        string surname;
        string nid;
    }

    struct Prescription {
        uint id;
        PatientInfo patient;
        MedicationInfo meds;
        InsuranceInfo insurance;
        string doctorNid;
        address patientAddress;
        address pharmacyAddress;
        uint issueDate;
        uint expirationDate;
        bool used;
        bool isPendingValidation; // Nuevo campo para bloquear el reenvío
        string invoiceNumber;
    }

    Prescription[] public prescriptions;
    mapping(string => Doctor) public doctors;
    uint public prescriptionCount;

    struct Doctor {
        string doctorName;
        string doctorLicense;
        string doctorSpecialty;
    }

    event IssuedPrescription(
        uint id,
        PatientInfo patient,
        MedicationInfo meds,
        InsuranceInfo insurance,
        string doctorNid,
        address patientAddress,
        address pharmacyAddress,
        uint issueDate,
        uint expirationDate
    );

    event PrescriptionUpdated(uint prescriptionId, address pharmacyAddress);
    event PrescriptionCleared(uint prescriptionId);


    // Función para emitir una receta con fecha personalizada
    function issuePrescription(
        PatientInfo memory _patient,
        MedicationInfo memory _meds,
        InsuranceInfo memory _insurance,
        string memory _doctorNid,
        address _patientAddress,
        uint _issueDate
    ) public {
        prescriptionCount++;

        uint expirationDate = _issueDate + 30 days;

        Prescription memory newPrescription = Prescription({
            id: prescriptionCount,
            patient: _patient,
            meds: _meds,
            insurance: _insurance,
            doctorNid: _doctorNid,
            patientAddress: _patientAddress,
            pharmacyAddress: address(0),
            issueDate: _issueDate,
            expirationDate: expirationDate,
            used: false,
            isPendingValidation: false, // Inicialmente no está pendiente de validación
            invoiceNumber: ""
        });

        prescriptions.push(newPrescription);

        emit IssuedPrescription(
            prescriptionCount,
            _patient,
            _meds,
            _insurance,
            _doctorNid,
            _patientAddress,
            address(0),
            _issueDate,
            expirationDate
        );
    }

    // Función para obtener una receta específica por ID
    function getPrescription(uint _prescriptionId) public view returns (Prescription memory) {
        require(_prescriptionId > 0 && _prescriptionId <= prescriptionCount, "Invalid ID.");
        return prescriptions[_prescriptionId - 1];
    }

    // Función para actualizar la dirección de la farmacia en la receta
    function updatePrescription(uint _prescriptionId, address _pharmacyAddress) public {
        require(_prescriptionId > 0 && _prescriptionId <= prescriptionCount, "Invalid ID.");
        require(!prescriptions[_prescriptionId - 1].isPendingValidation, "Prescription already pending validation.");
        require(_pharmacyAddress != address(0), "Invalid pharmacy address.");

        prescriptions[_prescriptionId - 1].pharmacyAddress = _pharmacyAddress;
        prescriptions[_prescriptionId - 1].isPendingValidation = true;

        emit PrescriptionUpdated(_prescriptionId, _pharmacyAddress);
    }

    // Función para liberar la receta de la farmacia
    function clearPendingValidation(uint _prescriptionId) public {
        require(_prescriptionId > 0 && _prescriptionId <= prescriptionCount, "Invalid ID.");
        prescriptions[_prescriptionId - 1].isPendingValidation = false;
        prescriptions[_prescriptionId - 1].pharmacyAddress = address(0);

        emit PrescriptionCleared(_prescriptionId);
    }

    // Función para obtener todas las recetas
    function getPrescriptions() public view returns (Prescription[] memory) {
        return prescriptions;
    }

    // Función para obtener recetas por NID de médico
    function getPresbyDoctorNid(string memory _doctorNid) public view returns (Prescription[] memory) {
        uint count = 0;
        for (uint i = 0; i < prescriptionCount; i++) {
            if (keccak256(abi.encodePacked(prescriptions[i].doctorNid)) == keccak256(abi.encodePacked(_doctorNid))) {
                count++;
            }
        }

        Prescription[] memory doctorPrescriptions = new Prescription[](count);
        uint index = 0;
        for (uint i = 0; i < prescriptionCount; i++) {
            if (keccak256(abi.encodePacked(prescriptions[i].doctorNid)) == keccak256(abi.encodePacked(_doctorNid))) {
                doctorPrescriptions[index] = prescriptions[i];
                index++;
            }
        }
        return doctorPrescriptions;
    }

    // Función para obtener recetas por dirección del paciente
    function getPresbyPatientAddress(address _patientAddress) public view returns (Prescription[] memory) {
        uint count = 0;
        for (uint i = 0; i < prescriptionCount; i++) {
            if (prescriptions[i].patientAddress == _patientAddress) {
                count++;
            }
        }

        Prescription[] memory patientPrescriptions = new Prescription[](count);
        uint index = 0;
        for (uint i = 0; i < prescriptionCount; i++) {
            if (prescriptions[i].patientAddress == _patientAddress) {
                patientPrescriptions[index] = prescriptions[i];
                index++;
            }
        }
        return patientPrescriptions;
    }

    // Función para obtener recetas por dirección de la farmacia
    function getPresbyPharmacyAddress(address _pharmacyAddress) public view returns (Prescription[] memory) {
        uint count = 0;
        for (uint i = 0; i < prescriptionCount; i++) {
            if (prescriptions[i].pharmacyAddress == _pharmacyAddress) {
                count++;
            }
        }

        Prescription[] memory pharmacyPrescriptions = new Prescription[](count);
        uint index = 0;
        for (uint i = 0; i < prescriptionCount; i++) {
            if (prescriptions[i].pharmacyAddress == _pharmacyAddress) {
                pharmacyPrescriptions[index] = prescriptions[i];
                index++;
            }
        }
        return pharmacyPrescriptions;
    }

    // Función para marcar la receta como usada y agregar el número de factura
    function markPrescriptionAsUsed(uint _prescriptionId, string memory _invoiceNumber) public {
        require(_prescriptionId > 0 && _prescriptionId <= prescriptionCount, "Invalid ID.");
        require(!prescriptions[_prescriptionId - 1].used, "Prescription already used.");

        prescriptions[_prescriptionId - 1].used = true;
        prescriptions[_prescriptionId - 1].invoiceNumber = _invoiceNumber;
    }

    // 📌 Función para validar la receta en la blockchain
function validatePrescription(uint _prescriptionId, address _pharmacyAddress, uint _validationTimestamp) public {
    require(_prescriptionId > 0 && _prescriptionId <= prescriptionCount, "Invalid prescription ID.");
    Prescription storage prescription = prescriptions[_prescriptionId - 1];

    require(!prescription.used, "Prescription already used.");
    require(prescription.pharmacyAddress == _pharmacyAddress, "Pharmacy does not match the assigned pharmacy.");
    require(prescription.isPendingValidation, "Prescription is not pending validation.");

    // 📌 Marcar la receta como validada y lista para facturación
   // prescription.used = true;
    prescription.isPendingValidation = false;

    // 📌 Agregar un timestamp de validación
    emit PrescriptionValidated(_prescriptionId, _pharmacyAddress, _validationTimestamp);
}

// 📌 Evento para registrar la validación de la receta
event PrescriptionValidated(uint prescriptionId, address pharmacyAddress, uint validationTimestamp);

}
