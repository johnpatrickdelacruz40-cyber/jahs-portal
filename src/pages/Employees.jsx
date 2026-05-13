import { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, Plus, Edit2, Trash2, X, Camera } from 'lucide-react';

export default function Employees({ employees, refreshData, logHistory }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    idNo: '', firstName: '', middleName: '', lastName: '', address: '', 
    sec: '', expiration: '', remarks: '', status: 'Active', 
    nbi2026: '', nbiExpire: '', requested: '', target: '', photo: null
  });

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, photo: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const openModal = (emp = null) => {
    if (emp) { setFormData(emp); setEditingId(emp.id); }
    else {
      setFormData({ idNo: '', firstName: '', middleName: '', lastName: '', address: '', sec: '', expiration: '', remarks: '', status: 'Active', nbi2026: '', nbiExpire: '', requested: '', target: '', photo: null });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingId) {
      const { error } = await supabase.from('employees').update(formData).eq('id', editingId);
      if (!error) logHistory(`Updated record: ${formData.lastName}`);
    } else {
      const { error } = await supabase.from('employees').insert([formData]);
      if (!error) logHistory(`Created record: ${formData.lastName}`);
    }

    refreshData();
    setIsModalOpen(false);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete ${name} permanently?`)) {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (!error) {
        logHistory(`Deleted record: ${name}`);
        refreshData();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Personnel Registry</h1>
        <button onClick={() => openModal()} className="flex items-center px-5 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm">
          <Plus size={18} className="mr-2" /> New Entry
        </button>
      </div>

      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Search Last Name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm outline-none" />
          </div>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
            <tr>
              <th className="px-6 py-4">Photo</th>
              <th className="px-6 py-4">ID / SEC</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.filter(e => e.lastName.toLowerCase().includes(searchTerm.toLowerCase())).map((emp) => (
              <tr key={emp.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-3">
                  <div className="w-10 h-10 rounded bg-slate-100 border flex items-center justify-center overflow-hidden">
                    {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover" /> : <Camera size={14} className="text-slate-300" />}
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-xs">{emp.idNo}<br/>{emp.sec}</td>
                <td className="px-6 py-4 font-bold">{emp.lastName}, {emp.firstName}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${emp.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{emp.status}</span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openModal(emp)} className="text-slate-400 hover:text-indigo-600"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(emp.id, emp.lastName)} className="text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold">{editingId ? 'Edit Record' : 'New Record'}</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 flex justify-center mb-4">
                <div onClick={() => fileInputRef.current.click()} className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden bg-slate-50">
                  {formData.photo ? <img src={formData.photo} className="w-full h-full object-cover" /> : <Camera size={24} className="text-slate-300"/>}
                </div>
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoUpload} />
              </div>
              {Object.keys(formData).map((key) => key !== 'photo' && key !== 'id' && (
                <div key={key} className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">{key}</label>
                  <input type="text" value={formData[key]} onChange={(e) => setFormData({...formData, [key]: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-lg outline-none" />
                </div>
              ))}
              <div className="md:col-span-2 pt-6 flex justify-end gap-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-xs font-bold text-slate-400">Cancel</button>
                <button type="submit" className="px-10 py-2 bg-indigo-600 text-white rounded-xl font-bold">Save to Database</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}