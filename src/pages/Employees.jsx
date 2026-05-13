import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, Plus, Edit2, Trash2, X, Camera, ChevronDown, ChevronUp, Calendar as CalIcon, User } from 'lucide-react';

export default function Employees({ employees, refreshData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({ name: '', photo: null });

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, photo: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const openModal = (emp = null) => {
    if (emp) { setFormData({ name: emp.name, photo: emp.photo }); setEditingId(emp.id); }
    else { setFormData({ name: '', photo: null }); setEditingId(null); }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = editingId 
      ? await supabase.from('employees').update(formData).eq('id', editingId)
      : await supabase.from('employees').insert([formData]);
    
    if (error) alert("Database Error: " + error.message);
    else { refreshData(); setIsModalOpen(false); }
  };

  const AttendanceUndertab = ({ emp }) => (
    <div className="bg-slate-50 p-10 border-t border-slate-100 flex flex-col lg:flex-row gap-10 animate-in slide-in-from-top-2">
      <div className="flex-1">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center">
          <CalIcon size={14} className="mr-2 text-indigo-500" /> Monthly Record: May 2026
        </h4>
        <div className="grid grid-cols-7 gap-3 max-w-sm">
          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
            <div key={day} className={`h-10 w-10 flex items-center justify-center rounded-2xl text-[10px] font-black 
              ${[2, 5, 8, 12, 15, 19, 22].includes(day) ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-white border border-slate-200 text-slate-300'}`}>
              {day}
            </div>
          ))}
        </div>
      </div>
      <div className="lg:w-64 space-y-4">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-100">
          <p className="text-[10px] font-black uppercase opacity-50 tracking-widest">Present</p>
          <h5 className="text-5xl font-black mt-2">7</h5>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Personnel</h1>
        <button onClick={() => openModal()} className="px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs tracking-widest uppercase shadow-2xl shadow-slate-200">
          <Plus size={18} className="mr-2 inline" /> New Entry
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50/50 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Search name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="text-[10px] font-black uppercase text-slate-300 border-b border-slate-50 tracking-widest">
            <tr><th className="px-12 py-6">JAHS Personnel Name</th><th className="px-12 py-6 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())).map((emp) => (
              <React.Fragment key={emp.id}>
                <tr className={`hover:bg-slate-50/50 cursor-pointer ${expandedId === emp.id ? 'bg-indigo-50/40' : ''}`} onClick={() => setExpandedId(expandedId === emp.id ? null : emp.id)}>
                  <td className="px-12 py-6">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl border-2 border-slate-50 overflow-hidden shadow-sm flex items-center justify-center p-1 bg-white">
                        {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover rounded-xl" /> : <User className="text-slate-100" size={32} />}
                      </div>
                      <p className="font-black text-slate-900 text-xl tracking-tight">{emp.name}</p>
                    </div>
                  </td>
                  <td className="px-12 py-6 text-right space-x-3" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openModal(emp)} className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"><Edit2 size={16} /></button>
                    <button onClick={async () => { if(window.confirm(`Delete ${emp.name}?`)) { await supabase.from('employees').delete().eq('id', emp.id); refreshData(); } }} className="p-3 text-slate-300 hover:text-rose-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"><Trash2 size={16} /></button>
                  </td>
                </tr>
                {expandedId === emp.id && (<tr><td colSpan="2" className="p-0 border-none"><AttendanceUndertab emp={emp} /></td></tr>)}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Personnel Profile</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-300"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="flex justify-center">
                <div onClick={() => fileInputRef.current.click()} className="w-40 h-40 rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:bg-slate-100 transition-all shadow-inner">
                  {formData.photo ? <img src={formData.photo} className="w-full h-full object-cover" /> : <><Camera size={32} className="text-slate-200"/><span className="text-[10px] text-slate-400 font-black mt-3 tracking-widest uppercase">Upload Photo</span></>}
                </div>
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoUpload} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">Full Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] outline-none font-bold text-slate-800 text-lg shadow-inner" placeholder="Enter Full Name" />
              </div>
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-2xl shadow-indigo-100 uppercase tracking-widest text-xs">{editingId ? 'Update Record' : 'Save Personnel'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}