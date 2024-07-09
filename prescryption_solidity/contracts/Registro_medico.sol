// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RegistroMedico {
    struct Medico {
        string nombre;
        string apellido;
        uint dni;
        string especialidad;
        string matricula;
    }

    mapping(address => Medico) public medicos;
    address[] public direccionesMedicos;

    function registrarMedico(
        string memory _nombre, 
        string memory _apellido, 
        uint _dni, 
        string memory _especialidad, 
        string memory _matricula
    ) public {
        Medico memory nuevoMedico = Medico(_nombre, _apellido, _dni, _especialidad, _matricula);
        medicos[msg.sender] = nuevoMedico;
        direccionesMedicos.push(msg.sender);
    }

    function obtenerMedico(address _direccion) public view returns (Medico memory) {
        return medicos[_direccion];
    }
}
