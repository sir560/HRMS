import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";

export default function Navbar() {
  const { user, logout } = useAuth();
  const initials = `${user?.firstName?.[0] || "S"}${user?.lastName?.[0] || "Q"}`;

  return (
    <header className="navbar-shell">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">HRMS Portal</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{user?.companyName || "Workspace"}</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right md:block">
          <p className="text-sm font-semibold text-slate-900">{user?.firstName} {user?.lastName}</p>
          <p className="text-xs text-slate-500">{user?.roles?.join(", ") || "Employee"}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
          {initials}
        </div>
        <Button variant="ghost" onClick={() => void logout()}>
          Logout
        </Button>
      </div>
    </header>
  );
}
