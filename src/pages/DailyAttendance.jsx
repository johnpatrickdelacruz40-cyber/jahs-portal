import { useState } from 'react';
import { Calendar as CalendarIcon, CheckCircle2, Circle, Save } from 'lucide-react';

export default function DailyAttendance({ employees, logHistory }) {
  // Get today's date formatted nicely
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  // State to hold today's attendance records temporarily before saving
  const [attendanceRecord, setAttendanceRecord] = useState(
    employees.map(emp => ({ id: emp.id, empNo: emp.empNo, name: emp.name, isPresent: false, notes: '' }))
  );

  const togglePresence = (id) => {
    setAttendanceRecord(records => records.map(rec => 
      rec.id === id ? { ...rec, isPresent: !rec.isPresent } : rec
    ));
  };

  const updateNotes = (id, text) => {
    setAttendanceRecord(records => records.map(rec => 
      rec.id === id ? { ...rec, notes: text } : rec
    ));
  };

  const saveAttendance = () => {
    const presentCount = attendanceRecord.filter(r => r.isPresent).length;
    alert(`Attendance saved for ${today}! ${presentCount}/${employees.length} present.`);
    // Log this action to the Audit History
    logHistory(`Submitted daily attendance. ${presentCount} employees marked present.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-indigo-50 p-6 rounded-xl border border-indigo-100">
        <div>
          <h1 className="text-2xl font-bold text-indigo-900 tracking-tight flex items-center">
            <CalendarIcon className="mr-3 text-indigo-500" /> Daily Roll Call
          </h1>
          <p className="text-sm text-indigo-700 mt-1">{today}</p>
        </div>
        <button onClick={saveAttendance} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 transition-colors font-medium">
          <Save size={18} className="mr-2" /> Save Register
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold w-16">Present</th>
              <th className="px-6 py-4 font-semibold">Employee</th>
              <th className="px-6 py-4 font-semibold">Optional Notes (Reason for Absence, etc.)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {attendanceRecord.map((record) => (
              <tr key={record.id} className={`transition-colors ${record.isPresent ? 'bg-emerald-50/30' : 'hover:bg-slate-50'}`}>
                <td className="px-6 py-3">
                  <button onClick={() => togglePresence(record.id)} className="focus:outline-none">
                    {record.isPresent ? <CheckCircle2 className="text-emerald-500" size={24} /> : <Circle className="text-slate-300 hover:text-slate-400" size={24} />}
                  </button>
                </td>
                <td className="px-6 py-3">
                  <p className="font-medium text-slate-900">{record.name}</p>
                  <p className="text-xs text-slate-500">{record.empNo}</p>
                </td>
                <td className="px-6 py-3">
                  <input 
                    type="text" 
                    value={record.notes} 
                    onChange={(e) => updateNotes(record.id, e.target.value)}
                    placeholder={record.isPresent ? "e.g., Arrived late" : "e.g., Sick leave, Unexcused..."}
                    className={`w-full px-3 py-1.5 border rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${record.isPresent ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-slate-50'}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}