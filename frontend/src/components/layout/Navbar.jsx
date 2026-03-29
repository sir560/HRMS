import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";

export default function Navbar() {
  const { user, logout } = useAuth();
  const initials = `${user?.firstName?.[0] || "S"}${user?.lastName?.[0] || "Q"}`;

  return (
    <header className="navbar-shell">
      <div className="navbar-left">
        <div className="navbar-search-wrap">
          <input className="navbar-search-input" placeholder="Search employee records, documents..." type="text" />
          <span className="navbar-search-icon">S</span>
        </div>
        <div className="navbar-links">
          <span className="active">Directory</span>
          <span>Resources</span>
        </div>
      </div>

      <div className="navbar-right">
        <button className="navbar-icon-button" type="button">
          <span>N</span>
        </button>
        <button className="navbar-icon-button" type="button">
          <span>G</span>
        </button>
        <div className="navbar-divider"></div>
        <div className="navbar-user-copy">
          <p className="navbar-user-name">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="navbar-user-role">
            {user?.roles?.[0]?.replaceAll("_", " ") || "Employee"}
          </p>
        </div>
        <div className="navbar-avatar">
          {initials}
        </div>
        <Button className="navbar-logout" variant="ghost" onClick={() => void logout()}>
          Sign Out
        </Button>
      </div>
    </header>
  );
}
