import React, { useEffect, useState } from "react";
import axios from "axios";
import "./styles.css";
import {
  FaUser,
  FaEnvelope,
  FaIdCard,
  FaBirthdayCake,
  FaVenusMars,
  FaBriefcaseMedical,
  FaStethoscope,
  FaClinicMedical,
} from "react-icons/fa";

function Perfil() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userType = document.cookie
    .split("; ")
    .find((row) => row.startsWith("userType="))
    ?.split("=")[1];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No estás autenticado");
          setLoading(false);
          return;
        }

        // 2) Elegimos la ruta EXACTA según el userType
        let url = "";
        if (userType === "doctor") {
          // ⇒ /api/doctors/profile
          url = "http://localhost:3001/api/doctors/profile";
        } else if (userType === "patient") {
          // (Asumo que si existe ruta /api/patients/profile en tu back)
          url = "http://localhost:3001/api/patients/profile";
        } else if (userType === "pharmacyUser") {
          // ⇒ /api/pharmacy-users/profile
          url = "http://localhost:3001/api/pharmacy-users/profile";
        } else if (userType === "pharmacyAdmin") {
          // ⇒ /api/pharmacy-admin/pharmacy_profile
          url = "http://localhost:3001/api/pharmacy-admin/pharmacy_profile";
        } else if (userType === "insurance") {
          // (Asumo /api/insurance/profile o el router que tengas)
          url = "http://localhost:3001/api/insurances/profile";
        } else {
          // Si no coincide ningún tipo
          setError("Tipo de usuario desconocido");
          setLoading(false);
          return;
        }

        // 3) Hacemos la petición al endpoint CORRECTO
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(response.data);
      } catch (err) {
        console.error("Error fetching profile:", err);
        // Distinguir posibles errores:
        if (err.response && err.response.status === 404) {
          setError("Perfil no encontrado");
        } else if (err.response && err.response.status === 403) {
          setError("No tienes permisos para ver este perfil");
        } else {
          setError("No se pudo cargar el perfil.");
        }
      } finally {
        setLoading(false);
      }
    };
    if (userType) {
      fetchProfile();
    } else {
      setError("No se detectó el tipo de usuario");
      setLoading(false);
    }
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
      case "patient":
        return (
          <>
            <Field icon={<FaUser />} label="Nombre" value={profile.name} />
            <Field icon={<FaUser />} label="Apellido" value={profile.surname} />
            <Field icon={<FaIdCard />} label="DNI" value={profile.nid} />
            <Field
              icon={<FaBirthdayCake />}
              label="Fecha de nacimiento"
              value={new Date(profile.birth_date).toLocaleDateString("es-AR")}
            />
            <Field
              icon={<FaVenusMars />}
              label="Sexo"
              value={
                profile.sex === "M"
                  ? "Masculino"
                  : profile.sex === "F"
                  ? "Femenino"
                  : profile.sex === "X"
                  ? "No binario"
                  : "No especificado"
              }
            />
            <Field
              icon={<FaBriefcaseMedical />}
              label="Obra Social"
              value={profile.insurance_name}
            />
            <Field
              icon={<FaIdCard />}
              label="Plan"
              value={profile.insurance_plan}
            />
            <Field
              icon={<FaIdCard />}
              label="N° de Afiliado"
              value={profile.affiliate_num}
            />
            <Field icon={<FaEnvelope />} label="Correo" value={profile.mail} />
          </>
        );
      case "doctor":
        return (
          <>
            <Field icon={<FaUser />} label="Nombre" value={profile.name} />
            <Field icon={<FaUser />} label="Apellido" value={profile.surname} />
            <Field icon={<FaIdCard />} label="DNI" value={profile.nid} />
            <Field
              icon={<FaStethoscope />}
              label="Especialidad"
              value={profile.specialty}
            />
            <Field
              icon={<FaIdCard />}
              label="Licencia"
              value={profile.license}
            />
            <Field icon={<FaEnvelope />} label="Correo" value={profile.mail} />
          </>
        );
      case "pharmacy":
        return (
          <>
            <Field icon={<FaUser />} label="Nombre" value={profile.name} />
            <Field icon={<FaUser />} label="Apellido" value={profile.surname} />
            <Field
              icon={<FaIdCard />}
              label="CUIT Farmacia"
              value={profile.pharmacy_nid}
            />
            <Field
              icon={<FaClinicMedical />}
              label="Nombre Farmacia"
              value={profile.pharmacy_name}
            />
            <Field icon={<FaIdCard />} label="Alias" value={profile.alias} />
            <Field icon={<FaEnvelope />} label="Correo" value={profile.mail} />
          </>
        );
      case "pharmacyUser":
        return (
          <>
            <Field icon={<FaUser />} label="Nombre" value={profile.name} />
            <Field icon={<FaUser />} label="Apellido" value={profile.surname} />
            <Field icon={<FaIdCard />} label="DNI" value={profile.nid} />
            <Field
              icon={<FaIdCard />}
              label="Licencia"
              value={profile.license}
            />
            <Field icon={<FaEnvelope />} label="Correo" value={profile.email} />
            <Field
              icon={<FaClinicMedical />}
              label="CUIT Farmacia"
              value={profile.pharmacyNid}
            />
            {profile.pharmacy_name && (
              <Field
                icon={<FaClinicMedical />}
                label="Nombre Farmacia"
                value={profile.pharmacy_name}
              />
            )}
          </>
        );
      case "insurance":
        return (
          <>
            <Field
              icon={<FaUser />}
              label="Nombre"
              value={profile.insurance_name}
            />
            <Field
              icon={<FaIdCard />}
              label="CUIT Obra Social"
              value={profile.insurance_nid}
            />
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
      <div className="perfil-content">{renderFields()}</div>
    </div>
  );
}

export default Perfil;
