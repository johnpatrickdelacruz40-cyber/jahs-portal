import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, ChevronDown, ChevronUp, User, Save, ChevronLeft, ChevronRight, Lock, Printer } from 'lucide-react';

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

  const handlePrevCutoff = () => { const d = new Date(viewDate); d.setDate(d.getDate() - 15); setViewDate(d); };
  const handleNextCutoff = () => { const d = new Date(viewDate); d.setDate(d.getDate() + 15); setViewDate(d); };

  const getCutoffRange = (baseDate) => {
    const year = baseDate.getFullYear(); const month = baseDate.getMonth(); const day = baseDate.getDate();
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
    const logsToUpload = []; const logsToDelete = []; 

    cutoffDays.forEach(date => {
      const dbDate = getDBDateStr(date);
      const isFuture = dbDate > todayDBStr;
      let status = attendanceData[`${empId}-${dbDate}`];

      if (isFuture) logsToDelete.push(dbDate);
      else {
        if (!status) status = 'absent';
        logsToUpload.push({ employee_id: empId, log_date: dbDate, status });
      }
    });

    try {
      if (logsToUpload.length > 0) await supabase.from('attendance_logs').upsert(logsToUpload, { onConflict: 'employee_id, log_date' });
      if (logsToDelete.length > 0) await supabase.from('attendance_logs').delete().eq('employee_id', empId).in('log_date', logsToDelete);
      if (typeof logHistory === 'function') logHistory(`Updated attendance for ${empName}`);
      await fetchLogs(); 
    } catch (error) { console.error(error); } finally { setIsSaving(false); }
  };

  const CutoffCalendar = ({ emp }) => {
    const todayDBStr = getDBDateStr(new Date());
    let totalPresent = 0, totalHoliday = 0, totalAbsent = 0;

    cutoffDays.forEach(d => {
      const dbDate = getDBDateStr(d); const isFuture = dbDate > todayDBStr; const status = attendanceData[`${emp.id}-${dbDate}`];
      if (isFuture) return; 
      if (status === 'present') totalPresent++; else if (status === 'holiday') totalHoliday++; else if (status === 'absent' || !status) totalAbsent++;
    });

    const handleToggle = (dbDate, currentStatus) => {
      let nextStatus = 'present'; 
      if (currentStatus === 'present') nextStatus = 'holiday'; else if (currentStatus === 'holiday') nextStatus = 'absent'; else if (currentStatus === 'absent') nextStatus = null; 
      setAttendanceData(prev => ({...prev, [`${emp.id}-${dbDate}`]: nextStatus}));
    };

    return (
      <div className="bg-slate-50 p-10 border-t border-slate-100 animate-in slide-in-from-top-2">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="flex gap-4">
             <div className="bg-indigo-600 px-6 py-3 rounded-2xl text-white shadow-lg w-32"><p className="text-[10px] font-black uppercase opacity-60">Present</p><p className="text-2xl font-black">{totalPresent}</p></div>
             <div className="bg-amber-500 px-6 py-3 rounded-2xl text-white shadow-lg w-32"><p className="text-[10px] font-black uppercase opacity-60">Holiday</p><p className="text-2xl font-black">{totalHoliday}</p></div>
             <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 w-32"><p className="text-[10px] font-black text-slate-400 uppercase">Absent</p><p className="text-2xl font-black text-slate-900">{totalAbsent}</p></div>
          </div>
          <button onClick={() => handleSave(emp.id, emp.name)} disabled={isSaving} className="w-full lg:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl disabled:opacity-50">
            {isSaving ? "Saving..." : <><Save size={16}/> Update Record</>}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3">
          {cutoffDays.map((date, i) => {
            const dbDate = getDBDateStr(date); const status = attendanceData[`${emp.id}-${dbDate}`]; const isFuture = dbDate > todayDBStr; const isToday = dbDate === todayDBStr;
            let bgClass = '';
            if (isFuture) bgClass = 'bg-slate-100 border-slate-200 text-slate-300 opacity-60 cursor-not-allowed';
            else {
              bgClass = 'bg-white border-slate-200 text-slate-400 hover:border-indigo-200 cursor-pointer'; 
              if (status === 'present') bgClass = 'bg-indigo-600 border-indigo-600 text-white shadow-lg cursor-pointer';
              if (status === 'holiday') bgClass = 'bg-amber-500 border-amber-500 text-white shadow-lg cursor-pointer';
              if (status === 'absent' || (!status && !isFuture)) bgClass = 'bg-rose-50 border-rose-100 text-rose-500 cursor-pointer'; 
            }
            return (
              <div key={i} onClick={isFuture ? undefined : () => handleToggle(dbDate, status)} className={`relative p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all group ${bgClass} ${isToday ? 'ring-4 ring-indigo-500/20 scale-[1.02] z-10' : ''}`}>
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
    <div>
      <div className="space-y-8 animate-in fade-in duration-500 print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Attendance Manager</h1>
            <div className="flex items-center gap-4 mt-2">
              <button onClick={handlePrevCutoff} className="p-2 hover:bg-slate-100 rounded-lg transition-all"><ChevronLeft size={20}/></button>
              <p className="font-bold text-indigo-600 uppercase text-xs tracking-widest bg-indigo-50 px-4 py-2 rounded-full">{currentCutoff.label}</p>
              <button onClick={handleNextCutoff} className="p-2 hover:bg-slate-100 rounded-lg transition-all"><ChevronRight size={20}/></button>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
            </div>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl">
              <Printer size={16}/> Print Report
            </button>
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

      {/* --- PRINT ONLY VIEW: OVERALL MATRIX --- */}
      <div className="hidden print:block text-black bg-white p-4">
        <div className="flex justify-between items-end mb-6 border-b-2 border-black pb-4">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight">JAHS Electronic and Electrical Service</h2>
            <h3 className="text-lg font-semibold uppercase tracking-widest text-gray-600 mt-1">Overall Attendance Record</h3>
            <p className="text-sm font-bold mt-2 inline-block px-3 py-1 bg-gray-100 border border-black">{currentCutoff.label}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Date Printed</p>
            <p className="text-sm font-bold">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>

        <table className="w-full border-collapse border border-black text-center text-xs">
          <thead>
            <tr className="bg-gray-200 font-bold uppercase">
              <th className="border border-black p-2 text-left w-48">Personnel Name</th>
              {/* Generate columns for every day in the cutoff */}
              {cutoffDays.map((d, i) => (
                <th key={i} className="border border-black p-1 leading-tight text-[9px]">
                  <div>{d.toLocaleDateString('en-US', { weekday: 'narrow' })}</div>
                  <div className="text-sm">{d.getDate()}</div>
                </th>
              ))}
              <th className="border border-black p-1 w-8">P</th>
              <th className="border border-black p-1 w-8">A</th>
              <th className="border border-black p-1 w-8">H</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => {
              const todayDBStr = getDBDateStr(new Date());
              let p = 0, a = 0, h = 0;

              return (
                <tr key={`print-${emp.id}`} className="border-b border-gray-300">
                  <td className="border border-black p-2 text-left whitespace-nowrap">
                    <span className="font-bold">{emp.name}</span><br/>
                    <span className="font-mono text-[9px] text-gray-500">{emp.idNo}</span>
                  </td>
                  
                  {/* Fill in the P/A/H Matrix */}
                  {cutoffDays.map((d, i) => {
                    const dbDate = getDBDateStr(d);
                    const isFuture = dbDate > todayDBStr;
                    
                    if (isFuture) return <td key={i} className="border border-black text-gray-300">-</td>;
                    
                    const status = attendanceData[`${emp.id}-${dbDate}`];
                    let mark = 'A';
                    if (status === 'present') { mark = 'P'; p++; }
                    else if (status === 'holiday') { mark = 'H'; h++; }
                    else { a++; } // Absent

                    return <td key={i} className={`border border-black font-bold ${mark === 'A' ? 'text-red-600' : ''}`}>{mark}</td>;
                  })}
                  
                  {/* Totals */}
                  <td className="border border-black font-black bg-gray-100">{p}</td>
                  <td className="border border-black font-black bg-gray-100 text-red-600">{a}</td>
                  <td className="border border-black font-black bg-gray-100">{h}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        <div className="mt-12 flex justify-between px-10">
          <div className="text-center">
            <div className="border-b border-black w-48 mb-2"></div>
            <p className="text-[10px] font-bold uppercase tracking-widest">Prepared By</p>
          </div>
          <div className="text-center">
            <div className="border-b border-black w-48 mb-2"></div>
            <p className="text-[10px] font-bold uppercase tracking-widest">Approved By</p>
          </div>
        </div>
      </div>
    </div>
  );
}