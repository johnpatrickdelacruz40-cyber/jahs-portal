import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, ChevronDown, ChevronUp, User, Save, ChevronLeft, ChevronRight, Lock, Printer, Edit3 } from 'lucide-react';

const getDBDateStr = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DailyAttendance({ employees, logHistory }) {
  // ... [Keep existing state variables] ...
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [attendanceData, setAttendanceData] = useState({});
  const [dtrDetails, setDtrDetails] = useState({}); 
  const [isSaving, setIsSaving] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [printMode, setPrintMode] = useState(null); 

  useEffect(() => {
    const handleAfterPrint = () => setPrintMode(null);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const triggerPrint = (mode) => {
    setPrintMode(mode);
    setTimeout(() => window.print(), 100);
  };

  const handlePrevCutoff = () => { const d = new Date(viewDate); d.setDate(d.getDate() - 15); setViewDate(d); };
  const handleNextCutoff = () => { const d = new Date(viewDate); d.setDate(d.getDate() + 15); setViewDate(d); };

  const getCutoffRange = (baseDate) => {
    const year = baseDate.getFullYear(); const month = baseDate.getMonth(); const day = baseDate.getDate();
    if (day >= 11 && day <= 25) return { label: `${baseDate.toLocaleString('default', { month: 'long' })} 11th - 25th`, start: new Date(year, month, 11), end: new Date(year, month, 25) };
    if (day >= 26) return { label: `${baseDate.toLocaleString('default', { month: 'long' })} 26th - ${new Date(year, month + 1, 1).toLocaleString('default', { month: 'long' })} 10th`, start: new Date(year, month, 26), end: new Date(year, month + 1, 10) };
    return { label: `${new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' })} 26th - ${baseDate.toLocaleString('default', { month: 'long' })} 10th`, start: new Date(year, month - 1, 26), end: new Date(year, month, 10) };
  };

  // --- SUNDAY FIX APPLIED HERE ---
  const currentCutoff = getCutoffRange(viewDate);
  const cutoffDays = [];
  let dayTracker = new Date(currentCutoff.start);
  while (dayTracker <= currentCutoff.end) {
    cutoffDays.push(new Date(dayTracker)); // This now includes Sundays perfectly!
    dayTracker.setDate(dayTracker.getDate() + 1);
  }

  // ... [Keep the exact rest of your DailyAttendance.jsx code below this line] ...
  const fetchLogs = async () => {
    const { data } = await supabase.from('attendance_logs').select('*');
    const mappedStatus = {};
    const mappedDetails = {};
    
    data?.forEach(log => {
      const key = `${log.employee_id}-${log.log_date}`;
      mappedStatus[key] = log.status;
      mappedDetails[key] = {
        timeIn: log.time_in,
        timeOut: log.time_out,
        activity: log.activity
      };
    });
    setAttendanceData(mappedStatus);
    setDtrDetails(mappedDetails);
  };

  useEffect(() => { fetchLogs(); }, [viewDate]);

  const handleDetailChange = (empId, dbDate, field, value) => {
    setDtrDetails(prev => ({
      ...prev,
      [`${empId}-${dbDate}`]: {
        ...(prev[`${empId}-${dbDate}`] || {}),
        [field]: value
      }
    }));
  };

  const handleSave = async (empId, empName) => {
    setIsSaving(true);
    const todayDBStr = getDBDateStr(new Date());
    const logsToUpload = []; const logsToDelete = []; 

    cutoffDays.forEach(date => {
      const dbDate = getDBDateStr(date);
      const isFuture = dbDate > todayDBStr;
      let status = attendanceData[`${empId}-${dbDate}`];
      const details = dtrDetails[`${empId}-${dbDate}`] || {};
      
      if (!status) {
        if (isFuture) {
           logsToDelete.push(dbDate); 
        } else {
           status = 'absent'; 
           logsToUpload.push({ 
             employee_id: empId, log_date: dbDate, status,
             time_in: details.timeIn ?? '', 
             time_out: details.timeOut ?? '', 
             activity: details.activity ?? 'NO WORK'
           });
        }
      } else {
        logsToUpload.push({ 
          employee_id: empId, log_date: dbDate, status,
          time_in: details.timeIn ?? (status === 'present' ? '08:00 AM' : ''),
          time_out: details.timeOut ?? (status === 'present' ? '05:00 PM' : ''),
          activity: details.activity ?? (status === 'leave' ? 'OFFICIAL LEAVE' : (status === 'absent' ? 'NO WORK' : ''))
        });
      }
    });

    try {
      if (logsToUpload.length > 0) await supabase.from('attendance_logs').upsert(logsToUpload, { onConflict: 'employee_id, log_date' });
      if (logsToDelete.length > 0) await supabase.from('attendance_logs').delete().eq('employee_id', empId).in('log_date', logsToDelete);
      if (typeof logHistory === 'function') logHistory(`Updated attendance & DTR logs for ${empName}`);
      await fetchLogs(); 
    } catch (error) { console.error(error); } finally { setIsSaving(false); }
  };

  return (
    <div className="h-full">
      <div className={`space-y-8 animate-in fade-in duration-500 ${printMode === 'matrix' ? 'hidden' : 'block'}`}>
        
        <div className={`flex-col md:flex-row justify-between items-end gap-6 ${printMode === 'dtr' ? 'hidden' : 'flex'}`}>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Attendance Manager</h1>
            <div className="flex items-center gap-4 mt-3">
              <button onClick={handlePrevCutoff} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-indigo-600"><ChevronLeft size={24}/></button>
              <p className="font-black text-indigo-600 uppercase text-sm md:text-base tracking-widest bg-indigo-50 px-6 py-2.5 rounded-full shadow-sm">{currentCutoff.label}</p>
              <button onClick={handleNextCutoff} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-indigo-600"><ChevronRight size={24}/></button>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" />
            </div>
            <button onClick={() => triggerPrint('matrix')} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl">
              <Printer size={16}/> Print Report
            </button>
          </div>
        </div>

        <div className={`bg-white border-slate-200 overflow-hidden ${printMode === 'dtr' ? 'border-none shadow-none' : 'border rounded-[3.5rem] shadow-sm'}`}>
          <table className="w-full text-left">
            <tbody className="divide-y divide-slate-50">
              
              {employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())).map((emp) => {
                
                const isExpanded = expandedId === emp.id;
                if (printMode === 'dtr' && !isExpanded) return null;

                const todayDBStr = getDBDateStr(new Date());
                let totalPresent = 0, totalLeave = 0, totalNoWork = 0;
                
                cutoffDays.forEach(d => {
                  const dbDate = getDBDateStr(d); 
                  const status = attendanceData[`${emp.id}-${dbDate}`];
                  if (status === 'present') totalPresent++; 
                  else if (status === 'leave') totalLeave++; 
                  else if (status === 'absent') totalNoWork++;
                  else if (!status && dbDate <= todayDBStr) totalNoWork++;
                });

                const handleToggle = (dbDate, currentStatus) => {
                  let nextStatus = 'present'; 
                  if (currentStatus === 'present') nextStatus = 'leave'; 
                  else if (currentStatus === 'leave') nextStatus = 'absent';
                  else if (currentStatus === 'absent') nextStatus = null; 
                  setAttendanceData(prev => ({...prev, [`${emp.id}-${dbDate}`]: nextStatus}));
                };

                return (
                  <React.Fragment key={emp.id}>
                    <tr className={`group transition-colors ${isExpanded ? 'bg-indigo-50/40' : 'hover:bg-slate-50/50 cursor-pointer'} ${printMode === 'dtr' ? 'hidden' : ''}`} onClick={() => setExpandedId(isExpanded ? null : emp.id)}>
                      <td className="px-12 py-6 flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[1.5rem] border-2 bg-white overflow-hidden p-1 shadow-sm"><img src={emp.photo || 'https://via.placeholder.com/60'} className="w-full h-full object-cover rounded-xl" alt="" /></div>
                        <div><p className="font-black text-slate-900 text-xl tracking-tight leading-tight">{emp.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{emp.idNo}</p></div>
                      </td>
                      <td className="px-12 py-6 text-right"><div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl transition-all ${isExpanded ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>{isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div></td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan="2" className="p-0 border-none">
                          <div className="bg-slate-50 animate-in slide-in-from-top-2 border-t border-slate-100">
                            
                            <div className={`p-10 border-b border-slate-200 ${printMode === 'dtr' ? 'hidden' : 'block'}`}>
                              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                                <div className="flex gap-4">
                                  <div className="bg-indigo-600 px-6 py-3 rounded-2xl text-white shadow-lg w-32"><p className="text-[10px] font-black uppercase opacity-60">Present</p><p className="text-2xl font-black">{totalPresent}</p></div>
                                  <div className="bg-amber-500 px-6 py-3 rounded-2xl text-white shadow-lg w-32"><p className="text-[10px] font-black uppercase opacity-60">Leave</p><p className="text-2xl font-black">{totalLeave}</p></div>
                                  <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 w-32"><p className="text-[10px] font-black text-slate-400 uppercase">No Work</p><p className="text-2xl font-black text-slate-900">{totalNoWork}</p></div>
                                </div>
                                <button onClick={() => handleSave(emp.id, emp.name)} disabled={isSaving} className="w-full lg:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl disabled:opacity-50">
                                  {isSaving ? "Saving..." : <><Save size={16}/> Update Database</>}
                                </button>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3">
                                {cutoffDays.map((date, i) => {
                                  const dbDate = getDBDateStr(date); 
                                  const status = attendanceData[`${emp.id}-${dbDate}`]; 
                                  const isFuture = dbDate > todayDBStr; 
                                  const isToday = dbDate === todayDBStr;
                                  
                                  let bgClass = '';
                                  if (status === 'present') bgClass = 'bg-indigo-600 border-indigo-600 text-white shadow-lg cursor-pointer';
                                  else if (status === 'leave') bgClass = 'bg-amber-500 border-amber-500 text-white shadow-lg cursor-pointer';
                                  else if (status === 'absent') bgClass = 'bg-rose-50 border-rose-100 text-rose-500 cursor-pointer';
                                  else if (!status && !isFuture) bgClass = 'bg-rose-50 border-rose-100 text-rose-500 cursor-pointer'; 
                                  else bgClass = 'bg-slate-50 border-slate-200 border-dashed text-slate-400 hover:border-indigo-300 cursor-pointer';
                                  
                                  return (
                                    <div key={i} onClick={() => handleToggle(dbDate, status)} className={`relative p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all group ${bgClass} ${isToday ? 'ring-4 ring-indigo-500/20 scale-[1.02] z-10' : ''}`}>
                                      {isToday && <span className="absolute -top-2 bg-rose-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Today</span>}
                                      <span className="text-[9px] font-black uppercase tracking-widest opacity-60 mt-1">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                      <span className="text-2xl font-black leading-none">{date.getDate()}</span>
                                      <span className="text-[9px] font-bold opacity-80 uppercase">{date.toLocaleString('default', { month: 'short' })}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className={printMode === 'dtr' ? 'p-0' : 'p-8 md:p-12'}>
                              
                              <div className={`mb-6 flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ${printMode === 'dtr' ? 'hidden' : 'flex'}`}>
                                <div className="flex items-center gap-3">
                                  <Edit3 size={18} className="text-indigo-600" />
                                  <div><p className="font-bold text-slate-900 text-sm">Interactive DTR Editor</p><p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-0.5">Type directly into the paper to record overtime and press Update Database</p></div>
                                </div>
                                <button onClick={() => triggerPrint('dtr')} className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl">
                                  <Printer size={16}/> Print Edited Document
                                </button>
                              </div>

                              <div className={`bg-white max-w-3xl mx-auto ${printMode === 'dtr' ? 'p-0' : 'shadow-2xl border border-slate-200 p-10 md:p-14'} min-h-[1000px]`}>
                                
                                <div className="flex items-start gap-5 mb-4">
                                  <div className="w-20 h-20 flex items-center justify-center border border-black p-1"><img src="/logo.png" className="w-full h-full object-contain grayscale" alt="Logo" onError={(e) => e.target.src='https://via.placeholder.com/80?text=LOGO'} /></div>
                                  <div>
                                    <h1 className="text-4xl font-black tracking-[0.2em] leading-none text-gray-800">JAHS</h1>
                                    <h1 className="text-4xl font-black tracking-[0.2em] leading-none text-gray-400 mt-[-5px]">TELECOM</h1>
                                    <p className="font-bold tracking-[0.3em] text-[10px] uppercase mt-2">Telecom Service Provider</p>
                                    <p className="text-xs leading-tight text-gray-800 mt-1">#424 Brgy Balubad, Bulacan, Bulacan<br/>Tel: 792-0595</p>
                                  </div>
                                </div>

                                <div className="border-t-2 border-black border-b-2 py-1.5 mb-6 text-center font-bold uppercase tracking-[0.5em] text-sm bg-gray-50 mt-6">Daily Time Record</div>
                                
                                <div className="mb-6 text-sm flex items-end">
                                  <span className="font-bold">Name:</span>
                                  <div className="font-bold border-b border-black ml-3 flex-1 px-2 py-0.5">{emp.name}</div>
                                </div>

                                <table className="w-full border-collapse border-2 border-black text-center text-xs">
                                  <thead>
                                    <tr className="bg-gray-100">
                                      <th className="border border-black py-3 w-1/5 uppercase text-[11px]">Date</th>
                                      <th className="border border-black py-3 w-1/4 uppercase text-[11px]">Time-In</th>
                                      <th className="border border-black py-3 w-1/4 uppercase text-[11px]">Time-Out</th>
                                      <th className="border border-black py-3 w-[30%] uppercase text-[11px]">Activity</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {cutoffDays.map((date, i) => {
                                      const dbDate = getDBDateStr(date);
                                      const status = attendanceData[`${emp.id}-${dbDate}`];
                                      const details = dtrDetails[`${emp.id}-${dbDate}`] || {};
                                      
                                      let dIn = details.timeIn ?? (status === 'present' ? '08:00 AM' : '');
                                      let dOut = details.timeOut ?? (status === 'present' ? '05:00 PM' : '');
                                      let dAct = details.activity ?? (status === 'leave' ? 'OFFICIAL LEAVE' : (status === 'absent' ? 'NO WORK' : ''));
                                      let rowStyle = (status === 'leave' || status === 'absent') ? "text-gray-500 bg-gray-50" : "";

                                      return (
                                        <tr key={`${i}-${status}`} className={`h-8 ${rowStyle}`}>
                                          <td className="border border-black font-bold text-[10px] bg-gray-100/50">
                                            {date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} ({date.toLocaleDateString('en-US', { weekday: 'short' })})
                                          </td>
                                          <td className="border border-black p-0">
                                            <input type="text" value={dIn || ''} onChange={(e) => handleDetailChange(emp.id, dbDate, 'timeIn', e.target.value)} placeholder="-" className="w-full h-8 text-center outline-none bg-transparent font-mono text-[11px] uppercase focus:bg-indigo-100 hover:bg-slate-100 transition-colors placeholder:text-gray-300" />
                                          </td>
                                          <td className="border border-black p-0">
                                            <input type="text" value={dOut || ''} onChange={(e) => handleDetailChange(emp.id, dbDate, 'timeOut', e.target.value)} placeholder="-" className="w-full h-8 text-center outline-none bg-transparent font-mono text-[11px] uppercase focus:bg-indigo-100 hover:bg-slate-100 transition-colors placeholder:text-gray-300" />
                                          </td>
                                          <td className="border border-black p-0">
                                            <input type="text" value={dAct || ''} onChange={(e) => handleDetailChange(emp.id, dbDate, 'activity', e.target.value)} placeholder="-" className="w-full h-8 text-center outline-none bg-transparent font-bold text-[10px] uppercase focus:bg-indigo-100 hover:bg-slate-100 transition-colors placeholder:text-gray-300 px-2" />
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>

                                <div className="mt-12 flex flex-col gap-6 w-72 mx-auto text-[11px] text-center">
                                   <div className="w-full">
                                      <div className="border-b border-black w-full h-5 flex items-end justify-center pb-[2px]">
                                         <span className="font-bold text-sm leading-none">{emp.name}</span>
                                      </div>
                                      <p className="mt-1 text-gray-800">Prepared By:</p>
                                   </div>
                                   <div className="w-full">
                                      <div className="border-b border-black w-full h-5 flex items-end justify-center pb-[2px]"><span className="font-bold text-sm leading-none">Glaiza P. Santos</span></div>
                                      <p className="mt-1 text-gray-800">Checked By:</p>
                                   </div>
                                   <div className="w-full">
                                      <div className="border-b border-black w-full h-5 flex items-end justify-center pb-[2px]"><span className="font-bold text-sm leading-none">Jose Alexander H. Santos</span></div>
                                      <p className="mt-1 text-gray-800">Approved By:</p>
                                   </div>
                                </div>

                              </div>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- PRINT ONLY VIEW: OVERALL MATRIX --- */}
      {printMode === 'matrix' && (
        <div className="block text-black bg-white p-4 font-sans max-w-none">
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
                {cutoffDays.map((d, i) => (
                  <th key={i} className="border border-black p-1 leading-tight text-[9px]">
                    <div>{d.toLocaleDateString('en-US', { weekday: 'narrow' })}</div><div className="text-sm">{d.getDate()}</div>
                  </th>
                ))}
                <th className="border border-black p-1 w-8 text-green-700">P</th><th className="border border-black p-1 w-8 text-amber-600">L</th><th className="border border-black p-1 w-8 text-red-700">NW</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => {
                const todayDBStr = getDBDateStr(new Date());
                let p = 0, l = 0, nw = 0;
                return (
                  <tr key={`matrix-${emp.id}`} className="border-b border-gray-300">
                    <td className="border border-black p-2 text-left whitespace-nowrap"><span className="font-bold">{emp.name}</span><br/><span className="font-mono text-[9px] text-gray-500">{emp.idNo}</span></td>
                    {cutoffDays.map((d, i) => {
                      const dbDate = getDBDateStr(d);
                      const status = attendanceData[`${emp.id}-${dbDate}`];
                      if (dbDate > todayDBStr && !status) return <td key={i} className="border border-black text-gray-300">-</td>;
                      let mark = 'NW'; let textColor = 'text-red-600';
                      if (status === 'present') { mark = 'P'; textColor = 'text-green-700'; p++; } else if (status === 'leave') { mark = 'L'; textColor = 'text-amber-600'; l++; } else { nw++; }
                      return <td key={i} className={`border border-black font-bold ${textColor}`}>{mark}</td>;
                    })}
                    <td className="border border-black font-black bg-gray-100 text-green-700">{p}</td><td className="border border-black font-black bg-gray-100 text-amber-600">{l}</td><td className="border border-black font-black bg-gray-100 text-red-600">{nw}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-12 flex justify-between px-10">
            <div className="text-center"><div className="border-b border-black w-48 mb-2"></div><p className="text-[10px] font-bold uppercase tracking-widest">Prepared By</p></div>
            <div className="text-center"><div className="border-b border-black w-48 mb-2"></div><p className="text-[10px] font-bold uppercase tracking-widest">Approved By</p></div>
          </div>
        </div>
      )}
    </div>
  );
}