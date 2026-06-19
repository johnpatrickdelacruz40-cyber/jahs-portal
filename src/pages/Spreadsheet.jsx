import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  FileSpreadsheet, Save, Download, Plus, Trash2, 
  FolderOpen, Loader2, PanelLeftClose, PanelLeftOpen 
} from 'lucide-react';

// Generates an empty 40x26 grid (A-Z)
const createEmptyGrid = (rows = 40, cols = 26) => {
  return Array(rows).fill().map(() => Array(cols).fill(''));
};

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
  
  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

  const handleCellChange = (rowIndex, colIndex, value) => {
    const newGrid = [...gridData];
    newGrid[rowIndex][colIndex] = value;
    setGridData(newGrid);
  };

  // --- NEW: EXCEL KEYBOARD NAVIGATION LOGIC ---
  const handleKeyDown = (e, rowIndex, colIndex) => {
    let nextRow = rowIndex;
    let nextCol = colIndex;
    let shouldMove = false;

    if (e.key === 'ArrowUp') { 
      nextRow -= 1; 
      shouldMove = true; 
      e.preventDefault(); 
    }
    else if (e.key === 'ArrowDown' || e.key === 'Enter') { 
      if (e.shiftKey && e.key === 'Enter') nextRow -= 1; // Shift+Enter goes up
      else nextRow += 1; 
      shouldMove = true; 
      e.preventDefault(); 
    }
    else if (e.key === 'ArrowLeft') {
      // Only jump cell if cursor is at the very beginning of the text
      if (e.target.selectionStart === 0) { 
        nextCol -= 1; 
        shouldMove = true; 
        e.preventDefault(); 
      }
    }
    else if (e.key === 'ArrowRight') {
      // Only jump cell if cursor is at the very end of the text
      if (e.target.selectionStart === e.target.value.length) { 
        nextCol += 1; 
        shouldMove = true; 
        e.preventDefault(); 
      }
    }
    else if (e.key === 'Tab') {
      if (e.shiftKey) nextCol -= 1; // Shift+Tab goes left
      else nextCol += 1; 
      shouldMove = true; 
      e.preventDefault();
    }

    if (shouldMove) {
      // Keep inside grid bounds
      if (nextRow >= 0 && nextRow < gridData.length && nextCol >= 0 && nextCol < gridData[0].length) {
        const nextInput = document.getElementById(`cell-${nextRow}-${nextCol}`);
        if (nextInput) {
          nextInput.focus();
          // Optional: Highlight all text when jumping to a new cell (like real Excel)
          setTimeout(() => nextInput.select(), 0);
        }
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const payload = { name: fileName, data: gridData };

    if (activeFileId) {
      await supabase.from('spreadsheets').update(payload).eq('id', activeFileId);
    } else {
      const { data } = await supabase.from('spreadsheets').insert([payload]).select().single();
      if (data) setActiveFileId(data.id);
    }
    await fetchFiles();
    setIsSaving(false);
  };

  const handleOpenFile = async (id) => {
    const { data, error } = await supabase.from('spreadsheets').select('*').eq('id', id).single();
    if (!error && data) {
      setActiveFileId(data.id);
      setFileName(data.name);
      setGridData(data.data);
    }
  };

  const handleNewFile = () => {
    setActiveFileId(null);
    setFileName('New Spreadsheet');
    setGridData(createEmptyGrid());
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation(); 
    if (window.confirm("Delete this spreadsheet permanently?")) {
      await supabase.from('spreadsheets').delete().eq('id', id);
      if (activeFileId === id) handleNewFile();
      fetchFiles();
    }
  };

  const handleDownloadCSV = () => {
    let csvContent = "";
    gridData.forEach(row => {
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
    <div className="flex h-[85vh] overflow-hidden animate-in fade-in duration-700 relative">
      
      {/* SIDEBAR: File Manager (Collapsible) */}
      <div className={`bg-white rounded-l-[2.5rem] border-y border-l border-slate-200 shadow-sm flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out z-10 shrink-0 ${isSidebarOpen ? 'w-72 p-6' : 'w-0 p-0 opacity-0 border-none'}`}>
        <div className="min-w-[14rem]">
          <button onClick={handleNewFile} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-md mb-6">
            <Plus size={16} /> New Sheet
          </button>

          <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase flex items-center gap-2 mb-4">
            <FolderOpen size={14} /> Saved Files
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 max-h-[60vh]">
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
                  <button onClick={(e) => handleDelete(file.id, e)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-white rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MAIN WORKSPACE: Spreadsheet Grid */}
      <div className={`flex-1 bg-white border border-slate-200 shadow-sm flex flex-col transition-all duration-300 ${isSidebarOpen ? 'rounded-r-[2.5rem]' : 'rounded-[2.5rem]'}`}>
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl shadow-sm border border-slate-200 transition-colors"
              title="Toggle Sidebar"
            >
              {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shadow-sm"><FileSpreadsheet size={20} /></div>
            <input 
              type="text" 
              value={fileName} 
              onChange={(e) => setFileName(e.target.value)}
              className="text-xl font-black text-slate-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-indigo-500/20 rounded-lg px-2 w-full max-w-sm placeholder-slate-300 transition-all"
              placeholder="Name your spreadsheet..."
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleDownloadCSV} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm">
              <Download size={14} /> Export CSV
            </button>
            <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md disabled:opacity-70">
              {isSaving ? <Loader2 className="animate-spin" size={14} /> : <><Save size={14} /> Cloud Save</>}
            </button>
          </div>
        </div>

        {/* Excel Grid Container */}
        <div className="flex-1 overflow-auto bg-[#f8f9fa] p-2 md:p-6 relative">
          <div className="bg-white inline-block border-2 border-slate-300 shadow-xl relative rounded-sm">
            <table className="border-collapse whitespace-nowrap bg-white">
              
              {/* Header Row (A, B, C...) */}
              <thead>
                <tr>
                  <th className="w-10 h-8 bg-slate-200/80 border border-slate-300 sticky top-0 left-0 z-30 shadow-sm backdrop-blur-sm"></th>
                  {gridData[0].map((_, colIndex) => (
                    <th key={`head-${colIndex}`} className="min-w-[120px] h-8 bg-slate-200/80 border border-slate-300 text-[11px] font-black text-slate-600 uppercase tracking-widest sticky top-0 z-20 shadow-sm select-none backdrop-blur-sm">
                      {getColumnLetter(colIndex)}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Data Rows (1, 2, 3...) */}
              <tbody>
                {gridData.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}`}>
                    <td className="w-10 h-8 bg-slate-200/80 border border-slate-300 text-center align-middle text-[10px] font-black text-slate-600 sticky left-0 z-20 shadow-sm select-none backdrop-blur-sm">
                      {rowIndex + 1}
                    </td>
                    {row.map((cell, colIndex) => (
                      <td key={`cell-container-${rowIndex}-${colIndex}`} className="border border-slate-300 p-0 relative h-8">
                        <input
                          id={`cell-${rowIndex}-${colIndex}`}
                          type="text"
                          value={cell}
                          onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                          className="w-full h-full px-2 text-sm font-semibold text-slate-800 text-center outline-none focus:ring-2 focus:ring-indigo-600 focus:z-10 transition-shadow bg-transparent absolute inset-0"
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
}'ds'