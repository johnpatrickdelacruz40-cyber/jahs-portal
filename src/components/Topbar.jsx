import React from 'react';
import { Menu, Bell } from 'lucide-react';

export default function Topbar({ onMenuClick, isAdmin }) {
  return (
    <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm z-20 relative">
      
      {/* Mobile Menu Button */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick} 
          className="md:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Middle Spacing (Search Bar Removed) */}
      <div className="flex-1"></div>

      {/* Right Side (Profile Badge Removed, Bell Kept for aesthetics) */}
      <div className="flex items-center gap-6">
        <button className="relative p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
          <Bell size={22} />
          {/* Notification Dot */}
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>
      </div>
      
    </div>
  );
}