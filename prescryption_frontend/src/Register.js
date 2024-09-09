import React, { useState } from 'react';
import axios from 'axios';

function Register() {
    const [dni, setDni] = useState('');
    const [matricula, setMatricula] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [especialidad, setEspecialidad] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = async () => {
        try {
            await axios.post('http://localhost:3001/register', { dni, matricula, nombre, apellido, especialidad, password });
            alert('Doctor registered successfully');
        } catch (error) {
            // Verifica si hay un mensaje de error específico desde el backend
            if (error.response && error.response.data) {
                alert(error.response.data);  // Muestra el mensaje exacto del backend
            } else {
                alert('Error registering doctor');
            }
        }
    };

    return (
        <div>
            <h2>Register</h2>
            <input type="text" placeholder="DNI" value={dni} onChange={e => setDni(e.target.value)} />
            <input type="text" placeholder="Matricula" value={matricula} onChange={e => setMatricula(e.target.value)} />
            <input type="text" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
            <input type="text" placeholder="Apellido" value={apellido} onChange={e => setApellido(e.target.value)} />
            <input type="text" placeholder="Especialidad" value={especialidad} onChange={e => setEspecialidad(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            <button onClick={handleRegister}>Register</button>
        </div>
    );
}

export default Register;
