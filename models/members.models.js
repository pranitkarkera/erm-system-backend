const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
 name: { type: String, required: true },
});

const Members = mongoose.model('Members', memberSchema);
module.exports = Members;