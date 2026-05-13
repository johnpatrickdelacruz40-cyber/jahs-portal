import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, Plus, Edit2, Trash2, X, Camera, User, Loader2 } from 'lucide-react';

export default function Employees({ employees, refreshData, logHistory }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({ idNo: '', name: '', photo: null });

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, photo: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const openModal = (emp = null) => {
    if (emp) { 
      setFormData({ idNo: emp.idNo || '', name: emp.name, photo: emp.photo }); 
      setEditingId(emp.id); 
    } else { 
      setFormData({ idNo: '', name: '', photo: null }); 
      setEditingId(null); 
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double-clicks
    setIsSubmitting(true);

    const payload = {
      idNo: formData.idNo,
      name: formData.name,
      photo: formData.photo
    };

    try {
      const { error } = editingId 
        ? await supabase.from('employees').update(payload).eq('id', editingId)
        : await supabase.from('employees').insert([payload]);
      
      if (error) throw error;

      // Safety check for logHistory prop
      if (typeof logHistory === 'function') {
        logHistory(`${editingId ? 'Updated' : 'Added'} personnel: ${formData.name}`);
      }

      setIsModalOpen(false); // Close immediately
      await refreshData();
    } catch (error) {
      alert("Database Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete ${name} permanently?`)) {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (!error) {
        if (typeof logHistory === 'function') logHistory(`Deleted personnel: ${name}`);
        refreshData();
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Personnel Registry</h1>
          <p className="text-sm font-bold text-slate-400 mt-1">JAHS System Administration Dashboard</p>
        </div>
        <button onClick={() => openModal()} className="px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">
          <Plus size={18} className="mr-2 inline" /> New Entry
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input type="text" placeholder="Filter by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" />
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="text-[10px] font-black uppercase text-slate-300 border-b border-slate-50 tracking-widest">
            <tr>
              <th className="px-12 py-6">ID Number</th>
              <th className="px-12 py-6">Full Name</th>
              <th className="px-12 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())).map((emp) => (
              <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-12 py-6 font-mono font-bold text-indigo-600 bg-indigo-50/10">{emp.idNo}</td>
                <td className="px-12 py-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.5rem] border-2 border-slate-100 overflow-hidden bg-white p-1">
                      {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover rounded-xl" /> : <User className="text-slate-100 m-auto h-full" size={32} />}
                    </div>
                    <p className="font-black text-slate-900 text-xl tracking-tight">{emp.name}</p>
                  </div>
                </td>
                <td className="px-12 py-6 text-right space-x-3">
                  <button onClick={() => openModal(emp)} className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(emp.id, emp.name)} className="p-3 text-slate-300 hover:text-rose-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-12 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Personnel Data</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-200 rounded-full text-slate-300"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-12 space-y-8">
              <div className="flex justify-center">
                <div onClick={() => !isSubmitting && fileInputRef.current.click()} className={`w-44 h-44 rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden transition-all group relative ${isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  {formData.photo ? <img src={formData.photo} className="w-full h-full object-cover" /> : <><Camera size={36} className="text-slate-200"/><span className="text-[10px] text-slate-400 font-black mt-3 tracking-widest uppercase">Set Photo</span></>}
                </div>
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoUpload} disabled={isSubmitting} />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">ID Number (Manual)</label>
                  <input required disabled={isSubmitting} type="text" value={formData.idNo} onChange={e => setFormData({...formData, idNo: e.target.value})} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] outline-none font-bold text-slate-800 text-lg shadow-inner" placeholder="e.g. JAHS-001" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">Personnel Full Name</label>
                  <input required disabled={isSubmitting} type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] outline-none font-bold text-slate-800 text-lg shadow-inner" placeholder="Last Name, First Name" />
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black shadow-2xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs flex items-center justify-center">
                {isSubmitting ? <Loader2 className="animate-spin mr-2" size={16} /> : (editingId ? 'Update' : 'Add')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}