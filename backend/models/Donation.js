const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donorName: { type: String, required: true },
  email: { type: String, required: true },
  amount: { type: Number, required: true },
  message: String,
  date: { type: Date, default: Date.now },
  
  // --- MAKE SURE THESE TWO EXIST ---
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' // <--- This ensures new data shows up as Pending!
  },
  cause: { type: String, default: 'General Support' }
});

module.exports = mongoose.model('Donation', donationSchema);