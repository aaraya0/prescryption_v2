// tests/testUtils/setupTestDB.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

async function connect() {
  // Si ya hay una conexión abierta, no hagas nada
  if (mongoose.connection && mongoose.connection.readyState === 1) return;

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Conectar SIN opciones deprecadas
  await mongoose.connect(uri);
}

async function closeDatabase() {
  try {
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase().catch(() => {});
      await mongoose.connection.close().catch(() => {});
    }
  } finally {
    if (mongoServer) {
      await mongoServer.stop().catch(() => {});
      mongoServer = null;
    }
  }
}

module.exports = { connect, closeDatabase };
