import { Users, Clock, Building2, UserX } from 'lucide-react';
import StatCard from '../components/StatCard';
import AttendanceTable from '../components/AttendanceTable';
import NewMembersTable from '../components/NewMembersTable';

// Accept the live employees data
export default function Dashboard({ employees }) {
  const statMetrics = [
    // Use employees.length to dynamically show the real total!
    { title: "Employees", value: employees.length.toString(), icon: <Users size={28} strokeWidth={1.5} />, theme: "blue" },
    { title: "Attendance", value: "9", icon: <Clock size={28} strokeWidth={1.5} />, theme: "emerald" },
    { title: "Department", value: "3", icon: <Building2 size={28} strokeWidth={1.5} />, theme: "indigo" },
    { title: "On Leave", value: "3", icon: <UserX size={28} strokeWidth={1.5} />, theme: "rose" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor daily attendance and workforce metrics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statMetrics.map((stat, index) => (
          <StatCard key={index} title={stat.title} value={stat.value} icon={stat.icon} colorTheme={stat.theme} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        <AttendanceTable />
        {/* Pass the live data into the table */}
        <NewMembersTable employees={employees} />
      </div>
    </div>
  );
}