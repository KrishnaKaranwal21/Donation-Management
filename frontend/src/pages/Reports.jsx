import { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { API_BASE_URL } from "../api";
// 1. VISUALIZATIONS
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Reports() {
  // --- STATE MANAGEMENT ---
  const [data, setData] = useState([]); 
  const [graphData, setGraphData] = useState([]);
  const [myTotal, setMyTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Admin View State: Default to 'all' (History)
  const [adminView, setAdminView] = useState('all'); 
  const [tabCounts, setTabCounts] = useState({ pending: 0, history: 0 });
  const [refreshKey, setRefreshKey] = useState(0); // Triggers updates

  // User Details
  const role = localStorage.getItem("userRole");
  const email = localStorage.getItem("userEmail");
  const userName = localStorage.getItem("userName");

  // --- 1. FETCH TABLE DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (role === 'admin') {
          if (adminView === 'pending') {
            const res = await axios.get(`${API_BASE_URL}/api/donations/pending`);
            setData(res.data);
          } else {
            const res = await axios.get(`${API_BASE_URL}/api/donations/processed`);
            setData(res.data);
          }
        } else {
          // Donor Logic
          const res = await axios.get(`${API_BASE_URL}/api/donations/my-history/${email}`);
          setData(res.data.history || []);
          setMyTotal(res.data.totalDonated || 0);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [adminView, refreshKey, role, email]);

  // --- 2. FETCH GRAPH DATA (Visuals) ---
  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/graph-data`, {
          params: { role, email }
        });
        setGraphData(res.data);
      } catch (error) {
        console.error("Error fetching graph:", error);
      }
    };
    fetchGraph();
  }, [refreshKey, role, email]);

  // --- 3. ADMIN COUNTS (Background Fetch) ---
  useEffect(() => {
    if (role === 'admin') {
      const fetchCounts = async () => {
        try {
          const [pendingRes, historyRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/api/donations/pending`),
            axios.get(`${API_BASE_URL}/api/donations/processed`)
          ]);
          setTabCounts({
            pending: pendingRes.data.length,
            history: historyRes.data.length
          });
        } catch (error) { console.error(error); }
      };
      fetchCounts();
    }
  }, [refreshKey, role]);

  // --- 4. PDF GENERATOR ---
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246); // Blue
    doc.text("Donation History Statement", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated for: ${userName} (${email})`, 14, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 35);

    const tableColumn = ["Date", "Cause", "Amount", "Status"];
    const tableRows = data.map(d => [
      new Date(d.date).toLocaleDateString(),
      d.cause || "General",
      `$${d.amount.toLocaleString()}`,
      d.status.toUpperCase()
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    // Total Footer
    if(role !== 'admin') {
      const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || 50;
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text(`Total Lifetime Contribution: $${myTotal.toLocaleString()}`, 14, finalY + 15);
    }

    doc.save(`Report_${userName}.pdf`);
  };

  // --- 5. ADMIN ACTIONS ---
  const updateStatus = async (id, status) => {
    if(!window.confirm(`Mark this donation as ${status}?`)) return;
    try {
      await axios.put(`${API_BASE_URL}/api/donations/${id}/status`, { status });
      setRefreshKey(prev => prev + 1); // Refresh UI immediately
    } catch (error) {
      alert("Failed to update status.");
    }
  };

  return (
    <div className="space-y-8">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {role === 'admin' ? 'Administrative Reports' : 'My Giving Portfolio'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {role === 'admin' ? 'Manage and track all donation activities.' : 'Track your impact and download statements.'}
          </p>
        </div>
        
        {role !== 'admin' && (
          <button 
            onClick={generatePDF}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-lg shadow-lg transition-all hover:-translate-y-1"
          >
            <span className="text-lg">📄</span> Download Statement
          </button>
        )}
      </div>

      {/* --- ADMIN TABS --- */}
      {role === 'admin' && (
        <div className="bg-slate-100 p-1 rounded-lg inline-flex shadow-inner">
          <button 
            onClick={() => setAdminView('all')}
            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${adminView === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            📋 All History <span className="ml-2 bg-slate-200 px-2 py-0.5 rounded-full text-xs">{tabCounts.history}</span>
          </button>
          <button 
            onClick={() => setAdminView('pending')}
            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${adminView === 'pending' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            ⚠️ Pending Requests <span className="ml-2 bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full text-xs">{tabCounts.pending}</span>
          </button>
        </div>
      )}

      {/* --- VISUALIZATION SECTION (Chart & Summary) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEFT: Total Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-6 rounded-xl shadow-lg flex flex-col justify-center relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-indigo-200 font-medium uppercase text-xs tracking-wider mb-1">
              {role === 'admin' ? "Total Funds Processed" : "My Lifetime Contribution"}
            </p>
            <h2 className="text-4xl font-bold">
              {role === 'admin' 
                ? (loading ? "..." : `$${graphData.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}`) 
                : `$${myTotal.toLocaleString()}`
              }
            </h2>
          </div>
          {/* Decorative Circle */}
          <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
        </div>

        {/* RIGHT: Bar Chart */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-slate-700 font-bold mb-4 text-sm uppercase tracking-wide">
            {role === 'admin' ? "Donation Trends (6 Months)" : "My Monthly Activity"}
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graphData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`$${value}`, 'Amount']}
                />
                <Bar 
                  dataKey="amount" 
                  fill={role === 'admin' ? "#8b5cf6" : "#3b82f6"} 
                  radius={[4, 4, 0, 0]} 
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-700">
            {role === 'admin' 
              ? (adminView === 'pending' ? 'Requests Awaiting Action' : 'Full Transaction Log') 
              : 'Detailed Transaction History'}
          </h3>
          <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 border rounded-full">
            {data.length} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Cause</th>
                <th className="p-4">Donor</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                {role === 'admin' && adminView === 'pending' && <th className="p-4">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-400">Loading data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="6" className="p-12 text-center text-slate-400 italic">No records found for this view.</td></tr>
              ) : (
                data.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-600 text-sm">{new Date(d.date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded text-xs font-medium border border-blue-100">
                        {d.cause || 'General'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-800 font-medium text-sm">{d.donorName}</td>
                    <td className="p-4 text-slate-800 font-bold">${d.amount.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${
                        d.status === 'approved' ? 'bg-green-100 text-green-700' : 
                        d.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {d.status === 'approved' && <span className="mr-1">●</span>}
                        {d.status === 'pending' && <span className="mr-1 animate-pulse">●</span>}
                        {d.status}
                      </span>
                    </td>
                    
                    {/* Admin Buttons (Only in Pending View) */}
                    {role === 'admin' && adminView === 'pending' && (
                      <td className="p-4 flex gap-2">
                        <button 
                          onClick={() => updateStatus(d._id, 'approved')} 
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-sm transition-all"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => updateStatus(d._id, 'rejected')} 
                          className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-md text-xs font-bold transition-all"
                        >
                          Reject
                        </button>
                      </td>
                    )}
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