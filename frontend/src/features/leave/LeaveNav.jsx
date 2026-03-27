import { Link, useLocation } from "react-router-dom";

const items = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/leaves/apply", label: "Apply Leave" },
  { to: "/leaves/my", label: "My Leaves" },
  { to: "/leaves/approvals", label: "Approvals" },
];

export default function LeaveNav() {
  const location = useLocation();

  return (
    <nav className="module-nav">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={location.pathname === item.to ? "module-nav-link active" : "module-nav-link"}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
