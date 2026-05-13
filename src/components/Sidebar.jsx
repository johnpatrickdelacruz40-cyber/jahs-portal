import React from 'react';
import { 
  LayoutDashboard, Users, UserSquare, CalendarCheck, 
  ShieldAlert, FileClock, LogOut, X 
} from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen, activeTab, setActiveTab, isAdmin, setIsAdmin }) {
  
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Employee Profiles', icon: UserSquare },
    { name: 'Manage Employees', icon: Users, adminOnly: true },
    { name: 'Daily Attendance', icon: CalendarCheck, adminOnly: true },
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

        {/* Admin Login / Logout Footer */}
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