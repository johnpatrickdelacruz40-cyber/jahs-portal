import { LayoutDashboard, Users, Shield, UserCheck, Calendar, History, LogOut, Clock, X } from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen, activeTab, setActiveTab, isAdmin, setIsAdmin }) {
  
  // Public tabs everyone can see
  const publicNav = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Employee Profiles', icon: <Users size={20} /> },
  ];

  // Locked tabs only the admin can see once logged in
  const adminNav = [
    { name: 'Manage Employees', icon: <Shield size={20} /> },
    { name: 'Daily Attendance', icon: <UserCheck size={20} /> },
    { name: 'Schedule Tracker', icon: <Calendar size={20} /> },
    { name: 'Audit History', icon: <History size={20} /> },
  ];

  // Determine which list to render
  const navItems = isAdmin ? [...publicNav, ...adminNav] : [...publicNav, { name: 'Admin Portal', icon: <Shield size={20} /> }];

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-20 md:hidden" onClick={() => setIsOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 h-screen flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center">
            <Clock className="text-indigo-500 mr-3" size={24} />
            <span className="text-lg font-semibold text-white tracking-wide">JAHS Portal</span>
          </div>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsOpen(false)}><X size={20} /></button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-1">
            {navItems.map((item, index) => {
              const isActive = activeTab === item.name;
              return (
                <li key={index}>
                  <button
                    onClick={() => { setActiveTab(item.name); if(window.innerWidth < 768) setIsOpen(false); }}
                    className={`w-full flex items-center px-6 py-3 transition-all duration-200 border-l-4 ${isActive ? 'border-indigo-500 bg-slate-800 text-white' : 'border-transparent hover:bg-slate-800/50 hover:text-white'}`}
                  >
                    <span className={`${isActive ? 'text-indigo-400' : 'text-slate-400'} mr-4`}>{item.icon}</span>
                    <span className="font-medium text-sm">{item.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* If Admin is logged in, show the Logout button */}
        {isAdmin && (
          <div className="p-4 border-t border-slate-800 shrink-0">
            <button 
              onClick={() => { setIsAdmin(false); setActiveTab('Dashboard'); }}
              className="w-full flex items-center justify-center px-4 py-2 text-sm text-red-400 hover:text-white hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut size={16} className="mr-2" /> End Admin Session
            </button>
          </div>
        )}
      </aside>
    </>
  );
}