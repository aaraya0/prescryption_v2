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
        string patientName;
        string patientNid;
        MedicationInfo meds;
        InsuranceInfo insurance;
        string doctorNid;
        address patientAddress;
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
        string patientName,
        string patientNid,
        MedicationInfo meds,
        InsuranceInfo insurance,
        string doctorNid,
        address patientAddress,
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
        uint issueDate = block.timestamp;
        uint expirationDate = issueDate + 30 days;

        Prescription memory newPrescription = Prescription({
            patientName: _patientName,
            patientNid: _patientNid,
            meds: _meds,
            insurance: _insurance,
            doctorNid: _doctorNid,
            patientAddress: _patientAddress,
            issueDate: issueDate,
            expirationDate: expirationDate
        });

        prescriptions.push(newPrescription);
        prescriptionCount++;

        emit IssuedPrescription(
            _patientName,
            _patientNid,
            _meds,
            _insurance,
            _doctorNid,
            _patientAddress,
            issueDate,
            expirationDate
        );
    }

    // Get a specific prescription by ID
    function getPrescription(uint _prescriptionId) public view returns (Prescription memory, Doctor memory) {
        require(_prescriptionId > 0 && _prescriptionId <= prescriptionCount, "invalid id.");
        Prescription memory prescription = prescriptions[_prescriptionId - 1];
        Doctor memory doctor = doctors[prescription.doctorNid];
        return (prescription, doctor);
    }

    // Get all prescriptions
    function getPrescriptions() public view returns (Prescription[] memory) {
        return prescriptions;
    }

    // Get prescriptions by doctor NID
    function getPresbyDoctorNid(string memory _doctorNid) public view returns (Prescription[] memory) {
        uint count = 0;

        // First loop to count how many prescriptions belong to the doctor
        for (uint i = 0; i < prescriptionCount; i++) {
            if (keccak256(abi.encodePacked(prescriptions[i].doctorNid)) == keccak256(abi.encodePacked(_doctorNid))) {
                count++;
            }
        }

        // Create an array to store the doctor's prescriptions
        Prescription[] memory doctorPrescriptions = new Prescription[](count);
        uint index = 0;

        // Second loop to store the corresponding prescriptions
        for (uint i = 0; i < prescriptionCount; i++) {
            if (keccak256(abi.encodePacked(prescriptions[i].doctorNid)) == keccak256(abi.encodePacked(_doctorNid))) {
                doctorPrescriptions[index] = prescriptions[i];
                index++;
            }
        }

        return doctorPrescriptions;
    }

    // -----------------------------
    // New function to get prescriptions by patient address
    function getPresbyPatientAddress(address _patientAddress) public view returns (Prescription[] memory) {
        uint count = 0;

        // First loop to count how many prescriptions belong to the patient
        for (uint i = 0; i < prescriptionCount; i++) {
            if (prescriptions[i].patientAddress == _patientAddress) {
                count++;
            }
        }

        // Create an array to store the patient's prescriptions
        Prescription[] memory patientPrescriptions = new Prescription[](count);
        uint index = 0;

        // Second loop to store the corresponding prescriptions
        for (uint i = 0; i < prescriptionCount; i++) {
            if (prescriptions[i].patientAddress == _patientAddress) {
                patientPrescriptions[index] = prescriptions[i];
                index++;
            }
        }

        return patientPrescriptions;
    }
}