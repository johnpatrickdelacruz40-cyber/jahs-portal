import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';

// Layout Components
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

// Page Components
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees'; 
import AdminLogin from './pages/AdminLogin';
import DailyAttendance from './pages/DailyAttendance';
import EmployeeProfiles from './pages/EmployeeProfiles';

export default function App() {
  // --- GLOBAL STATE ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('Dashboard');
  
  // Personnel Data (ID No, Name, Photo only)
  const [employees, setEmployees] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);

  // --- DATABASE: Fetch Personnel from Supabase ---
  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name', { ascending: true }); // Alphabetical order
    
    if (error) {
      console.error('Fetch Error:', error.message);
    } else {
      setEmployees(data || []); //
    }
  };

  // Run fetch on mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // --- AUDIT SYSTEM: Log session activities ---
  const logAction = (detail) => {
    const timestamp = new Date().toLocaleString();
    setHistoryLogs(prev => [{ time: timestamp, detail }, ...prev]);
  };

  // --- ROUTER LOGIC: Admin vs Employee Views ---
  const renderContent = () => {
    switch (currentView) {
      case 'Dashboard':
        return (
          <div className="space-y-6">
            {/* Welcome banner for non-admin JAHS employees */}
            {!isAdmin && (
              <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-100 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                <h1 className="text-4xl font-black tracking-tight">Welcome, JAHS Employee!</h1>
                <p className="opacity-90 mt-2 font-medium">Access your personal attendance records and calendars via the Profile tab.</p>
              </div>
            )}
            <Dashboard employees={employees} />
          </div>
        );
      
      case 'Employee Profiles':
        // Publicly accessible view for employees to see their own calendars
        return <EmployeeProfiles employees={employees} />;

      // ADMIN PORTAL LOGIN
      case 'Admin Portal':
        if (!isAdmin) {
          return (
            <AdminLogin 
              onLogin={() => { 
                setIsAdmin(true); 
                setCurrentView('Dashboard'); 
                logAction('Admin session started: Jahsadmin'); 
              }} 
            />
          );
        }
        return <div className="p-10 text-center font-bold text-slate-400">Authenticated as Jahsadmin</div>;

      // PROTECTED ADMIN ROUTES
      case 'Manage Employees':
        if (!isAdmin) return <AdminLogin onLogin={() => setIsAdmin(true)} />;
        return <Employees employees={employees} refreshData={fetchEmployees} logHistory={logAction} />;

      case 'Daily Attendance':
        if (!isAdmin) return <AdminLogin onLogin={() => setIsAdmin(true)} />;
        return <DailyAttendance employees={employees} logHistory={logAction} />;

      case 'Audit History':
        if (!isAdmin) return <AdminLogin onLogin={() => setIsAdmin(true)} />;
        return (
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
            <h2 className="text-xl font-black mb-6 text-slate-900 border-b pb-4 uppercase tracking-tighter">System Audit Logs</h2>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {historyLogs.map((log, i) => (
                <div key={i} className="text-sm border-l-4 border-indigo-500 pl-4 py-2 bg-slate-50 rounded-r-xl">
                  <span className="text-[10px] text-slate-400 block font-black uppercase tracking-widest">{log.time}</span>
                  <span className="text-slate-700 font-bold">{log.detail}</span>
                </div>
              ))}
              {historyLogs.length === 0 && <p className="text-slate-400 italic text-center py-10">No logs for this session.</p>}
            </div>
          </div>
        );

      default:
        return <Dashboard employees={employees} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden select-none">
      {/* Sidebar with "JP / System Admin" branding */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        activeTab={currentView} 
        setActiveTab={setCurrentView} 
        isAdmin={isAdmin} 
        setIsAdmin={(val) => {
          setIsAdmin(val);
          if (!val) logAction('Admin session terminated');
        }}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden w-full relative">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} isAdmin={isAdmin} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-10">
          <div className="max-w-7xl mx-auto h-full">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}