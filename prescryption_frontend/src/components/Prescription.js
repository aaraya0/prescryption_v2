import React, { useState } from 'react';
import axios from 'axios';
import "./styles.css"

function EmitirReceta() {
  const [formData, setFormData] = useState({
    patientName: '',
    patientNid: '',
    affiliateNum: '',
    insuranceName: '',
    insurancePlan: '',
    med1: '',
    quantity1: '',
    med2: '',
    quantity2: '',
    diagnosis: '',
  });

  // Manejar los cambios en los inputs del formulario
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Obtener el token almacenado en localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No estás autenticado. Por favor, inicia sesión nuevamente.');
      return;
    }

    // Validar los campos del formulario antes de enviarlos
    const {
      patientName,
      patientNid,
      affiliateNum,
      insuranceName,
      insurancePlan,
      med1,
      quantity1,
      diagnosis,
    } = formData;

    if (!patientName || !patientNid || !affiliateNum || !insuranceName || !insurancePlan || !med1 || !quantity1 || !diagnosis) {
      alert('Por favor, completa todos los campos obligatorios.');
      return;
    }

    // Imprimir el token y los datos del formulario para depuración
    console.log('Token:', token);
    console.log('Datos del formulario:', formData);

    try {
      // Enviar la solicitud al backend con el token en los headers
      const response = await axios.post(
        'http://localhost:3001/api/issue_pres',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`, // Incluye el token en el header
          },
        }
      );
      alert('Receta emitida con éxito');
      console.log('Respuesta del servidor:', response.data);
    } catch (error) {
      console.error('Error al emitir la receta:', error);

      // Manejo de errores detallado
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        
        // Manejar diferentes tipos de errores de autenticación o validación
        if (error.response.status === 401) {
          alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
        } else if (error.response.status === 400) {
          alert('Faltan datos necesarios para emitir la receta.');
        } else {
          alert('Error desconocido al emitir la receta.');
        }
      } else {
        alert('Error al emitir la receta.');
      }
    }
  };

  return (
    <div className="receta-container">
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="receipt_left">
            <div className="form-group">
              <label>Nombre(s) y Apellido(s) del Paciente</label>
              <input type="text" name="patientName" placeholder="Nombre(s)" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>DNI</label>
              <input type="text" name="patientNid" placeholder="DNI (sin puntos)" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Número de Afiliado</label>
              <input type="text" name="affiliateNum" placeholder="Número de Afiliado" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Obra Social</label>
              <input type="text" name="insuranceName" placeholder="Obra Social" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Plan de Obra Social</label>
              <input type="text" name="insurancePlan" placeholder="Plan Obra Social" onChange={handleChange} required />
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
          </div>
          <button type="submit" className="button">Generar Receta</button>
        </form>
        <div className="separator"></div>
        <div className="medical-info">
          <div className="doctor-info">
            <p>Médica: Julia Blunt</p>
            <p>MP: 1234E</p>
            <p>Médica - Gastroenteróloga</p>
          </div>
          <div className="prescription-info">
            <p>Fecha de Emisión: 20/08/2024</p>
            <p>Fecha de Vencimiento: 20/09/2024</p>
            <p>Córdoba - Argentina</p>
          </div>
        </div>
      </div>
      
    </div>
  );

}

export default EmitirReceta;
