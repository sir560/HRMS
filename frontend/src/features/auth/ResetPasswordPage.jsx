import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Loader from "../../components/ui/Loader";
import { authApi, readApiErrorMessage } from "../../services/api";

const defaultForm = {
  companyCode: "",
  email: "",
  otp: "",
  newPassword: "",
};

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await authApi.resetPassword(form);
      setMessage(response.message || "Password reset successfully.");
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to reset password."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-layout">
        <section className="auth-hero-card">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-200">Password reset</p>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight md:text-5xl">Confirm the OTP and issue fresh credentials.</h1>
            <p className="mt-5 max-w-xl">Complete the reset flow securely and return to the login page with updated credentials.</p>
          </div>
        </section>

        <Card className="auth-panel" title="Reset password" description="Enter the OTP generated for your company account.">
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="field-group">
              <span className="field-label">Company code</span>
              <input name="companyCode" onChange={handleChange} required value={form.companyCode} />
            </label>
            <label className="field-group">
              <span className="field-label">Work email</span>
              <input name="email" onChange={handleChange} required type="email" value={form.email} />
            </label>
            <label className="field-group">
              <span className="field-label">OTP</span>
              <input name="otp" onChange={handleChange} required value={form.otp} />
            </label>
            <label className="field-group">
              <span className="field-label">New password</span>
              <input name="newPassword" onChange={handleChange} required type="password" value={form.newPassword} />
            </label>

            {error ? <div className="form-error rounded-2xl px-4 py-3 text-sm">{error}</div> : null}
            {message ? <div className="banner banner-success">{message}</div> : null}

            <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <span className="flex items-center gap-2"><Loader /> Resetting password</span> : "Reset password"}
            </Button>
          </form>

          <div className="auth-links-row mt-6">
            <Link to="/forgot-password">Request OTP</Link>
            <Link to="/login">Back to login</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

