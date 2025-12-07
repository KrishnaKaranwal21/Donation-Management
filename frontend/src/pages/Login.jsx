import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Send credentials to backend
      const res = await axios.post(`${API_BASE_URL}/api/login`, { email, password });
      
      if (res.data.success) {
        // Save user details to LocalStorage
        // This 'userEmail' is critical for fetching specific donation history later
        localStorage.setItem("userRole", res.data.role);
        localStorage.setItem("userName", res.data.name);
        localStorage.setItem("userEmail", res.data.email); 
        
        alert(`Login Successful! Welcome, ${res.data.name}`);
        
        // Navigate to Dashboard
        navigate("/");
        
        // Force a page reload so App.jsx can read the new LocalStorage values
        // and update the Sidebar/Routes immediately
        window.location.reload(); 
      }
    } catch (err) {
      console.error(err);
      alert("Invalid email or password. Please check the credentials below.");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-800 font-sans">
      
      {/* Login Card */}
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md border-t-4 border-pink-600">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">CharityDash</h1>
          <p className="text-gray-500 mt-2">Sign in to manage donations</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email" 
              placeholder="Enter your email" 
              required
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" 
              placeholder="Enter your password" 
              required
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded shadow-lg transition duration-200 transform hover:scale-[1.02]"
          >
            Sign In
          </button>
        </form>

        {/* --- DEMO CREDENTIALS HELPER --- */}
        {/* Only for assignment purposes so the recruiter knows how to log in */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg border border-gray-200 text-sm">
          <p className="font-bold text-gray-600 mb-2 border-b border-gray-300 pb-1">Demo Credentials:</p>
          
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-slate-700">Admin Role:</span>
            <div className="text-right text-xs text-gray-500">
              <div>admin@hope.com</div>
              <div>admin123</div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-700">Donor Role:</span>
            <div className="text-right text-xs text-gray-500">
              <div>donor@test.com</div>
              <div>donor123</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
