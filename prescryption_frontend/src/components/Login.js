import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './styles.css';

function Login() {
    const [nid, setNid] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // 👈 nuevo estado
    const [userType, setUserType] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const navigate = useNavigate();

    useEffect(() => {
        const cookieType = document.cookie
            .split('; ')
            .find(row => row.startsWith('userType='))
            ?.split('=')[1];

        if (!cookieType) {
            setMessage({ text: 'No se seleccionó un tipo de usuario. Volvé al menú principal.', type: 'error' });
            navigate('/');
        } else {
            setUserType(cookieType);
        }
    }, [navigate]);

    const userTypeMap = {
        patient: 'Iniciar Sesión como Paciente',
        doctor: 'Iniciar Sesión como Médico',
        pharmacist: 'Iniciar Sesión como Farmacéutico',
        insurance: 'Iniciar Sesión como Obra Social'
    };

    const displayUserType = userTypeMap[userType] || 'Iniciar Sesión';

    const handleLogin = async () => {
        try {
            const response = await axios.post('http://localhost:3001/api/auth/login', {
                nid,
                password,
                userType
            });

            const token = response.data.token;
            localStorage.setItem('token', token);

            setMessage({ text: 'Login exitoso', type: 'success' });

            setTimeout(() => {
                setMessage({ text: '', type: '' });
                navigate(`/dashboard/${userType}`);
            }, 3000);

        } catch (error) {
            if (error.response && error.response.status === 429) {
                setMessage({ text: 'Has excedido el número de intentos. Esperá 15 minutos.', type: 'error' });
            } else if (error.response && error.response.status === 401) {
                setMessage({ text: 'Credenciales inválidas. Verificá tu DNI y contraseña.', type: 'error' });
            } else {
                console.error(error);
                setMessage({ text: 'Hubo un error en el servidor. Intentalo más tarde.', type: 'error' });
            }
        }
    };

    const handleRegister = () => {
        navigate('/register');
    };

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    return (
        <div className="formLogin">
            <h2 className="loginTitle">{displayUserType}</h2>

            <p className="inputTitle">DNI</p>
            <input
                className="loginInput"
                type="text"
                placeholder="DNI (sin puntos)"
                value={nid}
                onChange={e => setNid(e.target.value)}
            />

            <p className="inputTitle">Contraseña</p>

            <div className="password-container">
  <input
    className="loginInput password-field"
    type={showPassword ? "text" : "password"}
    placeholder="Contraseña"
    value={password}
    onChange={e => setPassword(e.target.value)}
  />
  <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
    {showPassword ? '🙈' : '👁️'}
  </span>
</div>


            <button className="loginButton" onClick={handleLogin}>Ingresar</button>
            <button className="RecordarButton">Recordar Contraseña</button>
            <p>
                ¿No tenés una cuenta?{' '}
                <button className="RegistrateButton" onClick={handleRegister}>Registrate</button>
            </p>

            {message.text && <Notification message={message.text} type={message.type} />}
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
