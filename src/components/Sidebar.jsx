import { LayoutDashboard, Users, Shield, UserCheck, History, LogOut, Clock, X } from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen, activeTab, setActiveTab, isAdmin, setIsAdmin }) {
  
  // Public tabs visible to everyone
  const publicNav = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Employee Profiles', icon: <Users size={20} /> },
  ];

  // Restricted admin tabs
  const adminNav = [
    { name: 'Manage Employees', icon: <Shield size={20} /> },
    { name: 'Daily Attendance', icon: <UserCheck size={20} /> },
    { name: 'Audit History', icon: <History size={20} /> },
  ];

  const navItems = isAdmin ? [...publicNav, ...adminNav] : [...publicNav, { name: 'Admin Portal', icon: <Shield size={20} /> }];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-20 md:hidden" onClick={() => setIsOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 h-screen flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        
        {/* Profile Header (Ref: image_66da56.png) */}
        <div className="p-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <>
                <div className="w-10 h-10 rounded-full bg-[#5D5CFF] flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-[#7C7BFF]">
                  JP
                </div>
                <div className="overflow-hidden">
                  <p className="text-white font-bold text-sm leading-tight tracking-tight truncate">JAHS</p>
                  <p className="text-slate-400 text-[10px] font-medium truncate">System Admin</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-bold text-sm">
                  JE
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">JAHS</p>
                  <p className="text-slate-400 text-[10px]">Employee Portal</p>
                </div>
              </>
            )}
            <button className="md:hidden ml-auto text-slate-400" onClick={() => setIsOpen(false)}><X size={20} /></button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-1">
            {navItems.map((item, index) => {
              const isActive = activeTab === item.name;
              return (
                <li key={index}>
                  <button
                    onClick={() => { setActiveTab(item.name); if(window.innerWidth < 768) setIsOpen(false); }}
                    className={`w-full flex items-center px-6 py-3 transition-all border-l-4 ${isActive ? 'border-indigo-500 bg-slate-800 text-white' : 'border-transparent hover:bg-slate-800/50 hover:text-white'}`}
                  >
                    <span className={`${isActive ? 'text-indigo-400' : 'text-slate-400'} mr-4`}>{item.icon}</span>
                    <span className="font-medium text-sm">{item.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* Session Control */}
        {isAdmin && (
          <div className="p-4 border-t border-slate-800 shrink-0">
            <button 
              onClick={() => { setIsAdmin(false); setActiveTab('Dashboard'); }}
              className="w-full flex items-center justify-center px-4 py-2 text-sm text-red-400 hover:text-white hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut size={16} className="mr-2" /> Log Out Admin
            </button>
          </div>
        )}
      </aside>
    </>
  );
}