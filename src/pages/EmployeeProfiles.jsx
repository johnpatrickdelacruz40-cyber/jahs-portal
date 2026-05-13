import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, ChevronLeft, ChevronRight, User, ChevronDown, ChevronUp, Printer } from 'lucide-react';

const getDBDateStr = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function EmployeeProfiles({ employees }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewDate, setViewDate] = useState(new Date());
  const [attendanceLogs, setAttendanceLogs] = useState({});
  const [expandedId, setExpandedId] = useState(null);

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
  let d = new Date(currentCutoff.start);
  while (d <= currentCutoff.end) { 
    if (d.getDay() !== 0) cutoffDays.push(new Date(d)); d.setDate(d.getDate() + 1); 
  }

  const fetchLogs = async () => {
    const { data } = await supabase.from('attendance_logs').select('*');
    const mapped = {};
    data?.forEach(log => mapped[`${log.employee_id}-${log.log_date}`] = log.status);
    setAttendanceLogs(mapped);
  };

  useEffect(() => { fetchLogs(); }, [viewDate]);

  return (
    <div>
      <div className="space-y-8 animate-in fade-in duration-700 print:hidden">
         <div className="flex flex-col md:flex-row justify-between items-end gap-6">
           <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tighter uppercase text-slate-900">Personnel Hub</h1>
              
              {/* --- UI UPDATE: Larger Date Font & Spacing --- */}
              <div className="flex items-center gap-4 mt-3">
                 <button onClick={handlePrevCutoff} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-indigo-600">
                   <ChevronLeft size={24}/>
                 </button>
                 <p className="font-black text-indigo-600 uppercase text-sm md:text-base tracking-widest bg-indigo-50 px-6 py-2.5 rounded-full shadow-sm">
                   {currentCutoff.label}
                 </p>
                 <button onClick={handleNextCutoff} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-indigo-600">
                   <ChevronRight size={24}/>
                 </button>
              </div>

           </div>
           <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input type="text" placeholder="Find your profile..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
           </div>
         </div>

         <div className="grid grid-cols-1 gap-6">
            {employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())).map(emp => {
              const todayDBStr = getDBDateStr(new Date());
              let present = 0, absent = 0;

              cutoffDays.forEach(d => {
                const dbDate = getDBDateStr(d);
                if (dbDate > todayDBStr) return; 
                const status = attendanceLogs[`${emp.id}-${dbDate}`];
                if (status === 'present') present++; else if (status === 'absent' || !status) absent++;
              });

              return (
                <div key={emp.id} className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                   <div onClick={() => setExpandedId(expandedId === emp.id ? null : emp.id)} className="p-8 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-6">
                         <div className="w-20 h-20 rounded-[1.5rem] border-4 border-slate-50 shadow-sm overflow-hidden bg-white p-1">
                            {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover rounded-xl" /> : <User className="text-slate-200 m-auto h-full" size={32} />}
                         </div>
                         <div>
                            <h4 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">{emp.name}</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{emp.idNo}</p>
                         </div>
                      </div>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${expandedId === emp.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                         {expandedId === emp.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                      </div>
                   </div>

                   {expandedId === emp.id && (
                     <div className="p-8 border-t border-slate-100 bg-slate-50/30 animate-in slide-in-from-top-2">
                        <div className="flex justify-end mb-6">
                          <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md">
                            <Printer size={16}/> Print Calendar Record
                          </button>
                        </div>
                        <div className="flex flex-col xl:flex-row gap-12">
                          <div className="flex gap-4 xl:w-64">
                             <div className="flex-1 bg-indigo-50 py-4 rounded-2xl text-indigo-600 text-center border border-indigo-100/50">
                                <p className="text-3xl font-black">{present}</p><p className="text-[8px] font-black uppercase tracking-widest mt-1">Present</p>
                             </div>
                             <div className="flex-1 bg-rose-50 py-4 rounded-2xl text-rose-500 text-center border border-rose-100/50">
                                <p className="text-3xl font-black">{absent}</p><p className="text-[8px] font-black uppercase tracking-widest mt-1">Absent</p>
                             </div>
                          </div>
                          
                          <div className="flex-1 grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-10 gap-3">
                             {cutoffDays.map((date, i) => {
                               const dbDate = getDBDateStr(date); const isFuture = dbDate > todayDBStr; const status = isFuture ? null : attendanceLogs[`${emp.id}-${dbDate}`];
                               let bgClass = ''; 
                               if (isFuture) bgClass = 'bg-white text-slate-300 border-2 border-slate-100 opacity-40';
                               else if (status === 'present') bgClass = 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 border-2 border-indigo-600';
                               else bgClass = 'bg-rose-50 text-rose-500 border-2 border-rose-100';

                               return (
                                 <div key={i} className={`aspect-square rounded-[1.5rem] flex flex-col items-center justify-center text-[10px] font-black transition-all ${bgClass}`}>
                                   <span className="text-xl tracking-tighter">{date.getDate()}</span>
                                   <span className="text-[7px] uppercase tracking-widest mt-1 opacity-80">{date.toLocaleString('default', { month: 'short' })}</span>
                                 </div>
                               );
                             })}
                          </div>
                        </div>
                     </div>
                   )}
                </div>
              )
            })}
         </div>
      </div>

      {/* --- PRINT ONLY VIEW: CALENDAR GRID --- */}
      <div className="hidden print:block text-black bg-white p-8">
        {employees.filter(e => e.id === expandedId).map(emp => {
            const todayDBStr = getDBDateStr(new Date());
            let p = 0, a = 0;
            cutoffDays.forEach(d => {
              const dbDate = getDBDateStr(d);
              if (dbDate > todayDBStr) return; 
              const status = attendanceLogs[`${emp.id}-${dbDate}`];
              if (status === 'present') p++; else if (status === 'absent' || !status) a++;
            });

            return (
              <div key={`print-${emp.id}`}>
                <div className="flex items-center gap-6 mb-8 border-b-2 border-black pb-6">
                   <div className="w-24 h-24 rounded-xl border-2 border-black overflow-hidden bg-white p-1">
                      {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover grayscale" /> : <User className="m-auto h-full text-black" size={40} />}
                   </div>
                   <div>
                      <h2 className="text-2xl font-black uppercase tracking-widest text-gray-500 mb-1">Individual Calendar Record</h2>
                      <h3 className="text-4xl font-black uppercase leading-none">{emp.name}</h3>
                      <p className="text-lg font-mono font-bold mt-2">ID: {emp.idNo} | {currentCutoff.label}</p>
                   </div>
                </div>

                <div className="flex gap-10 mb-8 border-2 border-black p-4 bg-gray-100">
                  <p className="text-lg font-bold uppercase"><span className="text-sm font-normal text-gray-600 block">Total Present</span> <span className="text-green-700">{p}</span> Days</p>
                  <p className="text-lg font-bold uppercase"><span className="text-sm font-normal text-gray-600 block">Total Absent</span> <span className="text-red-700">{a}</span> Days</p>
                </div>

                <h4 className="text-sm font-black uppercase tracking-widest mb-4">Calendar Grid</h4>
                <div className="grid grid-cols-5 gap-4">
                  {cutoffDays.map((date, i) => {
                    const dbDate = getDBDateStr(date);
                    if (dbDate > todayDBStr) return null; 
                    
                    const status = attendanceLogs[`${emp.id}-${dbDate}`];
                    let text = "ABSENT";
                    let textColor = "text-red-600";

                    if (status === 'present') { 
                      text = "PRESENT"; 
                      textColor = "text-green-700"; 
                    }

                    return (
                      <div key={i} className="border-2 border-black flex flex-col items-center justify-center p-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest mb-1">{date.toLocaleDateString('en-US', { weekday: 'short', month: 'short' })}</span>
                        <span className="text-4xl font-black mb-1">{date.getDate()}</span>
                        <span className={`text-sm font-bold uppercase border-t-2 border-black w-full text-center pt-2 ${textColor}`}>{text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
}