import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Register() {
    const [formData, setFormData] = useState({});
    const userType = document.cookie
        .split('; ')
        .find(row => row.startsWith('userType='))
        ?.split('=')[1];
    const navigate = useNavigate();

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

    const handleLogin = () => {
        navigate('/login'); 
    };

    const renderFields = () => {
        switch (userType) {
            case 'patient':
                return (
                    <>
                        <p className="inputTitle">Nombre</p>
                        <input className="form-input" type="text" name="name" placeholder="Nombre" onChange={handleChange} />
                        <p className="inputTitle">Apellido</p>
                        <input className="form-input" type="text" name="surname" placeholder="Apellido" onChange={handleChange} />
                        <p className="inputTitle">DNI</p>
                        <input className="form-input" type="text" name="nid" placeholder="DNI" onChange={handleChange} />
                        <div className="form-radio">
                            <label className='optionsTitle'>Sexo</label>
                            <label><input type="radio" name="sexo" value="F" onChange={handleChange} />F</label>
                            <label><input type="radio" name="sexo" value="M" onChange={handleChange} />M</label>
                            <label><input type="radio" name="sexo" value="X" onChange={handleChange} />X</label>
                        </div>
                        <p className="inputTitle">Fecha de Nacimiento</p>
                        <input className="form-input" type="date" name="fecha_nacimiento" placeholder="Fecha de Nacimiento" onChange={handleChange} />
                        <p className="inputTitle">Obra Social</p>
                        <input className="form-input" type="text" name="obra_social" placeholder="Obra Social" onChange={handleChange} />
                        <p className="inputTitle">Plan de Obra Social</p>
                        <input className="form-input" type="text" name="plan_os" placeholder="Plan de Obra Social" onChange={handleChange} />
                        <p className="inputTitle">Número de Afiliado</p>
                        <input className="form-input" type="text" name="num_afiliado" placeholder="Número de Afiliado" onChange={handleChange} />
                        <p className="inputTitle">Correo Electrónico</p>
                        <input className="form-input" type="email" name="mail" placeholder="Email" onChange={handleChange} />
                        <p className="inputTitle">Contraseña</p>
                        <input className="form-input" type="password" name="password" placeholder="Contraseña" onChange={handleChange} />
                    </>
                );
            case 'doctor':
                return (
                    <>
                        <p className="inputTitle">Nombre</p>
                        <input className="form-input" type="text" name="name" placeholder="Nombre" onChange={handleChange} />
                        <p className="inputTitle">Apellido</p>
                        <input className="form-input" type="text" name="surname" placeholder="Apellido" onChange={handleChange} />
                        <p className="inputTitle">DNI</p>
                        <input className="form-input" type="text" name="nid" placeholder="DNI" onChange={handleChange} />
                        <p className="inputTitle">Matrícula</p>
                        <input className="form-input" type="text" name="license" placeholder="Matrícula" onChange={handleChange} />
                        <p className="inputTitle">Especialidad</p>
                        <input className="form-input" type="text" name="specialty" placeholder="Especialidad" onChange={handleChange} />
                        <p className="inputTitle">Correo Electrónico</p>
                        <input className="form-input" type="email" name="mail" placeholder="Email" onChange={handleChange} />
                        <p className="inputTitle">Contraseña</p>
                        <input className="form-input" type="password" name="password" placeholder="Contraseña" onChange={handleChange} />
                    </>
                );
            case 'pharmacist':
                return (
                    <>
                        <p className="inputTitle">Nombre</p>
                        <input className="form-input" type="text" name="name" placeholder="Nombre" onChange={handleChange} />
                        <p className="inputTitle">Apellido</p>
                        <input className="form-input" type="text" name="surname" placeholder="Apellido" onChange={handleChange} />
                        <p className="inputTitle">Matrícula</p>
                        <input className="form-input" type="text" name="license" placeholder="Matrícula" onChange={handleChange} />
                        <p className="inputTitle">Farmacia</p>
                        <input className="form-input" type="text" name="farmacia" placeholder="Farmacia" onChange={handleChange} />
                        <p className="inputTitle">CUIT Farmacia</p>
                        <input className="form-input" type="text" name="cuit_farmacia" placeholder="CUIT Farmacia" onChange={handleChange} />
                        <p className="inputTitle">Correo Electrónico</p>
                        <input className="form-input" type="email" name="mail" placeholder="Email" onChange={handleChange} />
                        <p className="inputTitle">Contraseña</p>
                        <input className="form-input" type="password" name="password" placeholder="Contraseña" onChange={handleChange} />
                    </>
                );
            case 'insurance':
                return (
                    <>
                        <p className="inputTitle">Nombre</p>
                        <input className="form-input" type="text" name="name" placeholder="Nombre" onChange={handleChange} />
                        <p className="inputTitle">Apellido</p>
                        <input className="form-input" type="text" name="surname" placeholder="Apellido" onChange={handleChange} />
                        <p className="inputTitle">DNI</p>
                        <input className="form-input" type="text" name="nid" placeholder="DNI" onChange={handleChange} />
                        <p className="inputTitle">Razón Social</p>
                        <input className="form-input" type="text" name="razon_social" placeholder="Razón Social" onChange={handleChange} />
                        <p className="inputTitle">CUIT Obra Social</p>
                        <input className="form-input" type="text" name="cuit_os" placeholder="CUIT Obra Social" onChange={handleChange} />
                        <p className="inputTitle">Correo Electrónico</p>
                        <input className="form-input" type="email" name="mail" placeholder="Email" onChange={handleChange} />
                        <p className="inputTitle">Contraseña</p>
                        <input className="form-input" type="password" name="password" placeholder="Contraseña" onChange={handleChange} />
                    </>
                );
            default:
                return <p>Por favor, selecciona un tipo de usuario.</p>;
        }
    };

    return (
        <div className="register-container">
            <div className="form-header">
                <h2>Formulario de Registro de {userType}</h2>
            </div>
            <div className="form-body">
                {renderFields()}
                <button className="register-button" onClick={handleRegister}>Registrarme</button>
                <p>
                    ¿Ya tenés una cuenta?<button  className="login-link" onClick={handleLogin}> Ingresar</button>
                </p>
            </div>
        </div>
    );
}

export default Register;
