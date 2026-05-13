import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';

// Layout & Pages
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees'; 
import AdminLogin from './pages/AdminLogin';
import DailyAttendance from './pages/DailyAttendance';
import EmployeeProfiles from './pages/EmployeeProfiles';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('Dashboard');
  const [employees, setEmployees] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);

  // Fetch Personnel from Supabase
  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name', { ascending: true });
    
    if (!error) setEmployees(data || []);
  };

  useEffect(() => { fetchEmployees(); }, []);

  // Central Audit Logger
  const logAction = (detail) => {
    const timestamp = new Date().toLocaleString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric', 
      hour: 'numeric', minute: '2-digit', hour12: true 
    });
    setHistoryLogs(prev => [{ time: timestamp, detail }, ...prev]);
  };

  const renderContent = () => {
    // Admin Guard logic: Requires login for specific sensitive tabs
    if (currentView === 'Manage Employees' || currentView === 'Daily Attendance' || currentView === 'Audit History') {
      if (!isAdmin) return <AdminLogin onLogin={() => { setIsAdmin(true); logAction('Admin Session Started'); }} />;
    }

    switch (currentView) {
      case 'Dashboard':
        return <Dashboard employees={employees} />;
      
      case 'Employee Profiles':
        return <EmployeeProfiles employees={employees} />;

      case 'Manage Employees':
        return <Employees employees={employees} refreshData={fetchEmployees} logHistory={logAction} />;

      case 'Daily Attendance':
        return <DailyAttendance employees={employees} logHistory={logAction} />;

      case 'Admin Portal':
        return !isAdmin ? <AdminLogin onLogin={() => setIsAdmin(true)} /> : <Dashboard employees={employees} />;

      case 'Audit History':
        return (
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
            <h2 className="text-2xl font-black mb-8 text-slate-900 tracking-tighter uppercase">Audit History</h2>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {historyLogs.map((log, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl border-l-4 border-indigo-500">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.time}</p>
                  <p className="font-bold text-slate-700">{log.detail}</p>
                </div>
              ))}
              {historyLogs.length === 0 && (
                <div className="text-center py-10 text-slate-400 font-bold uppercase text-sm tracking-widest">
                  No actions recorded in this session.
                </div>
              )}
            </div>
          </div>
        );

      default:
        return <Dashboard employees={employees} />;
    }
  };

  return (
    // 'print:' prefixes allow the page to flow naturally onto paper when Ctrl+P is pressed
    <div className="flex h-screen print:h-auto print:bg-white bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden print:overflow-visible select-none print:select-auto">
      
      {/* Hide Sidebar when printing, ensure 'h-full' so it stretches to the bottom */}
      <div className="print:hidden h-full">
        <Sidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
          activeTab={currentView} 
          setActiveTab={setCurrentView} 
          isAdmin={isAdmin} 
          setIsAdmin={setIsAdmin} 
        />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible w-full relative">
        {/* Hide Topbar when printing */}
        <div className="print:hidden">
          <Topbar onMenuClick={() => setIsSidebarOpen(true)} isAdmin={isAdmin} />
        </div>
        
        {/* Unlock scrollbars so paper can extend beyond the screen size */}
        <main className="flex-1 overflow-y-auto print:overflow-visible p-4 md:p-10 print:p-0">
          <div className="max-w-7xl mx-auto h-full print:max-w-none">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}