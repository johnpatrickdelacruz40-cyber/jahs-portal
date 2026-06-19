import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FileSpreadsheet, Save, Download, Plus, Trash2, FolderOpen, Loader2 } from 'lucide-react';

// Generates an empty 20x10 grid
const createEmptyGrid = (rows = 20, cols = 10) => {
  return Array(rows).fill().map(() => Array(cols).fill(''));
};

// Generates Excel-style column letters (A, B, C, etc.)
const getColumnLetter = (colIndex) => {
  return String.fromCharCode(65 + colIndex);
};

export default function Spreadsheet() {
  const [savedFiles, setSavedFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [fileName, setFileName] = useState('Untitled Spreadsheet');
  const [gridData, setGridData] = useState(createEmptyGrid());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Load sidebar files on startup
  const fetchFiles = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('spreadsheets')
      .select('id, name, created_at')
      .order('created_at', { ascending: false });
    
    if (!error && data) setSavedFiles(data);
    setIsLoading(false);
  };

  useEffect(() => { fetchFiles(); }, []);

  // 2. Handle Cell Typing
  const handleCellChange = (rowIndex, colIndex, value) => {
    const newGrid = [...gridData];
    newGrid[rowIndex][colIndex] = value;
    setGridData(newGrid);
  };

  // 3. Save to Supabase
  const handleSave = async () => {
    setIsSaving(true);
    const payload = { name: fileName, data: gridData };

    if (activeFileId) {
      // Update existing
      await supabase.from('spreadsheets').update(payload).eq('id', activeFileId);
    } else {
      // Create new
      const { data } = await supabase.from('spreadsheets').insert([payload]).select().single();
      if (data) setActiveFileId(data.id);
    }
    
    await fetchFiles();
    setIsSaving(false);
  };

  // 4. Open a file from Sidebar
  const handleOpenFile = async (id) => {
    const { data, error } = await supabase.from('spreadsheets').select('*').eq('id', id).single();
    if (!error && data) {
      setActiveFileId(data.id);
      setFileName(data.name);
      setGridData(data.data);
    }
  };

  // 5. Create New File
  const handleNewFile = () => {
    setActiveFileId(null);
    setFileName('New Spreadsheet');
    setGridData(createEmptyGrid());
  };

  // 6. Delete File
  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Prevent opening the file when clicking delete
    if (window.confirm("Delete this spreadsheet permanently?")) {
      await supabase.from('spreadsheets').delete().eq('id', id);
      if (activeFileId === id) handleNewFile();
      fetchFiles();
    }
  };

  // 7. Export to standard Excel-compatible CSV
  const handleDownloadCSV = () => {
    let csvContent = "";
    gridData.forEach(row => {
      // Wrap in quotes to handle commas inside text
      const rowString = row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",");
      csvContent += rowString + "\r\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-[85vh] gap-6 animate-in fade-in duration-700">
      
      {/* SIDEBAR: File Manager */}
      <div className="w-72 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 flex flex-col h-full overflow-hidden shrink-0">
        <button onClick={handleNewFile} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-md mb-6">
          <Plus size={16} /> New Sheet
        </button>

        <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase flex items-center gap-2 mb-4">
          <FolderOpen size={14} /> Saved Files
        </h3>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {isLoading ? (
            <p className="text-xs font-bold text-slate-400 text-center py-4">Loading...</p>
          ) : savedFiles.length === 0 ? (
            <p className="text-[10px] font-bold text-slate-400 text-center bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">No saved files.</p>
          ) : (
            savedFiles.map(file => (
              <div 
                key={file.id} 
                onClick={() => handleOpenFile(file.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all group flex justify-between items-center ${activeFileId === file.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-slate-50 border-transparent hover:bg-slate-100 hover:border-slate-200'}`}
              >
                <div className="overflow-hidden">
                  <p className={`font-bold text-sm truncate ${activeFileId === file.id ? 'text-indigo-700' : 'text-slate-700'}`}>{file.name}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                    {new Date(file.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button onClick={(e) => handleDelete(file.id, e)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-white rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MAIN WORKSPACE: Spreadsheet Grid */}
      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shadow-sm"><FileSpreadsheet size={24} /></div>
            <input 
              type="text" 
              value={fileName} 
              onChange={(e) => setFileName(e.target.value)}
              className="text-2xl font-black text-slate-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-indigo-500/20 rounded-lg px-2 w-full max-w-md placeholder-slate-300 transition-all"
              placeholder="Name your spreadsheet..."
            />
          </div>
          <div className="flex gap-3">
            <button onClick={handleDownloadCSV} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-sm">
              <Download size={16} /> Download
            </button>
            <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md disabled:opacity-70">
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Save to Cloud</>}
            </button>
          </div>
        </div>

        {/* Excel Grid Container */}
        <div className="flex-1 overflow-auto bg-slate-100 p-4">
          <div className="bg-white inline-block border border-slate-300 shadow-lg">
            <table className="border-collapse whitespace-nowrap">
              
              {/* Header Row (A, B, C...) */}
              <thead>
                <tr>
                  <th className="w-12 h-8 bg-slate-100 border border-slate-300 sticky top-0 left-0 z-20"></th>
                  {gridData[0].map((_, colIndex) => (
                    <th key={`head-${colIndex}`} className="min-w-[120px] bg-slate-100 border border-slate-300 text-[10px] font-black text-slate-500 uppercase tracking-widest sticky top-0 z-10 shadow-sm">
                      {getColumnLetter(colIndex)}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Data Rows (1, 2, 3...) */}
              <tbody>
                {gridData.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}`}>
                    <td className="bg-slate-100 border border-slate-300 text-center text-[10px] font-black text-slate-500 sticky left-0 z-10 shadow-sm select-none">
                      {rowIndex + 1}
                    </td>
                    {row.map((cell, colIndex) => (
                      <td key={`cell-${rowIndex}-${colIndex}`} className="border border-slate-200 p-0 relative">
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                          className="w-full h-full min-h-[28px] px-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-indigo-50/30 transition-colors bg-transparent absolute inset-0"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}