import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Register() {
    const [formData, setFormData] = useState({});
    const [insurancePlan, setInsurancePlan] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const userType = document.cookie
        .split('; ')
        .find(row => row.startsWith('userType='))
        ?.split('=')[1];
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const fetchInsurancePlan = async () => {
        const { name, surname, nid, insurance_name, affiliate_num } = formData;

        if (!name || !surname || !nid || !insurance_name || !affiliate_num) {
            alert('Por favor, completa Nombre, Apellido, DNI, Obra Social y Número de Afiliado.');
            return;
        }

        try {
            const response = await axios.get('http://localhost:3001/insurance/plan', {
                params: { name, surname, nid, insurance_name, affiliate_num }
            });
            setInsurancePlan(response.data.plan);
            setFormData({ ...formData, insurance_plan: response.data.plan }); // Guarda el plan en el formulario
            setErrorMessage('');
        } catch (error) {
            console.error('Error fetching insurance plan:', error);
            setErrorMessage('No se encontró un plan para este afiliado.');
            setInsurancePlan(''); // Limpiar el plan si hay error
        }
    };

    const handleRegister = async () => {
        try {
            await axios.post(`http://localhost:3001/register_${userType}`, formData);
            alert('Registro exitoso');
            navigate('/login');
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
                            <label><input type="radio" name="sex" value="F" onChange={handleChange} />F</label>
                            <label><input type="radio" name="sex" value="M" onChange={handleChange} />M</label>
                            <label><input type="radio" name="sex" value="X" onChange={handleChange} />X</label>
                        </div>
                        <p className="inputTitle">Fecha de Nacimiento</p>
                        <input className="form-input" type="date" name="birth_date" placeholder="Fecha de Nacimiento" onChange={handleChange} />

                        <p className="inputTitle">Obra Social</p>
                        <input className="form-input" type="text" name="insurance_name" placeholder="Obra Social" onChange={handleChange} />
                        <p className="inputTitle">Número de Afiliado</p>
                        <div className="affiliate-input-container">
    <input 
        className="form-input" 
        type="text" 
        name="affiliate_num" 
        placeholder="Número de Afiliado" 
        onChange={handleChange} 
    />
    <button 
        type="button" 
        onClick={fetchInsurancePlan} 
        className="fetch-plan-button"
        title="Fetch Insurance Plan"
    >
        ➔ {/* Icono de flecha */}
    </button>
</div>
                        
                        <p className="inputTitle">Plan de Obra Social</p>
                        <input
                            className="form-input"
                            type="text"
                            name="insurance_plan"
                            placeholder="Plan de Obra Social"
                            value={insurancePlan}
                            readOnly
                        />
                        {errorMessage && <p className="error">{errorMessage}</p>}
                        
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
                case 'pharmacy':
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
                            <p className="inputTitle">Nombre de la Farmacia</p>
                            <input className="form-input" type="text" name="pharmacy_name" placeholder="Nombre de Farmacia" onChange={handleChange} />
                            <p className="inputTitle">Alias de Farmacia</p>
                            <input className="form-input" type="text" name="alias" placeholder="Alias de Farmacia" onChange={handleChange} />
                            <p className="inputTitle">CUIT Farmacia</p>
                            <input className="form-input" type="text" name="pharmacy_nid" placeholder="CUIT Farmacia" onChange={handleChange} />
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
                    ¿Ya tenés una cuenta?<button className="login-link" onClick={handleLogin}> Ingresar</button>
                </p>
            </div>
        </div>
    );
}

export default Register;
