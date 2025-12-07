import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Donors from "./pages/Donors";
import Reports from "./pages/Reports";
import Login from "./pages/Login";

export default function App() {
  // Check local storage to see if user is logged in
  const userRole = localStorage.getItem("userRole"); 
  const userName = localStorage.getItem("userName");

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/"; // Reloads to force Login screen
  };

  // Helper for Sidebar link styling
  const getLinkClass = ({ isActive }) => 
    `block py-2.5 px-4 rounded transition ${isActive ? 'bg-pink-600 text-white' : 'hover:bg-slate-800 text-gray-300'}`;

  // IF NOT LOGGED IN: Show Login Page Only
  if (!userRole) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
    );
  }

  // IF LOGGED IN: Show Full Layout
  return (
    <Router>
      <div className="flex h-screen bg-gray-100 font-sans text-gray-900">
        
        {/* --- SIDEBAR --- */}
        <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
          <div className="p-6 text-2xl font-bold text-pink-500 border-b border-slate-700">
            CharityDash
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <NavLink to="/" className={getLinkClass}>Dashboard</NavLink>
            <NavLink to="/donors" className={getLinkClass}>
              {userRole === 'admin' ? 'Approvals' : 'My Donations'}
            </NavLink>
            <NavLink to="/reports" className={getLinkClass}>Reports</NavLink>
          </nav>

          <div className="p-4 border-t border-slate-700">
            <p className="text-xs text-slate-400 mb-2">User: {userName}</p>
            <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300 font-bold">
              Logout
            </button>
          </div>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 overflow-y-auto p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/donors" element={<Donors />} />
            <Route path="/reports" element={<Reports />} />
            {/* Catch-all redirect to dashboard */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        
      </div>
    </Router>
  );
}