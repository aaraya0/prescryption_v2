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
        address patientAddress; // Dirección del paciente
        bool transferredToPatient; // Indica si fue transferida al paciente
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
        uint prescriptionId, 
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
        string doctorNid,
        address patientAddress
    );

    // Register function
    /*function registerDoctor(
        string memory _doctorNid,
        string memory _doctorName,
        string memory _doctorLicense,
        string memory _doctorSpecialty
    ) public {
        doctors[_doctorNid] = Doctor({
            doctorName: _doctorName,
            doctorLicense: _doctorLicense,
            doctorSpecialty: _doctorSpecialty
        });
    }*/

    // EMITIR RECETA 
    event TransferredToPatient(uint prescriptionId, address patientAddress);

    function issuePrescription(
        string memory _patientName,
        string memory _patientNid,
        string memory _affiliateNum,
        string memory _insuranceName,
        string memory _insurancePlan,
        string memory _med1,
        uint _quantity1,
        string memory _med2,
        uint _quantity2,
        string memory _diagnosis,
        string memory _doctorNid,
        address _patientAddress
    ) public {
        Prescription memory newPrescription = Prescription({
            patientName: _patientName,
            patientNid: _patientNid,
            affiliateNum: _affiliateNum,
            insuranceName: _insuranceName,
            insurancePlan: _insurancePlan,
            med1: _med1,
            quantity1: _quantity1,
            med2: _med2,
            quantity2: _quantity2,
            diagnosis: _diagnosis,
            doctorNid: _doctorNid,
            patientAddress: _patientAddress,
            transferredToPatient: false
        });

        prescriptions.push(newPrescription);
        uint prescriptionId = prescriptionCount;
        prescriptionCount++;

        emit IssuedPrescription(
            prescriptionId,
            _patientName,
            _patientNid,
            _affiliateNum,
            _insuranceName,
            _insurancePlan,
            _med1,
            _quantity1,
            _med2,
            _quantity2,
            _diagnosis,
            _doctorNid,
            _patientAddress
        );
    }

    function transferToPatient(uint _prescriptionId) public {
        require(_prescriptionId < prescriptionCount, "Invalid prescription ID.");
        Prescription storage prescription = prescriptions[_prescriptionId];

        require(!prescription.transferredToPatient, "Prescription already transferred.");
        require(msg.sender == prescription.patientAddress, "Only the patient can accept the transfer.");

        prescription.transferredToPatient = true;
        emit TransferredToPatient(_prescriptionId, msg.sender);
    }

    function getPrescription(uint _prescriptionId) public view returns (Prescription memory, Doctor memory) {
        require(_prescriptionId < prescriptionCount, "Invalid ID.");
        Prescription memory prescription = prescriptions[_prescriptionId];
        Doctor memory doctor = doctors[prescription.doctorNid];
        return (prescription, doctor);
    }

    function getPrescriptions() public view returns (Prescription[] memory) {
        return prescriptions;
    }

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
}
