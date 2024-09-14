import React, { useState } from 'react';
import axios from 'axios';

function Register() {
    const [formData, setFormData] = useState({});
    const userType = document.cookie
        .split('; ')
        .find(row => row.startsWith('userType='))
        ?.split('=')[1];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async () => {
        try {
            await axios.post(`http://localhost:3001/register_${userType}`, formData);
            alert('Registro exitoso');
            window.location.href = '/login';
        } catch (error) {
            console.error(error);
            alert('Error en el registro');
        }
    };

    const renderFields = () => {
        switch (userType) {
            case 'paciente':
                return (
                    <>
                        <input type="text" name="name" placeholder="Nombre" onChange={handleChange} />
                        <input type="text" name="surname" placeholder="Apellido" onChange={handleChange} />
                        <input type="text" name="nid" placeholder="DNI" onChange={handleChange} />
                        <input type="date" name="fecha_nacimiento" placeholder="Fecha de Nacimiento" onChange={handleChange} />
                        <input type="text" name="obra_social" placeholder="Obra Social" onChange={handleChange} />
                        <input type="text" name="plan_os" placeholder="Plan de Obra Social" onChange={handleChange} />
                        <input type="text" name="num_afiliado" placeholder="Número de Afiliado" onChange={handleChange} />
                        <input type="email" name="mail" placeholder="Email" onChange={handleChange} />
                        <input type="password" name="password" placeholder="Contraseña" onChange={handleChange} />
                    </>
                );
            case 'medico':
                return (
                    <>
                        <input type="text" name="name" placeholder="Nombre" onChange={handleChange} />
                        <input type="text" name="surname" placeholder="Apellido" onChange={handleChange} />
                        <input type="text" name="nid" placeholder="DNI" onChange={handleChange} />
                        <input type="text" name="license" placeholder="Matrícula" onChange={handleChange} />
                        <input type="text" name="specialty" placeholder="Especialidad" onChange={handleChange} />
                        <input type="email" name="mail" placeholder="Email" onChange={handleChange} />
                        <input type="password" name="password" placeholder="Contraseña" onChange={handleChange} />
                    </>
                );
            case 'farmaceutico':
                return (
                    <>
                        <input type="text" name="name" placeholder="Nombre" onChange={handleChange} />
                        <input type="text" name="surname" placeholder="Apellido" onChange={handleChange} />
                        <input type="text" name="license" placeholder="Matrícula" onChange={handleChange} />
                        <input type="text" name="farmacia" placeholder="Farmacia" onChange={handleChange} />
                        <input type="text" name="cuit_farmacia" placeholder="CUIT Farmacia" onChange={handleChange} />
                        <input type="email" name="mail" placeholder="Email" onChange={handleChange} />
                        <input type="password" name="password" placeholder="Contraseña" onChange={handleChange} />
                    </>
                );
            case 'obra_social':
                return (
                    <>
                        <input type="text" name="name" placeholder="Nombre" onChange={handleChange} />
                        <input type="text" name="surname" placeholder="Apellido" onChange={handleChange} />
                        <input type="text" name="nid" placeholder="DNI" onChange={handleChange} />
                        <input type="text" name="razon_social" placeholder="Razón Social" onChange={handleChange} />
                        <input type="text" name="cuit_os" placeholder="CUIT Obra Social" onChange={handleChange} />
                        <input type="email" name="mail" placeholder="Email" onChange={handleChange} />
                        <input type="password" name="password" placeholder="Contraseña" onChange={handleChange} />
                    </>
                );
            default:
                return <p>Por favor, selecciona un tipo de usuario.</p>;
        }
    };

    return (
        <div>
            <h2>Registro {userType}</h2>
            {renderFields()}
            <button onClick={handleRegister}>Registrarse</button>
        </div>
    );
}

export default Register;
