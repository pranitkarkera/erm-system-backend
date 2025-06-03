const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, 
  members: [{type: mongoose.Schema.Types.ObjectId, ref: 'Members' }]
});

const Teams = mongoose.model("Team", teamSchema);

module.exports = Teams;
