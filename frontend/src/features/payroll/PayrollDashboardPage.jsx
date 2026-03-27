import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { employeeApi, payrollApi, readApiErrorMessage } from "../../services/api";
import PayrollNav from "./PayrollNav";

function currentPeriod() {
  const now = new Date();
  return {
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
  };
}

const defaultInput = {
  basicSalary: "0",
  hra: "0",
  specialAllowance: "0",
  otherAllowance: "0",
  pfPercentage: "12",
  esiPercentage: "0.75",
  tdsPercentage: "5",
  lopDays: "0",
  notes: "",
};

export default function PayrollDashboardPage() {
  const [period, setPeriod] = useState(currentPeriod());
  const [employees, setEmployees] = useState([]);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [salaryInputs, setSalaryInputs] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void hydrate();
  }, []);

  async function hydrate(nextPeriod = period) {
    setIsLoading(true);
    setError("");

    try {
      const [employeesResponse, payrollResponse] = await Promise.all([
        employeeApi.getEmployees({ page: 0, size: 100, active: true }),
        payrollApi.getPayroll(nextPeriod.month, nextPeriod.year),
      ]);
      const nextEmployees = employeesResponse.data.content || [];
      const nextPayrollRecords = payrollResponse.data || [];
      setEmployees(nextEmployees);
      setPayrollRecords(nextPayrollRecords);
      setSalaryInputs(buildSalaryInputs(nextEmployees, nextPayrollRecords));
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to load payroll workspace."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePeriodSubmit(event) {
    event.preventDefault();
    setMessage("");
    await hydrate(period);
  }

  async function handleRunPayroll(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      await payrollApi.runPayroll({
        month: Number(period.month),
        year: Number(period.year),
        employees: employees.map((employee) => ({
          employeeId: employee.employeeId,
          ...serializePayrollInput(salaryInputs[employee.employeeId] || defaultInput),
        })),
      });
      setMessage("Payroll generated successfully.");
      await hydrate(period);
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to generate payroll."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <div className="eyebrow">Payroll workspace</div>
          <h1>Payroll dashboard</h1>
          <p>Run payroll, review deductions, and open salary slips.</p>
        </div>
      </header>

      <PayrollNav />

      {(error || message) && (
        <div className={`banner ${error ? "banner-error" : "banner-success"}`}>
          {error || message}
        </div>
      )}

      <section className="panel form-panel">
        <div className="panel-header compact row-between wrap-row">
          <div>
            <span className="kicker">Period</span>
            <h2>Payroll run controls</h2>
          </div>
        </div>
        <form className="filter-grid filter-grid-history" onSubmit={handlePeriodSubmit}>
          <select value={period.month} onChange={(event) => setPeriod((current) => ({ ...current, month: event.target.value }))}>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
          <input type="number" min="2000" max="2100" value={period.year} onChange={(event) => setPeriod((current) => ({ ...current, year: event.target.value }))} />
          <button className="ghost-button" type="submit">Load payroll</button>
          <button className="primary-button" type="button" disabled={isSubmitting || isLoading || employees.length === 0} onClick={(event) => void handleRunPayroll(event)}>
            {isSubmitting ? "Running..." : "Run payroll"}
          </button>
        </form>
      </section>

      <section className="stats-grid stats-grid-wide">
        <StatCard label="Employees" value={employees.length} detail="Active payroll inputs" />
        <StatCard label="Records" value={payrollRecords.length} detail="Generated entries for period" />
        <StatCard label="Net Payout" value={formatCurrency(sum(payrollRecords, "netSalary"))} detail="Total take-home" />
        <StatCard label="Deductions" value={formatCurrency(sum(payrollRecords, "totalDeductions"))} detail="PF + ESI + TDS + LOP" />
      </section>

      <section className="panel data-panel">
        <div className="panel-header compact">
          <div>
            <span className="kicker">Salary structures</span>
            <h2>Configure payroll inputs</h2>
          </div>
        </div>
        {isLoading ? (
          <div className="loading-state">Loading payroll data...</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Basic</th>
                  <th>HRA</th>
                  <th>Special</th>
                  <th>Other</th>
                  <th>PF %</th>
                  <th>ESI %</th>
                  <th>TDS %</th>
                  <th>LOP Days</th>
                  <th>Slip</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => {
                  const input = salaryInputs[employee.employeeId] || defaultInput;
                  return (
                    <tr key={employee.employeeId}>
                      <td>
                        <div className="employee-cell">
                          <strong>{employee.firstName} {employee.lastName}</strong>
                          <span>{employee.employeeCode} · {employee.designation}</span>
                        </div>
                      </td>
                      <td><input className="mini-input" value={input.basicSalary} onChange={(event) => updateInput(employee.employeeId, "basicSalary", event.target.value, setSalaryInputs)} /></td>
                      <td><input className="mini-input" value={input.hra} onChange={(event) => updateInput(employee.employeeId, "hra", event.target.value, setSalaryInputs)} /></td>
                      <td><input className="mini-input" value={input.specialAllowance} onChange={(event) => updateInput(employee.employeeId, "specialAllowance", event.target.value, setSalaryInputs)} /></td>
                      <td><input className="mini-input" value={input.otherAllowance} onChange={(event) => updateInput(employee.employeeId, "otherAllowance", event.target.value, setSalaryInputs)} /></td>
                      <td><input className="mini-input" value={input.pfPercentage} onChange={(event) => updateInput(employee.employeeId, "pfPercentage", event.target.value, setSalaryInputs)} /></td>
                      <td><input className="mini-input" value={input.esiPercentage} onChange={(event) => updateInput(employee.employeeId, "esiPercentage", event.target.value, setSalaryInputs)} /></td>
                      <td><input className="mini-input" value={input.tdsPercentage} onChange={(event) => updateInput(employee.employeeId, "tdsPercentage", event.target.value, setSalaryInputs)} /></td>
                      <td><input className="mini-input" value={input.lopDays} onChange={(event) => updateInput(employee.employeeId, "lopDays", event.target.value, setSalaryInputs)} /></td>
                      <td>
                        <Link className="ghost-button compact-button" to={`/payroll/slip/${employee.employeeId}?month=${period.month}&year=${period.year}`}>
                          View Slip
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="empty-state">No active employees are available for payroll.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel data-panel">
        <div className="panel-header compact">
          <div>
            <span className="kicker">History</span>
            <h2>Generated payroll</h2>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Gross</th>
                <th>Deductions</th>
                <th>Net</th>
                <th>LOP</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payrollRecords.length ? payrollRecords.map((record) => (
                <tr key={record.payrollId}>
                  <td>{record.employeeName}</td>
                  <td>{formatCurrency(record.grossSalary)}</td>
                  <td>{formatCurrency(record.totalDeductions)}</td>
                  <td>{formatCurrency(record.netSalary)}</td>
                  <td>{record.lopDays}</td>
                  <td><span className="status-chip">{record.status}</span></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="empty-state">No payroll has been generated for this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function buildSalaryInputs(employees, payrollRecords) {
  const recordsByEmployee = new Map(payrollRecords.map((item) => [item.employeeId, item]));
  return Object.fromEntries(
    employees.map((employee) => {
      const existing = recordsByEmployee.get(employee.employeeId);
      return [employee.employeeId, existing ? {
        basicSalary: String(existing.basicSalary ?? "0"),
        hra: String(existing.hra ?? "0"),
        specialAllowance: String(existing.specialAllowance ?? "0"),
        otherAllowance: String(existing.otherAllowance ?? "0"),
        pfPercentage: String(existing.pfPercentage ?? "12"),
        esiPercentage: String(existing.esiPercentage ?? "0.75"),
        tdsPercentage: String(existing.tdsPercentage ?? "5"),
        lopDays: String(existing.lopDays ?? "0"),
        notes: existing.notes || "",
      } : { ...defaultInput }];
    })
  );
}

function updateInput(employeeId, field, value, setSalaryInputs) {
  setSalaryInputs((current) => ({
    ...current,
    [employeeId]: {
      ...(current[employeeId] || defaultInput),
      [field]: value,
    },
  }));
}

function serializePayrollInput(input) {
  return {
    basicSalary: Number(input.basicSalary || 0),
    hra: Number(input.hra || 0),
    specialAllowance: Number(input.specialAllowance || 0),
    otherAllowance: Number(input.otherAllowance || 0),
    pfPercentage: Number(input.pfPercentage || 0),
    esiPercentage: Number(input.esiPercentage || 0),
    tdsPercentage: Number(input.tdsPercentage || 0),
    lopDays: Number(input.lopDays || 0),
    notes: input.notes || "",
  };
}

function sum(records, field) {
  return records.reduce((total, item) => total + Number(item[field] || 0), 0);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function StatCard({ label, value, detail }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}
