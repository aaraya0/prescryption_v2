import React, { useState } from 'react';
import axios from 'axios';

function Login() {
    const [dni, setDni] = useState('');
    const [matricula, setMatricula] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState('');

    const handleLogin = async () => {
        try {
            const response = await axios.post('http://localhost:3001/login', { dni, matricula, password });
            setToken(response.data.token);
            alert('Login successful');
        } catch (error) {
            console.error(error);
            alert('Invalid credentials');
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <input type="text" placeholder="DNI" value={dni} onChange={e => setDni(e.target.value)} />
            <input type="text" placeholder="Matricula" value={matricula} onChange={e => setMatricula(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            <button onClick={handleLogin}>Login</button>
        </div>
    );
}

export default Login;
