const fs = require('fs');
const path = require('path');
const { Web3 } = require('web3');
const Doctor = require('./models/Doctor');

// Configurar web3 y conectar a Ganache
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

// Cargar el ABI compilado del contrato y la dirección
const contractPath = path.resolve(__dirname, '../prescryption_solidity/build/contracts', 'RecetaContract.json');
const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const contratoAddress = "0x8989133E73FAD80b39fFEcAa2F602Da9282ACB47"; // Dirección del contrato en Ganache
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

    const { nid } = req.user; // Información del usuario logueado

    // Registro de datos recibidos para depuración
    console.log('Datos recibidos:', req.body);

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
        const fromAccount = accounts[0];

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
            medicoSurname: medico.surname,
            medicoNid: medico.nid,
            medicoLicense: medico.license,
            medicoSpecialty: medico.specialty,
            fromAccount: fromAccount
        });

        // Enviar transacción a la blockchain y recibir el recibo de la transacción
        const receipt = await recetaContract.methods
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
            .send({ from: accounts[0], gas: '1000000' }); // Ajusta la cantidad de gas aquí

        // Verificar si la transacción fue exitosa
        if (receipt.status) {
            res.send({
                message: 'Receta emitida y almacenada en la blockchain',
                transactionHash: receipt.transactionHash,
                blockNumber: receipt.blockNumber.toString(), // BigInt to string
                gasUsed: receipt.gasUsed.toString() // BigInt to string
            });
        } else {
            res.status(500).send('Error al emitir la receta en la blockchain');
        }
    } catch (error) {
        console.error('Error al emitir receta:', error);
        res.status(500).send('Error al emitir la receta. Detalles del error: ' + error.message);
    }
};

exports.obtenerRecetasPorMedico = async (req, res) => {
    try {
        const { nid } = req.user; // Obtener el nid del token del usuario logueado

        // Buscar al médico en la base de datos
        const medico = await Doctor.findOne({ nid });
        if (!medico) {
            return res.status(404).send('Médico no encontrado.');
        }

        // Obtener las cuentas de la blockchain
        const accounts = await web3.eth.getAccounts();
        const fromAccount = accounts[0]; // Primera cuenta de Ganache

        // Llamar a la función del contrato inteligente para obtener las recetas
        const recetas = await recetaContract.methods.getRecetasPorMedico(medico.nid).call({ from: fromAccount });

        // Verificar si se encontraron recetas
        if (recetas.length === 0) {
            return res.status(404).send('No se encontraron recetas para este médico.');
        }

        // Devolver las recetas al frontend
        res.json({
            message: 'Recetas obtenidas con éxito',
            recetas: recetas
        });
    } catch (error) {
        console.error('Error al obtener recetas:', error);
        res.status(500).send('Error al obtener las recetas. Detalles del error: ' + error.message);
    }
};