const mongoose = require("mongoose");
require("dotenv").config();

const MongoUri = process.env.MONGO_URI; // Use env variable

const initializeDatabase = async () => {
  if (!MongoUri) {
    console.error("MongoDB URI is not set. Please check your .env file.");
    process.exit(1);
  }
  mongoose
    .connect(MongoUri)
    .then(() => {
      console.log("Connected to MongoDB successfully.");
    })
    .catch((err) => {
      console.log("Error while connecting to database", err);
      process.exit(1);
    });
};

module.exports = { initializeDatabase };
