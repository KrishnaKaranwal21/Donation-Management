import { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { API_BASE_URL } from "../api";

export default function Donors() {
  const [data, setData] = useState([]); 
  const [myTotal, setMyTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Get User Details
  const role = localStorage.getItem("userRole");
  const email = localStorage.getItem("userEmail");
  const userName = localStorage.getItem("userName");

  // --- 1. FETCH DATA ---
  const fetchData = async () => {
    try {
      setLoading(true);
      if (role === 'admin') {
        // ADMIN: Get all PENDING donations
        const res = await axios.get("${API_BASE_URL}/api/donations/pending");
        setData(res.data);
      } else {
        // DONOR: Get THEIR OWN history
        const res = await axios.get(`${API_BASE_URL}/api/donations/my-history/${email}`);
        setData(res.data.history);
        setMyTotal(res.data.totalDonated);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 2. GENERATE PDF REPORT (New Feature) ---
  const generatePDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Donation History Statement", 14, 22);
    
    // Subtitle Info
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Donor: ${userName}`, 14, 30);
    doc.text(`Email: ${email}`, 14, 35);
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 40);

    // Table Columns
    const tableColumn = ["Date", "Cause", "Amount ($)", "Status"];
    const tableRows = [];

    // Push data into rows
    data.forEach(ticket => {
      const ticketData = [
        new Date(ticket.date).toLocaleDateString(),
        ticket.cause || "General Support",
        ticket.amount.toLocaleString(),
        ticket.status.toUpperCase()
      ];
      tableRows.push(ticketData);
    });

    // Generate Table
    doc.autoTable(tableColumn, tableRows, { startY: 50 });
    
    // Add Total at the bottom
    const finalY = doc.lastAutoTable.finalY || 50;
    doc.text(`Total Approved Contributions: $${myTotal.toLocaleString()}`, 14, finalY + 10);

    // Save File
    doc.save(`Donation_Report_${userName}.pdf`);
  };

  // --- 3. ADMIN ACTIONS ---
  const updateStatus = async (id, status) => {
    try {
      if(!window.confirm(`Mark as ${status}?`)) return;
      await axios.put(`${API_BASE_URL}/api/donations/${id}/status`, { status });
      fetchData(); 
      alert(`Donation ${status}!`);
    } catch (error) {
      alert("Failed to update status.");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">
          {role === 'admin' ? 'Admin Approvals' : 'My Donation Portfolio'}
        </h1>
        
        {/* DOWNLOAD BUTTON (Donors Only) */}
        {role !== 'admin' && (
          <button 
            onClick={generatePDF}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded shadow transition"
          >
            <span>📄</span> Download Report
          </button>
        )}
      </div>

      {/* --- DONOR STATS CARD --- */}
      {role !== 'admin' && (
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 rounded-lg shadow-lg mb-8 w-full md:w-1/3 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full bg-white opacity-20"></div>
          <p className="text-pink-100 font-medium uppercase text-xs tracking-wider">My Total Contribution</p>
          <h2 className="text-4xl font-bold mt-2">${myTotal.toLocaleString()}</h2>
          <p className="text-xs text-pink-200 mt-2">Thank you for your generosity!</p>
        </div>
      )}

      {/* --- TABLE --- */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <span className="font-bold text-slate-700">
            {role === 'admin' ? 'Pending Requests' : 'Transaction History'}
          </span>
          <span className="text-xs text-gray-500 bg-white px-2 py-1 border rounded">
            {data.length} Records
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-gray-100 text-gray-600 text-sm uppercase">
                <th className="p-4">Date</th>
                <th className="p-4">Cause</th>
                <th className="p-4">Donor Name</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status / Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading records...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No records found.</td></tr>
              ) : (
                data.map((d) => (
                  <tr key={d._id} className="border-b hover:bg-gray-50 transition last:border-0 text-sm">
                    <td className="p-4 text-gray-500">{new Date(d.date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs border border-blue-100">
                        {d.cause || 'General Support'}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-700">{d.donorName}</td>
                    <td className="p-4 font-bold text-slate-800">${d.amount.toLocaleString()}</td>
                    
                    <td className="p-4">
                      {role === 'admin' ? (
                        <div className="flex gap-2">
                          <button onClick={() => updateStatus(d._id, 'approved')} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-xs">Approve</button>
                          <button onClick={() => updateStatus(d._id, 'rejected')} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs">Reject</button>
                        </div>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${
                          d.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' : 
                          d.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' : 
                          'bg-yellow-100 text-yellow-700 border-yellow-200'
                        }`}>
                          {d.status}
                        </span>
                      )}
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