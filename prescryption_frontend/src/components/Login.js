import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
        <div>
            <h2>Login</h2>
            <input type="text" placeholder="DNI" value={nid} onChange={e => setNid(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            <button onClick={handleLogin}>Login</button>
            <p>
                ¿No tienes cuenta? <button onClick={handleRegister}>Regístrate</button>
            </p>
        </div>
    );
}

export default Login;
