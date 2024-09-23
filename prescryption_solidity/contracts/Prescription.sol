// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PrescriptionContract {
    struct Prescription {
        string patientName;
        string patientNid;
        string affiliateNum;
        string insuranceName;
        string insurancePlan;
        string med1;
        uint quantity1;
        string med2;
        uint quantity2;
        string diagnosis;
        string doctorNid; 
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
        string patientName,
        string patientNid,
        string affiliateNum,
        string insuranceName,
        string insurancePlan,
        string med1,
        uint quantity1,
        string med2,
        uint quantity2,
        string diagnosis,
        string doctorNid
    );

    // Register function
    function registerDoctor(
        string memory _doctorNid,
        string memory _doctorName,
        string memory _doctorLicense,
        string memory _doctorSpecialty
    ) public {
        doctors[_doctorNid] = Doctor ({
            doctorName: _doctorName,
            doctorLicense: _doctorLicense,
            doctorSpecialty: _doctorSpecialty
        });
    }

    function issuePrescription(
        string memory _patientName,
        string memory _patientNid,
        string memory _affiliateNum,
        string memory _licenseName,
        string memory _licensePlan,
        string memory _med1,
        uint _quantity1,
        string memory _med2,
        uint _quantity2,
        string memory _diagnosis,
        string memory _doctorNid 
    ) public {
        Prescription memory newPrescription = Prescription(
            _patientName,
            _patientNid,
            _affiliateNum,
            _licenseName,
            _licensePlan,
            _med1,
            _quantity1,
            _med2,
            _quantity2,
            _diagnosis,
            _doctorNid
        );
        prescriptions.push(newPrescription);
        prescriptionCount++;

        emit IssuedPrescription(
            _patientName,
            _patientName,
            _affiliateNum,
            _licenseName,
            _licensePlan,
            _med1,
            _quantity1,
            _med2,
            _quantity2,
            _diagnosis,
            _doctorNid
        );
    }

    function getPrescription(uint _prescriptionId) public view returns (Prescription memory, Doctor memory) {
        require(_prescriptionId > 0 && _prescriptionId <= prescriptionCount, "invalid id.");
        Prescription memory prescription = prescriptions[_prescriptionId - 1];
        Doctor memory doctor = doctors[prescription.doctorNid];
        return (prescription, doctor);
    }

    function getPrescriptions() public view returns (Prescription[] memory) {
        return prescriptions;
    }

    // -----------------------------
function getPresbyDoctorNid(string memory _doctorNid) public view returns (Prescription[] memory) {
    uint count = 0;
    
    // Primer bucle para contar cuántas recetas pertenecen al doctor
    for (uint i = 0; i < prescriptionCount; i++) {
        // Obtener los hashes de ambos NID (almacenado y proporcionado)
        bytes32 storedHash = keccak256(abi.encodePacked(prescriptions[i].doctorNid));
        bytes32 inputHash = keccak256(abi.encodePacked(_doctorNid));

        // Comparar ambos hashes
        if (storedHash == inputHash) {
            count++;
        }
    }

    // Crear un array para almacenar las recetas del doctor
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

}