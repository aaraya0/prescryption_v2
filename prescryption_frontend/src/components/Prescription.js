import React, { useState } from 'react';
import axios from 'axios';

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
    <div>
      <h2>Emitir Receta</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="patientName" placeholder="Nombre y Apellido" onChange={handleChange} required />
        <input type="text" name="patientNid" placeholder="DNI" onChange={handleChange} required />
        <input type="text" name="affiliateNum" placeholder="Número de Afiliado" onChange={handleChange} required />
        <input type="text" name="insuranceName" placeholder="Obra Social" onChange={handleChange} required />
        <input type="text" name="insurancePlan" placeholder="Plan de Obra Social" onChange={handleChange} required />
        <input type="text" name="med1" placeholder="Ingresar Medicamento 1" onChange={handleChange} required />
        <input type="text" name="quantity1" placeholder="Cantidad" onChange={handleChange} required />
        <input type="text" name="med2" placeholder="Ingresar Medicamento 2" onChange={handleChange} />
        <input type="text" name="quantity2" placeholder="Cantidad" onChange={handleChange} />
        <textarea name="diagnosis" placeholder="Diagnóstico" onChange={handleChange} required></textarea>
        <button type="submit">Emitir Receta</button>
      </form>
    </div>
  );
}

export default EmitirReceta;
