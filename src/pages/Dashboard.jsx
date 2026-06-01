import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Users, CheckCircle2, XCircle, Clock, 
  Activity, Video, PieChart, X, User, Printer, Coffee, BarChart3,
  Search, MapPin, Navigation, ExternalLink,
  MessageSquare, Send, Bot, ChevronRight, ArrowLeft, ShieldAlert
} from 'lucide-react';

const getDBDateStr = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Dashboard({ employees }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayStats, setTodayStats] = useState({ present: 0, leave: 0, absent: 0 });
  const [detailedStats, setDetailedStats] = useState({ present: [], leave: [], absent: [] });
  const [activeList, setActiveList] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);

  // --- DEPLOYMENT ROUTER STATE ---
  const COMPANY_LOCATION = "Brgy Balubad, Bulakan, Bulacan, Philippines";
  const [searchSite, setSearchSite] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // --- RULE-BASED CHATBOT STATE ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [currentCategory, setCurrentCategory] = useState(null); // Controls Sub-Menus
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm the JAHS Telecom Assistant. Select a category below or type your question.", sender: 'bot' }
  ]);
  const chatEndRef = useRef(null);

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

  // 3. AUTOCOMPLETE SEARCH FOR DEPLOYMENT SITES
  useEffect(() => {
    if (searchSite.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    
    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${searchSite}&count=20&language=en&format=json`);
        const data = await res.json();
        
        if (data.results) {
          let localResults = data.results.filter(loc => loc.country_code === 'PH');
          localResults = localResults.filter((v, i, a) => a.findIndex(t => (t.name === v.name && t.admin1 === v.admin1)) === i);
          setSuggestions(localResults.slice(0, 5));
        } else {
          setSuggestions([]);
        }
      } catch (err) { console.error(err); }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchSite]);

  const handleSelectSite = (site) => {
    const province = site.admin2 ? site.admin2.replace('Province of ', '').replace(' (capital)', '') : '';
    const fullLocation = `${site.name}${province && province !== site.name ? `, ${province}` : ''}, Philippines`;
    
    setSearchSite(fullLocation);
    setSelectedDestination(fullLocation);
    setShowSuggestions(false);
  };

  const total = employees.length;

  // --- 4. HIERARCHICAL KNOWLEDGE BASE ---
  // We use categories to organize the sub-questions
  const FAQ_CATEGORIES = [
    {
      id: 'attendance',
      title: '👥 Operations & Attendance',
      questions: [
        { q: "How many are present today?", a: `Based on today's live logs, there are ${todayStats.present} employees present out of ${total}.`, keywords: ["present", "how many", "attendance"] },
        { q: "Who is absent or on leave?", a: `Today, ${todayStats.leave} employees are on official leave, and ${todayStats.absent} have no work scheduled.`, keywords: ["absent", "leave", "missing"] },
        { q: "What are the payroll cutoffs?", a: "Standard payroll cutoffs are on the 10th and 25th of every month.", keywords: ["payroll", "cutoff", "salary"] },
        { q: "What are the overtime rules?", a: "Overtime must be pre-approved by the site supervisor before deployment ends. Unauthorized OT will not be credited.", keywords: ["overtime", "ot"] }
      ]
    },
    {
      id: 'installation',
      title: '🔧 Installation Processes',
      questions: [
        { q: "What is the fiber splicing process?", a: "Fiber splicing involves stripping the outer jacket, cleaning the core with isopropyl alcohol, cleaving it perfectly flat, and fusing the ends using a fusion splicer.", keywords: ["fiber", "splicing", "splice"] },
        { q: "How are telecom antennas mounted?", a: "Antennas are mounted on pole brackets. They must be aligned perfectly to the planned Azimuth (direction) and Mechanical Tilt (angle), then fully weatherproofed at the connectors.", keywords: ["antenna", "mount", "alignment"] },
        { q: "What is the standard site grounding?", a: "All equipment must be tied to the Main Grounding Busbar (MGB) using heavy copper cables and compression lugs. Resistance must be less than 5 ohms to prevent lightning damage.", keywords: ["grounding", "earth", "lightning"] }
      ]
    },
    {
      id: 'hardware',
      title: '📡 Hardware & Brands',
      questions: [
        { q: "What is a Rectifier System?", a: "A rectifier converts AC power from the grid into stable -48V DC power. It powers the telecom equipment and constantly charges the backup battery banks.", keywords: ["rectifier", "power"] },
        { q: "What is the difference between BBU and RRU?", a: "The BBU (Baseband Unit) is the 'brain' that processes digital signals inside the cabinet. The RRU (Remote Radio Unit) sits on the tower to transceive RF radio waves. They connect via fiber cables.", keywords: ["bbu", "rru", "radio"] },
        { q: "Which telecom brands do we handle?", a: "We primarily deploy and maintain equipment from major global vendors including Huawei, ZTE, Ericsson, Nokia, Emerson, and Delta.", keywords: ["brands", "vendor", "huawei", "zte", "ericsson"] }
      ]
    },
    {
      id: 'developer',
      title: '💻 System Info',
      questions: [
        { q: "Who developed this system?", a: "I was proudly engineered and developed by John Patrick DC. Dela Cruz as a modern telecommunications operations platform.", keywords: ["who made you", "creator", "developer", "who programmed you"] }
      ]
    }
  ];

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Handle User Input (Typing OR Clicking a chip)
  const handleSendMessage = (textOrEvent, directAnswer = null) => {
    let userText = "";
    
    if (typeof textOrEvent === 'string') {
      userText = textOrEvent;
    } else {
      textOrEvent.preventDefault();
      userText = chatInput;
    }

    if (!userText.trim()) return;

    // 1. Post user message
    setMessages(prev => [...prev, { id: Date.now(), text: userText, sender: 'user' }]);
    setChatInput('');

    // 2. Security Guardrail Check (Block admin/password info)
    const lowerText = userText.toLowerCase();
    if (lowerText.includes("admin") || lowerText.includes("password") || lowerText.includes("database") || lowerText.includes("hack")) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          text: "SECURITY ALERT: I am strictly programmed to decline any requests regarding admin access, passwords, or system architecture.", 
          sender: 'bot' 
        }]);
      }, 400);
      return;
    }

    // 3. Process Bot Reply
    setTimeout(() => {
      let botReply = "";

      if (directAnswer) {
        // User clicked a specific sub-question button
        botReply = directAnswer;
      } else {
        // User typed a custom question. Search through ALL categories and questions.
        let foundAnswer = null;
        for (const category of FAQ_CATEGORIES) {
          for (const faq of category.questions) {
            if (faq.q.toLowerCase() === lowerText || faq.keywords.some(kw => lowerText.includes(kw))) {
              foundAnswer = faq.a;
              break;
            }
          }
          if (foundAnswer) break;
        }

        botReply = foundAnswer || "I'm sorry, I only have access to specific telecom and operations data. Please browse the categories below or check your spelling.";
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, text: botReply, sender: 'bot' }]);
    }, 400); 
  };


  const greeting = currentTime.getHours() < 12 ? 'Good Morning' : currentTime.getHours() < 18 ? 'Good Afternoon' : 'Good Evening';
  const pctPresent = total > 0 ? (todayStats.present / total) * 100 : 0;
  const pctLeave = total > 0 ? (todayStats.leave / total) * 100 : 0;
  const pctAbsent = total > 0 ? (todayStats.absent / total) * 100 : 0;
  const stop1 = pctPresent;
  const stop2 = pctPresent + pctLeave;

  // Determine what day today is (0 = Sunday, 1 = Monday ... 5 = Friday, 6 = Saturday)
  const currentDayNum = currentTime.getDay(); 

  // Mock historical data so the graph looks realistic for your OJT presentation
  const mockHistorical = { 1: 95, 2: 88, 3: 92, 4: 90, 5: 85, 6: 75 };

  // Dynamically build the chart based on today's actual day
  const weeklyData = [
    { day: 'Mon', id: 1 },
    { day: 'Tue', id: 2 },
    { day: 'Wed', id: 3 },
    { day: 'Thu', id: 4 },
    { day: 'Fri', id: 5 },
    { day: 'Sat', id: 6 },
  ].map(item => {
    let percent = 0;
    if (item.id < currentDayNum) {
      // If it is a PAST day, show historical data
      percent = mockHistorical[item.id];
    } else if (item.id === currentDayNum) {
      // If it is TODAY, show the live calculated data
      percent = pctPresent > 0 ? Math.round(pctPresent) : 0;
    } else {
      // If it is a FUTURE day, leave it empty (0)
      percent = 0;
    }
    return { day: item.day, percent };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10 flex flex-col min-h-full relative">
      
      {/* --- CUSTOM CSS FOR WIGGLE & BOUNCE --- */}
      <style>{`
        @keyframes gentle-wiggle {
          0% { transform: rotate(0deg) scale(1); }
          15% { transform: rotate(-8deg) scale(1.05); }
          30% { transform: rotate(8deg) scale(1.05); }
          45% { transform: rotate(-8deg) scale(1.05); }
          60% { transform: rotate(0deg) scale(1); }
          100% { transform: rotate(0deg) scale(1); }
        }
        .animate-bot-wiggle {
          animation: gentle-wiggle 3s infinite;
        }
        @keyframes float-bubble {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-float-bubble {
          animation: float-bubble 2s ease-in-out infinite;
        }
      `}</style>

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

          <div className="flex flex-col gap-6">
            
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-4 flex flex-col">
              <div className="flex justify-between items-center mb-3 px-3"><h3 className="text-xs font-black tracking-widest text-slate-900 uppercase flex items-center gap-2"><Video size={16} className="text-rose-500" /> Live Feed</h3><span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span></span></div>
              <div className="relative w-full h-40 rounded-[1.5rem] overflow-hidden bg-slate-900 border border-slate-800"><video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-80"><source src="/bg-video.mp4" type="video/mp4" /></video></div>
            </div>

            {/* --- SITE DEPLOYMENT ROUTER --- */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex-1 flex flex-col relative z-20">
              
              <div className="flex justify-between items-start mb-6">
  <div>
    <h3 className="text-lg font-black tracking-tight text-slate-900 uppercase flex items-center gap-2">
      <Navigation size={18} className="text-indigo-500" /> Deployment Router
    </h3>
    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-1">From <MapPin size={10}/> Bulakan HQ</p>
  </div>
</div>

              {/* Destination Search Bar */}
              <div className="relative mb-6">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchSite} 
                  onChange={(e) => { setSearchSite(e.target.value); setShowSuggestions(true); setSelectedDestination(null); }} 
                  onFocus={() => { if(searchSite.length >= 2) setShowSuggestions(true); }}
                  placeholder="Enter Deployment Destination..." 
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-50">
                    {suggestions.map((s, i) => {
                      const province = s.admin2 ? s.admin2.replace('Province of ', '').replace(' (capital)', '') : '';
                      const region = s.admin1 ? s.admin1 : '';
                      return (
                        <div 
                          key={i}
                          onClick={() => handleSelectSite(s)}
                          className="px-5 py-3 hover:bg-slate-50 cursor-pointer flex flex-col border-b border-slate-50 last:border-0 transition-colors"
                        >
                          <span className="font-bold text-slate-900 text-sm leading-none">
                            {s.name}{province && province !== s.name ? `, ${province}` : ''}
                          </span>
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                            {region ? `${region}, ` : ''}{s.country}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {selectedDestination ? (
                <div className="flex flex-col flex-1">
                  <div className="w-full h-48 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative mb-4">
                    <iframe 
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      style={{ border: 0 }}
                      src={`https://maps.google.com/maps?saddr=${encodeURIComponent(COMPANY_LOCATION)}&daddr=${encodeURIComponent(selectedDestination)}&output=embed`}
                      allowFullScreen
                    ></iframe>
                  </div>
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(COMPANY_LOCATION)}&destination=${encodeURIComponent(selectedDestination)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-200"
                  >
                    Launch Live Navigation <ExternalLink size={14}/>
                  </a>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-60">
                  <Navigation size={32} className="mb-2 opacity-50" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-center">Awaiting Destination<br/>Type a city to calculate route</p>
                </div>
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
          {/* Modal content omitted for brevity, remains exactly identical to previous block */}
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

      {/* --- OFFLINE FLOATING CHATBOT WIDGET --- */}
      <div className="fixed bottom-6 right-6 z-50 print:hidden flex flex-col items-end">
        
        {/* Floating "Ask Me" Bubble */}
        {!isChatOpen && (
          <div className="mb-3 mr-2 animate-float-bubble pointer-events-none">
            <div className="bg-[#5538ff] text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-2xl rounded-br-sm shadow-xl shadow-indigo-300/50">
              Ask Me!
            </div>
          </div>
        )}

        {/* Chat Window - WIDENED TO w-96 (384px) and h-[32rem] */}
        {isChatOpen && (
          <div className="w-96 h-[32rem] bg-white border border-slate-200 rounded-3xl shadow-2xl mb-4 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300 relative z-10">
            
            {/* Chat Header */}
            <div className="bg-[#5538ff] p-4 flex justify-between items-center text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white p-1.5 flex items-center justify-center overflow-hidden border-2 border-white relative">
                  <img src="/jahsbots-removebg-preview.png" alt="Bot Icon" className="w-full h-full object-cover z-10 relative" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-tight leading-none">JAHS Assistant</h4>
                  <p className="text-[9px] text-indigo-200 uppercase tracking-widest mt-0.5">Knowledge Base</p>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-indigo-200 hover:text-white transition-colors"><X size={20}/></button>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-slate-50 relative z-0">
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-2 relative z-0 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-white flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200 relative mt-1 p-1">
                       <img src="/jahsbots-removebg-preview.png" alt="Bot Avatar" className="w-full h-full object-contain z-10 relative" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-[#5538ff] text-white rounded-br-none shadow-md' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* HIERARCHICAL MENU SYSTEM */}
            <div className="bg-white border-t border-slate-100 flex flex-col shrink-0 max-h-48">
              
              {/* Back Button (Only shows if inside a category) */}
              {currentCategory && (
                <div className="px-3 py-2 border-b border-slate-50 flex items-center">
                   <button 
                     onClick={() => setCurrentCategory(null)}
                     className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700 transition-colors"
                   >
                     <ArrowLeft size={12} /> Back to Menus
                   </button>
                </div>
              )}

              {/* Menu List */}
              <div className="p-3 overflow-y-auto flex flex-col gap-2">
                {!currentCategory ? (
                  // MAIN MENU: Show Categories
                  <>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1 mb-1">Topics</p>
                    {FAQ_CATEGORIES.map((category) => (
                      <button 
                        key={category.id}
                        onClick={() => setCurrentCategory(category.id)}
                        className="text-left bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 text-slate-700 hover:text-indigo-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex justify-between items-center group"
                      >
                        <span>{category.title}</span>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                      </button>
                    ))}
                  </>
                ) : (
                  // SUB MENU: Show Questions inside selected Category
                  FAQ_CATEGORIES.find(c => c.id === currentCategory)?.questions.map((faq, index) => (
                    <button 
                      key={index}
                      onClick={() => handleSendMessage(faq.q, faq.a)}
                      className="text-left bg-indigo-50/50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 text-[11px] px-3 py-2 rounded-xl transition-colors"
                    >
                      {faq.q}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0 relative z-10">
              <input 
                type="text" 
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Or type your question here..." 
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
              />
              <button type="submit" disabled={!chatInput.trim()} className="bg-[#5538ff] text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex-shrink-0">
                <Send size={18} />
              </button>
            </form>
          </div>
        )}

        {/* --- MAIN WIGGLING BOT BUTTON --- */}
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`transition-all duration-300 flex items-center justify-center relative hover:scale-110 active:scale-95 z-0 
            ${isChatOpen ? 'h-16 w-16 bg-rose-500 text-white rounded-full shadow-2xl shadow-rose-300/50' : 'h-24 w-24 animate-bot-wiggle drop-shadow-2xl'}`}
        >
          {isChatOpen ? (
            <X size={32} />
          ) : (
            <img 
              src="/jahsbots-removebg-preview.png" 
              alt="Bot Button" 
              className="w-full h-full object-contain filter drop-shadow-lg" 
              onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} 
            />
          )}
        </button>
      </div>

    </div>
  );
}