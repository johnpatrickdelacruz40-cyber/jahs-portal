export default function StatCard({ title, value, icon, colorTheme }) {
  const themeStyles = {
    indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    rose: "bg-rose-50 text-rose-600 ring-rose-100",
  };

  const selectedTheme = themeStyles[colorTheme] || themeStyles.indigo;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center space-x-5 group cursor-default">
      <div className={`p-4 rounded-xl ring-4 ring-transparent group-hover:ring-opacity-50 transition-all ${selectedTheme}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-slate-500 text-sm font-medium tracking-wide mb-1 uppercase">{title}</h3>
        <p className="text-3xl font-bold text-slate-800 leading-tight">{value}</p>
      </div>
    </div>
  );
}