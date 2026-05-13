import React, { useState } from 'react';
import { Search, Calendar as CalIcon, ChevronDown, ChevronUp, User, CheckCircle2, Circle } from 'lucide-react';

export default function DailyAttendance({ employees, logHistory }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [attendanceData, setAttendanceData] = useState({}); // Local state for demo; ideally sync with Supabase

  // --- CUTOFF LOGIC ---
  const getCutoffRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();

    // Range A: 11 - 25 of current month
    if (date >= 11 && date <= 25) {
      return { 
        label: "Cutoff: 11th - 25th", 
        start: new Date(year, month, 11), 
        end: new Date(year, month, 25) 
      };
    }
    // Range B: 26 of current month - 10 of next month
    if (date >= 26) {
      return { 
        label: "Cutoff: 26th - 10th", 
        start: new Date(year, month, 26), 
        end: new Date(year, month + 1, 10) 
      };
    }
    // Range B: 1 - 10 of current month (meaning it started on the 26th of last month)
    return { 
      label: "Cutoff: 26th - 10th", 
      start: new Date(year, month - 1, 26), 
      end: new Date(year, month, 10) 
    };
  };

  const currentCutoff = getCutoffRange();

  const generateDays = (start, end) => {
    const days = [];
    let curr = new Date(start);
    while (curr <= end) {
      days.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return days;
  };

  const cutoffDays = generateDays(currentCutoff.start, currentCutoff.end);

  const toggleAttendance = (empId, dateStr, empName) => {
    const key = `${empId}-${dateStr}`;
    const newState = !attendanceData[key];
    setAttendanceData(prev => ({ ...prev, [key]: newState }));
    
    logHistory(`${newState ? 'Marked' : 'Unmarked'} ${empName} attendance for ${dateStr}`);
  };

  const CutoffCalendar = ({ emp }) => {
    const todayStr = new Date().toDateString();

    return (
      <div className="bg-slate-50 p-10 border-t border-slate-100 animate-in slide-in-from-top-4 duration-300">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Active Payroll Period</h4>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{currentCutoff.label}</h3>
          </div>
          <div className="flex gap-4 text-[10px] font-black uppercase">
            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div> Present</span>
            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-white border border-slate-300"></div> Absent</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-3">
          {cutoffDays.map((dateObj, idx) => {
            const dateStr = dateObj.toDateString();
            const isToday = dateStr === todayStr;
            const isPresent = attendanceData[`${emp.id}-${dateStr}`];

            return (
              <button 
                key={idx}
                onClick={() => toggleAttendance(emp.id, dateStr, emp.name)}
                className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group
                  ${isPresent ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'}
                  ${isToday ? 'ring-4 ring-indigo-500/20 scale-105 z-10' : ''}`}
              >
                {isToday && <span className="absolute -top-2 bg-rose-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Today</span>}
                <span className="text-[10px] font-black uppercase tracking-tighter opacity-60">
                  {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className="text-xl font-black">{dateObj.getDate()}</span>
                <span className="text-[9px] font-bold opacity-40">{dateObj.toLocaleDateString('en-US', { month: 'short' })}</span>
                <div className="mt-1">
                  {isPresent ? <CheckCircle2 size={16} /> : <Circle size={16} className="opacity-20" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Daily Attendance</h1>
          <p className="text-slate-500 font-bold mt-1">Manage personnel attendance within the current cutoff range.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="Search personnel..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-[2rem] text-sm font-bold outline-none shadow-sm" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[3.5rem] shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <tr>
              <th className="px-12 py-6">JAHS Personnel</th>
              <th className="px-12 py-6 text-right">Attendance Manager</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())).map((emp) => (
              <React.Fragment key={emp.id}>
                <tr className={`group cursor-pointer transition-all ${expandedId === emp.id ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`} onClick={() => setExpandedId(expandedId === emp.id ? null : emp.id)}>
                  <td className="px-12 py-6">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl border-2 border-slate-100 overflow-hidden shadow-sm flex items-center justify-center bg-white p-1">
                        {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover rounded-xl" /> : <User className="text-slate-200" size={24} />}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-xl tracking-tight leading-tight">{emp.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{emp.idNo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-12 py-6 text-right">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl transition-all ${expandedId === emp.id ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                      {expandedId === emp.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                    </div>
                  </td>
                </tr>
                {expandedId === emp.id && (
                  <tr>
                    <td colSpan="2" className="p-0 border-none">
                      <CutoffCalendar emp={emp} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}