import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
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

  const fetchEmployees = async () => {
    const { data } = await supabase.from('employees').select('*').order('name', { ascending: true });
    setEmployees(data || []);
  };

  useEffect(() => { fetchEmployees(); }, []);

  const renderContent = () => {
    if (currentView === 'Dashboard') {
      return (
        <div className="space-y-6">
          {!isAdmin && (
            <div className="bg-indigo-600 p-10 rounded-[2.5rem] text-white shadow-xl">
              <h1 className="text-4xl font-black">Welcome, JAHS Employee!</h1>
              <p className="opacity-80 mt-2 font-medium">Use the "Employee Profiles" tab to view your attendance calendar.</p>
            </div>
          )}
          <Dashboard employees={employees} />
        </div>
      );
    }

    if (currentView === 'Employee Profiles') return <EmployeeProfiles employees={employees} />;

    if (!isAdmin) return <AdminLogin onLogin={() => { setIsAdmin(true); setCurrentView('Dashboard'); }} />;

    switch (currentView) {
      case 'Manage Employees': return <Employees employees={employees} refreshData={fetchEmployees} />;
      case 'Daily Attendance': return <DailyAttendance employees={employees} />;
      default: return <Dashboard employees={employees} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden select-none">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} activeTab={currentView} setActiveTab={setCurrentView} isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} isAdmin={isAdmin} />
        <main className="flex-1 overflow-y-auto p-4 md:p-10">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
}