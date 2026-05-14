import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, ShieldCheck, Calendar, AlertCircle } from 'lucide-react';

export default function Topbar({ onMenuClick, isAdmin }) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // SMART ALERTS LOGIC
  const getNotifications = () => {
    const notifs = [];
    const today = new Date().getDate();

    if (isAdmin) {
      notifs.push({ 
        id: 1, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-100', 
        title: 'Admin Session Active', time: 'Just now', desc: 'You have full DTR modification rights.' 
      });

      // Automated Cutoff Warnings (Trigger 2 days before cutoffs: 10th & 25th)
      if (today >= 8 && today <= 10) {
        notifs.push({ 
          id: 2, icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-100', 
          title: '10th Cutoff Approaching', time: 'System Alert', desc: 'Please ensure all DTRs and Overtime logs are updated for printing.' 
        });
      } else if (today >= 23 && today <= 25) {
        notifs.push({ 
          id: 3, icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-100', 
          title: '25th Cutoff Approaching', time: 'System Alert', desc: 'Please ensure all DTRs and Overtime logs are updated for printing.' 
        });
      }
    } else {
       notifs.push({ 
         id: 4, icon: AlertCircle, color: 'text-indigo-500', bg: 'bg-indigo-100', 
         title: 'Read-Only Mode', time: 'System Alert', desc: 'Please contact the system admin for DTR discrepancies.' 
       });
    }

    return notifs;
  };

  const notifications = getNotifications();

  return (
    <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm z-20 relative">
      
      {/* Mobile Menu Button */}
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="md:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all">
          <Menu size={24} />
        </button>
      </div>

      <div className="flex-1"></div>

      {/* Right Side (Working Notification Bell) */}
      <div className="flex items-center gap-6" ref={dropdownRef}>
        <div className="relative">
          
          {/* Bell Button */}
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`relative p-2 rounded-full transition-colors ${isNotifOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
          >
            <Bell size={22} />
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </button>

          {/* Notification Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-top-2 duration-200 z-50">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h4 className="font-black text-sm uppercase tracking-widest text-slate-900">Notifications</h4>
                <span className="bg-indigo-100 text-indigo-600 text-[10px] font-black px-2 py-1 rounded-lg">{notifications.length} New</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.map((notif) => {
                  const Icon = notif.icon;
                  return (
                    <div key={notif.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-4 cursor-default">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${notif.bg} ${notif.color}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-xs font-bold text-slate-900 leading-tight">{notif.title}</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">{notif.time}</p>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">{notif.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
      
    </div>
  );
}