import { useState } from 'react';
import { Search, FileText } from 'lucide-react';

export default function AttendanceTable({ attendanceLogs = [] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = attendanceLogs.filter(log => 
    log.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.idNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center">
          <FileText size={20} className="mr-2 text-indigo-500" /> Attendance History
        </h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" placeholder="Search by name or ID..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/10"
          />
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left text-slate-600 min-w-[600px]">
          <thead className="text-[10px] text-slate-400 uppercase font-bold bg-slate-50/50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">ID No</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date Logged</th>
              <th className="px-6 py-4">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length > 0 ? filteredLogs.map((log, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs">{log.idNo}</td>
                <td className="px-6 py-4 font-bold text-slate-800">{log.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                    log.isPresent ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                  }`}>
                    {log.isPresent ? 'PRESENT' : 'ABSENT'}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">{log.date}</td>
                <td className="px-6 py-4 text-xs italic text-slate-400">{log.notes || '---'}</td>
              </tr>
            )) : (
              <tr><td colSpan="5" className="px-6 py-20 text-center text-slate-400 italic">No attendance records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}