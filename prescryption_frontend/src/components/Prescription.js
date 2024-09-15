import React, { useState } from 'react';
import axios from 'axios';

function EmitirReceta() {
  const [formData, setFormData] = useState({
    nombrePaciente: '',
    dniPaciente: '',
    numAfiliado: '',
    obraSocial: '',
    planObraSocial: '',
    medicamento1: '',
    cantidad1: '',
    medicamento2: '',
    cantidad2: '',
    diagnostico: '',
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
      nombrePaciente,
      dniPaciente,
      numAfiliado,
      obraSocial,
      planObraSocial,
      medicamento1,
      cantidad1,
      diagnostico,
    } = formData;

    if (!nombrePaciente || !dniPaciente || !numAfiliado || !obraSocial || !planObraSocial || !medicamento1 || !cantidad1 || !diagnostico) {
      alert('Por favor, completa todos los campos obligatorios.');
      return;
    }

    // Imprimir el token y los datos del formulario para depuración
    console.log('Token:', token);
    console.log('Datos del formulario:', formData);

    try {
      // Enviar la solicitud al backend con el token en los headers
      const response = await axios.post(
        'http://localhost:3001/api/emitir_receta',
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
        <input type="text" name="nombrePaciente" placeholder="Nombre y Apellido" onChange={handleChange} required />
        <input type="text" name="dniPaciente" placeholder="DNI" onChange={handleChange} required />
        <input type="text" name="numAfiliado" placeholder="Número de Afiliado" onChange={handleChange} required />
        <input type="text" name="obraSocial" placeholder="Obra Social" onChange={handleChange} required />
        <input type="text" name="planObraSocial" placeholder="Plan de Obra Social" onChange={handleChange} required />
        <input type="text" name="medicamento1" placeholder="Ingresar Medicamento 1" onChange={handleChange} required />
        <input type="text" name="cantidad1" placeholder="Cantidad" onChange={handleChange} required />
        <input type="text" name="medicamento2" placeholder="Ingresar Medicamento 2" onChange={handleChange} />
        <input type="text" name="cantidad2" placeholder="Cantidad" onChange={handleChange} />
        <textarea name="diagnostico" placeholder="Diagnóstico" onChange={handleChange} required></textarea>
        <button type="submit">Emitir Receta</button>
      </form>
    </div>
  );
}

export default EmitirReceta;
