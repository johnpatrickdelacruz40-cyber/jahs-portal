import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Printer, CalendarDays, X, CheckCircle2, XCircle, FileText, Loader2 } from 'lucide-react';

// --- HELPER: GENERATE RECENT PAYROLL CUTOFFS ---
// Automatically calculates the last 4 cutoff periods based on today's date
const generateRecentCutoffs = () => {
  const cutoffs = [];
  const today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth();

  for (let i = 0; i < 4; i++) {
    // Cutoff 2: 11th to 25th of the current month
    const c2Start = new Date(year, month, 11);
    const c2End = new Date(year, month, 25);
    cutoffs.push({
      id: `${year}-${month}-2`,
      label: `${c2Start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${c2End.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      startStr: `${year}-${String(month + 1).padStart(2, '0')}-11`,
      endStr: `${year}-${String(month + 1).padStart(2, '0')}-25`
    });

    // Cutoff 1: 26th of the PREVIOUS month to the 10th of the CURRENT month
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear -= 1;
    }
    const c1Start = new Date(prevYear, prevMonth, 26);
    const c1End = new Date(year, month, 10);
    cutoffs.push({
      id: `${year}-${month}-1`,
      label: `${c1Start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${c1End.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      startStr: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-26`,
      endStr: `${year}-${String(month + 1).padStart(2, '0')}-10`
    });

    // Step back one month for the next loop iteration
    month--;
    if (month < 0) {
      month = 11;
      year--;
    }
  }
  return cutoffs;
};

export default function DailyAttendance({ employees }) {
  // Main UI State
  const [currentDate] = useState(new Date());
  
  // Cutoff & Print State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [availableCutoffs] = useState(generateRecentCutoffs());
  const [isGenerating, setIsGenerating] = useState(false);
  
  // The processed data that will be printed
  const [printReportData, setPrintReportData] = useState(null);
  const [selectedCutoffLabel, setSelectedCutoffLabel] = useState("");

  // --- GENERATE AND PRINT SPECIFIC CUTOFF ---
  const handlePrintCutoff = async (cutoff) => {
    setIsGenerating(true);
    setSelectedCutoffLabel(cutoff.label);

    try {
      // 1. Fetch all attendance logs within the specific date range
      const { data: logs, error } = await supabase
        .from('attendance_logs')
        .select('employee_id, status, log_date')
        .gte('log_date', cutoff.startStr)
        .lte('log_date', cutoff.endStr);

      if (error) throw error;

      // 2. Process and summarize the data for HR (Total Present, Absent, Leave per employee)
      const summary = employees.map(emp => {
        const empLogs = logs.filter(log => log.employee_id === emp.id);
        return {
          ...emp,
          totalPresent: empLogs.filter(l => l.status === 'present').length,
          totalLeave: empLogs.filter(l => l.status === 'leave').length,
          totalAbsent: empLogs.filter(l => l.status === 'absent').length
        };
      });

      // Sort alphabetically for a clean report
      summary.sort((a, b) => a.name.localeCompare(b.name));
      
      setPrintReportData(summary);
      
      // 3. Close modal and trigger the browser print window
      setIsPrintModalOpen(false);
      
      // We use a small timeout to let React render the hidden print table before opening the print dialog
      setTimeout(() => {
        window.print();
        setIsGenerating(false);
      }, 500);

    } catch (err) {
      console.error("Error generating report:", err);
      alert("Failed to generate report. Please check database connection.");
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      
      {/* --- STANDARD SCREEN UI (Hidden during printing) --- */}
      <div className="print:hidden flex flex-col gap-6">
        
        {/* Header */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Attendance Records</h1>
            <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">
              {currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          {/* Main Action Button */}
          <button 
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
          >
            <Printer size={16} /> Print Cutoff Report
          </button>
        </div>

        {/* Placeholder for your actual Daily Attendance Table view */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 flex flex-col items-center justify-center text-slate-400 min-h-[400px]">
           <CalendarDays size={48} className="mb-4 opacity-50" />
           <p className="font-bold">Your Standard Daily Attendance UI Goes Here.</p>
           <p className="text-xs uppercase tracking-widest mt-2">Click the "Print Cutoff Report" button above to test the new feature.</p>
        </div>
      </div>

      {/* --- PRINT MODAL --- */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-900 uppercase">Generate Report</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select a payroll period to summarize</p>
              </div>
              <button onClick={() => !isGenerating && setIsPrintModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-3">
              {availableCutoffs.map((cutoff, index) => (
                <button
                  key={cutoff.id}
                  onClick={() => handlePrintCutoff(cutoff)}
                  disabled={isGenerating}
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                      <FileText size={18} className="text-slate-500 group-hover:text-indigo-700" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-slate-900">{cutoff.label}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {index === 0 ? "Current Period" : "Past Cutoff"}
                      </p>
                    </div>
                  </div>
                  {isGenerating && selectedCutoffLabel === cutoff.label ? (
                    <Loader2 size={18} className="text-indigo-600 animate-spin" />
                  ) : (
                    <Printer size={16} className="text-slate-300 group-hover:text-indigo-600" />
                  )}
                </button>
              ))}
            </div>
            
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ==================== PRINT ONLY VIEW ==================== */}
      {/* ========================================================= */}
      {/* This section is completely invisible on the screen, but formatted perfectly for paper. */}
      
      {printReportData && (
        <div className="hidden print:block w-full bg-white text-black p-8 font-sans">
          
          {/* Formal Document Header */}
          <div className="flex justify-between items-end border-b-2 border-black pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter">JAHS Telecom</h1>
              <p className="text-sm font-bold uppercase tracking-widest mt-1">Electronic and Electrical Service</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold uppercase tracking-widest">Payroll Attendance Summary</h2>
              <p className="text-sm mt-1 border border-black px-3 py-1 inline-block font-mono bg-gray-100">
                PERIOD: {selectedCutoffLabel}
              </p>
            </div>
          </div>

          <p className="text-xs mb-4">Date Generated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>

          {/* Formal Data Table */}
          <table className="w-full text-left border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-3 text-xs font-black uppercase tracking-widest">Employee Name</th>
                <th className="border border-black p-3 text-xs font-black uppercase tracking-widest w-32">ID Number</th>
                <th className="border border-black p-3 text-xs font-black uppercase tracking-widest text-center w-24">Present (Days)</th>
                <th className="border border-black p-3 text-xs font-black uppercase tracking-widest text-center w-24">Leave (Days)</th>
                <th className="border border-black p-3 text-xs font-black uppercase tracking-widest text-center w-24">Absent (Days)</th>
              </tr>
            </thead>
            <tbody>
              {printReportData.map((emp) => (
                <tr key={emp.id}>
                  <td className="border border-black p-3 font-bold text-sm">{emp.name}</td>
                  <td className="border border-black p-3 font-mono text-sm">{emp.idNo}</td>
                  <td className="border border-black p-3 text-center font-bold text-base">{emp.totalPresent}</td>
                  <td className="border border-black p-3 text-center font-bold text-base">{emp.totalLeave}</td>
                  <td className="border border-black p-3 text-center font-bold text-base">{emp.totalAbsent}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Signatures Section */}
          <div className="mt-16 flex justify-between px-10">
            <div className="text-center w-64">
              <div className="border-b border-black h-8 mb-2"></div>
              <p className="text-xs font-black uppercase tracking-widest">Prepared By</p>
              <p className="text-[10px] mt-1">John Patrick DC. Dela Cruz</p>
            </div>
            <div className="text-center w-64">
              <div className="border-b border-black h-8 mb-2"></div>
              <p className="text-xs font-black uppercase tracking-widest">Approved By</p>
              <p className="text-[10px] mt-1">Operations Manager</p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}