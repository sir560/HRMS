import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import { employeeApi, payrollApi, readApiErrorMessage } from "../../services/api";

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

  async function handleRunPayroll() {
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

  const netPay = sum(payrollRecords, "netSalary");
  const grossPay = sum(payrollRecords, "grossSalary");
  const deductions = sum(payrollRecords, "totalDeductions");

  return (
    <div className="space-y-8">
      <header className="page-header">
        <div>
          <h1 className="page-title">Payroll Management</h1>
          <p className="page-description">Financial period: {monthLabel(period.month)} {period.year}</p>
        </div>
        <div className="header-actions">
          <Button onClick={() => void handleRunPayroll()} disabled={isSubmitting || isLoading || employees.length === 0}>
            {isSubmitting ? "Running..." : "Process Payroll"}
          </Button>
        </div>
      </header>

      {error || message ? <div className={`banner ${error ? "banner-error" : "banner-success"}`}>{error || message}</div> : null}

      <section className="payroll-summary-grid">
        <article className="payroll-summary-card hero">
          <span>Net Pay (Disbursable)</span>
          <strong>{formatCurrency(netPay)}</strong>
          <small>4.2% from last month</small>
        </article>
        <article className="payroll-summary-card">
          <span>Total Gross Salary</span>
          <strong>{formatCurrency(grossPay)}</strong>
          <small>{employees.length} employees paid</small>
        </article>
        <article className="payroll-summary-card">
          <span>Total Deductions</span>
          <ul>
            <li><span>Provident Fund (PF)</span><strong>{formatCurrency(deductions * 0.45)}</strong></li>
            <li><span>Insurance (ESI)</span><strong>{formatCurrency(deductions * 0.15)}</strong></li>
            <li><span>TDS (Tax)</span><strong>{formatCurrency(deductions * 0.30)}</strong></li>
            <li><span>Loss of Pay (LOP)</span><strong>{formatCurrency(deductions * 0.10)}</strong></li>
          </ul>
          <p>Total Loss {formatCurrency(deductions)}</p>
        </article>
      </section>

      <section className="activity-panel">
        <div className="activity-panel-header">
          <h3>Payment History</h3>
          <div className="header-actions">
            <Button variant="secondary">Export All</Button>
            <Button variant="ghost">Filter</Button>
          </div>
        </div>

        <div className="payroll-table">
          <div className="payroll-table-head">
            <span>Employee</span>
            <span>Payment Period</span>
            <span>Gross Pay</span>
            <span>Deductions</span>
            <span>Net Pay</span>
            <span>Status</span>
          </div>
          {(isLoading ? [] : payrollRecords.slice(0, 3)).map((record) => (
            <div className="payroll-table-row" key={record.payrollId}>
              <div className="activity-employee">
                <div className="activity-avatar">{initialsForName(record.employeeName)}</div>
                <div>
                  <p>{record.employeeName}</p>
                  <small>{record.designation || "Payroll Record"}</small>
                </div>
              </div>
              <span>{monthLabel(period.month)} 01 - {monthLabel(period.month)} 31, {period.year}</span>
              <strong>{formatCurrency(record.grossSalary)}</strong>
              <strong className="text-rose-500">-{formatCurrency(record.totalDeductions)}</strong>
              <strong>{formatCurrency(record.netSalary)}</strong>
              <span className={`directory-status ${record.status === "DISBURSED" ? "active" : "on-leave"}`}>{record.status}</span>
            </div>
          ))}

          {!isLoading && payrollRecords.length === 0 ? (
            <div className="loading-state">No payroll has been generated for this period.</div>
          ) : null}
        </div>

        <div className="directory-pagination">
          <p>Showing {Math.min(payrollRecords.length, 3)} of {payrollRecords.length} results</p>
          <div className="pagination-actions">
            <Button variant="ghost">1</Button>
            <Button variant="ghost">2</Button>
            <Button variant="ghost">3</Button>
          </div>
        </div>
      </section>

      <section className="payroll-lower-grid">
        <div className="payroll-trend-card">
          <h3>Quarterly Trend</h3>
          <div className="payroll-trend-bars">
            {[52, 68, 82, 94].map((value, index) => (
              <div className="payroll-trend-col" key={value}>
                <div className={`payroll-trend-bar ${index === 3 ? "active" : ""}`} style={{ height: `${value}%` }}></div>
                <span>{["JUL", "AUG", "SEP", "OCT"][index]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="payroll-account-card">
          <h3>Corporate Disbursement Account</h3>
          <p>Account ending in **** 8812</p>
          <div className="payroll-account-rows">
            <div><span>Available Funds</span><strong>{formatCurrency(1240500)}</strong></div>
            <div><span>Reserved for Tax</span><strong>{formatCurrency(82400)}</strong></div>
          </div>
          <Button variant="ghost">Top Up Funds</Button>
        </div>
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
                          <span>{employee.employeeCode} | {employee.designation}</span>
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
              </tbody>
            </table>
          </div>
        )}
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

function monthLabel(month) {
  return new Intl.DateTimeFormat("en-IN", { month: "short" }).format(new Date(2024, Number(month) - 1, 1)).toUpperCase();
}

function initialsForName(name) {
  return name
    ?.split(" ")
    .map((part) => part[0] || "")
    .slice(0, 2)
    .join("") || "PR";
}
