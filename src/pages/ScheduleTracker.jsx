import { useState, useEffect } from 'react';
import { Calendar, Clock, Bell, Mail, Plus, Trash2, CheckCircle } from 'lucide-react';

export default function ScheduleTracker({ logHistory }) {
  const [schedules, setSchedules] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    notifyWeb: true,
    notifyEmail: false
  });

  // Request browser notification permission on load
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  const handleAddSchedule = (e) => {
    e.preventDefault();
    const newSched = { ...formData, id: Date.now() };
    setSchedules([...schedules, newSched]);
    logHistory(`Scheduled: ${formData.title} for ${formData.date}`);
    
    // Logic for Web Notification
    if (formData.notifyWeb && Notification.permission === "granted") {
      new Notification("Schedule Set", {
        body: `You will be notified for: ${formData.title}`,
        icon: "/vite.svg" 
      });
    }

    setIsModalOpen(false);
    setFormData({ title: '', date: '', time: '', notifyWeb: true, notifyEmail: false });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Schedule Tracker</h1>
          <p className="text-sm text-slate-500">Manage site survey appointments and reminders.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100"
        >
          <Plus size={18} className="mr-2" /> Set Schedule
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schedules.length > 0 ? schedules.map((sched) => (
          <div key={sched.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Calendar size={20} />
              </div>
              <button 
                onClick={() => setSchedules(schedules.filter(s => s.id !== sched.id))}
                className="text-slate-300 hover:text-rose-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-1">{sched.title}</h3>
            <div className="space-y-2 text-sm text-slate-500">
              <p className="flex items-center"><Calendar size={14} className="mr-2" /> {sched.date}</p>
              {sched.time && <p className="flex items-center"><Clock size={14} className="mr-2" /> {sched.time}</p>}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3">
              {sched.notifyWeb && <span className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase"><Bell size={10} className="mr-1" /> Web</span>}
              {sched.notifyEmail && <span className="flex items-center text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase"><Mail size={10} className="mr-1" /> Gmail</span>}
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <Calendar className="mx-auto text-slate-200 mb-2" size={48} />
            <p className="text-slate-400 italic">No upcoming schedules set.</p>
          </div>
        )}
      </div>

      {/* SCHEDULE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold">New Schedule</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddSchedule} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Schedule Name</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="e.g. TSSR Survey - Malolos" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Date</label>
                  <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-lg outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Time (Optional)</label>
                  <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-lg outline-none" />
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notification Channels</p>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={formData.notifyWeb} onChange={e => setFormData({...formData, notifyWeb: e.target.checked})} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Browser Web Notification</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={formData.notifyEmail} onChange={e => setFormData({...formData, notifyEmail: e.target.checked})} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Gmail Alert (requires EmailJS)</span>
                </label>
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold mt-4 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                Confirm Schedule
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const X = ({size}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;