import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Search, ChevronDown, ChevronUp, User, 
  CheckCircle2, Circle, Save, ChevronLeft, ChevronRight 
} from 'lucide-react';

export default function DailyAttendance({ employees, logHistory }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [attendanceData, setAttendanceData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Navigation State: Start with current date
  const [viewDate, setViewDate] = useState(new Date());

  // --- DYNAMIC CUTOFF LOGIC ---
  const getCutoffRange = (baseDate) => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const day = baseDate.getDate();

    if (day >= 11 && day <= 25) {
      return { 
        label: `${baseDate.toLocaleString('default', { month: 'long' })} 11th - 25th`, 
        start: new Date(year, month, 11), 
        end: new Date(year, month, 25) 
      };
    }
    if (day >= 26) {
      const nextMonth = new Date(year, month + 1, 1);
      return { 
        label: `${baseDate.toLocaleString('default', { month: 'long' })} 26th - ${nextMonth.toLocaleString('default', { month: 'long' })} 10th`, 
        start: new Date(year, month, 26), 
        end: new Date(year, month + 1, 10) 
      };
    }
    const prevMonth = new Date(year, month - 1, 1);
    return { 
      label: `${prevMonth.toLocaleString('default', { month: 'long' })} 26th - ${baseDate.toLocaleString('default', { month: 'long' })} 10th`, 
      start: new Date(year, month - 1, 26), 
      end: new Date(year, month, 10) 
    };
  };

  const currentCutoff = getCutoffRange(viewDate);
  const cutoffDays = [];
  let dayTracker = new Date(currentCutoff.start);
  while (dayTracker <= currentCutoff.end) {
    cutoffDays.push(new Date(dayTracker));
    dayTracker.setDate(dayTracker.getDate() + 1);
  }

  // --- DATABASE: Fetch & Save ---
  const fetchLogs = async () => {
    const { data } = await supabase.from('attendance_logs').select('*');
    const mapped = {};
    data?.forEach(log => mapped[`${log.employee_id}-${log.log_date}`] = log.status);
    setAttendanceData(mapped);
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleSave = async (empId, empName) => {
    setIsSaving(true);
    const logsToUpload = Object.entries(attendanceData)
      .filter(([key]) => key.startsWith(`${empId}-`))
      .map(([key, status]) => ({
        employee_id: empId,
        log_date: key.split('-').slice(1).join('-'),
        status
      }));

    const { error } = await supabase.from('attendance_logs').upsert(logsToUpload);
    
    if (!error) {
      if (typeof logHistory === 'function') logHistory(`Updated attendance for ${empName}`);
      alert("Attendance Saved Successfully");
    }
    setIsSaving(false);
  };

  const CutoffCalendar = ({ emp }) => {
    const empLogs = cutoffDays.map(d => attendanceData[`${emp.id}-${d.toDateString()}`]);
    const totalPresent = empLogs.filter(s => s === 'present').length;
    const totalAbsent = empLogs.filter(s => s === 'absent').length;

    return (
      <div className="bg-slate-50 p-10 border-t border-slate-100 animate-in slide-in-from-top-2">
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-8">
             <div className="bg-indigo-600 px-6 py-3 rounded-2xl text-white shadow-lg">
               <p className="text-[10px] font-black uppercase opacity-60">Total Presents</p>
               <p className="text-2xl font-black">{totalPresent}</p>
             </div>
             <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200">
               <p className="text-[10px] font-black text-slate-400 uppercase">Total Absents</p>
               <p className="text-2xl font-black text-slate-900">{totalAbsent}</p>
             </div>
          </div>
          <button 
            onClick={() => handleSave(emp.id, emp.name)}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : <><Save size={16}/> Done / Update Record</>}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {cutoffDays.map((date, i) => {
            const dStr = date.toDateString();
            const status = attendanceData[`${emp.id}-${dStr}`];
            return (
              <div key={i} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer
                ${status === 'present' ? 'bg-indigo-600 border-indigo-600 text-white' : status === 'absent' ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-slate-100'}`}
                onClick={() => setAttendanceData(prev => ({...prev, [`${emp.id}-${dStr}`]: status === 'present' ? 'absent' : 'present'}))}
              >
                <span className="text-[9px] font-black uppercase opacity-60">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <span className="text-xl font-black">{date.getDate()}</span>
                <span className="text-[9px] font-bold">{date.toLocaleString('default', { month: 'short' })}</span>
              </div>
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Attendance Manager</h1>
          <div className="flex items-center gap-4 mt-2">
            <button onClick={() => setViewDate(new Date(viewDate.setDate(viewDate.getDate() - 15)))} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft size={20}/></button>
            <p className="font-bold text-indigo-600 uppercase text-xs tracking-widest bg-indigo-50 px-4 py-2 rounded-full">{currentCutoff.label}</p>
            <button onClick={() => setViewDate(new Date(viewDate.setDate(viewDate.getDate() + 15)))} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRight size={20}/></button>
          </div>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search personnel..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <tbody className="divide-y divide-slate-50">
            {employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())).map((emp) => (
              <React.Fragment key={emp.id}>
                <tr className={`cursor-pointer group ${expandedId === emp.id ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`} onClick={() => setExpandedId(expandedId === emp.id ? null : emp.id)}>
                  <td className="px-12 py-6 flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl border bg-white overflow-hidden p-1">
                      {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover rounded-xl" alt="" /> : <User className="text-slate-200 m-auto" />}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-lg">{emp.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{emp.idNo}</p>
                    </div>
                  </td>
                  <td className="px-12 py-6 text-right">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${expandedId === emp.id ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                      {expandedId === emp.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </td>
                </tr>
                {expandedId === emp.id && (<tr><td colSpan="2" className="p-0 border-none"><CutoffCalendar emp={emp} /></td></tr>)}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}