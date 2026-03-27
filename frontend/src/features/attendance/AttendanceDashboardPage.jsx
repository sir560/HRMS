import { useEffect, useMemo, useState } from "react";
import { attendanceApi, employeeApi, readApiErrorMessage } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import AttendanceNav from "./AttendanceNav";

const initialClockForm = {
  employeeId: "",
  workFromHome: false,
  notes: "",
};

export default function AttendanceDashboardPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [todayRecords, setTodayRecords] = useState([]);
  const [report, setReport] = useState(null);
  const [clockForm, setClockForm] = useState(initialClockForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const isManagement = useMemo(
    () => ["SUPER_ADMIN", "ADMIN", "HR", "MANAGER"].some((role) => user?.roles?.includes(role)),
    [user]
  );

  useEffect(() => {
    void hydrate();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      void loadAttendanceData(selectedEmployeeId || undefined);
    }
  }, [selectedEmployeeId]);

  async function hydrate() {
    setIsLoading(true);
    setError("");

    try {
      if (isManagement) {
        const response = await employeeApi.getEmployees({ page: 0, size: 100, active: true });
        const nextEmployees = response.data.content || [];
        setEmployees(nextEmployees);
        const defaultEmployeeId = nextEmployees[0]?.employeeId ? String(nextEmployees[0].employeeId) : "";
        setSelectedEmployeeId(defaultEmployeeId);
        setClockForm((current) => ({ ...current, employeeId: defaultEmployeeId }));
        await loadAttendanceData(defaultEmployeeId || undefined);
      } else {
        await loadAttendanceData();
      }
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to load attendance data."));
    } finally {
      setIsLoading(false);
    }
  }

  async function loadAttendanceData(employeeId) {
    setError("");
    try {
      const params = employeeId ? { employeeId: Number(employeeId) } : undefined;
      const [todayResponse, reportResponse] = await Promise.all([
        attendanceApi.getTodayAttendance(params),
        attendanceApi.getReport(params),
      ]);
      setTodayRecords(todayResponse.data || []);
      setReport(reportResponse.data);
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to load attendance dashboard."));
    }
  }

  async function handleClockIn(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setFeedback("");

    try {
      await attendanceApi.clockIn(buildClockPayload(clockForm, isManagement));
      setFeedback("Clock-in recorded successfully.");
      setClockForm((current) => ({ ...current, notes: "" }));
      await loadAttendanceData(selectedEmployeeId || undefined);
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to clock in."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleClockOut() {
    setIsSubmitting(true);
    setError("");
    setFeedback("");

    try {
      await attendanceApi.clockOut(buildClockPayload(clockForm, isManagement));
      setFeedback("Clock-out recorded successfully.");
      setClockForm((current) => ({ ...current, notes: "", workFromHome: false }));
      await loadAttendanceData(selectedEmployeeId || undefined);
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to clock out."));
    } finally {
      setIsSubmitting(false);
    }
  }

  const activeRecord = todayRecords.find((item) => !item.clockOutAt) || null;

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <div className="eyebrow">Attendance workspace</div>
          <h1>Daily attendance</h1>
          <p>Clock time, today status, and current period summary.</p>
        </div>
      </header>

      <AttendanceNav />

      {(error || feedback) && (
        <div className={`banner ${error ? "banner-error" : "banner-success"}`}>
          {error || feedback}
        </div>
      )}

      <section className="stats-grid stats-grid-wide">
        <StatCard label="Present" value={report?.presentCount ?? 0} detail="Current report window" />
        <StatCard label="Late" value={report?.lateCount ?? 0} detail="Clock-ins after threshold" />
        <StatCard label="Half-Day" value={report?.halfDayCount ?? 0} detail="Short working duration" />
        <StatCard label="WFH" value={report?.workFromHomeCount ?? 0} detail="Remote attendance records" />
      </section>

      <section className="workspace-grid workspace-grid-wide attendance-grid">
        <article className="panel form-panel">
          <div className="panel-header compact row-between wrap-row">
            <div>
              <span className="kicker">Today</span>
              <h2>Clock controls</h2>
            </div>
          </div>

          {isManagement ? (
            <select value={selectedEmployeeId} onChange={(event) => { setSelectedEmployeeId(event.target.value); setClockForm((current) => ({ ...current, employeeId: event.target.value })); }}>
              <option value="">Select employee</option>
              {employees.map((employee) => (
                <option key={employee.employeeId} value={employee.employeeId}>
                  {employee.firstName} {employee.lastName} · {employee.employeeCode}
                </option>
              ))}
            </select>
          ) : null}

          <form className="stack-form" onSubmit={handleClockIn}>
            <label className="inline-toggle">
              <input type="checkbox" checked={clockForm.workFromHome} onChange={(event) => setClockForm((current) => ({ ...current, workFromHome: event.target.checked }))} />
              Mark as work from home
            </label>
            <textarea rows="4" placeholder="Optional note for attendance record" value={clockForm.notes} onChange={(event) => setClockForm((current) => ({ ...current, notes: event.target.value }))} />
            <div className="header-actions">
              <button className="primary-button" disabled={isSubmitting || (isManagement && !selectedEmployeeId) || Boolean(activeRecord)} type="submit">
                {isSubmitting ? "Saving..." : "Clock in"}
              </button>
              <button className="ghost-button" disabled={isSubmitting || (isManagement && !selectedEmployeeId) || !activeRecord} onClick={() => void handleClockOut()} type="button">
                {isSubmitting ? "Saving..." : "Clock out"}
              </button>
            </div>
          </form>

          <div className="attendance-summary-card">
            <strong>{activeRecord ? "Clocked in" : "No active shift"}</strong>
            <p>
              {activeRecord
                ? `Started at ${formatDateTime(activeRecord.clockInAt)}`
                : "Use the controls above to begin today’s attendance record."}
            </p>
          </div>
        </article>

        <article className="panel data-panel">
          <div className="panel-header compact">
            <div>
              <span className="kicker">Overview</span>
              <h2>Current period</h2>
            </div>
          </div>
          <div className="report-grid">
            <ReportItem label="Average Hours" value={report?.averageWorkingHours || "00:00"} />
            <ReportItem label="Absent" value={report?.absentCount ?? 0} />
            <ReportItem label="Total Records" value={report?.totalRecords ?? 0} />
            <ReportItem label="Tracked Days" value={report?.totalTrackedDays ?? 0} />
          </div>
          <div className="table-scroll attendance-table">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Status</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {todayRecords.length ? todayRecords.map((record) => (
                  <tr key={record.attendanceId}>
                    <td>{record.employeeName}</td>
                    <td><span className={`status-chip attendance-${record.attendanceStatus.toLowerCase()}`}>{formatStatus(record.attendanceStatus)}</span></td>
                    <td>{formatDateTime(record.clockInAt)}</td>
                    <td>{formatDateTime(record.clockOutAt)}</td>
                    <td>{record.workingHours || "-"}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="empty-state">No attendance records for today.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}

function buildClockPayload(clockForm, isManagement) {
  return {
    ...(isManagement && clockForm.employeeId ? { employeeId: Number(clockForm.employeeId) } : {}),
    ...(clockForm.notes ? { notes: clockForm.notes } : {}),
    ...(clockForm.workFromHome ? { workFromHome: true } : {}),
  };
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

function ReportItem({ label, value }) {
  return (
    <div className="report-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
