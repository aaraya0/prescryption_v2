const fs = require('fs');
const path = require('path');
const { Web3 } = require('web3');

// Setup web3 and connect to Ganache
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

// Load the compiled contract ABI and address
const contractPath = path.resolve(__dirname, '../prescryption_solidity/build/contracts', 'RecetaContract.json');
const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const contratoAddress = "0xA14458C81a4c8762A9AE643c38d42e8b67EcFDc6"; // Dirección del contrato en Ganache
const recetaContract = new web3.eth.Contract(contractJSON.abi, contratoAddress);

exports.emitirReceta = async (req, res) => {
    const {
        nombrePaciente,
        dniPaciente,
        numAfiliado,
        obraSocial,
        planObraSocial,
        medicamento1,
        cantidad1,
        medicamento2,
        cantidad2,
        diagnostico,
    } = req.body;

   // const medico = req.user; // Información del médico logueado
   const { nid, userType } = req.user; // Información del usuario logueado


    // Registro de datos recibidos para depuración
    console.log('Datos recibidos:', req.body);
    console.log('Información del médico:', userType);

    try {
        // Validación de datos del formulario
        if (!nombrePaciente || !dniPaciente || !numAfiliado || !obraSocial || !planObraSocial || !medicamento1 || !cantidad1 || !diagnostico) {
            console.warn('Datos faltantes en la solicitud:', {
                nombrePaciente,
                dniPaciente,
                numAfiliado,
                obraSocial,
                planObraSocial,
                medicamento1,
                cantidad1,
                medicamento2,
                cantidad2,
                diagnostico
            });
            return res.status(400).send('Faltan datos necesarios para emitir la receta.');
        }

       // Buscar al médico en la base de datos
        const medico = await Doctor.findOne({ nid });
        if (!medico) {
            return res.status(404).send('Médico no encontrado.');
        }

        // Emitir receta y guardarla en la blockchain
        const accounts = await web3.eth.getAccounts();

        console.log('Enviando transacción con los siguientes datos:', {
            nombrePaciente,
            dniPaciente,
            numAfiliado,
            obraSocial,
            planObraSocial,
            medicamento1,
            cantidad1,
            medicamento2,
            cantidad2,
            diagnostico,
            medicoName: medico.name,
            medicoLicense: medico.license,
            fromAccount: accounts[0]
        });

        await recetaContract.methods
            .emitirReceta(
                nombrePaciente,
                dniPaciente,
                numAfiliado,
                obraSocial,
                planObraSocial,
                medicamento1,
                cantidad1,
                medicamento2,
                cantidad2,
                diagnostico,
                medico.name, // Nombre del médico logueado
                medico.license // Matrícula del médico logueado
            )
            .send({ from: accounts[0] });

        res.send('Receta emitida y almacenada en la blockchain');
    } catch (error) {
        console.error('Error al emitir receta:', error);
        // Proporcionar información más detallada en el mensaje de error
        res.status(500).send('Error al emitir la receta. Detalles del error: ' + error.message);
    }
};
