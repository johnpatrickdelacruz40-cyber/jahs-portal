import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, ChevronLeft, ChevronRight, User, Calendar as CalIcon } from 'lucide-react';

export default function EmployeeProfiles({ employees }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewDate, setViewDate] = useState(new Date());
  const [attendanceLogs, setAttendanceLogs] = useState({});

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase.from('attendance_logs').select('*');
      const mapped = {};
      data?.forEach(log => mapped[`${log.employee_id}-${log.log_date}`] = log.status);
      setAttendanceLogs(mapped);
    };
    fetchLogs();
  }, []);

  // Use the same Cutoff logic from DailyAttendance
  const getCutoffRange = (baseDate) => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const day = baseDate.getDate();

    if (day >= 11 && day <= 25) return { label: `${baseDate.toLocaleString('default', { month: 'long' })} 11th - 25th`, start: new Date(year, month, 11), end: new Date(year, month, 25) };
    if (day >= 26) return { label: `${baseDate.toLocaleString('default', { month: 'long' })} 26th - ${new Date(year, month + 1, 1).toLocaleString('default', { month: 'long' })} 10th`, start: new Date(year, month, 26), end: new Date(year, month + 1, 10) };
    return { label: `${new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' })} 26th - ${baseDate.toLocaleString('default', { month: 'long' })} 10th`, start: new Date(year, month - 1, 26), end: new Date(year, month, 10) };
  };

  const currentCutoff = getCutoffRange(viewDate);
  const days = [];
  let d = new Date(currentCutoff.start);
  while (d <= currentCutoff.end) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }

  return (
    <div className="space-y-8">
       <div className="flex justify-between items-end">
         <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter uppercase">Employee Hub</h1>
            <div className="flex items-center gap-3 bg-white border border-slate-100 p-2 rounded-2xl shadow-sm">
               <button onClick={() => setViewDate(new Date(viewDate.setDate(viewDate.getDate() - 15)))} className="p-2 hover:bg-slate-50 rounded-xl transition-all"><ChevronLeft size={18}/></button>
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">{currentCutoff.label}</span>
               <button onClick={() => setViewDate(new Date(viewDate.setDate(viewDate.getDate() + 15)))} className="p-2 hover:bg-slate-50 rounded-xl transition-all"><ChevronRight size={18}/></button>
            </div>
         </div>
         <div className="relative w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input type="text" placeholder="Find your profile..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
         </div>
       </div>

       <div className="grid grid-cols-1 gap-6">
          {employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())).map(emp => (
            <div key={emp.id} className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm flex flex-col lg:flex-row gap-12">
               <div className="lg:w-64 flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-[2rem] border-4 border-slate-50 shadow-inner overflow-hidden mb-4">
                     {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover" /> : <User className="text-slate-200 m-auto h-full" size={40} />}
                  </div>
                  <h4 className="text-xl font-black text-slate-900 leading-tight">{emp.name}</h4>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-2">{emp.idNo}</p>
               </div>
               
               <div className="flex-1 grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-3">
                  {days.map((date, i) => {
                    const status = attendanceLogs[`${emp.id}-${date.toDateString()}`];
                    return (
                      <div key={i} className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-[10px] font-black transition-all
                        ${status === 'present' ? 'bg-indigo-600 text-white shadow-lg' : status === 'absent' ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-50 text-slate-300 border border-slate-100 opacity-40'}`}>
                        <span>{date.getDate()}</span>
                        <span className="text-[7px] uppercase">{date.toLocaleString('default', { month: 'short' })}</span>
                      </div>
                    );
                  })}
               </div>
            </div>
          ))}
       </div>
    </div>
  );
}