import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';

// Layout Components
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

// Page Components
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees'; 
import AdminLogin from './pages/AdminLogin';
import DailyAttendance from './pages/DailyAttendance';
import ScheduleTracker from './pages/ScheduleTracker';

export default function App() {
  // --- AUTHENTICATION & UI STATE ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('Dashboard');
  
  // --- LIVE DATA STATE ---
  const [employees, setEmployees] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]); // This would ideally fetch from a 'logs' table in Supabase
  const [historyLogs, setHistoryLogs] = useState([]);

  // --- DATABASE SYNC: Fetch Personnel ---
  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('lastName', { ascending: true });
    
    if (error) {
      console.error('Database Error:', error.message);
    } else {
      setEmployees(data || []);
    }
  };

  // Load data on initial mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // --- AUDIT SYSTEM ---
  const logAction = (detail) => {
    const timestamp = new Date().toLocaleString();
    setHistoryLogs(prev => [{ time: timestamp, detail }, ...prev]);
  };

  // --- DYNAMIC ROUTER ---
  const renderContent = () => {
    switch (currentView) {
      case 'Dashboard':
        return <Dashboard employees={employees} attendanceLogs={attendanceLogs} />;
      
      case 'Employee Profiles':
        return (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 bg-white/50">
            <p className="text-lg font-bold">Personnel Search Engine</p>
            <p className="text-sm italic">Search and Print functionality coming in Phase 2.</p>
          </div>
        );

      // ADMIN PORTAL GATEKEEPER
      case 'Admin Portal':
        if (!isAdmin) {
          return (
            <AdminLogin 
              onLogin={() => { 
                setIsAdmin(true); 
                setCurrentView('Manage Employees'); 
                logAction('Admin Authorized: Jahsadmin session started'); 
              }} 
            />
          );
        }
        return <div className="p-8 text-center text-slate-500 font-medium">Session Active: Jahsadmin</div>;

      // PROTECTED ADMIN ROUTES
      case 'Manage Employees':
        if (!isAdmin) return <AdminLogin onLogin={() => setIsAdmin(true)} />;
        return (
          <Employees 
            employees={employees} 
            refreshData={fetchEmployees} 
            logHistory={logAction} 
          />
        );

      case 'Daily Attendance':
        if (!isAdmin) return <AdminLogin onLogin={() => setIsAdmin(true)} />;
        return (
          <DailyAttendance 
            employees={employees} 
            logHistory={logAction} 
            setAttendanceLogs={setAttendanceLogs}
          />
        );

      case 'Schedule Tracker':
        if (!isAdmin) return <AdminLogin onLogin={() => setIsAdmin(true)} />;
        return <ScheduleTracker logHistory={logAction} />;

      case 'Audit History':
        if (!isAdmin) return <AdminLogin onLogin={() => setIsAdmin(true)} />;
        return (
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-bold mb-6 text-slate-900 border-b pb-4">System Audit Logs</h2>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {historyLogs.map((log, i) => (
                <div key={i} className="text-sm border-l-4 border-indigo-500 pl-4 py-2 bg-slate-50 rounded-r-lg">
                  <span className="text-[10px] text-slate-400 block font-black uppercase tracking-tighter">{log.time}</span>
                  <span className="text-slate-700 font-semibold">{log.detail}</span>
                </div>
              ))}
              {historyLogs.length === 0 && (
                <p className="text-slate-400 italic text-center py-10">No administrative logs recorded for this session.</p>
              )}
            </div>
          </div>
        );

      default:
        return <Dashboard employees={employees} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden select-none">
      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        activeTab={currentView} 
        setActiveTab={setCurrentView} 
        isAdmin={isAdmin} 
        setIsAdmin={(val) => {
          setIsAdmin(val);
          if (!val) logAction('Admin Session Terminated');
        }}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full relative">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-10">
          <div className="max-w-7xl mx-auto h-full">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}