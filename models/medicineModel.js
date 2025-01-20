const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  stock: { type: Number, required: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  addedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Medicine', medicineSchema);
