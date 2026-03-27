import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Loader from "../../components/ui/Loader";
import { useAuth } from "../../context/AuthContext";
import { readApiErrorMessage } from "../../services/api";

const defaultForm = {
  companyName: "",
  companyCode: "",
  adminFirstName: "",
  adminLastName: "",
  adminEmail: "",
  adminPassword: "",
  phoneNumber: "",
};

export default function RegisterCompanyPage() {
  const navigate = useNavigate();
  const { registerCompany } = useAuth();
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await registerCompany(form);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to register the company."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-layout">
        <section className="auth-hero-card">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-200">Tenant onboarding</p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight">Launch a new HR workspace in minutes.</h1>
            <p className="mt-5 max-w-xl">Create the company tenant, provision the admin account, and enter a production-ready dashboard flow without breaking existing APIs.</p>
          </div>
        </section>

        <Card className="auth-panel" title="Create workspace" description="Register your company and bootstrap the admin account.">
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="employee-form-grid">
              <label className="field-group">
                <span className="field-label">Company name</span>
                <input name="companyName" onChange={handleChange} required value={form.companyName} />
              </label>
              <label className="field-group">
                <span className="field-label">Company code</span>
                <input name="companyCode" onChange={handleChange} required value={form.companyCode} />
              </label>
              <label className="field-group">
                <span className="field-label">Admin first name</span>
                <input name="adminFirstName" onChange={handleChange} required value={form.adminFirstName} />
              </label>
              <label className="field-group">
                <span className="field-label">Admin last name</span>
                <input name="adminLastName" onChange={handleChange} required value={form.adminLastName} />
              </label>
              <label className="field-group">
                <span className="field-label">Admin email</span>
                <input name="adminEmail" onChange={handleChange} required type="email" value={form.adminEmail} />
              </label>
              <label className="field-group">
                <span className="field-label">Phone number</span>
                <input name="phoneNumber" onChange={handleChange} value={form.phoneNumber} />
              </label>
            </div>

            <label className="field-group">
              <span className="field-label">Admin password</span>
              <input name="adminPassword" onChange={handleChange} required type="password" value={form.adminPassword} />
            </label>

            {error ? <div className="form-error rounded-2xl px-4 py-3 text-sm">{error}</div> : null}

            <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <span className="flex items-center gap-2"><Loader /> Creating workspace</span> : "Register company"}
            </Button>
          </form>

          <div className="auth-links-row mt-6 single-link">
            <Link to="/login">Back to login</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
