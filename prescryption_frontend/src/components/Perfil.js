import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Perfil() {
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get('http://localhost:3001/api/user/profile', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setProfile(response.data);
            } catch (err) {
                console.error('Error fetching profile data:', err);
                setError('Error fetching profile data. Please try again.');
            }
        };

        fetchProfile();
    }, []);

    if (error) return <p>{error}</p>;

    return (
        <div>
            <h2>Perfil</h2>
            {profile ? (
                <div>
                    <p><strong>Tipo de Usuario:</strong> {profile.userType}</p>
                    <p><strong>Nombre y Apellido:</strong> {profile.profile.name} {profile.profile.surname}</p>
                    {profile.userType === 'patient' && (
                        <>
                            <p><strong>DNI:</strong> {profile.profile.nid}</p>
                            <p><strong>Fecha de Nacimiento:</strong> {profile.profile.birth_date}</p>
                            <p><strong>Sexo:</strong> {profile.profile.sex}</p>
                            <p><strong>Obra Social:</strong> {profile.profile.insurance_name}</p>
                            <p><strong>Plan:</strong> {profile.profile.insurance_plan}</p>
                        </>
                    )}
                    {profile.userType === 'doctor' && (
                        
                        <>  <p><strong>DNI:</strong> {profile.profile.nid}</p>
                            <p><strong>Especialidad:</strong> {profile.profile.specialty}</p>
                            <p><strong>Licencia:</strong> {profile.profile.license}</p>
                        </>
                    )}
                    {profile.userType === 'pharmacy' && (
                        <>
                            <p><strong>CUIT:</strong> {profile.profile.pharmacy_nid}</p>
                            <p><strong>Nombre de la Farmacia:</strong> {profile.profile.pharmacy_name}</p>
                            <p><strong>Número de Farmacia:</strong> {profile.profile.pharmacy_nid}</p>
                            <p><strong>Alias de Farmacia:</strong> {profile.profile.alias}</p>
                        </>
                    )}
                    {profile.userType === 'insurance' && (
                        <>
                            <p><strong>CUIT:</strong> {profile.profile.insurance_nid}</p>
                            <p><strong>Nombre de la Compañía:</strong> {profile.profile.insurance_name}</p>
                            <p><strong>ID de la Compañía:</strong> {profile.profile.insurance_nid}</p>
                        </>
                    )}
                </div>
            ) : (
                <p>Cargando información del perfil...</p>
            )}
        </div>
    );
}

export default Perfil;
