import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, ChevronDown, ChevronUp, User, Save, ChevronLeft, ChevronRight, Lock } from 'lucide-react';

const getDBDateStr = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DailyAttendance({ employees, logHistory }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [attendanceData, setAttendanceData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  const handlePrevCutoff = () => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() - 15);
    setViewDate(d);
  };

  const handleNextCutoff = () => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() + 15);
    setViewDate(d);
  };

  const getCutoffRange = (baseDate) => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const day = baseDate.getDate();

    if (day >= 11 && day <= 25) return { label: `${baseDate.toLocaleString('default', { month: 'long' })} 11th - 25th`, start: new Date(year, month, 11), end: new Date(year, month, 25) };
    if (day >= 26) return { label: `${baseDate.toLocaleString('default', { month: 'long' })} 26th - ${new Date(year, month + 1, 1).toLocaleString('default', { month: 'long' })} 10th`, start: new Date(year, month, 26), end: new Date(year, month + 1, 10) };
    return { label: `${new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' })} 26th - ${baseDate.toLocaleString('default', { month: 'long' })} 10th`, start: new Date(year, month - 1, 26), end: new Date(year, month, 10) };
  };

  const currentCutoff = getCutoffRange(viewDate);
  
  const cutoffDays = [];
  let dayTracker = new Date(currentCutoff.start);
  while (dayTracker <= currentCutoff.end) {
    if (dayTracker.getDay() !== 0) cutoffDays.push(new Date(dayTracker)); 
    dayTracker.setDate(dayTracker.getDate() + 1);
  }

  const fetchLogs = async () => {
    const { data } = await supabase.from('attendance_logs').select('*');
    const mapped = {};
    data?.forEach(log => mapped[`${log.employee_id}-${log.log_date}`] = log.status);
    setAttendanceData(mapped);
  };

  useEffect(() => { fetchLogs(); }, [viewDate]);

  const handleSave = async (empId, empName) => {
    setIsSaving(true);
    const todayDBStr = getDBDateStr(new Date());
    
    const logsToUpload = [];
    const logsToDelete = []; 

    cutoffDays.forEach(date => {
      const dbDate = getDBDateStr(date);
      const isFuture = dbDate > todayDBStr;
      let status = attendanceData[`${empId}-${dbDate}`];

      if (!status && !isFuture) status = 'absent';

      if (status) {
        logsToUpload.push({ employee_id: empId, log_date: dbDate, status });
      } else {
        logsToDelete.push(dbDate);
      }
    });

    try {
      if (logsToUpload.length > 0) {
        const { error: upsertError } = await supabase
          .from('attendance_logs')
          .upsert(logsToUpload, { onConflict: 'employee_id, log_date' });
        if (upsertError) throw upsertError;
      }

      if (logsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('attendance_logs')
          .delete()
          .eq('employee_id', empId)
          .in('log_date', logsToDelete);
        if (deleteError) throw deleteError;
      }
      
      if (typeof logHistory === 'function') logHistory(`Saved attendance for ${empName}`);
      alert("Attendance Saved Successfully");
      await fetchLogs(); 
      
    } catch (error) {
      alert("Error saving: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const CutoffCalendar = ({ emp }) => {
    const todayDBStr = getDBDateStr(new Date());
    let totalPresent = 0, totalHoliday = 0, totalAbsent = 0;

    cutoffDays.forEach(d => {
      const dbDate = getDBDateStr(d);
      const isFuture = dbDate > todayDBStr;
      const status = attendanceData[`${emp.id}-${dbDate}`];

      if (status === 'present') totalPresent++;
      else if (status === 'holiday') totalHoliday++;
      else if (status === 'absent') totalAbsent++;
      else if (!status && !isFuture) totalAbsent++;
    });

    // --- BUG FIX: Use Raw Data for the Toggle Cycle ---
    const handleToggle = (dbDate, rawStatus) => {
      let nextStatus = 'present'; // First click defaults to present
      if (rawStatus === 'present') nextStatus = 'holiday';
      else if (rawStatus === 'holiday') nextStatus = 'absent';
      else if (rawStatus === 'absent') nextStatus = null; // Final click clears it completely
      
      setAttendanceData(prev => ({...prev, [`${emp.id}-${dbDate}`]: nextStatus}));
    };

    return (
      <div className="bg-slate-50 p-10 border-t border-slate-100 animate-in slide-in-from-top-2">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="flex gap-4">
             <div className="bg-indigo-600 px-6 py-3 rounded-2xl text-white shadow-lg w-32">
               <p className="text-[10px] font-black uppercase opacity-60">Present</p>
               <p className="text-2xl font-black">{totalPresent}</p>
             </div>
             <div className="bg-amber-500 px-6 py-3 rounded-2xl text-white shadow-lg w-32">
               <p className="text-[10px] font-black uppercase opacity-60">Holiday</p>
               <p className="text-2xl font-black">{totalHoliday}</p>
             </div>
             <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 w-32">
               <p className="text-[10px] font-black text-slate-400 uppercase">Absent</p>
               <p className="text-2xl font-black text-slate-900">{totalAbsent}</p>
             </div>
          </div>
          <button onClick={() => handleSave(emp.id, emp.name)} disabled={isSaving} className="w-full lg:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl disabled:opacity-50">
            {isSaving ? "Saving..." : <><Save size={16}/> Done / Update Record</>}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3">
          {cutoffDays.map((date, i) => {
            const dbDate = getDBDateStr(date);
            const status = attendanceData[`${emp.id}-${dbDate}`]; // The true data
            const isFuture = dbDate > todayDBStr;
            const isToday = dbDate === todayDBStr;

            let bgClass = '';
            if (isFuture) {
              bgClass = 'bg-slate-100 border-slate-200 text-slate-300 opacity-60 cursor-not-allowed';
            } else {
              bgClass = 'bg-white border-slate-200 text-slate-400 hover:border-indigo-200 cursor-pointer'; 
              if (status === 'present') bgClass = 'bg-indigo-600 border-indigo-600 text-white shadow-lg cursor-pointer';
              if (status === 'holiday') bgClass = 'bg-amber-500 border-amber-500 text-white shadow-lg cursor-pointer';
              // If it is explicitly marked absent OR it is implicitly absent (past and unmarked)
              if (status === 'absent' || (!status && !isFuture)) bgClass = 'bg-rose-50 border-rose-100 text-rose-500 cursor-pointer'; 
            }

            return (
              <div 
                key={i} 
                // Pass the RAW status to the toggle function, not the display colors
                onClick={isFuture ? undefined : () => handleToggle(dbDate, status)} 
                className={`relative p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all group ${bgClass} ${isToday ? 'ring-4 ring-indigo-500/20 scale-[1.02] z-10' : ''}`}
              >
                {isToday && <span className="absolute -top-2 bg-rose-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Today</span>}
                
                {isFuture && <Lock size={12} className="absolute top-3 right-3 opacity-30" />}

                <span className="text-[9px] font-black uppercase tracking-widest opacity-60 mt-1">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <span className="text-2xl font-black leading-none">{date.getDate()}</span>
                <span className="text-[9px] font-bold opacity-80 uppercase">{date.toLocaleString('default', { month: 'short' })}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Attendance Manager</h1>
          <div className="flex items-center gap-4 mt-2">
            <button onClick={handlePrevCutoff} className="p-2 hover:bg-slate-100 rounded-lg transition-all"><ChevronLeft size={20}/></button>
            <p className="font-bold text-indigo-600 uppercase text-xs tracking-widest bg-indigo-50 px-4 py-2 rounded-full">{currentCutoff.label}</p>
            <button onClick={handleNextCutoff} className="p-2 hover:bg-slate-100 rounded-lg transition-all"><ChevronRight size={20}/></button>
          </div>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search personnel..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[3.5rem] shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <tbody className="divide-y divide-slate-50">
            {employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())).map((emp) => (
              <React.Fragment key={emp.id}>
                <tr className={`cursor-pointer group transition-colors ${expandedId === emp.id ? 'bg-indigo-50/40' : 'hover:bg-slate-50/50'}`} onClick={() => setExpandedId(expandedId === emp.id ? null : emp.id)}>
                  <td className="px-12 py-6 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.5rem] border-2 bg-white overflow-hidden p-1 shadow-sm">
                      {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover rounded-xl" alt="" /> : <User className="text-slate-200 m-auto" size={32} />}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-xl tracking-tight leading-tight">{emp.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{emp.idNo}</p>
                    </div>
                  </td>
                  <td className="px-12 py-6 text-right">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl transition-all ${expandedId === emp.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>
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