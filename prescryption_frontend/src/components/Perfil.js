import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles.css';
import { FaUser, FaEnvelope, FaIdCard, FaBirthdayCake, FaVenusMars, FaBriefcaseMedical, FaStethoscope, FaClinicMedical, FaBuilding } from 'react-icons/fa';

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

    if (loading) return <p className="perfil-loading">Cargando perfil...</p>;
    if (error) return <p className="perfil-error">{error}</p>;

    const Field = ({ icon, label, value }) => (
        <div className="perfil-item">
            <span className="perfil-icon">{icon}</span>
            <strong>{label}:</strong> {value}
        </div>
    );

    const renderFields = () => {
        switch (userType) {
            case 'patient':
                return (
                    <>
                        <Field icon={<FaUser />} label="Nombre" value={profile.name} />
                        <Field icon={<FaUser />} label="Apellido" value={profile.surname} />
                        <Field icon={<FaIdCard />} label="DNI" value={profile.nid} />
                        <Field icon={<FaBirthdayCake />} label="Fecha de nacimiento" value={profile.birth_date} />
                        <Field icon={<FaVenusMars />} label="Sexo" value={profile.sex} />
                        <Field icon={<FaBriefcaseMedical />} label="Obra Social" value={profile.insurance_name} />
                        <Field icon={<FaIdCard />} label="Plan" value={profile.insurance_plan} />
                        <Field icon={<FaIdCard />} label="N° de Afiliado" value={profile.affiliate_num} />
                        <Field icon={<FaEnvelope />} label="Correo" value={profile.mail} />
                    </>
                );
            case 'doctor':
                return (
                    <>
                        <Field icon={<FaUser />} label="Nombre" value={profile.name} />
                        <Field icon={<FaUser />} label="Apellido" value={profile.surname} />
                        <Field icon={<FaIdCard />} label="DNI" value={profile.nid} />
                        <Field icon={<FaStethoscope />} label="Especialidad" value={profile.specialty} />
                        <Field icon={<FaIdCard />} label="Licencia" value={profile.license} />
                        <Field icon={<FaEnvelope />} label="Correo" value={profile.mail} />
                    </>
                );
            case 'pharmacy':
                return (
                    <>
                        <Field icon={<FaUser />} label="Nombre" value={profile.name} />
                        <Field icon={<FaUser />} label="Apellido" value={profile.surname} />
                        <Field icon={<FaIdCard />} label="CUIT Farmacia" value={profile.pharmacy_nid} />
                        <Field icon={<FaClinicMedical />} label="Nombre Farmacia" value={profile.pharmacy_name} />
                        <Field icon={<FaIdCard />} label="Alias" value={profile.alias} />
                        <Field icon={<FaEnvelope />} label="Correo" value={profile.mail} />
                    </>
                );
            case 'insurance':
                return (
                    <>
                        <Field icon={<FaUser />} label="Nombre" value={profile.name} />
                        <Field icon={<FaUser />} label="Apellido" value={profile.surname} />
                        <Field icon={<FaIdCard />} label="CUIT Obra Social" value={profile.cuit_os} />
                        <Field icon={<FaBuilding />} label="Razón Social" value={profile.razon_social} />
                        <Field icon={<FaEnvelope />} label="Correo" value={profile.mail} />
                    </>
                );
            default:
                return <p>Tipo de usuario desconocido</p>;
        }
    };

    return (
        <div className="perfil-card-aesthetic">
            <h2 className="perfil-title">Perfil de {userType}</h2>
            <div className="perfil-content">
                {renderFields()}
            </div>
        </div>
    );
}

export default Perfil;
