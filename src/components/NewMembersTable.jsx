import { useState } from 'react';
import { Search } from 'lucide-react';

// Accept the live employees data as a prop
export default function NewMembersTable({ employees = [] }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Use the live prop data instead of the old hardcoded array
  const filteredData = employees.filter((row) => 
    row.empNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full w-full">
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">New Members <span className="text-slate-400 text-sm font-normal ml-1">| Today</span></h2>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <select className="w-full sm:w-auto border border-slate-300 text-slate-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer bg-white">
            <option>10 entries per page</option>
            <option>25 entries per page</option>
          </select>

          <div className="relative w-full sm:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search ID or Name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto w-full flex-1">
        <table className="w-full text-sm text-left text-slate-600 min-w-[500px]">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold">Employee No.</th>
              <th className="px-6 py-4 font-semibold">Employee Name</th>
              <th className="px-6 py-4 font-semibold">Designation</th>
              <th className="px-6 py-4 font-semibold">Emp Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.length > 0 ? (
              filteredData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors duration-150">
                  <td className="px-6 py-3 font-medium text-indigo-600">{row.empNo}</td>
                  <td className="px-6 py-3 font-medium text-slate-800">{row.name}</td>
                  <td className="px-6 py-3">{row.designation}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap ${
                      row.status === 'Probationary' 
                        ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-slate-400">
                  No members found for "{searchTerm}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}