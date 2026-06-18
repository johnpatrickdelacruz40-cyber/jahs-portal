import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Megaphone, Trash2, Send, Loader2, Calendar } from 'lucide-react';

export default function Announcements({ logHistory }) {
  const [announcements, setAnnouncements] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ subject: '', message: '', event_date: '' });

  const fetchAnnouncements = async () => {
    // We now fetch all announcements and order them by the upcoming event date
    const { data } = await supabase.from('announcements').select('*').order('event_date', { ascending: true });
    if (data) setAnnouncements(data);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = {
      subject: formData.subject,
      message: formData.message,
      event_date: formData.event_date // Adding the new calendar date to the DB
    };

    const { error } = await supabase.from('announcements').insert([payload]);
    
    if (!error) {
      setFormData({ subject: '', message: '', event_date: '' });
      if (typeof logHistory === 'function') logHistory(`Posted calendar event: ${formData.subject}`);
      fetchAnnouncements();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id, subject) => {
    if (window.confirm('Remove this event from the calendar?')) {
      await supabase.from('announcements').delete().eq('id', id);
      fetchAnnouncements();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Event Calendar Setup</h1>
        <p className="text-sm font-bold text-slate-400 mt-1 flex items-center gap-1.5">
          <Calendar size={14} className="text-indigo-500" /> Posts will highlight on the Dashboard Calendar
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- FORM SECTION --- */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Megaphone size={20} /></div>
              <h2 className="text-xl font-black text-slate-800">New Event</h2>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Event Subject</label>
              <input required type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] outline-none font-bold text-slate-800 text-sm focus:ring-4 ring-indigo-500/10" placeholder="e.g. Company Holiday" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Calendar Date</label>
              <input required type="date" value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] outline-none font-bold text-slate-800 text-sm focus:ring-4 ring-indigo-500/10 text-slate-500" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Event Details</label>
              <textarea required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] outline-none font-bold text-slate-800 text-sm h-32 resize-none focus:ring-4 ring-indigo-500/10" placeholder="Type event details here..." />
            </div>
            
            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <><Send size={16} /> Add to Calendar</>}
            </button>
          </form>
        </div>

        {/* --- FEED SECTION --- */}
        <div className="lg:col-span-2 space-y-4">
          {announcements.length === 0 && <p className="text-slate-400 font-bold p-8 text-center bg-white rounded-[2.5rem] border border-slate-200">No scheduled events.</p>}
          {announcements.map((ann) => (
            <div key={ann.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group flex flex-col md:flex-row gap-6 items-start">
              <button onClick={() => handleDelete(ann.id, ann.subject)} className="absolute top-6 right-6 p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
              
              <div className="flex flex-col items-center justify-center bg-indigo-50 text-indigo-600 rounded-2xl p-4 min-w-[80px] shrink-0 border border-indigo-100">
                <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                  {new Date(ann.event_date).toLocaleString('default', { month: 'short' })}
                </span>
                <span className="text-2xl font-black leading-none">
                  {new Date(ann.event_date).getDate()}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 mb-2 pr-12">{ann.subject}</h3>
                <p className="text-sm font-semibold text-slate-500 whitespace-pre-wrap leading-relaxed">{ann.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}