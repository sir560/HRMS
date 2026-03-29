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
    <aside className="sidebar">
      <div className="mb-10 px-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00439f] text-white">
            <span className="text-lg font-bold">A</span>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-blue-900">Architectural HRMS</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Management Suite</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-3 text-sm tracking-wide transition-colors duration-200 ${
                isActive
                  ? "border-r-4 border-blue-700 bg-white/50 font-bold text-blue-700"
                  : "font-medium text-slate-600 hover:bg-white hover:text-blue-600"
              }`
            }
          >
            <div className="min-w-0">
              <div>{item.label}</div>
              <div className="mt-0.5 text-[10px] font-medium normal-case tracking-normal text-slate-400">{item.hint}</div>
            </div>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-6 pt-6">
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-blue-700">System Load</p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-[32%] bg-blue-700"></div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Operations remain stable across employee, attendance, payroll, and leave modules.
          </p>
        </div>
      </div>
    </aside>
  );
}
