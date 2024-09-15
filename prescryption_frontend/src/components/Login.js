import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./styles.css"

function Login() {
    const [nid, setNid] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        const userType = document.cookie
            .split('; ')
            .find(row => row.startsWith('userType='))
            ?.split('=')[1];

        if (!userType) {
            alert('No se seleccionó un tipo de usuario');
            return;
        }

        try {
            const response = await axios.post('http://localhost:3001/login', { nid, password, userType });
            setToken(response.data.token);
            alert('Login exitoso');
            switch (userType) {
                case 'paciente':
                    navigate('/dashboard/paciente');
                    break;
                case 'medico':
                    navigate('/dashboard/medico');
                    break;
                case 'farmaceutico':
                    navigate('/dashboard/farmaceutico');
                    break;
                case 'obra_social':
                    navigate('/dashboard/obra_social');
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error(error);
            alert('Credenciales inválidas');
        }
    };

    const handleRegister = () => {
        navigate('/register'); // Redirige a la pantalla de registro
    };

    return (
        <div className="formLogin">
            <h2 className="loginTitle">Iniciar Sesión</h2>
            <p className="buttonTitle">DNI</p>
            <input className="loginButton" type="text" placeholder="DNI (sin puntos)" value={nid} onChange={e => setNid(e.target.value)} />
            <p className="buttonTitle">Contraseña</p>
            <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} />
            <button className="loginButton" onClick={handleLogin}>Ingresar</button>
            <p>
                ¿No tenés una cuenta? <button onClick={handleRegister}>Registrate</button>
            </p>
        </div>
    );
}

export default Login;
