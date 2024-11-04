import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './styles.css';

function Login() {
    const [nid, setNid] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const navigate = useNavigate();

    const userType = document.cookie
        .split('; ')
        .find(row => row.startsWith('userType='))
        ?.split('=')[1];

    if (!userType) {
        setMessage({ text: 'No se seleccionó un tipo de usuario. Vuelve al menú principal.', type: 'error' });
        navigate('/');
        return null;
    }

    const userTypeMap = {
        patient: 'Iniciar Sesión como Paciente',
        doctor: 'Iniciar Sesión como Médico',
        pharmacist: 'Iniciar Sesión como Farmacéutico',
        insurance: 'Iniciar Sesión como Obra Social'
    };

    const displayUserType = userTypeMap[userType] || 'Iniciar Sesión';

    const handleLogin = async () => {
        try {
            const response = await axios.post('http://localhost:3001/login', { nid, password, userType });
            const token = response.data.token;
            localStorage.setItem('token', token);
            
            setMessage({ text: 'Login exitoso', type: 'success' });
            setTimeout(() => {
                setMessage({ text: '', type: '' });
                navigate(`/dashboard/${userType}`);
            }, 3000);
        } catch (error) {
            if (error.response && error.response.status === 429) {
                setMessage({ text: 'Has excedido el número de intentos de inicio de sesión. Intenta nuevamente en 15 minutos.', type: 'error' });
            } else if (error.response && error.response.status === 401) {
                setMessage({ text: 'Credenciales inválidas. Por favor, verifica tu DNI y contraseña.', type: 'error' });
            } else {
                console.error(error);
                setMessage({ text: 'Hubo un error en el servidor. Intenta de nuevo más tarde.', type: 'error' });
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
            {message.text && <Notification message={message.text} type={message.type} />} {/* Mostrar mensaje */}
        </div>
    );
}

function Notification({ message, type }) {
    return (
        <div className={`notification ${type}`}>
            {message}
        </div>
    );
}

export default Login;
