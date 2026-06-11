import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Megaphone, Trash2, Send, Loader2, Clock } from 'lucide-react';

export default function Announcements({ logHistory }) {
  const [announcements, setAnnouncements] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ subject: '', message: '' });

  const fetchAnnouncements = async () => {
    // 1. Calculate exactly 24 hours ago
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // 2. HOUSEKEEPING: Permanently delete anything older than 24 hours
    await supabase.from('announcements').delete().lt('created_at', yesterday);

    // 3. Fetch the remaining active announcements
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (data) setAnnouncements(data);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase.from('announcements').insert([formData]);
    
    if (!error) {
      setFormData({ subject: '', message: '' });
      if (typeof logHistory === 'function') logHistory(`Posted announcement: ${formData.subject}`);
      fetchAnnouncements();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id, subject) => {
    if (window.confirm('Delete this announcement early?')) {
      await supabase.from('announcements').delete().eq('id', id);
      fetchAnnouncements();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Company Announcements</h1>
        <p className="text-sm font-bold text-slate-400 mt-1 flex items-center gap-1.5">
          <Clock size={14} className="text-indigo-500" /> Posts automatically disappear after 24 hours
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- FORM SECTION --- */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Megaphone size={20} /></div>
              <h2 className="text-xl font-black text-slate-800">New Post</h2>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Subject</label>
              <input required type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] outline-none font-bold text-slate-800 text-sm focus:ring-4 ring-indigo-500/10" placeholder="e.g. Holiday Schedule" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Message</label>
              <textarea required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] outline-none font-bold text-slate-800 text-sm h-40 resize-none focus:ring-4 ring-indigo-500/10" placeholder="Type announcement here..." />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <><Send size={16} /> Publish Post</>}
            </button>
          </form>
        </div>

        {/* --- FEED SECTION --- */}
        <div className="lg:col-span-2 space-y-4">
          {announcements.length === 0 && <p className="text-slate-400 font-bold p-8 text-center bg-white rounded-[2.5rem] border border-slate-200">No active announcements.</p>}
          {announcements.map((ann) => (
            <div key={ann.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group">
              <button onClick={() => handleDelete(ann.id, ann.subject)} className="absolute top-6 right-6 p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">{new Date(ann.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
              <h3 className="text-xl font-black text-slate-900 mb-3 pr-12">{ann.subject}</h3>
              <p className="text-sm font-semibold text-slate-500 whitespace-pre-wrap leading-relaxed">{ann.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}