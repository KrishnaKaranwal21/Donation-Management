import { useEffect, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { API_BASE_URL } from "../api";

export default function Donors() {
  const [data, setData] = useState([]); 
  const [myTotal, setMyTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Admin View State: 'pending' or 'all'
  const [adminView, setAdminView] = useState('pending'); 
  
  const role = localStorage.getItem("userRole");
  const email = localStorage.getItem("userEmail");
  const userName = localStorage.getItem("userName");

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (role === 'admin') {
        // ADMIN: Toggle between Pending and All
        if (adminView === 'pending') {
          const res = await axios.get("${API_BASE_URL}/api/donations/pending");
          setData(res.data);
        } else {
          // View ALL history
          const res = await axios.get("${API_BASE_URL}/api/donations/all");
          setData(res.data);
        }
      } else {
        // DONOR: Always get own history
        const res = await axios.get(`${API_BASE_URL}/api/donations/my-history/${email}`);
        setData(res.data.history || []);
        setMyTotal(res.data.totalDonated || 0);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  // Re-fetch when view changes (for admin)
  useEffect(() => {
    fetchData();
  }, [adminView]);

  // --- ROBUST PDF GENERATION ---
  const generatePDF = () => {
    try {
      // Initialize jsPDF
      const doc = new jsPDF();

      // Safety checks for null values
      const safeName = userName || "Valued Donor";
      const safeEmail = email || "Not Provided";
      const safeTotal = myTotal ? myTotal.toLocaleString() : "0";

      // 1. HEADER
      doc.setFontSize(22);
      doc.setTextColor(219, 39, 119); // Pink
      doc.text("Hope & Support Foundation", 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("123 Charity Lane, Kindness City", 14, 26);
      doc.text("Official Donation Receipt", 14, 32);

      doc.setDrawColor(200);
      doc.line(14, 36, 196, 36);

      // 2. DONOR INFO
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text("Donor Information", 14, 46);

      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text(`Name: ${safeName}`, 14, 54);
      doc.text(`Email: ${safeEmail}`, 14, 59);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 64);

      // 3. SUMMARY BOX
      doc.setFillColor(250, 240, 245);
      doc.rect(130, 42, 65, 25, 'F');
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Total Contributions", 135, 49);
      
      doc.setFontSize(18);
      doc.setTextColor(219, 39, 119);
      doc.text(`$${safeTotal}`, 135, 60);

      // 4. THE TABLE
      const tableColumn = ["Date", "Cause", "Amount", "Status"];
      const tableRows = data.map(ticket => [
        new Date(ticket.date).toLocaleDateString(),
        ticket.cause || "General Support",
        `$${ticket.amount.toLocaleString()}`,
        ticket.status.toUpperCase()
      ]);

      // Updated AutoTable Usage
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 75,
        theme: 'grid',
        headStyles: { 
          fillColor: [219, 39, 119], 
          textColor: 255, 
          fontStyle: 'bold' 
        },
        alternateRowStyles: { 
          fillColor: [255, 250, 252] 
        },
      });

      // 5. FOOTER
      // Use explicit logic to find the end of the table
      const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || 80;
      
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text("Thank you for your support.", 14, finalY + 10);

      // Save File
      doc.save(`Statement_${safeName}.pdf`);

    } catch (err) {
      console.error("PDF Generation Error:", err);
      alert("Could not generate PDF. Please check the console for details.");
    }
  };

  // --- UPDATE STATUS ---
  const updateStatus = async (id, status) => {
    if(!window.confirm(`Are you sure you want to mark this as ${status}?`)) return;
    try {
      await axios.put(`${API_BASE_URL}/api/donations/${id}/status`, { status });
      // Refresh the list immediately to see the change
      fetchData(); 
    } catch (err) {
      alert("Error updating status");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">
          {role === 'admin' ? 'Admin Console' : 'My Donation Portfolio'}
        </h1>
        
        {role !== 'admin' && (
          <button onClick={generatePDF} className="bg-slate-800 text-white px-4 py-2 rounded shadow hover:bg-slate-700">
            Download Report
          </button>
        )}
      </div>

      {/* --- ADMIN TOGGLE BUTTONS --- */}
      {role === 'admin' && (
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setAdminView('pending')}
            className={`px-4 py-2 rounded font-bold transition ${adminView === 'pending' ? 'bg-pink-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            ⚠️ Pending ({data.length})
          </button>
          <button 
            onClick={() => setAdminView('all')}
            className={`px-4 py-2 rounded font-bold transition ${adminView === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            📋 All History
          </button>
        </div>
      )}

      {/* --- DONOR STATS --- */}
      {role !== 'admin' && (
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 rounded-lg shadow-lg mb-8 w-full md:w-1/3">
          <p className="text-pink-100 font-medium uppercase text-xs">My Total Contribution</p>
          <h2 className="text-4xl font-bold mt-2">${myTotal.toLocaleString()}</h2>
        </div>
      )}

      {/* --- TABLE --- */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
        <div className="p-4 border-b bg-gray-50 font-bold text-slate-700">
          {role === 'admin' 
            ? (adminView === 'pending' ? 'Requests Waiting for Action' : 'Full Database Records') 
            : 'Transaction History'}
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 text-sm uppercase">
            <tr>
              <th className="p-4">Date</th>
              <th className="p-4">Donor</th>
              <th className="p-4">Cause</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              {role === 'admin' && <th className="p-4">Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="6" className="p-8 text-center">Loading...</td></tr> : 
             data.length === 0 ? <tr><td colSpan="6" className="p-8 text-center text-gray-500">No records found.</td></tr> : 
             data.map((d) => (
              <tr key={d._id} className="border-b hover:bg-gray-50 text-sm transition">
                <td className="p-4 text-gray-500">{new Date(d.date).toLocaleDateString()}</td>
                <td className="p-4 font-medium">{d.donorName}</td>
                <td className="p-4 text-blue-600">{d.cause || 'General'}</td>
                <td className="p-4 font-bold text-slate-700">${d.amount.toLocaleString()}</td>
                
                {/* STATUS BADGE */}
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${
                    d.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' : 
                    d.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' : 
                    'bg-yellow-100 text-yellow-700 border-yellow-200'
                  }`}>
                    {d.status}
                  </span>
                </td>
                
                {/* ADMIN ACTIONS - ALWAYS VISIBLE NOW */}
                {role === 'admin' && (
                  <td className="p-4 flex gap-2">
                    <button 
                      onClick={() => updateStatus(d._id, 'approved')} 
                      className={`px-3 py-1 rounded text-xs font-bold transition ${d.status === 'approved' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                      disabled={d.status === 'approved'}
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => updateStatus(d._id, 'rejected')} 
                      className={`px-3 py-1 rounded text-xs font-bold transition ${d.status === 'rejected' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                      disabled={d.status === 'rejected'}
                    >
                      Reject
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
