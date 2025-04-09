import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Perfil() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const userType = document.cookie
        .split('; ')
        .find(row => row.startsWith('userType='))
        ?.split('=')[1];

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`http://localhost:3001/api/${userType}s/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProfile(response.data);
            } catch (err) {
                console.error('Error fetching profile:', err);
                setError('No se pudo cargar el perfil.');
            } finally {
                setLoading(false);
            }
        };

        if (userType) fetchProfile();
    }, [userType]);

    if (loading) return <p>Cargando perfil...</p>;
    if (error) return <p>{error}</p>;

    const renderFields = () => {
        switch (userType) {
            case 'patient':
                return (
                    <>
                        <p><strong>Nombre:</strong> {profile.name}</p>
                        <p><strong>Apellido:</strong> {profile.surname}</p>
                        <p><strong>DNI:</strong> {profile.nid}</p>
                        <p><strong>Fecha de nacimiento:</strong> {profile.birth_date}</p>
                        <p><strong>Sexo:</strong> {profile.sex}</p>
                        <p><strong>Obra Social:</strong> {profile.insurance_name}</p>
                        <p><strong>Plan:</strong> {profile.insurance_plan}</p>
                        <p><strong>N° de Afiliado:</strong> {profile.affiliate_num}</p>
                        <p><strong>Correo:</strong> {profile.mail}</p>
                    </>
                );
            case 'doctor':
                return (
                    <>
                        <p><strong>Nombre:</strong> {profile.name}</p>
                        <p><strong>Apellido:</strong> {profile.surname}</p>
                        <p><strong>DNI:</strong> {profile.nid}</p>
                        <p><strong>Especialidad:</strong> {profile.specialty}</p>
                        <p><strong>Licencia:</strong> {profile.license}</p>
                        <p><strong>Correo:</strong> {profile.mail}</p>
                    </>
                );
            case 'pharmacy':
                return (
                    <>
                        <p><strong>Nombre:</strong> {profile.name}</p>
                        <p><strong>Apellido:</strong> {profile.surname}</p>
                        <p><strong>CUIT Farmacia:</strong> {profile.pharmacy_nid}</p>
                        <p><strong>Nombre Farmacia:</strong> {profile.pharmacy_name}</p>
                        <p><strong>Alias:</strong> {profile.alias}</p>
                        <p><strong>Correo:</strong> {profile.mail}</p>
                    </>
                );
            case 'insurance':
                return (
                    <>
                        <p><strong>Nombre:</strong> {profile.name}</p>
                        <p><strong>Apellido:</strong> {profile.surname}</p>
                        <p><strong>CUIT Obra Social:</strong> {profile.cuit_os}</p>
                        <p><strong>Razón Social:</strong> {profile.razon_social}</p>
                        <p><strong>Correo:</strong> {profile.mail}</p>
                    </>
                );
            default:
                return <p>Tipo de usuario desconocido</p>;
        }
    };

    return (
        <div className="perfil-container">
            <h2>Perfil de {userType}</h2>
            {renderFields()}
        </div>
    );
}

export default Perfil;
