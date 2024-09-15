import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./styles.css"
function Login() {
    const [nid, setNid] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const userType = document.cookie
    .split('; ')
    .find(row => row.startsWith('userType='))
    ?.split('=')[1];

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
            const token = response.data.token;
            localStorage.setItem('token', token); // Guarda el token en localStorage
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
        navigate('/register'); 
    };

    return (
        <div className="formLogin">
            <h2 className="loginTitle">Iniciar Sesión {userType}</h2>
            <p className="inputTitle">DNI</p>
            <input className="loginInput" type="text" placeholder="DNI (sin puntos)" value={nid} onChange={e => setNid(e.target.value)} />
            <p className="inputTitle">Contraseña</p>
            <input className="loginInput" type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} />
            <button className="loginButton" onClick={handleLogin}>Ingresar</button>
            <button className='RecordarButton'>Recordar Contraseña</button>
            <p>
                ¿No tenés una cuenta? <button className='RegistrateButton' onClick={handleRegister}>Registrate</button>
            </p>
        </div>
    );
}

export default Login;
