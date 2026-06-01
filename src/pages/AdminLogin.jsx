import { useState } from 'react';
import { Shield, Lock, User, ArrowRight } from 'lucide-react';
import { RadioTower, Signal, Globe, ShoppingCart, MapPin } from 'lucide-react';

export default function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Hardcoded Admin Credentials as requested
    if (username === 'Jahsadmin' && password === 'Jahsadmin123') {
      setError('');
      onLogin();
    } else {
      setError('Invalid admin credentials. Access denied.');
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-full animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-slate-900 rounded-xl mb-4 shadow-lg">
            <Shield className="text-indigo-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Admin Portal</h2>
          <p className="text-slate-500 text-sm mt-1">Restricted access area.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input 
                type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                placeholder="Enter admin username"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                placeholder="••••••••"
              />
            </div>
          </div>
          <button type="submit" className="w-full flex justify-center items-center py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors">
            Authorize Access <ArrowRight size={18} className="ml-2" />
          </button>
        </form>
      </div>
    </div>
  );
  
}{/* --- QUICK LINKS COMMAND CENTER --- */}
        <div className="mb-6 px-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 px-2">Quick Links</p>
          <div className="flex items-center justify-between bg-slate-800/50 p-2 rounded-2xl border border-slate-700/50 shadow-inner">
            
            <a href="https://appcodeplatform.ericsson.net/ConnectedSupplier_Requests/OpenRequests_List.aspx?ShowResults=True" target="_blank" rel="noopener noreferrer" className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all" title="Ericsson SP2P">
              <RadioTower size={18} />
            </a>
            
            <a href="https://service.ariba.com/Authenticator.aw/ad/ssoIDP" target="_blank" rel="noopener noreferrer" className="p-2.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-all" title="SMART Ariba">
              <Signal size={18} />
            </a>
            
            <a href="https://service.ariba.com/Sourcing.aw/109555006/aw?awh=r&awssk=Yg4UM5Yz&dard=1" target="_blank" rel="noopener noreferrer" className="p-2.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all" title="Globe Ariba">
              <Globe size={18} />
            </a>
            
            <a href="https://shopee.ph/shop/66780887/recommendation-landing?pageNumber=2&upstream=cart" target="_blank" rel="noopener noreferrer" className="p-2.5 text-slate-400 hover:text-orange-400 hover:bg-orange-400/10 rounded-xl transition-all" title="Shopee Material Orders">
              <ShoppingCart size={18} />
            </a>
            
            <div className="w-px h-6 bg-slate-700 mx-1"></div> {/* Divider */}
            
            <a href="https://jahs-geolocator.vercel.app/" target="_blank" rel="noopener noreferrer" className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all" title="JAHS Geolocator">
              <MapPin size={18} />
            </a>

          </div>
        </div>