import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Loader from "../../components/ui/Loader";
import Toast from "../../components/ui/Toast";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import { readApiErrorMessage } from "../../services/api";

const defaultForm = {
  companyCode: "",
  email: "",
  password: "",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast, show, clear } = useToast();
  const redirectPath = location.state?.from?.pathname || "/dashboard";

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    clear();

    try {
      await login(form);
      navigate(redirectPath, { replace: true });
    } catch (requestError) {
      show(readApiErrorMessage(requestError, "Unable to sign in with the provided credentials."), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <Toast type={toast?.variant} message={toast?.message} onClose={clear} />
      <div className="auth-layout">
        <section className="auth-hero-card">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-200">SynQ HRMS</p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight">Clean HR operations for growing teams.</h1>
            <p className="mt-5 max-w-xl">
              Manage employee records, attendance, payroll, leave, and projects from a single workspace built for modern SaaS operations.
            </p>
          </div>

          <div className="auth-metric-grid">
            <div className="auth-metric-card">
              <strong>Unified workspace</strong>
              <p className="mt-2 text-sm text-slate-300">One platform for people, process, and approvals.</p>
            </div>
            <div className="auth-metric-card">
              <strong>Secure by default</strong>
              <p className="mt-2 text-sm text-slate-300">Tenant-aware access with session refresh support.</p>
            </div>
          </div>
        </section>

        <Card className="auth-panel" title="Welcome back" description="Sign in to access your company workspace.">
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="field-group">
              <span className="field-label">Company code</span>
              <input
                autoComplete="organization"
                name="companyCode"
                onChange={handleChange}
                placeholder="DEMOHR"
                required
                value={form.companyCode}
              />
            </label>

            <label className="field-group">
              <span className="field-label">Work email</span>
              <input
                autoComplete="email"
                name="email"
                onChange={handleChange}
                placeholder="admin@company.com"
                required
                type="email"
                value={form.email}
              />
            </label>

            <label className="field-group">
              <span className="field-label">Password</span>
              <input
                autoComplete="current-password"
                name="password"
                onChange={handleChange}
                placeholder="••••••••"
                required
                type="password"
                value={form.password}
              />
            </label>

            <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader /> Signing in
                </span>
              ) : (
                "Access dashboard"
              )}
            </Button>
          </form>

          <div className="auth-links-row mt-6">
            <Link to="/register-company">Create company</Link>
            <Link to="/forgot-password">Forgot password?</Link>
            <Link to="/reset-password">Reset password</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
