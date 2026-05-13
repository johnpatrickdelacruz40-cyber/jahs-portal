import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Users, CheckCircle2, XCircle, Clock, 
  Activity, Video, BarChart3, Radio 
} from 'lucide-react';

const getDBDateStr = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Dashboard({ employees }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayStats, setTodayStats] = useState({ present: 0, absent: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Today's Attendance
  useEffect(() => {
    const fetchTodayAttendance = async () => {
      setIsLoading(true);
      const todayStr = getDBDateStr(new Date());
      
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('status')
        .eq('log_date', todayStr);

      if (!error && data) {
        let p = 0, a = 0;
        data.forEach(log => {
          if (log.status === 'present') p++;
          if (log.status === 'absent') a++;
        });
        
        const totalMarked = p + a;
        const unmarked = employees.length - totalMarked;
        
        setTodayStats({ present: p, absent: a + unmarked });
      }
      setIsLoading(false);
    };

    if (employees.length > 0) fetchTodayAttendance();
    else setIsLoading(false);
  }, [employees]);

  const hour = currentTime.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  // Mock data for the weekly chart
  const weeklyData = [
    { day: 'Mon', percent: 95 },
    { day: 'Tue', percent: 88 },
    { day: 'Wed', percent: Math.max(10, Math.floor((todayStats.present / (employees.length || 1)) * 100)) },
    { day: 'Thu', percent: 0 },
    { day: 'Fri', percent: 0 },
    { day: 'Sat', percent: 0 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10 flex flex-col min-h-full">
      
      {/* --- CLEAN HEADER --- */}
      <div className="w-full bg-indigo-600 rounded-[3rem] p-10 text-white shadow-xl shadow-indigo-200 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 p-10 opacity-5 pointer-events-none">
           <Activity size={300} />
        </div>
        
        <div className="relative z-10">
          <p className="text-indigo-200 font-bold uppercase tracking-widest text-xs mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> System Online
          </p>
          {/* GREETING CHANGED HERE */}
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
            {greeting}.
          </h1>
          <p className="text-indigo-100 mt-2 font-medium max-w-md">
            JAHS Electronic and Electrical Service
          </p>
        </div>
        
        <div className="relative z-10 text-left md:text-right bg-white/10 p-6 rounded-3xl backdrop-blur-sm border border-white/20">
          <p className="text-3xl font-black tracking-tighter flex items-center gap-3">
            <Clock size={24} className="text-indigo-300" />
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-200 mt-1">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* --- KPI METRIC CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 hover:shadow-md transition-shadow">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400"><Users size={32} /></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Personnel</p>
            <h3 className="text-4xl font-black text-slate-900 leading-none mt-1">{employees.length}</h3>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 hover:shadow-md transition-shadow">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500"><CheckCircle2 size={32} /></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Present Today</p>
            <h3 className="text-4xl font-black text-slate-900 leading-none mt-1">{isLoading ? '...' : todayStats.present}</h3>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 hover:shadow-md transition-shadow">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500"><XCircle size={32} /></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Absent / Unmarked</p>
            <h3 className="text-4xl font-black text-slate-900 leading-none mt-1">{isLoading ? '...' : todayStats.absent}</h3>
          </div>
        </div>
      </div>

      {/* --- BOTTOM SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 flex-1">
        
        {/* Analytics Chart */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="text-xl font-black tracking-tight text-slate-900 uppercase flex items-center gap-2">
                <BarChart3 size={20} className="text-indigo-600" /> Weekly Trends
              </h3>
              <p className="text-xs font-bold text-slate-400 mt-1">Percentage of personnel present across the active week.</p>
            </div>
            <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Active Week</p>
            </div>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 px-2 md:px-6">
            {weeklyData.map((data, i) => (
              <div key={i} className="flex flex-col items-center gap-3 w-full group">
                <div className="w-full h-40 bg-slate-50 rounded-t-xl relative flex items-end justify-center group-hover:bg-slate-100 transition-colors">
                  <div 
                    className={`w-full rounded-t-xl transition-all duration-1000 ${data.percent > 0 ? 'bg-indigo-500 shadow-lg shadow-indigo-100' : 'bg-transparent'}`} 
                    style={{ height: `${data.percent}%` }}
                  ></div>
                  <div className="absolute -top-8 bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {data.percent}%
                  </div>
                </div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${data.percent > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                  {data.day}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Video & Telemetry */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-4 flex flex-col">
            <div className="flex justify-between items-center mb-3 px-3">
              <h3 className="text-xs font-black tracking-widest text-slate-900 uppercase flex items-center gap-2">
                <Video size={16} className="text-rose-500" /> Live Feed
              </h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            </div>
            <div className="relative w-full h-36 rounded-[1.5rem] overflow-hidden bg-slate-900 border border-slate-800">
              <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-80">
                <source src="/bg-video.mp4" type="video/mp4" />
              </video>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex-1 flex flex-col">
            <h3 className="text-lg font-black tracking-tight text-slate-900 uppercase flex items-center gap-2 mb-6">
              <Radio size={18} className="text-indigo-500" /> System Activity
            </h3>
            <div className="flex-1 flex flex-col gap-5 relative">
              <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-slate-100 z-0"></div>
              
              <div className="flex gap-4 relative z-10">
                <div className="w-5 h-5 rounded-full bg-emerald-100 border-4 border-white flex-shrink-0 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div></div>
                <div><p className="text-xs font-bold text-slate-900 leading-none">Database Synced</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Just now</p></div>
              </div>

              <div className="flex gap-4 relative z-10">
                <div className="w-5 h-5 rounded-full bg-indigo-100 border-4 border-white flex-shrink-0 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div></div>
                <div><p className="text-xs font-bold text-slate-900 leading-none">Admin Session Verified</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">12 mins ago</p></div>
              </div>

              <div className="flex gap-4 relative z-10">
                <div className="w-5 h-5 rounded-full bg-slate-100 border-4 border-white flex-shrink-0 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div></div>
                <div><p className="text-xs font-bold text-slate-900 leading-none">Cloud Backup Completed</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">03:00 AM</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- DEVELOPER FOOTER --- */}
      <div className="mt-auto pt-4 flex flex-col md:flex-row justify-between items-center text-slate-400 gap-4 px-4">
         <p className="text-[10px] font-black uppercase tracking-[0.2em]">
           JAHS Electronic and Electrical Service
         </p>
         <div className="text-[11px] font-bold tracking-wide text-center md:text-right border border-slate-200 bg-white px-6 py-3 rounded-full shadow-sm">
           System Engineered & Developed by <span className="text-indigo-600 font-black mx-1">John Patrick DC. Dela Cruz</span> <span className="opacity-40">| © 2026</span>
         </div>
      </div>

    </div>
  );
}