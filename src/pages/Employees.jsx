import { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, Plus, Edit2, Trash2, X, Camera, ChevronDown, ChevronUp, Calendar as CalIcon } from 'lucide-react';

export default function Employees({ employees, refreshData, logHistory }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null); // Track which row is expanded
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({ idNo: '', name: '', photo: null });

  // --- CRUD Logic ---
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, photo: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const openModal = (emp = null) => {
    if (emp) { setFormData({ idNo: emp.idNo, name: emp.name, photo: emp.photo }); setEditingId(emp.id); }
    else { setFormData({ idNo: '', name: '', photo: null }); setEditingId(null); }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      const { error } = await supabase.from('employees').update(formData).eq('id', editingId);
      if (!error) logHistory(`Modified personnel: ${formData.name}`);
    } else {
      const { error } = await supabase.from('employees').insert([formData]);
      if (!error) logHistory(`Added new personnel: ${formData.name}`);
    }
    refreshData();
    setIsModalOpen(false);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete ${name} permanently?`)) {
      await supabase.from('employees').delete().eq('id', id);
      logHistory(`Removed personnel: ${name}`);
      refreshData();
    }
  };

  // --- Sub-Component: Attendance Calendar Undertab ---
  const AttendanceUndertab = ({ empName }) => {
    // For production, you would fetch real logs here. This is a visual template.
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const presentDays = [2, 5, 8, 12, 15, 19, 22, 26]; // Mock data
    
    return (
      <div className="bg-slate-50 p-6 border-t border-slate-100 flex flex-col lg:flex-row gap-8 animate-in slide-in-from-top-2">
        {/* Calendar Grid */}
        <div className="flex-1">
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center">
            <CalIcon size={14} className="mr-2" /> Attendance Tracker - May 2026
          </h4>
          <div className="grid grid-cols-7 gap-2 max-w-sm">
            {days.map(day => (
              <div key={day} className={`h-8 w-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all
                ${presentDays.includes(day) ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200' : 'bg-white border border-slate-200 text-slate-400'}`}>
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="lg:w-48 flex flex-col justify-center gap-4">
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase">Monthly Present</p>
            <p className="text-2xl font-black text-emerald-600">{presentDays.length} Days</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase">Monthly Absent</p>
            <p className="text-2xl font-black text-rose-600">{31 - presentDays.length} Days</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Personnel List</h1>
        <button onClick={() => openModal()} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all">
          <Plus size={18} className="mr-2 inline" /> New Entry
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/10" />
          </div>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
            <tr>
              <th className="px-8 py-4">Employee Information</th>
              <th className="px-8 py-4">ID Number</th>
              <th className="px-8 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())).map((emp) => (
              <React.Fragment key={emp.id}>
                <tr className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${expandedId === emp.id ? 'bg-indigo-50/30' : ''}`} onClick={() => setExpandedId(expandedId === emp.id ? null : emp.id)}>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shadow-inner flex items-center justify-center">
                        {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover" /> : <Camera size={16} className="text-slate-300" />}
                      </div>
                      <div>
                        <p className="font-black text-slate-900">{emp.name}</p>
                        <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest flex items-center gap-1">
                          {expandedId === emp.id ? <><ChevronUp size={12}/> Hide Record</> : <><ChevronDown size={12}/> View Record</>}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 font-mono text-xs font-bold text-slate-500">{emp.idNo}</td>
                  <td className="px-8 py-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openModal(emp)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-100"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(emp.id, emp.name)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-100"><Trash2 size={14} /></button>
                  </td>
                </tr>
                
                {/* Expandable Undertab */}
                {expandedId === emp.id && (
                  <tr>
                    <td colSpan="3" className="p-0">
                      <AttendanceUndertab empName={emp.name} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Simplified Admin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-900">{editingId ? 'Modify Entry' : 'New Personnel'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="flex justify-center">
                <div onClick={() => fileInputRef.current.click()} className="w-32 h-32 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:bg-slate-100 transition-all group relative">
                  {formData.photo ? <img src={formData.photo} className="w-full h-full object-cover" /> : <><Camera size={24} className="text-slate-300"/><span className="text-[10px] text-slate-400 font-bold mt-2">UPLOAD PHOTO</span></>}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold uppercase tracking-widest">Change</div>
                </div>
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoUpload} />
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identification Number</label>
                  <input required type="text" value={formData.idNo} onChange={e => setFormData({...formData, idNo: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" placeholder="e.g. EMP-2026-001" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personnel Full Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" placeholder="Enter full name" />
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all">
                {editingId ? 'Update Record' : 'Save Personnel'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}