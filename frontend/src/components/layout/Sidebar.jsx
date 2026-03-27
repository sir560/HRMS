import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/dashboard", hint: "People overview" },
  { label: "Attendance", to: "/attendance", hint: "Daily tracking" },
  { label: "Projects", to: "/projects", hint: "Tasks and delivery" },
  { label: "Payroll", to: "/payroll", hint: "Compensation" },
  { label: "Leave", to: "/leaves/apply", hint: "Requests and approvals" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar px-5 py-6">
      <div className="rounded-3xl bg-slate-950 p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200">SynQ HRMS</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Workforce OS</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">Modern HR operations across employees, payroll, projects, attendance, and leave.</p>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `rounded-2xl border px-4 py-3 transition duration-200 ${
                isActive
                  ? "border-blue-100 bg-blue-50 text-blue-700 shadow-sm"
                  : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            {({ isActive }) => (
              <div>
                <div className={`text-sm font-semibold ${isActive ? "text-blue-700" : "text-slate-900"}`}>{item.label}</div>
                <div className="mt-1 text-xs text-slate-500">{item.hint}</div>
              </div>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
