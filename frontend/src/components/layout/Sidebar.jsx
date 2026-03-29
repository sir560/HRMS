import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: "D" },
  { label: "Employees", to: "/employees", icon: "E" },
  { label: "Attendance", to: "/attendance", icon: "A" },
  { label: "Leave", to: "/leaves/apply", icon: "L" },
  { label: "Payroll", to: "/payroll", icon: "P" },
  { label: "Tasks", to: "/projects", icon: "T" },
  { label: "Meetings", to: "/meetings", icon: "M" },
  { label: "Files", to: "/files", icon: "F" },
  { label: "Reports", to: "/dashboard", icon: "R" },
  { label: "Settings", to: "/dashboard", icon: "S" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="flex items-start gap-3">
          <div className="sidebar-brand-mark">
            <span className="text-sm font-bold">A</span>
          </div>
          <div>
            <h1 className="sidebar-brand-title">Architectural HRMS</h1>
            <p className="sidebar-brand-subtitle">Management Suite</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-link ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-load-card">
          <p className="sidebar-load-label">System Load</p>
          <div className="sidebar-load-track">
            <div className="sidebar-load-fill"></div>
          </div>
        </div>
      </div>
    </aside>
  );
}
