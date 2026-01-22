import React, { useState } from 'react';
import { Lock, Play, RefreshCw, BarChart2 } from 'lucide-react';

// !!! IMPORTANT: REPLACE THIS URL AFTER DEPLOYING BACKEND TO RENDER !!!
// Example: "https://screen-a5g9.onrender.com"
const API_URL = "https://screen-a5g9.onrender.com"; 

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creds, setCreds] = useState({ username: "", password: "" });
  
  const [myScreens, setMyScreens] = useState([]);
  const [screenData, setScreenData] = useState([]);
  const [activeScreen, setActiveScreen] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds)
      });
      const data = await res.json();
      if (data.status === "success") {
        setIsAuthenticated(true);
        fetchScreens();
      } else {
        alert("Login failed: " + data.msg);
      }
    } catch (err) {
      alert("Connection Error. Did you paste the Render URL in App.js?");
    }
    setLoading(false);
  };

  const fetchScreens = async () => {
    try {
      const res = await fetch(`${API_URL}/screens`);
      const data = await res.json();
      setMyScreens(data);
    } catch (err) { console.error(err); }
  };

  const runScreen = async (url, name) => {
    setLoading(true);
    setActiveScreen(name);
    setScreenData([]); 
    try {
      const res = await fetch(`${API_URL}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      setScreenData(data);
    } catch (err) { alert("Failed to fetch data"); }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm">
          <div className="flex justify-center mb-6 text-blue-600">
             <div className="p-4 bg-blue-50 rounded-full"><Lock size={32}/></div>
          </div>
          <h2 className="text-2xl font-bold text-center mb-2 text-slate-800">Screen Login</h2>
          <p className="text-center text-gray-500 text-sm mb-6">Enter Screener.in credentials</p>
          
          <div className="space-y-4">
            <input 
              type="text" placeholder="Email / Username"
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={creds.username} onChange={e => setCreds({...creds, username: e.target.value})} 
            />
            <input 
              type="password" placeholder="Password"
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={creds.password} onChange={e => setCreds({...creds, password: e.target.value})} 
            />
            <button disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition">
              {loading ? "Connecting..." : "Connect"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <div className="w-72 bg-slate-900 text-white flex flex-col shadow-xl z-10">
        <div className="p-6 font-bold text-xl tracking-tight border-b border-slate-800">
            SCREEN<span className="text-blue-400">APP</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
           {myScreens.length === 0 && <div className="text-slate-500 text-center mt-10 text-sm">Loading Screens...</div>}
           {myScreens.map((screen, idx) => (
             <button key={idx} onClick={() => runScreen(screen.url, screen.name)}
               className={`w-full text-left p-3 rounded-lg text-sm flex items-center gap-3 transition-colors ${activeScreen === screen.name ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
             >
               <Play size={16} />
               <span className="truncate">{screen.name}</span>
             </button>
           ))}
        </div>
        <button onClick={fetchScreens} className="p-4 border-t border-slate-800 text-xs text-slate-400 hover:text-white flex items-center justify-center gap-2">
           <RefreshCw size={14}/> Refresh List
        </button>
      </div>

      <div className="flex-1 flex flex-col h-full">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 justify-between shadow-sm">
           <div className="flex items-center gap-3">
              <BarChart2 className="text-blue-600" />
              <h1 className="font-bold text-lg text-slate-800">{activeScreen || "Select a Screen"}</h1>
           </div>
           {loading && <div className="text-blue-600 text-sm font-semibold animate-pulse">Fetching Live Data...</div>}
        </header>
        
        <main className="flex-1 overflow-auto p-8">
           {screenData.length > 0 ? (
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left whitespace-nowrap">
                   <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                     <tr>
                       {Object.keys(screenData[0]).map((key, i) => (
                         i < 10 && <th key={key} className="p-4 border-b">{key}</th>
                       ))}
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {screenData.map((row, i) => (
                       <tr key={i} className="hover:bg-blue-50 transition-colors">
                         {Object.values(row).map((val, j) => (
                           j < 10 && <td key={j} className="p-4 text-slate-700">{val}</td>
                         ))}
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="p-6 bg-white rounded-full mb-4 shadow-sm">
                    <Play size={40} className="text-slate-200 ml-1"/>
                </div>
                <p>Select a query from the sidebar to load data.</p>
             </div>
           )}
        </main>
      </div>
    </div>
  );
}

export default App;