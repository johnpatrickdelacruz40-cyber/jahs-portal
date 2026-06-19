import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  FileSpreadsheet, Save, Download, Plus, Trash2, 
  FolderOpen, Loader2, PanelLeftClose, PanelLeftOpen, Upload, Search, Share2 
} from 'lucide-react';

// CHANGED: Default is now 40 rows and 10 columns (A-J)
const createEmptyGrid = (rows = 40, cols = 10) => Array(rows).fill().map(() => Array(cols).fill(''));
const getColumnLetter = (colIndex) => String.fromCharCode(65 + colIndex);

export default function Spreadsheet() {
  const [savedFiles, setSavedFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [fileName, setFileName] = useState('Untitled Spreadsheet');
  const [gridData, setGridData] = useState(createEmptyGrid());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const fileInputRef = useRef(null);
  const [isCopied, setIsCopied] = useState(false);

  // Layout State (Widths and Heights)
  const [colWidths, setColWidths] = useState({});
  const [rowHeights, setRowHeights] = useState({});

  // Multiplayer Logic
  const channelRef = useRef(null);

  useEffect(() => {
    if (!activeFileId) return;
    const roomName = `spreadsheet_${activeFileId}`;
    
    channelRef.current = supabase.channel(roomName)
      .on('broadcast', { event: 'cell_update' }, (payload) => {
        const { rowIndex, colIndex, value } = payload.payload;
        setGridData(prevGrid => {
          const newGrid = [...prevGrid];
          newGrid[rowIndex][colIndex] = value;
          return newGrid;
        });
      })
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [activeFileId]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const fetchFiles = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('spreadsheets').select('id, name, created_at').order('created_at', { ascending: false });
    if (!error && data) setSavedFiles(data);
    setIsLoading(false);
  };

  useEffect(() => { fetchFiles(); }, []);

  const handleCellChange = (rowIndex, colIndex, value) => {
    const newGrid = [...gridData];
    newGrid[rowIndex][colIndex] = value;
    setGridData(newGrid);

    if (activeFileId && channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'cell_update',
        payload: { rowIndex, colIndex, value }
      });
    }
  };

  const handleKeyDown = (e, rowIndex, colIndex) => {
    let nextRow = rowIndex, nextCol = colIndex, shouldMove = false;
    if (e.key === 'ArrowUp') { nextRow -= 1; shouldMove = true; e.preventDefault(); }
    else if (e.key === 'ArrowDown' || e.key === 'Enter') { if (e.shiftKey && e.key === 'Enter') nextRow -= 1; else nextRow += 1; shouldMove = true; e.preventDefault(); }
    else if (e.key === 'ArrowLeft' && e.target.selectionStart === 0) { nextCol -= 1; shouldMove = true; e.preventDefault(); }
    else if (e.key === 'ArrowRight' && e.target.selectionStart === e.target.value.length) { nextCol += 1; shouldMove = true; e.preventDefault(); }
    else if (e.key === 'Tab') { if (e.shiftKey) nextCol -= 1; else nextCol += 1; shouldMove = true; e.preventDefault(); }

    if (shouldMove && nextRow >= 0 && nextRow < gridData.length && nextCol >= 0 && nextCol < gridData[0].length) {
      const nextInput = document.getElementById(`cell-${nextRow}-${nextCol}`);
      if (nextInput) { nextInput.focus(); setTimeout(() => nextInput.select(), 0); }
    }
  };

  const handleColResize = (e, colIndex) => {
    e.preventDefault();
    const startX = e.pageX;
    const startWidth = colWidths[colIndex] || 160;
    const handleMouseMove = (moveEvent) => setColWidths(prev => ({ ...prev, [colIndex]: Math.max(50, startWidth + (moveEvent.pageX - startX)) }));
    const handleMouseUp = () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp);
  };

  const handleRowResize = (e, rowIndex) => {
    e.preventDefault();
    const startY = e.pageY;
    const startHeight = rowHeights[rowIndex] || 40;
    const handleMouseMove = (moveEvent) => setRowHeights(prev => ({ ...prev, [rowIndex]: Math.max(30, startHeight + (moveEvent.pageY - startY)) }));
    const handleMouseUp = () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp);
  };

  // --- UPDATED: Save Grid AND Layout to Cloud ---
  const handleSave = async () => {
    setIsSaving(true);
    // Bundle the grid data and sizes into one JSON object
    const payload = { 
      name: fileName, 
      data: {
        grid: gridData,
        colWidths: colWidths,
        rowHeights: rowHeights
      } 
    };

    if (activeFileId) await supabase.from('spreadsheets').update(payload).eq('id', activeFileId);
    else {
      const { data } = await supabase.from('spreadsheets').insert([payload]).select().single();
      if (data) setActiveFileId(data.id);
    }
    await fetchFiles();
    setIsSaving(false);
  };

  // --- UPDATED: Open File & Restore Layout ---
  const handleOpenFile = async (id) => {
    const { data, error } = await supabase.from('spreadsheets').select('*').eq('id', id).single();
    if (!error && data) {
      setActiveFileId(data.id);
      setFileName(data.name);
      
      // Backward compatibility check for older files that didn't have layouts saved
      if (Array.isArray(data.data)) {
        setGridData(data.data);
        setColWidths({});
        setRowHeights({});
      } else {
        // Load the new bundle
        setGridData(data.data.grid || createEmptyGrid());
        setColWidths(data.data.colWidths || {});
        setRowHeights(data.data.rowHeights || {});
      }
    }
  };

  const handleNewFile = () => {
    setActiveFileId(null);
    setFileName('New Spreadsheet');
    setGridData(createEmptyGrid());
    setSearchQuery('');
    setColWidths({});
    setRowHeights({});
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
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.csv`;
    link.click();
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const rows = event.target.result.split('\n');
      const importedGrid = rows.map(row => {
        const rowData = [];
        let insideQuotes = false, currentValue = "";
        for (let i = 0; i < row.length; i++) {
          if (row[i] === '"') insideQuotes = !insideQuotes;
          else if (row[i] === ',' && !insideQuotes) { rowData.push(currentValue); currentValue = ""; }
          else currentValue += row[i];
        }
        rowData.push(currentValue);
        return rowData.map(val => val.trim().replace(/^"|"$/g, ''));
      });

      const finalGrid = createEmptyGrid();
      for (let i = 0; i < Math.max(importedGrid.length, finalGrid.length); i++) {
        if (!finalGrid[i]) finalGrid[i] = Array(finalGrid[0].length).fill('');
        if (importedGrid[i]) {
          for (let j = 0; j < Math.max(importedGrid[i].length, finalGrid[0].length); j++) {
            if (j >= finalGrid[i].length) finalGrid[i].push(''); 
            if (importedGrid[i][j]) finalGrid[i][j] = importedGrid[i][j];
          }
        }
      }
      setGridData(finalGrid);
      setFileName(file.name.replace('.csv', '')); 
      setColWidths({}); // Reset layout on new import
      setRowHeights({});
    };
    reader.readAsText(file);
    e.target.value = null; 
  };

  const handleShare = () => {
    if (!activeFileId) return alert("Please save the file first before sharing!");
    const text = `Join me in the JAHS System Portal! Open the spreadsheet named: "${fileName}" to edit together.`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex h-[85vh] overflow-hidden animate-in fade-in duration-700 relative">
      
      <div className={`bg-white rounded-l-[2.5rem] border-y border-l border-slate-200 shadow-sm flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out z-10 shrink-0 ${isSidebarOpen ? 'w-72 p-6' : 'w-0 p-0 opacity-0 border-none'}`}>
        <div className="min-w-[14rem]">
          <button onClick={handleNewFile} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-md mb-6">
            <Plus size={16} /> New Sheet
          </button>
          <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase flex items-center gap-2 mb-4"><FolderOpen size={14} /> Saved Files</h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 max-h-[60vh]">
            {isLoading ? <p className="text-xs font-bold text-slate-400 text-center py-4">Loading...</p> : savedFiles.map(file => (
              <div key={file.id} onClick={() => handleOpenFile(file.id)} className={`p-3 rounded-xl border cursor-pointer transition-all group flex justify-between items-center ${activeFileId === file.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}>
                <div className="overflow-hidden">
                  <p className={`font-bold text-sm truncate ${activeFileId === file.id ? 'text-indigo-700' : 'text-slate-700'}`}>{file.name}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{new Date(file.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={(e) => handleDelete(file.id, e)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-white rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`flex-1 bg-white border border-slate-200 shadow-sm flex flex-col transition-all duration-300 ${isSidebarOpen ? 'rounded-r-[2.5rem]' : 'rounded-[2.5rem]'}`}>
        
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex justify-between items-center shrink-0 flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl shadow-sm border border-slate-200" title="Toggle Sidebar">
              {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shadow-sm"><FileSpreadsheet size={20} /></div>
            <input type="text" value={fileName} onChange={(e) => setFileName(e.target.value)} className="text-xl font-black text-slate-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-indigo-500/20 rounded-lg px-2 w-full max-w-[200px] md:max-w-sm" placeholder="Name your spreadsheet..." />
            <div className="relative flex items-center ml-2 hidden sm:flex">
              <Search size={16} className="absolute left-3 text-slate-400" />
              <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Find... (Ctrl+F)" className="pl-9 pr-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 w-48" />
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={handleShare} className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm ${isCopied ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white border-slate-200 text-indigo-600 hover:bg-indigo-50'}`}>
              <Share2 size={14} /> {isCopied ? 'Copied!' : 'Share'}
            </button>

            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportCSV} className="hidden" />
            <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm"><Upload size={14} /> Import</button>
            <button onClick={handleDownloadCSV} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm"><Download size={14} /> Export</button>
            <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md"><Save size={14} /> Cloud Save</button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-[#f8f9fa] p-0 md:p-4 relative">
          <div className="bg-white inline-block border-2 border-slate-300 shadow-xl relative rounded-sm m-2">
            <table className="border-collapse bg-white table-fixed">
              <thead>
                <tr>
                  <th className="w-12 h-10 bg-slate-200/80 border border-slate-300 sticky top-0 left-0 z-30 shadow-sm backdrop-blur-sm"></th>
                  {gridData[0].map((_, colIndex) => (
                    <th 
                      key={`head-${colIndex}`} 
                      className="bg-slate-200/80 border border-slate-300 text-[11px] font-black text-slate-600 uppercase tracking-widest sticky top-0 z-20 shadow-sm select-none backdrop-blur-sm relative group"
                      style={{ width: colWidths[colIndex] || 160 }}
                    >
                      {getColumnLetter(colIndex)}
                      <div 
                        onMouseDown={(e) => handleColResize(e, colIndex)}
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-indigo-500/50 z-40"
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gridData.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}`} style={{ height: rowHeights[rowIndex] || 40 }}>
                    <td className="w-12 bg-slate-200/80 border border-slate-300 text-center align-middle text-[11px] font-black text-slate-600 sticky left-0 z-20 shadow-sm select-none backdrop-blur-sm relative group">
                      {rowIndex + 1}
                      <div 
                        onMouseDown={(e) => handleRowResize(e, rowIndex)}
                        className="absolute bottom-0 left-0 right-0 h-2 cursor-row-resize hover:bg-indigo-500/50 z-40"
                      />
                    </td>
                    {row.map((cell, colIndex) => {
                      const isMatch = searchQuery && cell.toLowerCase().includes(searchQuery.toLowerCase());
                      return (
                        <td key={`cell-${rowIndex}-${colIndex}`} className="border border-slate-300 p-0 relative overflow-hidden">
                          <input
                            id={`cell-${rowIndex}-${colIndex}`}
                            type="text"
                            value={cell}
                            onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                            className={`w-full h-full px-3 text-[13px] font-semibold text-slate-800 text-center outline-none focus:ring-2 focus:ring-indigo-600 focus:z-10 absolute inset-0 
                              ${isMatch ? 'bg-yellow-100/80 ring-1 ring-yellow-400 z-0' : 'bg-transparent'}
                            `}
                          />
                        </td>
                      );
                    })}
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