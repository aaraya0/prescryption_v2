// EmitirReceta.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './styles.css';

function EmitirReceta() {
  const [formData, setFormData] = useState({
    patientName: '',
    patientSurname: '',
    patientNid: '',
    affiliateNum: '',
    insuranceName: '',
    insurancePlan: '',
    med1: '',
    quantity1: '',
    med2: '',
    quantity2: '',
    diagnosis: '',
    observations: ''
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearchPatient = async () => {
    console.log("Buscando paciente con NID:", formData.patientNid);
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No estás autenticado. Por favor, inicia sesión nuevamente.');
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:3001/api/doctors/patients/${formData.patientNid}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const patientData = response.data.profile;
      //console.log("Datos del paciente encontrados:", patientData);

      setFormData((prev) => ({
        ...prev,
        patientName: patientData.name || '',
        patientSurname: patientData.surname || '',
        affiliateNum: patientData.affiliate_num || '',
        insuranceName: patientData.insurance_name || '',
        insurancePlan: patientData.insurance_plan || ''
      }));
    } catch (error) {
      console.error('Error al buscar datos del paciente:', error);
      alert('Paciente no encontrado.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No estás autenticado. Por favor, inicia sesión nuevamente.');
      return;
    }

    const {
      patientName,
      patientSurname,
      patientNid,
      affiliateNum,
      insuranceName,
      insurancePlan,
      med1,
      quantity1,
      diagnosis,
    } = formData;

    if (!patientName || !patientSurname || !patientNid || !affiliateNum || !insuranceName || !insurancePlan || !med1 || !quantity1 || !diagnosis) {
      alert('Por favor, completa todos los campos obligatorios.');
      return;
    }

    try {
      await axios.post(
        'http://localhost:3001/api/prescriptions/issue',
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert('Receta emitida con éxito');
      navigate('/dashboard/doctor');
    } catch (error) {
      console.error('Error al emitir la receta:', error);
      alert('Error al emitir la receta.');
    }
  };

  return (
    <div className="receta-container">
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="receipt_left">
            <div className="form-group">
              <label>DNI</label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  name="patientNid"
                  placeholder="DNI (sin puntos)"
                  onChange={handleChange}
                  value={formData.patientNid}
                  required
                />
  <button onClick={handleSearchPatient} className="search-patient-button" title="Buscar paciente">
    <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" fill="currentColor" viewBox="0 0 24 24">
      <path d="M10 2a8 8 0 105.293 14.293l4.707 4.707 1.414-1.414-4.707-4.707A8 8 0 0010 2zm0 2a6 6 0 110 12A6 6 0 0110 4z"/>
    </svg>
  </button>
              </div>
            </div>
            <div className="form-group">
              <label>Nombre del Paciente</label>
              <input type="text" name="patientName" value={formData.patientName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Apellido del Paciente</label>
              <input type="text" name="patientSurname" value={formData.patientSurname} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Número de Afiliado</label>
              <input type="text" name="affiliateNum" value={formData.affiliateNum} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Obra Social</label>
              <input type="text" name="insuranceName" value={formData.insuranceName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Plan de Obra Social</label>
              <input type="text" name="insurancePlan" value={formData.insurancePlan} onChange={handleChange} required />
            </div>
          </div>
          <div className="receipt_right">
            <div className="form-group">
              <label>Rp:</label>
              <input type="text" name="med1" placeholder="Ingresar medicamento 1" onChange={handleChange} required />
              <input type="text" name="quantity1" placeholder="Ingresar Cantidad" onChange={handleChange} required />
              <input type="text" name="med2" placeholder="Ingresar medicamento 2" onChange={handleChange} />
              <input type="text" name="quantity2" placeholder="Ingresar Cantidad" onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Diagnóstico</label>
              <textarea name="diagnosis" className="textarea" placeholder="Ingresar diagnóstico" onChange={handleChange} required></textarea>
            </div>
            <div className="form-group">
              <label>Observaciones</label>
              <textarea name="observations" className="textarea" placeholder="Ingresar observaciones (opcional)" onChange={handleChange}></textarea>
            </div>
          </div>
          <div className="buttonGenerarReceta">
            <button type="submit" className="button">Generar Receta</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EmitirReceta;
