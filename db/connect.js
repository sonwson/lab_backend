const mongoose = require("mongoose");

const DEFAULT_MONGODB_URI = "mongodb://127.0.0.1:27017/photo-sharing";

async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });

  return mongoose.connection;
}

module.exports = {
  connectToDatabase,
  DEFAULT_MONGODB_URI,
};
