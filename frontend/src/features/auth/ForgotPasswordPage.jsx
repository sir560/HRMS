import { Link } from "react-router-dom";
import { useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Loader from "../../components/ui/Loader";
import { authApi, readApiErrorMessage } from "../../services/api";

const defaultForm = {
  companyCode: "",
  email: "",
};

export default function ForgotPasswordPage() {
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [otpPreview, setOtpPreview] = useState("");
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
    setOtpPreview("");

    try {
      const response = await authApi.forgotPassword(form);
      setMessage(response.message || "Password reset OTP generated successfully.");
      setOtpPreview(response.data?.otp || "");
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to generate password reset OTP."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-layout">
        <section className="auth-hero-card">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-200">Password recovery</p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight">Generate a secure reset OTP.</h1>
            <p className="mt-5 max-w-xl">Use your company code and work email to begin the password recovery flow for your tenant workspace.</p>
          </div>
        </section>

        <Card className="auth-panel" title="Request reset OTP" description="We will validate the account and issue a one-time reset code.">
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="field-group">
              <span className="field-label">Company code</span>
              <input name="companyCode" onChange={handleChange} required value={form.companyCode} />
            </label>
            <label className="field-group">
              <span className="field-label">Work email</span>
              <input name="email" onChange={handleChange} required type="email" value={form.email} />
            </label>

            {error ? <div className="form-error rounded-2xl px-4 py-3 text-sm">{error}</div> : null}
            {message ? <div className="banner banner-success">{message}</div> : null}
            {otpPreview ? <div className="banner banner-success">OTP preview: <strong>{otpPreview}</strong></div> : null}

            <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <span className="flex items-center gap-2"><Loader /> Generating OTP</span> : "Generate OTP"}
            </Button>
          </form>

          <div className="auth-links-row mt-6">
            <Link to="/reset-password">Go to reset password</Link>
            <Link to="/login">Back to login</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
