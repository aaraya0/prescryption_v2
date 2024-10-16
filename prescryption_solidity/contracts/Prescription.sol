// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PrescriptionContract {
    struct MedicationInfo {
        string med1;
        uint quantity1;
        string med2;
        uint quantity2;
        string diagnosis;
    }

    struct InsuranceInfo {
        string affiliateNum;
        string insuranceName;
        string insurancePlan;
    }

    struct Prescription {
        uint id;  // ID único para cada receta
        string patientName;
        string patientNid;
        MedicationInfo meds;
        InsuranceInfo insurance;
        string doctorNid;
        address patientAddress;
        address pharmacyAddress; // Agregado para almacenar la dirección de la farmacia
        uint issueDate;
        uint expirationDate;
    }

    Prescription[] public prescriptions;
    mapping(string => Doctor) public doctors;

    struct Doctor {
        string doctorName;
        string doctorLicense;
        string doctorSpecialty;
    }

    uint public prescriptionCount;

    event IssuedPrescription(
        uint id,  // ID agregado al evento
        string patientName,
        string patientNid,
        MedicationInfo meds,
        InsuranceInfo insurance,
        string doctorNid,
        address patientAddress,
        address pharmacyAddress, // Agregado al evento
        uint issueDate,
        uint expirationDate
    );

    // Emitir receta
    function issuePrescription(
        string memory _patientName,
        string memory _patientNid,
        MedicationInfo memory _meds,
        InsuranceInfo memory _insurance,
        string memory _doctorNid,
        address _patientAddress
    ) public {
        prescriptionCount++;  // Incrementar el contador para el nuevo ID

        uint issueDate = block.timestamp;
        uint expirationDate = issueDate + 30 days;

        Prescription memory newPrescription = Prescription({
            id: prescriptionCount,  // Asignar el ID
            patientName: _patientName,
            patientNid: _patientNid,
            meds: _meds,
            insurance: _insurance,
            doctorNid: _doctorNid,
            patientAddress: _patientAddress,
            pharmacyAddress: address(0), // Inicialmente vacío
            issueDate: issueDate,
            expirationDate: expirationDate
        });

        prescriptions.push(newPrescription);

        emit IssuedPrescription(
            prescriptionCount,  // Emitir el ID
            _patientName,
            _patientNid,
            _meds,
            _insurance,
            _doctorNid,
            _patientAddress,
            address(0), // Inicialmente vacío
            issueDate,
            expirationDate
        );
    }

    // Obtener una receta específica por ID
    function getPrescription(uint _prescriptionId) public view returns (Prescription memory) {
        require(_prescriptionId > 0 && _prescriptionId <= prescriptionCount, "Invalid ID.");
        return prescriptions[_prescriptionId - 1];
    }

    // Obtener todas las recetas
    function getPrescriptions() public view returns (Prescription[] memory) {
        return prescriptions;
    }

    // Obtener recetas por NID de médico
    function getPresbyDoctorNid(string memory _doctorNid) public view returns (Prescription[] memory) {
        uint count = 0;

        // Primer bucle para contar cuántas recetas pertenecen al médico
        for (uint i = 0; i < prescriptionCount; i++) {
            if (keccak256(abi.encodePacked(prescriptions[i].doctorNid)) == keccak256(abi.encodePacked(_doctorNid))) {
                count++;
            }
        }

        // Crear un array para almacenar las recetas del médico
        Prescription[] memory doctorPrescriptions = new Prescription[](count);
        uint index = 0;

        // Segundo bucle para almacenar las recetas correspondientes
        for (uint i = 0; i < prescriptionCount; i++) {
            if (keccak256(abi.encodePacked(prescriptions[i].doctorNid)) == keccak256(abi.encodePacked(_doctorNid))) {
                doctorPrescriptions[index] = prescriptions[i];
                index++;
            }
        }

        return doctorPrescriptions;
    }

    // Obtener recetas por dirección del paciente
    function getPresbyPatientAddress(address _patientAddress) public view returns (Prescription[] memory) {
        uint count = 0;

        // Primer bucle para contar cuántas recetas pertenecen al paciente
        for (uint i = 0; i < prescriptionCount; i++) {
            if (prescriptions[i].patientAddress == _patientAddress) {
                count++;
            }
        }

        // Crear un array para almacenar las recetas del paciente
        Prescription[] memory patientPrescriptions = new Prescription[](count);
        uint index = 0;

        // Segundo bucle para almacenar las recetas correspondientes
        for (uint i = 0; i < prescriptionCount; i++) {
            if (prescriptions[i].patientAddress == _patientAddress) {
                patientPrescriptions[index] = prescriptions[i];
                index++;
            }
        }

        return patientPrescriptions;
    }

    // Nueva función para actualizar la dirección de la farmacia en la receta
    function updatePrescription(uint _prescriptionId, address _pharmacyAddress) public {
        require(_prescriptionId > 0 && _prescriptionId <= prescriptionCount, "Invalid ID.");
        prescriptions[_prescriptionId - 1].pharmacyAddress = _pharmacyAddress; // Actualizar la dirección de la farmacia
    }
}
