import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Users, CheckCircle2, XCircle, Clock, 
  Activity, Video, Radio, PieChart, X, User, Printer, Coffee, BarChart3,
  Search, MapPin, Wind, CloudRain, Sun, CloudLightning, AlertTriangle, ShieldCheck
} from 'lucide-react';

const getDBDateStr = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeatherStatus = (code) => {
  if (code === 0) return { label: 'Clear Sky', icon: Sun };
  if (code >= 1 && code <= 3) return { label: 'Cloudy', icon: Sun }; 
  if (code >= 45 && code <= 48) return { label: 'Foggy', icon: Wind };
  if (code >= 51 && code <= 67) return { label: 'Raining', icon: CloudRain };
  if (code >= 80 && code <= 82) return { label: 'Showers', icon: CloudRain };
  if (code >= 95 && code <= 99) return { label: 'Thunderstorm', icon: CloudLightning };
  return { label: 'Variable', icon: Sun };
};

export default function Dashboard({ employees }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayStats, setTodayStats] = useState({ present: 0, leave: 0, absent: 0 });
  const [detailedStats, setDetailedStats] = useState({ present: [], leave: [], absent: [] });
  const [activeList, setActiveList] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);

  // --- WEATHER & AUTOCOMPLETE STATE ---
  const [searchCity, setSearchCity] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  // 1. Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Fetch Today's Attendance
  useEffect(() => {
    const fetchTodayAttendance = async () => {
      setIsLoading(true);
      const todayStr = getDBDateStr(new Date());
      const { data, error } = await supabase.from('attendance_logs').select('employee_id, status').eq('log_date', todayStr);

      if (!error && data) {
        const presentArr = []; const leaveArr = []; const absentArr = [];
        const markedIds = new Set();

        data.forEach(log => {
          markedIds.add(log.employee_id);
          const emp = employees.find(e => e.id === log.employee_id);
          if (emp) {
            if (log.status === 'present') presentArr.push(emp);
            else if (log.status === 'leave') leaveArr.push(emp);
            else if (log.status === 'absent') absentArr.push(emp);
          }
        });
        employees.forEach(emp => { if (!markedIds.has(emp.id)) absentArr.push(emp); });

        [presentArr, leaveArr, absentArr].forEach(arr => arr.sort((a, b) => a.name.localeCompare(b.name)));
        setDetailedStats({ present: presentArr, leave: leaveArr, absent: absentArr });
        setTodayStats({ present: presentArr.length, leave: leaveArr.length, absent: absentArr.length });
      }
      setIsLoading(false);
    };

    if (employees.length > 0) fetchTodayAttendance();
    else setIsLoading(false);
  }, [employees]);

  // 3. LIVE AUTOCOMPLETE EFFECT
  useEffect(() => {
    if (searchCity.length < 2) {
      setSuggestions([]);
      return;
    }
    
    // Debounce: Wait 300ms after user stops typing to fetch suggestions
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${searchCity}&count=5`);
        const data = await res.json();
        if (data.results) {
          setSuggestions(data.results);
        } else {
          setSuggestions([]);
        }
      } catch (err) { console.error(err); }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchCity]);

  // 4. Load Exact Weather by Coordinates
  const fetchWeatherExact = async (lat, lon, locationName) => {
    setIsWeatherLoading(true);
    setShowSuggestions(false);
    setSearchCity(locationName); // Lock the input to the exact selection
    
    try {
      const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max&timezone=Asia%2FSingapore`);
      const wData = await wRes.json();
      setWeatherData({ name: locationName, current: wData.current, daily: wData.daily });
    } catch (err) { console.error(err); }
    
    setIsWeatherLoading(false);
  };

  // Load default weather on start (Bulacan coordinates approx)
  useEffect(() => { fetchWeatherExact(14.85, 120.8167, 'Bulacan'); }, []);

  const greeting = currentTime.getHours() < 12 ? 'Good Morning' : currentTime.getHours() < 18 ? 'Good Afternoon' : 'Good Evening';
  const total = employees.length;
  const pctPresent = total > 0 ? (todayStats.present / total) * 100 : 0;
  const pctLeave = total > 0 ? (todayStats.leave / total) * 100 : 0;
  const pctAbsent = total > 0 ? (todayStats.absent / total) * 100 : 0;
  const stop1 = pctPresent;
  const stop2 = pctPresent + pctLeave;

  const weeklyData = [
    { day: 'Mon', percent: 95 }, { day: 'Tue', percent: 88 }, { day: 'Wed', percent: pctPresent > 0 ? Math.round(pctPresent) : 0 },
    { day: 'Thu', percent: 0 }, { day: 'Fri', percent: 0 }, { day: 'Sat', percent: 0 },
  ];

  // --- TELECOM SAFETY ALGORITHM ---
  let deploymentStatus = { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: ShieldCheck, title: 'Safe for Deployment', msg: 'Clear for tower climbing and site installation.' };
  
  if (weatherData) {
    const wind = weatherData.current.wind_speed_10m;
    const code = weatherData.current.weather_code;
    
    if (code >= 95) { 
      deploymentStatus = { color: 'bg-rose-100 text-rose-700 border-rose-200', icon: AlertTriangle, title: 'RED ALERT: Suspend Ops', msg: 'Lightning detected. All tower and outdoor operations halted.' };
    } else if (wind > 40) { 
      deploymentStatus = { color: 'bg-rose-100 text-rose-700 border-rose-200', icon: Wind, title: 'DANGER: High Winds', msg: `Wind at ${wind}km/h. Tower climbing is strictly prohibited.` };
    } else if (code >= 51 && code <= 82) { 
      deploymentStatus = { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: CloudRain, title: 'CAUTION: Ground Ops Only', msg: 'Wet conditions. Slippery towers. Indoor/Cabinet splicing only.' };
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10 flex flex-col min-h-full relative">
      
      <div className={activeList ? "print:hidden" : ""}>
        
        {/* --- HEADER --- */}
        <div className="w-full bg-indigo-600 rounded-[3rem] p-10 text-white shadow-xl shadow-indigo-200 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-1/4 p-10 opacity-5 pointer-events-none"><Activity size={300} /></div>
          <div className="relative z-10">
            <p className="text-indigo-200 font-bold uppercase tracking-widest text-xs mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> System Online</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter">{greeting}.</h1>
            <p className="text-indigo-100 mt-2 font-medium max-w-md">JAHS Electronic and Electrical Service</p>
          </div>
          <div className="relative z-10 text-left md:text-right bg-white/10 p-6 rounded-3xl backdrop-blur-sm border border-white/20">
            <p className="text-3xl font-black tracking-tighter flex items-center gap-3"><Clock size={24} className="text-indigo-300" />{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-200 mt-1">{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        {/* --- KPI CARDS --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><Users size={24} /></div><div><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Personnel</p><h3 className="text-2xl font-black text-slate-900 leading-none mt-1">{total}</h3></div></div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500"><CheckCircle2 size={24} /></div><div><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Present</p><h3 className="text-2xl font-black text-slate-900 leading-none mt-1">{isLoading ? '...' : todayStats.present}</h3></div></div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500"><Coffee size={24} /></div><div><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Leave</p><h3 className="text-2xl font-black text-slate-900 leading-none mt-1">{isLoading ? '...' : todayStats.leave}</h3></div></div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500"><XCircle size={24} /></div><div><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">No Work</p><h3 className="text-2xl font-black text-slate-900 leading-none mt-1">{isLoading ? '...' : todayStats.absent}</h3></div></div>
        </div>

        {/* --- MAIN GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8 flex-1">
          
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-8">
                <div><h3 className="text-xl font-black tracking-tight text-slate-900 uppercase flex items-center gap-2"><PieChart size={20} className="text-indigo-600" /> Daily Overview</h3><p className="text-xs font-bold text-slate-400 mt-1">Real-time attendance distribution.</p></div>
                <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl"><p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Today</p></div>
              </div>
              <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-12 py-6">
                <div className="w-56 h-52 rounded-full flex items-center justify-center shadow-lg" style={{ background: `conic-gradient(#10b981 0% ${stop1}%, #f59e0b ${stop1}% ${stop2}%, #f43f5e ${stop2}% 100%)` }}>
                  <div className="w-36 h-36 bg-white rounded-full flex flex-col items-center justify-center shadow-inner"><span className="text-4xl font-black text-slate-900 leading-none">{total}</span><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Personnel</span></div>
                </div>
                <div className="flex flex-col gap-3 w-full md:w-auto min-w-[280px]">
                  <div className="flex items-center justify-between gap-6 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100"><div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><div><p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none">Present</p><p className="text-xl font-black text-slate-900 mt-1">{todayStats.present} <span className="text-[10px] font-bold text-slate-400 ml-1">({Math.round(pctPresent)}%)</span></p></div></div><button onClick={() => setActiveList('present')} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-widest">View</button></div>
                  <div className="flex items-center justify-between gap-6 bg-amber-50/50 p-4 rounded-2xl border border-amber-100"><div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-amber-500"></div><div><p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest leading-none">Leave</p><p className="text-xl font-black text-slate-900 mt-1">{todayStats.leave} <span className="text-[10px] font-bold text-slate-400 ml-1">({Math.round(pctLeave)}%)</span></p></div></div><button onClick={() => setActiveList('leave')} className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-[9px] font-black uppercase tracking-widest">View</button></div>
                  <div className="flex items-center justify-between gap-6 bg-rose-50/50 p-4 rounded-2xl border border-rose-100"><div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-rose-500"></div><div><p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest leading-none">No Work</p><p className="text-xl font-black text-slate-900 mt-1">{todayStats.absent} <span className="text-[10px] font-bold text-slate-400 ml-1">({Math.round(pctAbsent)}%)</span></p></div></div><button onClick={() => setActiveList('absent')} className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-[9px] font-black uppercase tracking-widest">View</button></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-10">
                <div><h3 className="text-xl font-black tracking-tight text-slate-900 uppercase flex items-center gap-2"><BarChart3 size={20} className="text-indigo-600" /> Weekly Trends</h3><p className="text-xs font-bold text-slate-400 mt-1">Percentage of personnel present across the active week.</p></div>
                <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl"><p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Active Week</p></div>
              </div>
              <div className="h-48 flex items-end justify-between gap-2 px-2 md:px-6">
                {weeklyData.map((data, i) => (
                  <div key={i} className="flex flex-col items-center gap-3 w-full group">
                    <div className="w-full h-40 bg-slate-50 rounded-t-xl relative flex items-end justify-center group-hover:bg-slate-100 transition-colors">
                      <div className={`w-full rounded-t-xl transition-all duration-1000 ${data.percent > 0 ? 'bg-indigo-500 shadow-lg shadow-indigo-100' : 'bg-transparent'}`} style={{ height: `${data.percent}%` }}></div>
                      <div className="absolute -top-8 bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{data.percent}%</div>
                    </div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${data.percent > 0 ? 'text-slate-900' : 'text-slate-300'}`}>{data.day}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-6">
            
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-4 flex flex-col">
              <div className="flex justify-between items-center mb-3 px-3"><h3 className="text-xs font-black tracking-widest text-slate-900 uppercase flex items-center gap-2"><Video size={16} className="text-rose-500" /> Live Feed</h3><span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span></span></div>
              <div className="relative w-full h-40 rounded-[1.5rem] overflow-hidden bg-slate-900 border border-slate-800"><video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-80"><source src="/bg-video.mp4" type="video/mp4" /></video></div>
            </div>

            {/* --- FIELD DISPATCH RADAR WITH AUTOCOMPLETE --- */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex-1 flex flex-col relative z-20">
              
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg font-black tracking-tight text-slate-900 uppercase flex items-center gap-2"><MapPin size={18} className="text-indigo-500" /> Dispatch Radar</h3>
              </div>

              {/* Autocomplete Search Bar */}
              <div className="relative mb-6">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchCity} 
                  onChange={(e) => { setSearchCity(e.target.value); setShowSuggestions(true); }} 
                  onFocus={() => { if(searchCity.length >= 2) setShowSuggestions(true); }}
                  placeholder="Enter Deployment City..." 
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                
                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-50">
                    {suggestions.map((s, i) => (
                      <div 
                        key={i}
                        onClick={() => fetchWeatherExact(s.latitude, s.longitude, s.name)}
                        className="px-5 py-3 hover:bg-slate-50 cursor-pointer flex flex-col border-b border-slate-50 last:border-0 transition-colors"
                      >
                        <span className="font-bold text-slate-900 text-sm leading-none">{s.name}</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                          {s.admin1 ? `${s.admin1}, ` : ''}{s.country}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isWeatherLoading ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">Scanning Atmosphere...</div>
              ) : weatherData ? (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center bg-slate-900 text-white p-5 rounded-3xl shadow-lg">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">{weatherData.name}</p>
                      <h4 className="text-3xl font-black mt-1 leading-none">{Math.round(weatherData.current.temperature_2m)}°C</h4>
                    </div>
                    <div className="text-right">
                      {React.createElement(getWeatherStatus(weatherData.current.weather_code).icon, { size: 28, className: "text-indigo-300 ml-auto mb-1" })}
                      <p className="text-[10px] font-bold uppercase tracking-wider">{getWeatherStatus(weatherData.current.weather_code).label}</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border-2 flex gap-3 ${deploymentStatus.color}`}>
                    <deploymentStatus.icon size={24} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider leading-none">{deploymentStatus.title}</p>
                      <p className="text-[10px] font-bold mt-1 opacity-90 leading-tight">{deploymentStatus.msg}</p>
                    </div>
                  </div>

                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 border-t border-slate-100 pt-4">3-Day Forecast</p>
                  <div className="flex justify-between gap-2">
                    {weatherData.daily.time.slice(1, 4).map((dateStr, i) => {
                      const d = new Date(dateStr);
                      const maxT = weatherData.daily.temperature_2m_max[i + 1];
                      const code = weatherData.daily.weather_code[i + 1];
                      const status = getWeatherStatus(code);
                      return (
                        <div key={i} className="flex-1 bg-slate-50 border border-slate-100 rounded-xl py-3 flex flex-col items-center justify-center gap-1">
                          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{d.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                          <status.icon size={16} className="text-slate-600 my-1" />
                          <p className="text-xs font-black text-slate-900">{Math.round(maxT)}°</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-rose-500 text-xs font-bold uppercase tracking-widest">Radar Offline</div>
              )}
            </div>

          </div>
        </div>

        <div className="mt-8 pt-4 flex flex-col md:flex-row justify-between items-center text-slate-400 gap-4 px-4">
           <p className="text-[10px] font-black uppercase tracking-[0.2em]">JAHS Electronic and Electrical Service</p>
           <div className="text-[11px] font-bold tracking-wide text-center md:text-right border border-slate-200 bg-white px-6 py-3 rounded-full shadow-sm">System Engineered & Developed by <span className="text-indigo-600 font-black mx-1">John Patrick DC. Dela Cruz</span> <span className="opacity-40">| © 2026</span></div>
        </div>
      </div>

      {/* --- MODAL --- */}
      {activeList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 print:bg-white print:p-0 print:block">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-100 flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200 print:shadow-none print:border-none print:max-w-none print:h-auto print:max-h-none">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center print:border-black print:pb-4">
               <div>
                 <h3 className={`text-xl font-black uppercase tracking-tight print:text-black ${activeList === 'present' ? 'text-emerald-700' : activeList === 'leave' ? 'text-amber-700' : 'text-rose-700'}`}>
                   {activeList === 'present' ? 'Present Today' : activeList === 'leave' ? 'On Official Leave' : 'No Work Today'}
                 </h3>
                 <p className="text-xs font-bold text-slate-400 mt-1 print:text-black">
                   {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} • {detailedStats[activeList].length} Personnel
                 </p>
               </div>
               <div className="flex items-center gap-2 print:hidden">
                 <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"><Printer size={14}/> Print</button>
                 <button onClick={() => setActiveList(null)} className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-xl transition-colors"><X size={20} /></button>
               </div>
            </div>
            <div className="p-4 overflow-y-auto flex flex-col gap-2 flex-1 print:overflow-visible print:p-0 print:mt-4">
              {detailedStats[activeList].length === 0 ? (
                 <div className="text-center py-10 text-slate-400 font-bold text-xs uppercase tracking-widest">No personnel found.</div>
              ) : (
                 detailedStats[activeList].map((emp, i) => (
                   <div key={emp.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 print:border-b print:border-slate-300 print:rounded-none">
                     <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 p-0.5 flex-shrink-0 print:hidden">
                       {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover rounded-lg" /> : <User className="m-auto h-full text-slate-300" size={16} />}
                     </div>
                     <span className="hidden print:block font-mono text-sm mr-2">{i + 1}.</span>
                     <div className="overflow-hidden">
                       <p className="font-bold text-slate-900 text-sm truncate print:text-base">{emp.name}</p>
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 print:text-black">{emp.idNo}</p>
                     </div>
                   </div>
                 ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}