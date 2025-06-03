const mongoose = require("mongoose");
// Tag Schema

const tagSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Tag names must be unique
});

const Tags = mongoose.model("Tag", tagSchema);

module.exports = Tags;
