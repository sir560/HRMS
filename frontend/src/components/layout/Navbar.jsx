import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";

export default function Navbar() {
  const { user, logout } = useAuth();
  const initials = `${user?.firstName?.[0] || "S"}${user?.lastName?.[0] || "Q"}`;

  return (
    <header className="navbar-shell">
      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <input className="w-64 pl-10" placeholder="Search directory..." type="text" />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">S</span>
        </div>
        <div className="hidden items-center gap-4 md:flex">
          <span className="text-sm text-blue-700">Directory</span>
          <span className="text-sm text-slate-500">Resources</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600">
          <span>O</span>
        </button>
        <button className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600">
          <span>...</span>
        </button>
        <div className="mx-2 hidden h-8 w-px bg-slate-200 md:block"></div>
        <div className="hidden text-right md:block">
          <p className="text-sm font-bold text-slate-900">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">
            {user?.roles?.[0]?.replaceAll("_", " ") || "Employee"}
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold text-blue-900">
          {initials}
        </div>
        <Button variant="ghost" onClick={() => void logout()}>
          Logout
        </Button>
      </div>
    </header>
  );
}
