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

  // --- DOCUMENT UPLOAD STATE ---
  const [selectedDocs, setSelectedDocs] = useState({});
  const [existingDocs, setExistingDocs] = useState({});
  
  const DOCUMENT_TYPES = [
    { key: 'jahs_id_url', label: 'JAHS ID' },
    { key: 'govt_id_url', label: 'GOVT ID' },
    { key: 'wah_url', label: 'WAH' },
    { key: 'so2_url', label: 'SO2' },
    { key: 'ncii_url', label: 'NCII' },
    { key: 'nbi_url', label: 'NBI' },
    { key: 'signature_url', label: 'SIGN' }
  ];

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
      setExistingDocs({
        jahs_id_url: emp.jahs_id_url,
        govt_id_url: emp.govt_id_url, wah_url: emp.wah_url, 
        so2_url: emp.so2_url, ncii_url: emp.ncii_url, 
        nbi_url: emp.nbi_url, signature_url: emp.signature_url
      });
    } else { 
      setFormData({ idNo: '', name: '', photo: null }); 
      setEditingId(null); 
      setExistingDocs({});
    }
    setSelectedDocs({}); 
    setIsModalOpen(true);
  };

  // --- HELPER TO UPLOAD FILES TO SUPABASE ---
  const uploadDocument = async (file, employeeName, docType) => {
    if (!file) return null;
    const cleanName = employeeName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileExt = file.name.split('.').pop();
    const filePath = `${cleanName}/${docType}_${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage.from('employee-documents').upload(filePath, file);
    if (error) { console.error(`Error uploading ${docType}:`, error); return null; }
    
    const { data: publicUrlData } = supabase.storage.from('employee-documents').getPublicUrl(filePath);
    return publicUrlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; 
    setIsSubmitting(true);

    // --- PROCESS DOCUMENT UPLOADS AND DELETIONS ---
    let documentUpdates = {};
    
    for (const doc of DOCUMENT_TYPES) {
      if (selectedDocs[doc.key]) {
        // 1. If a NEW file is selected, upload it and get the URL
        const url = await uploadDocument(selectedDocs[doc.key], formData.name, doc.label);
        documentUpdates[doc.key] = url;
      } else if (!existingDocs[doc.key]) {
        // 2. If no new file is selected AND there is no existing file, explicitly nullify it.
        // This is the trick! If you clicked the "X", it removes it from existingDocs,
        // so this triggers and wipes the database column, making it instantly disappear in profiles!
        documentUpdates[doc.key] = null;
      }
    }

    const payload = {
      idNo: formData.idNo,
      name: formData.name,
      photo: formData.photo,
      ...documentUpdates 
    };

    try {
      const { error } = editingId 
        ? await supabase.from('employees').update(payload).eq('id', editingId)
        : await supabase.from('employees').insert([payload]);
      
      if (error) throw error;

      if (typeof logHistory === 'function') {
        logHistory(`${editingId ? 'Updated' : 'Added'} personnel: ${formData.name}`);
      }

      setIsModalOpen(false); 
      await refreshData(); // This instantly pulls the new data for the Personnel Hub
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

  // --- NEW LOGIC: HANDLE REMOVING A DOCUMENT BEFORE SAVING ---
  const handleRemoveDocument = (docKey) => {
    // Remove from newly selected files
    const newSelected = { ...selectedDocs };
    delete newSelected[docKey];
    setSelectedDocs(newSelected);
    
    // Remove from existing database records 
    const newExisting = { ...existingDocs };
    delete newExisting[docKey];
    setExistingDocs(newExisting);
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
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-md max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Personnel Data</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-200 rounded-full text-slate-400"><X size={20} /></button>
            </div>
            
            <div className="overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                
                <div className="flex justify-center">
                  <div onClick={() => !isSubmitting && fileInputRef.current.click()} className={`w-36 h-36 rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden transition-all group relative ${isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    {formData.photo ? <img src={formData.photo} className="w-full h-full object-cover" /> : <><Camera size={32} className="text-slate-200"/><span className="text-[10px] text-slate-400 font-black mt-3 tracking-widest uppercase">Set Photo</span></>}
                  </div>
                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoUpload} disabled={isSubmitting} />
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">ID Number (Manual)</label>
                    <input required disabled={isSubmitting} type="text" value={formData.idNo} onChange={e => setFormData({...formData, idNo: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] outline-none font-bold text-slate-800 text-sm shadow-inner" placeholder="e.g. JAHS-001" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Personnel Full Name</label>
                    <input required disabled={isSubmitting} type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] outline-none font-bold text-slate-800 text-sm shadow-inner" placeholder="Last Name, First Name" />
                  </div>
                </div>

                {/* --- DOCUMENT UPLOAD GRID --- */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Upload Documents (PDF / Image)</label>
                  <div className="grid grid-cols-3 gap-3">
                    {DOCUMENT_TYPES.map((doc) => {
                      const hasNew = !!selectedDocs[doc.key];
                      const hasExisting = !!existingDocs[doc.key];
                      const hasDoc = hasNew || hasExisting;
                      
                      return (
                        <div key={doc.key} className="relative group">
                          
                          {/* File Input (Only active if no document exists) */}
                          {!hasDoc && (
                            <input 
                              type="file" 
                              accept="image/*,.pdf"
                              onChange={(e) => setSelectedDocs({...selectedDocs, [doc.key]: e.target.files[0]})}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                              disabled={isSubmitting || !formData.name}
                              title={`Upload ${doc.label}`}
                            />
                          )}

                          <div className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all 
                            ${hasNew ? 'border-emerald-400 bg-emerald-50 text-emerald-600' : (hasExisting ? 'border-indigo-400 bg-indigo-50 text-indigo-600' : 'border-dashed border-slate-200 bg-slate-50 text-slate-400 hover:border-indigo-300')}`}>
                            <span className="font-black text-[10px] tracking-widest uppercase leading-none">{doc.label}</span>
                            <span className="text-[8px] mt-1.5 truncate w-full text-center font-bold">
                              {hasNew ? 'Selected' : (hasExisting ? 'Saved ✅' : 'Upload')}
                            </span>
                          </div>

                          {/* --- NEW: REMOVE (X) BUTTON --- */}
                          {hasDoc && (
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => handleRemoveDocument(doc.key)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 hover:scale-110 active:scale-95 transition-all z-20 disabled:opacity-50"
                              title={`Remove ${doc.label}`}
                            >
                              <X size={12} strokeWidth={4} />
                            </button>
                          )}
                          
                        </div>
                      );
                    })}
                  </div>
                  {!formData.name && <p className="text-[9px] text-rose-500 text-center uppercase tracking-widest font-bold mt-2">Enter Name to enable document upload</p>}
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs flex items-center justify-center mt-6">
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" size={16} /> : (editingId ? 'Update & Save' : 'Add Personnel')}
                </button>
              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}