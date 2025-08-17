// tests/unit/authMiddleware.test.js
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const path = require('path');

// Cargamos SECRET_KEY de tests si existe (no pisamos valores ya presentes)
require('dotenv').config({ path: path.resolve(__dirname, '../acceptance/.env.test'), override: false });
process.env.SECRET_KEY = process.env.SECRET_KEY || 'unit-tests-secret';

// Importamos el middleware real del proyecto
const authMiddleware = require('../../middleware/authMiddleware');

// App mínima con una ruta protegida para DOCTOR
const app = express();
app.get('/doctor-only', authMiddleware('doctor'), (req, res) => {
  return res.json({
    ok: true,
    user: req.user || null,
  });
});

const sign = (payload) => jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: '1h' });

describe('middleware/authMiddleware', () => {
  it('permite acceso con token de doctor', async () => {
    // 👇 Ojo: el middleware usa "userType", no "role"
    const token = sign({ id: 'abc123', nid: 'DOC001', userType: 'doctor' });

    const res = await request(app)
      .get('/doctor-only')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.user?.userType).toBe('doctor');
  });

  it('rechaza con 403 si el userType no es doctor', async () => {
    const token = sign({ id: 'xyz987', nid: 'PHARM001', userType: 'pharmacy' });

    await request(app)
      .get('/doctor-only')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('rechaza con 403 si no hay token', async () => {
    // El middleware retorna 403 "Token required" si falta token
    await request(app)
      .get('/doctor-only')
      .expect(403);
  });
});
