import { useEffect, useMemo, useState } from "react";
import { attendanceApi, employeeApi, readApiErrorMessage } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import AttendanceNav from "./AttendanceNav";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendanceHistoryPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [report, setReport] = useState(null);
  const [filters, setFilters] = useState({
    employeeId: "",
    dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    dateTo: todayDate(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const isManagement = useMemo(
    () => ["SUPER_ADMIN", "ADMIN", "HR", "MANAGER"].some((role) => user?.roles?.includes(role)),
    [user]
  );

  useEffect(() => {
    void hydrate();
  }, []);

  async function hydrate() {
    setIsLoading(true);
    setError("");
    try {
      if (isManagement) {
        const response = await employeeApi.getEmployees({ page: 0, size: 100, active: true });
        setEmployees(response.data.content || []);
      }
      await runSearch(filters);
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to load attendance history."));
    } finally {
      setIsLoading(false);
    }
  }

  async function runSearch(nextFilters = filters) {
    const params = {
      ...(isManagement && nextFilters.employeeId ? { employeeId: Number(nextFilters.employeeId) } : {}),
      ...(nextFilters.dateFrom ? { dateFrom: nextFilters.dateFrom } : {}),
      ...(nextFilters.dateTo ? { dateTo: nextFilters.dateTo } : {}),
    };

    try {
      const [attendanceResponse, reportResponse] = await Promise.all([
        attendanceApi.getAttendance(isManagement && nextFilters.employeeId ? { employeeId: Number(nextFilters.employeeId) } : undefined),
        attendanceApi.getReport(params),
      ]);

      const reportRecords = reportResponse.data?.records || [];
      const filteredRecords = reportRecords.length
        ? reportRecords
        : filterRecordsByDate(attendanceResponse.data || [], nextFilters.dateFrom, nextFilters.dateTo);

      setRecords(filteredRecords);
      setReport(reportResponse.data);
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to fetch attendance history."));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    await runSearch(filters);
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <div className="eyebrow">Attendance analytics</div>
          <h1>Attendance history</h1>
          <p>Review attendance records and period summaries.</p>
        </div>
      </header>

      <AttendanceNav />

      {error ? <div className="banner banner-error">{error}</div> : null}

      <section className="panel form-panel">
        <div className="panel-header compact">
          <div>
            <span className="kicker">Filters</span>
            <h2>Report scope</h2>
          </div>
        </div>
        <form className="filter-grid filter-grid-history" onSubmit={handleSubmit}>
          {isManagement ? (
            <select value={filters.employeeId} onChange={(event) => setFilters((current) => ({ ...current, employeeId: event.target.value }))}>
              <option value="">All employees</option>
              {employees.map((employee) => (
                <option key={employee.employeeId} value={employee.employeeId}>
                  {employee.firstName} {employee.lastName} · {employee.employeeCode}
                </option>
              ))}
            </select>
          ) : null}
          <input type="date" value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} />
          <input type="date" value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} />
          <button className="primary-button" disabled={isLoading} type="submit">Apply filters</button>
        </form>
      </section>

      <section className="stats-grid stats-grid-wide">
        <StatCard label="Records" value={report?.totalRecords ?? 0} detail="Entries in range" />
        <StatCard label="Working Minutes" value={report?.totalWorkingMinutes ?? 0} detail="Total minutes logged" />
        <StatCard label="Average Hours" value={report?.averageWorkingHours ?? "00:00"} detail="Per record average" />
        <StatCard label="Absent" value={report?.absentCount ?? 0} detail="Calculated from tracked days" />
      </section>

      <section className="panel data-panel">
        <div className="panel-header compact">
          <div>
            <span className="kicker">Records</span>
            <h2>Attendance history</h2>
          </div>
        </div>
        {isLoading ? (
          <div className="loading-state">Loading attendance records...</div>
        ) : (
          <div className="table-scroll attendance-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee</th>
                  <th>Status</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Hours</th>
                  <th>Department</th>
                </tr>
              </thead>
              <tbody>
                {records.length ? records.map((record) => (
                  <tr key={record.attendanceId}>
                    <td>{record.attendanceDate}</td>
                    <td>{record.employeeName}</td>
                    <td><span className={`status-chip attendance-${record.attendanceStatus.toLowerCase()}`}>{formatStatus(record.attendanceStatus)}</span></td>
                    <td>{formatDateTime(record.clockInAt)}</td>
                    <td>{formatDateTime(record.clockOutAt)}</td>
                    <td>{record.workingHours || "-"}</td>
                    <td>{record.departmentName}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="empty-state">No attendance records match the selected range.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function filterRecordsByDate(records, from, to) {
  return records.filter((record) => {
    const date = record.attendanceDate;
    return (!from || date >= from) && (!to || date <= to);
  });
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatStatus(value) {
  return value.replaceAll("_", " ");
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
