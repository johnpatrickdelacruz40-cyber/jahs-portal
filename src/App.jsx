import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees'; 
import AdminLogin from './pages/AdminLogin';
import DailyAttendance from './pages/DailyAttendance';

export default function App() {
  // --- AUTHENTICATION & UI STATE ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('Dashboard');
  
  // --- DATA STORAGE (Single Source of Truth) ---
  const [employees, setEmployees] = useState([]); // Personnel Registry
  const [attendanceLogs, setAttendanceLogs] = useState([]); // Log history
  const [historyLogs, setHistoryLogs] = useState([]); // Audit trail

  // --- HELPER: Audit Logging ---
  const logAction = (detail) => {
    const timestamp = new Date().toLocaleString();
    setHistoryLogs(prev => [{ time: timestamp, detail }, ...prev]);
  };

  // --- ROUTING LOGIC ---
  const renderContent = () => {
    switch (currentView) {
      case 'Dashboard':
        return <Dashboard employees={employees} attendanceLogs={attendanceLogs} />;
      
      case 'Employee Profiles':
        return (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
            Employee Search & Profiles coming in Phase 2.
          </div>
        );

      // Admin Restricted Routes
      case 'Admin Portal':
        if (!isAdmin) return <AdminLogin onLogin={() => { setIsAdmin(true); setCurrentView('Manage Employees'); logAction('Admin Authorized'); }} />;
        return <div className="p-8 text-center text-slate-500">Authorized as Jahsadmin.</div>;

      case 'Manage Employees':
        if (!isAdmin) return <AdminLogin onLogin={() => setIsAdmin(true)} />;
        return <Employees employees={employees} setEmployees={setEmployees} logHistory={logAction} />;

      case 'Daily Attendance':
        if (!isAdmin) return <AdminLogin onLogin={() => setIsAdmin(true)} />;
        return (
          <DailyAttendance 
            employees={employees} 
            setAttendanceLogs={setAttendanceLogs} 
            logHistory={logAction} 
          />
        );

      case 'Audit History':
        if (!isAdmin) return <AdminLogin onLogin={() => setIsAdmin(true)} />;
        return (
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
            <h2 className="text-xl font-bold mb-6">System Audit Logs</h2>
            <div className="space-y-4">
              {historyLogs.map((log, i) => (
                <div key={i} className="text-sm border-l-2 border-indigo-500 pl-4 py-1">
                  <span className="text-[10px] text-slate-400 block uppercase">{log.time}</span>
                  <span className="text-slate-700 font-medium">{log.detail}</span>
                </div>
              ))}
              {historyLogs.length === 0 && <p className="text-slate-400 italic">No activity recorded.</p>}
            </div>
          </div>
        );

      default:
        return <Dashboard employees={employees} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} 
        activeTab={currentView} setActiveTab={setCurrentView} 
        isAdmin={isAdmin} setIsAdmin={setIsAdmin}
      />
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
}