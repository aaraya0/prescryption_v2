// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RecetaContract {
    struct Receta {
        string nombrePaciente;
        string dniPaciente;
        string numAfiliado;
        string obraSocial;
        string planObraSocial;
        string medicamento1;
        uint cantidad1;
        string medicamento2;
        uint cantidad2;
        string diagnostico;
        string dniMedico; // Almacenar solo el DNI del médico
    }

    Receta[] public recetas;
    mapping(string => Medico) public medicos; // Mapeo para almacenar datos de médicos

    struct Medico {
        string nombreMedico;
        string matriculaMedico;
        string especialidadMedico;
    }

    uint public recetaCount;

    event RecetaEmitida(
        string nombrePaciente,
        string dniPaciente,
        string numAfiliado,
        string obraSocial,
        string planObraSocial,
        string medicamento1,
        uint cantidad1,
        string medicamento2,
        uint cantidad2,
        string diagnostico,
        string dniMedico
    );

    // Función para registrar médicos
    function registrarMedico(
        string memory _dniMedico,
        string memory _nombreMedico,
        string memory _matriculaMedico,
        string memory _especialidadMedico
    ) public {
        medicos[_dniMedico] = Medico({
            nombreMedico: _nombreMedico,
            matriculaMedico: _matriculaMedico,
            especialidadMedico: _especialidadMedico
        });
    }

    function emitirReceta(
        string memory _nombrePaciente,
        string memory _dniPaciente,
        string memory _numAfiliado,
        string memory _obraSocial,
        string memory _planObraSocial,
        string memory _medicamento1,
        uint _cantidad1,
        string memory _medicamento2,
        uint _cantidad2,
        string memory _diagnostico,
        string memory _dniMedico // Solo el DNI del médico
    ) public {
        Receta memory newReceta = Receta(
            _nombrePaciente,
            _dniPaciente,
            _numAfiliado,
            _obraSocial,
            _planObraSocial,
            _medicamento1,
            _cantidad1,
            _medicamento2,
            _cantidad2,
            _diagnostico,
            _dniMedico
        );
        recetas.push(newReceta);
        recetaCount++;

        emit RecetaEmitida(
            _nombrePaciente,
            _dniPaciente,
            _numAfiliado,
            _obraSocial,
            _planObraSocial,
            _medicamento1,
            _cantidad1,
            _medicamento2,
            _cantidad2,
            _diagnostico,
            _dniMedico
        );
    }

    function getReceta(uint _recetaId) public view returns (Receta memory, Medico memory) {
        require(_recetaId > 0 && _recetaId <= recetaCount, "id de receta invalido.");
        Receta memory receta = recetas[_recetaId - 1];
        Medico memory medico = medicos[receta.dniMedico];
        return (receta, medico);
    }

    function getRecetas() public view returns (Receta[] memory) {
        return recetas;
    }
}
