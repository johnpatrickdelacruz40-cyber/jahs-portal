import { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, Plus, Edit2, Trash2, X, Camera, ChevronDown, ChevronUp, Calendar as CalIcon } from 'lucide-react';

export default function Employees({ employees, refreshData, logHistory }) {
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
    
    if (!error) {
      logHistory(`${editingId ? 'Modified' : 'Added'} personnel: ${formData.name}`);
      refreshData();
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Personnel Registry</h1>
        <button onClick={() => openModal()} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Plus size={18} className="mr-2 inline" /> New Personnel
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search personnel..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" 
            />
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-50">
            <tr>
              <th className="px-10 py-5">JAHS Employee</th>
              <th className="px-10 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())).map((emp) => (
              <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-10 py-5">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-100 overflow-hidden shadow-sm flex items-center justify-center p-0.5">
                      {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover rounded-xl" /> : <Camera size={20} className="text-slate-200" />}
                    </div>
                    <p className="font-black text-slate-900 text-lg leading-tight">{emp.name}</p>
                  </div>
                </td>
                <td className="px-10 py-5 text-right space-x-2">
                  <button onClick={() => openModal(emp)} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100"><Edit2 size={16} /></button>
                  <button onClick={() => { if(window.confirm(`Delete ${emp.name}?`)) supabase.from('employees').delete().eq('id', emp.id).then(refreshData); }} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter">{editingId ? 'Modify Entry' : 'New Personnel'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-all"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="flex justify-center">
                <div onClick={() => fileInputRef.current.click()} className="w-40 h-40 rounded-[2.5rem] border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:bg-slate-100 transition-all group relative shadow-inner">
                  {formData.photo ? <img src={formData.photo} className="w-full h-full object-cover" /> : <><Camera size={32} className="text-slate-300"/><span className="text-[10px] text-slate-400 font-black mt-3 tracking-widest">UPLOAD 2X2</span></>}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-black uppercase tracking-[0.2em]">Change Photo</div>
                </div>
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoUpload} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Personnel Full Name</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] outline-none font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/5 transition-all" 
                  placeholder="Last Name, First Name M." 
                />
              </div>
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:translate-y-[-2px] active:translate-y-[0] transition-all uppercase tracking-widest text-xs">
                {editingId ? 'Update Record' : 'Save Personnel'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}