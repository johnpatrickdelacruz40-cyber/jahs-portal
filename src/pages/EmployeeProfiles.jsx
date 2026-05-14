import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, ChevronLeft, ChevronRight, User, ChevronDown, ChevronUp, Printer, FileText } from 'lucide-react';

const getDBDateStr = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function EmployeeProfiles({ employees }) {
  // ... [Keep existing state variables] ...
  const [searchTerm, setSearchTerm] = useState('');
  const [viewDate, setViewDate] = useState(new Date());
  const [attendanceLogs, setAttendanceLogs] = useState({});
  const [dtrDetails, setDtrDetails] = useState({}); 
  const [expandedId, setExpandedId] = useState(null);

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
  let d = new Date(currentCutoff.start);
  while (d <= currentCutoff.end) { 
    cutoffDays.push(new Date(d)); // This now includes Sundays perfectly!
    d.setDate(d.getDate() + 1); 
  }

  // ... [Keep the exact rest of your EmployeeProfiles.jsx code below this line] ...
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
    setAttendanceLogs(mappedStatus);
    setDtrDetails(mappedDetails);
  };

  useEffect(() => { fetchLogs(); }, [viewDate]);

  return (
    <div className="h-full">
      <div className="space-y-8 animate-in fade-in duration-700 print:hidden">
         <div className="flex flex-col md:flex-row justify-between items-end gap-6">
           <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tighter uppercase text-slate-900 leading-none">Personnel Hub</h1>
              <div className="flex items-center gap-4 mt-4">
                 <button onClick={handlePrevCutoff} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-indigo-600"><ChevronLeft size={28}/></button>
                 <p className="font-black text-indigo-600 uppercase text-sm md:text-base tracking-widest bg-white border border-slate-100 px-8 py-3 rounded-full shadow-sm">{currentCutoff.label}</p>
                 <button onClick={handleNextCutoff} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-indigo-600"><ChevronRight size={28}/></button>
              </div>
           </div>
           <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input type="text" placeholder="Find profile..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" />
           </div>
         </div>

         <div className="grid grid-cols-1 gap-6">
            {employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())).map(emp => {
              const isExpanded = expandedId === emp.id;
              let present = 0, leave = 0, noWork = 0;

              cutoffDays.forEach(d => {
                const dbDate = getDBDateStr(d);
                if (dbDate > getDBDateStr(new Date())) return; 
                const status = attendanceLogs[`${emp.id}-${dbDate}`];
                if (status === 'present') present++; else if (status === 'leave') leave++; else if (status === 'absent' || !status) noWork++;
              });

              return (
                <div key={emp.id} className={`bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-4 ring-indigo-500/10' : 'hover:shadow-md'}`}>
                   
                   <div onClick={() => setExpandedId(isExpanded ? null : emp.id)} className="p-8 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-6">
                         <div className="w-20 h-20 rounded-[1.5rem] border-4 border-slate-50 shadow-sm overflow-hidden bg-white p-1">
                            {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover rounded-xl" /> : <User className="text-slate-200 m-auto h-full" size={32} />}
                         </div>
                         <div>
                            <h4 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">{emp.name}</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{emp.idNo}</p>
                         </div>
                      </div>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isExpanded ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                         {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                      </div>
                   </div>

                   {isExpanded && (
                     <div className="border-t border-slate-100 bg-slate-50 animate-in slide-in-from-top-2">
                        
                        <div className="p-6 flex justify-between items-center bg-white border-b border-slate-200">
                          <div className="flex items-center gap-3">
                            <FileText size={18} className="text-indigo-600" />
                            <div>
                              <p className="font-bold text-slate-900 text-sm">Standard DTR View</p>
                              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-0.5">Read-only system records (Synced with Admin Edits)</p>
                            </div>
                          </div>
                          <button onClick={() => window.print()} className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl">
                            <Printer size={16}/> Print Standard DTR
                          </button>
                        </div>

                        <div className="p-8 md:p-12 overflow-x-auto print:p-0 print:overflow-visible">
                          <div className="bg-white max-w-3xl mx-auto shadow-2xl print:shadow-none border border-slate-200 print:border-none p-10 md:p-14 print:p-0 min-h-[1000px] pointer-events-none">
                            
                            <div className="flex items-start gap-5 mb-4">
                              <div className="w-20 h-20 flex items-center justify-center border border-black p-1"><img src="/logo.png" className="w-full h-full object-contain grayscale" alt="Logo" onError={(e) => e.target.src='https://via.placeholder.com/80?text=LOGO'} /></div>
                              <div>
                                <h1 className="text-4xl font-black tracking-[0.2em] leading-none text-gray-800">JAHS</h1>
                                <p className="font-bold tracking-[0.3em] text-[10px] uppercase mt-2">Electronic and Electrical Services</p>
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
                                  const isFuture = dbDate > getDBDateStr(new Date()); 
                                  const status = isFuture ? null : attendanceLogs[`${emp.id}-${dbDate}`];
                                  
                                  const details = dtrDetails[`${emp.id}-${dbDate}`] || {};
                                  
                                  let dIn = details.timeIn ? details.timeIn : (status === 'present' ? '08:00 AM' : '-');
                                  let dOut = details.timeOut ? details.timeOut : (status === 'present' ? '05:00 PM' : '-');
                                  let dAct = details.activity ? details.activity : (status === 'leave' ? 'OFFICIAL LEAVE' : (status === 'absent' ? 'NO WORK' : '-'));
                                  let rowStyle = (status === 'leave' || status === 'absent') ? "text-gray-500 bg-gray-50" : "";

                                  return (
                                    <tr key={i} className={`h-8 ${rowStyle}`}>
                                      <td className="border border-black font-bold text-[10px] bg-gray-100/50">
                                        {date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} ({date.toLocaleDateString('en-US', { weekday: 'short' })})
                                      </td>
                                      <td className="border border-black font-mono text-[11px] uppercase">{dIn}</td>
                                      <td className="border border-black font-mono text-[11px] uppercase">{dOut}</td>
                                      <td className="border border-black font-bold text-[10px] uppercase">{dAct}</td>
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
                                  <div className="border-b border-black w-full h-5 flex items-end justify-center pb-[2px]">
                                     <span className="font-bold text-sm leading-none">Glaiza P. Santos</span>
                                  </div>
                                  <p className="mt-1 text-gray-800">Checked By:</p>
                               </div>
                               <div className="w-full">
                                  <div className="border-b border-black w-full h-5 flex items-end justify-center pb-[2px]">
                                     <span className="font-bold text-sm leading-none">Jose Alexander H. Santos</span>
                                  </div>
                                  <p className="mt-1 text-gray-800">Approved By:</p>
                               </div>
                            </div>
                          </div>
                        </div>

                     </div>
                   )}
                </div>
              )
            })}
         </div>
      </div>

      {/* --- PRINT ONLY VIEW FOR PUBLIC PROFILE --- */}
      <div className="hidden print:block text-black bg-white p-4 font-sans max-w-3xl mx-auto">
        {employees.filter(e => e.id === expandedId).map(emp => {
            return (
              <div key={`print-dtr-${emp.id}`} className="flex flex-col h-[95vh]">
                
                <div className="flex items-start gap-5 mb-4">
                  <div className="w-16 h-16 flex items-center justify-center border border-black p-1"><img src="/logo.png" className="w-full h-full object-contain grayscale" alt="Logo" onError={(e) => e.target.src='https://via.placeholder.com/60?text=LOGO'} /></div>
                  <div>
                    <h1 className="text-4xl font-black tracking-[0.2em] leading-none text-gray-800">JAHS</h1>
                    <h1 className="text-4xl font-black tracking-[0.2em] leading-none text-gray-400 mt-[-5px]">TELECOM</h1>
                    <p className="font-bold tracking-[0.3em] text-[10px] uppercase mt-2">Telecom Service Provider</p>
                    <p className="text-[10px] leading-tight text-gray-800 mt-1">#424 Brgy Balubad, Bulacan, Bulacan<br/>Tel: 792-0595</p>
                  </div>
                </div>

                <div className="border-t-2 border-black border-b-2 py-1.5 mb-6 text-center font-bold uppercase tracking-[0.5em] text-sm bg-gray-50 mt-4">Daily Time Record</div>
                
                <div className="mb-6 text-sm flex items-end"><span className="font-bold">Name:</span><div className="font-bold border-b border-black ml-3 flex-1 px-2 py-0.5">{emp.name}</div></div>

                <table className="w-full border-collapse border-2 border-black text-center text-xs flex-1">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black py-2 w-1/5 uppercase text-[10px]">Date</th>
                      <th className="border border-black py-2 w-1/4 uppercase text-[10px]">Time-In</th>
                      <th className="border border-black py-2 w-1/4 uppercase text-[10px]">Time-Out</th>
                      <th className="border border-black py-2 w-[30%] uppercase text-[10px]">Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cutoffDays.map((date, i) => {
                      const dbDate = getDBDateStr(date);
                      const isFuture = dbDate > getDBDateStr(new Date()); 
                      const status = isFuture ? null : attendanceLogs[`${emp.id}-${dbDate}`];
                      
                      const details = dtrDetails[`${emp.id}-${dbDate}`] || {};
                      
                      let dIn = details.timeIn ? details.timeIn : (status === 'present' ? '08:00 AM' : '-');
                      let dOut = details.timeOut ? details.timeOut : (status === 'present' ? '05:00 PM' : '-');
                      let dAct = details.activity ? details.activity : (status === 'leave' ? 'OFFICIAL LEAVE' : (status === 'absent' ? 'NO WORK' : '-'));
                      let rowStyle = (status === 'leave' || status === 'absent') ? "text-gray-500 bg-gray-50" : "";

                      return (
                        <tr key={i} className={`h-6 ${rowStyle}`}>
                          <td className="border border-black font-bold text-[10px] bg-gray-50/50">
                            {date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} ({date.toLocaleDateString('en-US', { weekday: 'short' })})
                          </td>
                          <td className="border border-black font-mono text-[11px] uppercase">{dIn}</td>
                          <td className="border border-black font-mono text-[11px] uppercase">{dOut}</td>
                          <td className="border border-black font-bold text-[9px] uppercase">{dAct}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="mt-8 flex flex-col gap-5 w-72 mx-auto text-[11px] text-center">
                   <div className="w-full">
                      <div className="border-b border-black w-full h-5 flex items-end justify-center pb-[2px]"><span className="font-bold text-sm leading-none">{emp.name}</span></div>
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

                <p className="mt-auto text-[8px] text-center text-gray-400 italic">JAHS System Portal Generated DTR - © 2026</p>

              </div>
            );
        })}
      </div>

    </div>
  );
}