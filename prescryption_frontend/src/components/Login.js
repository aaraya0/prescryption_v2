import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./styles.css";

function Login() {
    const [nid, setNid] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    // Obtener el tipo de usuario desde la cookie
    const userType = document.cookie
        .split('; ')
        .find(row => row.startsWith('userType='))
        ?.split('=')[1];

    // Validar que el tipo de usuario esté en la cookie
    if (!userType) {
        alert('No se seleccionó un tipo de usuario. Vuelve al menú principal.');
        navigate('/'); // Redirige al menú principal si no se ha seleccionado un tipo de usuario
        return null; // Evita renderizar el componente si no hay tipo de usuario
    }

    const userTypeMap = {
        patient: 'Iniciar Sesión como Paciente',
        doctor: 'Iniciar Sesión como Médico',
        pharmacist: 'Iniciar Sesión como Farmacéutico',
        insurance: 'Iniciar Sesión como Obra Social'
    };

    const displayUserType = userTypeMap[userType] || 'Iniciar Sesión'; // Texto por defecto si no se encuentra el tipo de usuario

    const handleLogin = async () => {
        try {
            const response = await axios.post('http://localhost:3001/login', { nid, password, userType });
            const token = response.data.token;
            localStorage.setItem('token', token); // Guarda el token en localStorage
            alert('Login exitoso');
            navigate(`/dashboard/${userType}`);

        } catch (error) {
            if (error.response && error.response.status === 429) {
                setErrorMessage('Has excedido el número de intentos de inicio de sesión. Intenta nuevamente en 15 minutos.');
            } else if (error.response && error.response.status === 401) {
                setErrorMessage('Credenciales inválidas. Por favor, verifica tu DNI y contraseña.');
            } else {
                console.error(error);
                setErrorMessage('Hubo un error en el servidor. Intenta de nuevo más tarde.');
            }
        }
    };

    const handleRegister = () => {
        navigate('/register');
    };

    return (
        <div className="formLogin">
            <h2 className="loginTitle">{displayUserType}</h2>
            <p className="inputTitle">DNI</p>
            <input className="loginInput" type="text" placeholder="DNI (sin puntos)" value={nid} onChange={e => setNid(e.target.value)} />
            <p className="inputTitle">Contraseña</p>
            <input className="loginInput" type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} />
            <button className="loginButton" onClick={handleLogin}>Ingresar</button>
            <button className='RecordarButton'>Recordar Contraseña</button>
            <p>
                ¿No tenés una cuenta? <button className='RegistrateButton' onClick={handleRegister}>Registrate</button>
            </p>
            {errorMessage && <p className="error">{errorMessage}</p>} {/* Mostrar mensaje de error */}
        </div>
    );
}

export default Login;
