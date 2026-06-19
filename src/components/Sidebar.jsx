import React from 'react';
import { 
  LayoutDashboard, Users, UserSquare, CalendarCheck, 
  ShieldAlert, FileClock, LogOut, X, 
  RadioTower, Signal, Globe, ShoppingCart, MapPin, Megaphone,
  FileSpreadsheet // <-- NEW: Added Spreadsheet Icon
} from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen, activeTab, setActiveTab, isAdmin, setIsAdmin }) {
  
  // --- UPDATED: Added 'Spreadsheet' to the menu array ---
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Employee Profiles', icon: UserSquare },
    { name: 'Manage Employees', icon: Users, adminOnly: true },
    { name: 'Daily Attendance', icon: CalendarCheck, adminOnly: true },
    { name: 'Announcements', icon: Megaphone, adminOnly: true },
    { name: 'Spreadsheet', icon: FileSpreadsheet, adminOnly: true }, // <-- NEW: Spreadsheet button
    { name: 'Audit History', icon: FileClock, adminOnly: true },
  ];

  return (
    <>
      {/* Mobile Dark Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* FIX: Added 'h-full' to this container */}
      <div className={`fixed md:static inset-y-0 left-0 w-72 h-full bg-slate-900 text-white flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} shadow-2xl md:shadow-none`}>
        
        {/* Mobile Close Button */}
        <button onClick={() => setIsOpen(false)} className="md:hidden absolute top-6 right-6 text-slate-400 hover:text-white">
          <X size={24} />
        </button>

        {/* Custom Logo Section */}
        <div className="p-8 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700 shadow-inner">
              <img 
                src="/logo.png" 
                alt="JAHS Logo" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = '<span class="font-black text-xl">JA</span>';
                }}
              />
            </div>
            <div>
              <h2 className="font-black text-white tracking-widest text-xl leading-tight">JAHS</h2>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">System Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto py-8 px-4 space-y-2">
          {menuItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            
            const isActive = activeTab === item.name;
            const Icon = item.icon;
            
            return (
              <button
                key={item.name}
                onClick={() => { setActiveTab(item.name); setIsOpen(false); }}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-200 group
                  ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'} />
                <span className="font-bold text-sm tracking-wide">{item.name}</span>
                {item.adminOnly && !isActive && <ShieldAlert size={12} className="ml-auto text-slate-600" />}
              </button>
            );
          })}
        </div>

        {/* --- QUICK LINKS COMMAND CENTER --- */}
        <div className="mb-6 px-4 relative">
          
          {/* CSS for the Hover Wiggle Animation */}
          <style>{`
            @keyframes icon-wiggle {
              0% { transform: rotate(0deg) scale(1.15); }
              25% { transform: rotate(-15deg) scale(1.15); }
              50% { transform: rotate(15deg) scale(1.15); }
              75% { transform: rotate(-15deg) scale(1.15); }
              100% { transform: rotate(0deg) scale(1.15); }
            }
            .hover-wiggle:hover svg {
              animation: icon-wiggle 0.4s ease-in-out forwards;
            }
          `}</style>

          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 px-2">Quick Links</p>
          <div className="flex items-center justify-between bg-slate-800/50 p-2 rounded-2xl border border-slate-700/50 shadow-inner">
            
            <a href="https://appcodeplatform.ericsson.net/ConnectedSupplier_Requests/OpenRequests_List.aspx?ShowResults=True" target="_blank" rel="noopener noreferrer" className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-colors hover-wiggle" title="Ericsson SP2P">
              <RadioTower size={18} className="transition-transform duration-300" />
            </a>
            
            <a href="https://service.ariba.com/Authenticator.aw/ad/ssoIDP" target="_blank" rel="noopener noreferrer" className="p-2.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-colors hover-wiggle" title="SMART Ariba">
              <Signal size={18} className="transition-transform duration-300" />
            </a>
            
            <a href="https://service.ariba.com/Sourcing.aw/109555006/aw?awh=r&awssk=Yg4UM5Yz&dard=1" target="_blank" rel="noopener noreferrer" className="p-2.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-colors hover-wiggle" title="Globe Ariba">
              <Globe size={18} className="transition-transform duration-300" />
            </a>
            
            <a href="https://shopee.ph/shop/66780887/recommendation-landing?pageNumber=2&upstream=cart" target="_blank" rel="noopener noreferrer" className="p-2.5 text-slate-400 hover:text-orange-400 hover:bg-orange-400/10 rounded-xl transition-colors hover-wiggle" title="Shopee Material Orders">
              <ShoppingCart size={18} className="transition-transform duration-300" />
            </a>
            
            <div className="w-px h-6 bg-slate-700 mx-1"></div> {/* Divider */}
            
            <a href="https://jahs-geolocator.vercel.app/" target="_blank" rel="noopener noreferrer" className="group p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-colors" title="JAHS Geolocator">
              {/* Using a smooth 360 SPIN and scale specifically for the Map Pin! */}
              <MapPin size={18} className="transition-all duration-500 group-hover:rotate-[360deg] group-hover:scale-110" />
            </a>

          </div>
        </div>
        <div className="p-6 border-t border-slate-800">
          {!isAdmin ? (
            <button
              onClick={() => { setActiveTab('Admin Portal'); setIsOpen(false); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-slate-800 text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all border border-slate-700 hover:border-indigo-500"
            >
              <ShieldAlert size={16} /> Admin Access
            </button>
          ) : (
            <button
              onClick={() => { setIsAdmin(false); setActiveTab('Dashboard'); setIsOpen(false); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-rose-500/10 text-rose-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"
            >
              <LogOut size={16} /> Sign Out
            </button>
          )}
        </div>
      </div>
    </>
  );
}