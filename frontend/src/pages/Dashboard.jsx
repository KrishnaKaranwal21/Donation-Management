import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../api";

// Configuration for the backend URL
const API_URL = "http://localhost:5000/api/donations";

export default function Dashboard() {
  // State for Dashboard Stats (Global Approved Data)
  const [stats, setStats] = useState({ 
    totalAmount: 0, 
    totalDonations: 0, 
    recentDonations: [] 
  });

  // Get logged-in user details to auto-fill the form
  const userEmail = localStorage.getItem("userEmail") || "";
  const userName = localStorage.getItem("userName") || "";

  // Form State
  const [formData, setFormData] = useState({ 
    donorName: userName, 
    email: userEmail, 
    amount: "", 
    cause: "Cancer Awareness", // Default selection
    message: "" 
  });
  
  const [loading, setLoading] = useState(true);

  // 1. Fetch Global Stats (Runs on page load)
  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/stats`);
      setStats(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // 2. Handle Donation Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Send data to backend
      await axios.post(API_URL, formData);
      
      // Feedback to user
      alert("Success! Your donation has been submitted for Admin Approval.");
      
      // Reset sensitive fields, keep Name/Email for convenience
      setFormData({ ...formData, amount: "", message: "" }); 
      
      // Note: We do NOT refresh stats here because the donation is "Pending" 
      // and won't show up in the Total Amount until an Admin approves it.
    } catch (error) {
      console.error("Error adding donation:", error);
      alert("Failed to process donation. Please try again.");
    }
  };

  return (
    <div>
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Donation Overview</h1>
        {/* Mobile Menu Button (Visible only on small screens) */}
        <button className="md:hidden bg-slate-900 text-white px-4 py-2 rounded">Menu</button>
      </header>

      {/* --- TOP SECTION: STATS & FORM --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Card 1: Total Raised */}
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-pink-500 flex flex-col justify-center">
          <p className="text-gray-500 font-medium uppercase text-sm tracking-wider">Total Raised</p>
          <h2 className="text-5xl font-bold text-slate-800 mt-2">
            ${stats.totalAmount.toLocaleString()}
          </h2>
          <p className="text-xs text-gray-400 mt-2">Verified & Approved Donations</p>
        </div>
        
        {/* Card 2: Total Donors */}
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500 flex flex-col justify-center">
          <p className="text-gray-500 font-medium uppercase text-sm tracking-wider">Total Donors</p>
          <h2 className="text-5xl font-bold text-slate-800 mt-2">
            {stats.totalDonations}
          </h2>
          <p className="text-xs text-gray-400 mt-2">Community Members</p>
        </div>
        
        {/* Card 3: DONATION FORM */}
        <div className="bg-slate-800 text-white p-6 rounded-lg shadow-lg relative overflow-hidden">
          {/* Decorative Background Circle */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-500 rounded-full opacity-20 blur-xl"></div>
          
          <h3 className="font-bold mb-4 text-pink-400 text-lg relative z-10">Make a Difference</h3>
          
          <form onSubmit={handleSubmit} className="space-y-3 relative z-10">
            {/* Name Input */}
            <input 
              type="text" placeholder="Your Name" required 
              className="w-full p-2 rounded bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
              value={formData.donorName}
              onChange={e => setFormData({...formData, donorName: e.target.value})}
            />
            
            {/* Cause Dropdown */}
            <select 
              className="w-full p-2 rounded bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-pink-500"
              value={formData.cause}
              onChange={e => setFormData({...formData, cause: e.target.value})}
            >
              <option value="Cancer Awareness">Cancer Awareness</option>
              <option value="Orphan Support">Orphan Support</option>
              <option value="Education for All">Education for All</option>
              <option value="Emergency Relief">Emergency Relief</option>
            </select>

            {/* Email & Amount Row */}
            <div className="flex gap-2">
              <input 
                type="email" placeholder="Email" required 
                className="w-2/3 p-2 rounded bg-slate-700 border border-slate-600 text-white placeholder-gray-400"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
              <input 
                type="number" placeholder="$ Amount" required 
                className="w-1/3 p-2 rounded bg-slate-700 border border-slate-600 text-white placeholder-gray-400"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
              />
            </div>
            
            {/* Submit Button */}
            <button type="submit" className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 py-2 rounded font-bold shadow-lg transition transform hover:scale-[1.02]">
              Donate Now
            </button>
          </form>
        </div>
      </div>

      {/* --- BOTTOM SECTION: RECENT TRANSACTIONS --- */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">Recent Global Activity</h3>
          <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">Live Updates</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 border-b">Donor Name</th>
                <th className="p-4 border-b">Cause Supported</th>
                <th className="p-4 border-b">Amount</th>
                <th className="p-4 border-b">Date</th>
                <th className="p-4 border-b">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading data...</td></tr>
              ) : stats.recentDonations.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No approved donations yet. Be the first!</td></tr>
              ) : (
                stats.recentDonations.map((d) => (
                  <tr key={d._id} className="hover:bg-gray-50 transition border-b last:border-0 text-sm">
                    <td className="p-4 font-semibold text-slate-700">{d.donorName}</td>
                    <td className="p-4 text-slate-600">
                      <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs border border-blue-100">
                        {d.cause || 'General'}
                      </span>
                    </td>
                    <td className="p-4 text-green-600 font-bold">+${d.amount.toLocaleString()}</td>
                    <td className="p-4 text-gray-400">{new Date(d.date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase border border-green-200">
                        Approved
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
