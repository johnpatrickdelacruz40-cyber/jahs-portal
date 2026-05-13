import React, { useState } from 'react';
import { Search, User, Calendar as CalIcon, ChevronDown, ChevronUp, MapPin, Award } from 'lucide-react';

export default function EmployeeProfiles({ employees }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Filter list by name
  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Sub-Component: Interactive Attendance Calendar ---
  const AttendanceCalendar = ({ emp }) => {
    // Mock data for the calendar visualization
    const daysInMonth = 31;
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const presentDays = [1, 2, 4, 5, 6, 8, 9, 11, 12, 13, 15, 16, 18, 19, 20, 22, 23, 25, 26, 27, 29, 30]; 

    return (
      <div className="bg-slate-50 p-8 border-t border-slate-100 flex flex-col xl:flex-row gap-8 animate-in slide-in-from-top-4 duration-300">
        
        {/* Left: Detailed Info Card */}
        <div className="xl:w-1/3 space-y-4">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Personnel Bio</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-600">
                <div className="p-2 bg-slate-50 rounded-lg"><User size={16} /></div>
                <p className="text-sm font-bold">{emp.name}</p>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <div className="p-2 bg-slate-50 rounded-lg"><MapPin size={16} /></div>
                <p className="text-xs font-medium truncate">{emp.address || 'Address not set'}</p>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <div className="p-2 bg-slate-50 rounded-lg"><Award size={16} /></div>
                <p className="text-xs font-mono font-bold text-indigo-600">{emp.idNo}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Center: The Calendar Grid */}
        <div className="flex-1 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center">
              <CalIcon size={18} className="mr-2 text-indigo-500" /> Attendance History - May 2026
            </h4>
            <div className="flex gap-4 text-[10px] font-bold">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Present</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-200"></div> Absent</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-3">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
              <div key={d} className="text-center text-[10px] font-black text-slate-300 py-2">{d}</div>
            ))}
            {days.map(day => {
              const isPresent = presentDays.includes(day);
              return (
                <div 
                  key={day} 
                  className={`aspect-square flex flex-col items-center justify-center rounded-2xl text-xs font-black transition-all cursor-default
                    ${isPresent 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100 scale-105' 
                      : 'bg-slate-50 text-slate-300 border border-slate-100'}`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Totals Sidebar */}
        <div className="xl:w-64 space-y-4">
           <div className="bg-emerald-600 p-6 rounded-[2rem] text-white shadow-xl shadow-emerald-100">
              <p className="text-[10px] font-black uppercase opacity-70">Present Total</p>
              <h5 className="text-4xl font-black">{presentDays.length}</h5>
              <p className="text-[10px] mt-1 font-bold">Days this month</p>
           </div>
           <div className="bg-white p-6 rounded-[2rem] border border-slate-200 text-slate-400">
              <p className="text-[10px] font-black uppercase tracking-widest">Absent Total</p>
              <h5 className="text-4xl font-black text-slate-800">{daysInMonth - presentDays.length}</h5>
              <p className="text-[10px] mt-1 font-bold">Unmarked days</p>
           </div>
           <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-lg hover:bg-slate-800 transition-all uppercase tracking-widest">
             Print DTR Report
           </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Personnel Directory</h1>
          <p className="text-sm text-slate-500 font-medium">Select an employee to view their detailed attendance records.</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by full name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-10 py-5">Employee Info</th>
              <th className="px-10 py-5">Access ID</th>
              <th className="px-10 py-5 text-right">View Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredEmployees.map((emp) => (
              <React.Fragment key={emp.id}>
                <tr 
                  className={`group cursor-pointer transition-all ${expandedId === emp.id ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`}
                  onClick={() => setExpandedId(expandedId === emp.id ? null : emp.id)}
                >
                  <td className="px-10 py-5">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-100 overflow-hidden shadow-sm flex items-center justify-center p-0.5 group-hover:border-indigo-200 transition-colors">
                        {emp.photo ? (
                          <img src={emp.photo} className="w-full h-full object-cover rounded-xl" alt={emp.name} />
                        ) : (
                          <User className="text-slate-200" size={24} />
                        )}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-lg leading-tight">{emp.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">JAHS Personnel</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-5">
                    <span className="font-mono text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                      {emp.idNo}
                    </span>
                  </td>
                  <td className="px-10 py-5 text-right">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                      {expandedId === emp.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </td>
                </tr>
                
                {/* THE EXPANDABLE UNDERTAB */}
                {expandedId === emp.id && (
                  <tr>
                    <td colSpan="3" className="p-0">
                      <AttendanceCalendar emp={emp} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {filteredEmployees.length === 0 && (
              <tr>
                <td colSpan="3" className="px-10 py-20 text-center">
                  <p className="text-slate-400 font-bold italic">No personnel found matching your search.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}