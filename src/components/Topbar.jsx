import { Menu, Search, Bell } from 'lucide-react';

export default function Topbar({ onMenuClick }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 z-10 relative shrink-0">
      <div className="flex items-center flex-1">
        <button 
          onClick={onMenuClick}
          className="text-slate-400 hover:text-slate-600 focus:outline-none mr-4 transition-colors md:hidden"
        >
          <Menu size={24} />
        </button>

        <div className="hidden md:flex items-center bg-slate-100 rounded-md px-3 py-2 w-96 border border-transparent focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
          <Search size={18} className="text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search global records..." 
            className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="text-slate-400 hover:text-indigo-600 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        <div className="h-8 w-px bg-slate-200 mx-2"></div>

        <div className="flex items-center cursor-pointer group">
          <img 
            src="https://ui-avatars.com/api/?name=John+Patrick&background=4F46E5&color=fff&bold=true" 
            alt="Profile" 
            className="h-9 w-9 rounded-full ring-2 ring-transparent group-hover:ring-indigo-100 transition-all"
          />
          <div className="hidden md:block ml-3">
            <p className="text-sm font-semibold text-slate-700 leading-tight">JAHS</p>
            <p className="text-xs text-slate-500">System Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}