const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

async function connect() {
  
  if (mongoose.connection && mongoose.connection.readyState === 1) return;

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

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
