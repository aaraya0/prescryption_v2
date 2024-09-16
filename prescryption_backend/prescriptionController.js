const fs = require('fs');
const path = require('path');
const { Web3 } = require('web3');
const Doctor = require('./models/Doctor');

// Web3 config
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

// Compiled contract and address ABI
const contractPath = path.resolve(__dirname, '../prescryption_solidity/build/contracts', 'PrescriptionContract.json');
const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const contractAddress = "0x8989133E73FAD80b39fFEcAa2F602Da9282ACB47"; // Ganache contract address
const prescriptionContract = new web3.eth.Contract(contractJSON.abi, contractAddress);

exports.issuePrescription = async (req, res) => {
    const {
        patientName,
        patientNid,
        affiliateNum,
        insuranceName,
        insurancePlan,
        med1,
        quantity1,
        med2,
        quantity2,
        diagnosis,
    } = req.body;

    const { nid } = req.user; // Logged user info

    // Debugging
    console.log('Received data:', req.body);

    try {
        // Form data validation
        if (!patientName || !patientNid || !affiliateNum|| !insuranceName || !insurancePlan || !med1 || !quantity1 || !diagnosis) {
            console.warn('Missing data:', {
                patientName,
                patientNid,
                affiliateNum,
                insuranceName,
                insurancePlan,
                med1,
                quantity1,
                med2,
                quantity2,
                diagnosis,
            });
            return res.status(400).send('Missing necessary data.');
        }

        // Search doctor in DB
        const doctor = await Doctor.findOne({ nid });
        if (!doctor) {
            return res.status(404).send('Doctor not found.');
        }

        // issue prescription and save it on blockchain
        const accounts = await web3.eth.getAccounts();
        const fromAccount = accounts[0];

        console.log('Sending transaction with the following data:', {
            patientName,
            patientNid,
            affiliateNum,
            insuranceName,
            insurancePlan,
            med1,
            quantity1,
            med2,
            quantity2,
            diagnosis,
            doctorName: doctor.name,
            doctorSurname: doctor.surname,
            doctorNid: doctor.nid,
            doctorLicense: doctor.license,
            doctorSpecialty: doctor.specialty,
            fromAccount: fromAccount
        });

        // Send transaction to blockchain and get transaction receipt
        const receipt = await prescriptionContract.methods
            .issuePrescription(
                patientName,
                patientNid,
                affiliateNum,
                insuranceName,
                insurancePlan,
                med1,
                quantity1,
                med2,
                quantity2,
                diagnosis,
                doctor.name, // logged doctor name
                doctor.license // logged doctor license
            )
            .send({ from: accounts[0], gas: '1000000' }); // Adjust ammount of gas

        // Verify successful transaction
        if (receipt.status) {
            res.send({
                message: 'Prescription issued and saved in blockchain',
                transactionHash: receipt.transactionHash,
                blockNumber: receipt.blockNumber.toString(), // BigInt to string
                gasUsed: receipt.gasUsed.toString() // BigInt to string
            });
        } else {
            res.status(500).send('Error issuing prescription in blockchain');
        }
    } catch (error) {
        console.error('Error issuing prescription:', error);
        res.status(500).send('Error issuing prescription. Details: ' + error.message);
    }
};

exports.getPresbyDoctorNid = async (req, res) => {
    try {
        const { nid } = req.user; 

        const doctor = await Doctor.findOne({ nid });
        if (!doctor) {
            return res.status(404).send('Doctor not found.');
        }

        const accounts = await web3.eth.getAccounts();
        const fromAccount = accounts[0]; // First Ganache acc

        // Call smart contract function
        const prescriptions = await prescriptionContract.methods.getPresbyDoctorNid(doctor.nid).call({ from: fromAccount });

        if (prescriptions.length === 0) {
            return res.status(404).send('Prescriptions not found for this doctor.');
        }

        // Prescriptions for frontend
        res.json({
            message: 'Prescriptions obtained successfully',
            prescriptions: prescriptions
        });
    } catch (error) {
        console.error('Error obtaining prescriptions:', error);
        res.status(500).send('Error obtaining prescriptions. Details: ' + error.message);
    }
};