import { Users, CheckCircle } from 'lucide-react';

export default function Dashboard({ employees }) {
  const stats = [
    { title: "Total Personnel", value: employees.length, icon: <Users size={24} />, color: "bg-blue-500" },
    { title: "Today's Attendance", value: "Updating...", icon: <CheckCircle size={24} />, color: "bg-emerald-500" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {stats.map((s, i) => (
        <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6">
          <div className={`${s.color} p-4 rounded-2xl text-white shadow-lg`}>{s.icon}</div>
          <div>
            <p className="text-slate-500 font-medium text-sm">{s.title}</p>
            <h3 className="text-3xl font-black text-slate-900">{s.value}</h3>
          </div>
        </div>
      ))}
    </div>
  );
}