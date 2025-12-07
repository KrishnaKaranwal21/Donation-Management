require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Donation = require('./models/Donation'); 

const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

/* --- AUTHENTICATION --- */
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@hope.com' && password === 'admin123') {
    return res.json({ success: true, role: 'admin', name: 'Admin', email });
  }
  if (email === 'donor@test.com' && password === 'donor123') {
    return res.json({ success: true, role: 'donor', name: 'Donor', email });
  }
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

/* --- DONATION ROUTES (STRICT SEPARATION) --- */

// 1. GET Stats (Approved Only - For Dashboard)
app.get('/api/donations/stats', async (req, res) => {
  try {
    const approvedFilter = { status: 'approved' };
    const totalDonations = await Donation.countDocuments(approvedFilter);
    const totalAmountData = await Donation.aggregate([
      { $match: approvedFilter },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalAmount = totalAmountData.length > 0 ? totalAmountData[0].total : 0;
    const recentDonations = await Donation.find(approvedFilter).sort({ date: -1 }).limit(5);
    res.json({ totalDonations, totalAmount, recentDonations });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. GET Pending ONLY (Strict Filter)
// This guarantees NO finished items appear in the Pending tab
app.get('/api/donations/pending', async (req, res) => {
  try {
    const pending = await Donation.find({ status: 'pending' }).sort({ date: -1 });
    res.json(pending);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. GET Processed/History ONLY (Strict Filter)
// This guarantees NO pending items appear in the History tab
app.get('/api/donations/all', async (req, res) => {
  try {
    // Return status NOT EQUAL to 'pending' (So only approved or rejected)
    const processed = await Donation.find({ status: { $ne: 'pending' } }).sort({ date: -1 });
    res.json(processed);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. GET Individual History
app.get('/api/donations/my-history/:email', async (req, res) => {
  try {
    const history = await Donation.find({ email: req.params.email }).sort({ date: -1 });
    const totalDonated = history
      .filter(d => d.status === 'approved')
      .reduce((sum, d) => sum + d.amount, 0);
    res.json({ history, totalDonated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. POST New Donation
app.post('/api/donations', async (req, res) => {
  try {
    const newDonation = new Donation({
      donorName: req.body.donorName,
      email: req.body.email,
      amount: req.body.amount,
      cause: req.body.cause,
      message: req.body.message
    });
    await newDonation.save();
    res.status(201).json(newDonation);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// 6. PUT Update Status
app.put('/api/donations/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Donation.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));