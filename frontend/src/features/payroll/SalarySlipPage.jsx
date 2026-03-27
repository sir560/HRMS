import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { payrollApi, readApiErrorMessage } from "../../services/api";
import PayrollNav from "./PayrollNav";

export default function SalarySlipPage() {
  const { employeeId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [slip, setSlip] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const month = searchParams.get("month") || "";
  const year = searchParams.get("year") || "";

  useEffect(() => {
    void loadSlip();
  }, [employeeId, month, year]);

  async function loadSlip() {
    setIsLoading(true);
    setError("");
    try {
      const response = await payrollApi.getSalarySlip(employeeId, {
        ...(month ? { month: Number(month) } : {}),
        ...(year ? { year: Number(year) } : {}),
      });
      setSlip(response.data);
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to load salary slip."));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <div className="eyebrow">Payroll</div>
          <h1>Salary slip</h1>
          <p>Review the earnings and deduction breakdown for one payroll period.</p>
        </div>
        <div className="header-actions">
          <button className="ghost-button" type="button" onClick={() => window.print()}>
            Print slip
          </button>
        </div>
      </header>

      <PayrollNav />

      {error ? <div className="banner banner-error">{error}</div> : null}

      <section className="panel form-panel narrow-panel">
        <div className="panel-header compact">
          <div>
            <span className="kicker">Period</span>
            <h2>Salary slip filters</h2>
          </div>
        </div>
        <div className="filter-grid filter-grid-history">
          <input type="number" placeholder="Month" min="1" max="12" value={month} onChange={(event) => setSearchParams((current) => ({ ...Object.fromEntries(current.entries()), month: event.target.value, year }))} />
          <input type="number" placeholder="Year" min="2000" max="2100" value={year} onChange={(event) => setSearchParams((current) => ({ ...Object.fromEntries(current.entries()), month, year: event.target.value }))} />
          <button className="ghost-button" type="button" onClick={() => void loadSlip()}>Reload slip</button>
        </div>
      </section>

      <section className="panel profile-card salary-slip-card">
        {isLoading ? (
          <div className="loading-state">Loading salary slip...</div>
        ) : slip ? (
          <>
            <div className="panel-header compact row-between wrap-row">
              <div>
                <span className="kicker">{slip.companyName}</span>
                <h2>{slip.employeeName}</h2>
                <p>{slip.employeeCode} · {slip.designation} · {slip.departmentName}</p>
              </div>
              <div className="salary-slip-summary">
                <strong>{month || slip.payrollMonth}/{year || slip.payrollYear}</strong>
                <span>{slip.status}</span>
              </div>
            </div>

            <div className="salary-slip-grid">
              <article className="salary-slip-section">
                <h3>Earnings</h3>
                <LineItem label="Basic Salary" value={slip.basicSalary} />
                <LineItem label="HRA" value={slip.hra} />
                <LineItem label="Special Allowance" value={slip.specialAllowance} />
                <LineItem label="Other Allowance" value={slip.otherAllowance} />
                <LineItem label="Gross Salary" value={slip.grossSalary} emphasize />
              </article>

              <article className="salary-slip-section">
                <h3>Deductions</h3>
                <LineItem label="PF" value={slip.pfAmount} />
                <LineItem label="ESI" value={slip.esiAmount} />
                <LineItem label="TDS" value={slip.tdsAmount} />
                <LineItem label="LOP" value={slip.lopAmount} />
                <LineItem label="Total Deductions" value={slip.totalDeductions} emphasize />
              </article>
            </div>

            <div className="salary-slip-footer">
              <LineItem label="Paid Days" value={slip.paidDays} plain />
              <LineItem label="LOP Days" value={slip.lopDays} plain />
              <LineItem label="Net Salary" value={slip.netSalary} emphasize />
            </div>
          </>
        ) : (
          <div className="empty-state">No salary slip is available for this employee and period.</div>
        )}
      </section>
    </div>
  );
}

function LineItem({ label, value, emphasize = false, plain = false }) {
  return (
    <div className={emphasize ? "line-item line-item-strong" : "line-item"}>
      <span>{label}</span>
      <strong>{plain ? value : formatCurrency(value)}</strong>
    </div>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}
