import React, { useEffect, useState } from 'react';
import axios from 'axios';

function PatientProfile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:3001/api/patients/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProfile(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching profile:', err);
                setError('No se pudo cargar el perfil.');
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) return <p>Cargando perfil...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h2>Perfil del Paciente</h2>
            <p><strong>Nombre:</strong> {profile.name}</p>
            <p><strong>Apellido:</strong> {profile.surname}</p>
            <p><strong>DNI:</strong> {profile.nid}</p>
            <p><strong>Fecha de nacimiento:</strong> {profile.birth_date}</p>
            <p><strong>Sexo:</strong> {profile.sex}</p>
            <p><strong>Obra Social:</strong> {profile.insurance_name}</p>
            <p><strong>N° de Afiliado:</strong> {profile.affiliate_num}</p>
            <p><strong>Plan:</strong> {profile.insurance_plan}</p>
            <p><strong>Correo:</strong> {profile.mail}</p>
        </div>
    );
}

export default PatientProfile;
