import { Link, useLocation } from "react-router-dom";

const items = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/projects", label: "Projects" },
];

export default function ProjectNav() {
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
