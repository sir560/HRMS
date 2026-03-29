import { useEffect, useMemo, useState } from "react";
import { attendanceApi, employeeApi, readApiErrorMessage } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

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
        const defaultEmployeeId = nextEmployees[0]?.employeeId ? String(nextEmployees[0].employeeId) : "";
        setEmployees(nextEmployees);
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
  const sessionEntry = activeRecord?.clockInAt ? formatTime(activeRecord.clockInAt) : "08:50 AM";

  return (
    <div className="space-y-8">
      <header className="page-header">
        <div>
          <h1 className="page-title">Time &amp; Absences</h1>
          <p className="page-description">Manage your professional availability and track team presence.</p>
        </div>
        <div className="attendance-date-chip">Today</div>
      </header>

      {error || feedback ? <div className={`banner ${error ? "banner-error" : "banner-success"}`}>{error || feedback}</div> : null}

      {isManagement ? (
        <div className="attendance-management-bar">
          <select value={selectedEmployeeId} onChange={(event) => { setSelectedEmployeeId(event.target.value); setClockForm((current) => ({ ...current, employeeId: event.target.value })); }}>
            <option value="">Select employee</option>
            {employees.map((employee) => (
              <option key={employee.employeeId} value={employee.employeeId}>
                {employee.firstName} {employee.lastName} | {employee.employeeCode}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <section className="attendance-grid-screen">
        <div className="attendance-session-card">
          <p>Current Session</p>
          <h2>{activeRecord ? formatTime(activeRecord.clockInAt) : "09:42 AM"}</h2>
          <div className="attendance-session-meta">
            <div>
              <span>Entry</span>
              <strong>{sessionEntry}</strong>
            </div>
            <div>
              <span>Duration</span>
              <strong>{activeRecord?.workingHours || "0h 52m"}</strong>
            </div>
          </div>
          <form className="space-y-4" onSubmit={handleClockIn}>
            <label className="inline-toggle">
              <input type="checkbox" checked={clockForm.workFromHome} onChange={(event) => setClockForm((current) => ({ ...current, workFromHome: event.target.checked }))} />
              Mark as work from home
            </label>
            <textarea rows="3" placeholder="Optional note for attendance record" value={clockForm.notes} onChange={(event) => setClockForm((current) => ({ ...current, notes: event.target.value }))} />
            <div className="header-actions">
              <button className="attendance-primary-action" disabled={isSubmitting || (isManagement && !selectedEmployeeId) || !activeRecord} onClick={() => void handleClockOut()} type="button">
                {isSubmitting ? "Saving..." : "Clock Out Now"}
              </button>
              <button className="ghost-button" disabled={isSubmitting || (isManagement && !selectedEmployeeId) || Boolean(activeRecord)} type="submit">
                {isSubmitting ? "Saving..." : "Clock In"}
              </button>
            </div>
          </form>
        </div>

        <div className="attendance-panel">
          <div className="attendance-panel-header">
            <div>
              <h3>Team Presence Today</h3>
              <p>Showing status for current employee view</p>
            </div>
            <div className="attendance-summary-chips">
              <span className="green">{report?.presentCount ?? 0} Present</span>
              <span className="amber">{report?.lateCount ?? 0} Late</span>
              <span>{report?.workFromHomeCount ?? 0} Away</span>
            </div>
          </div>
          <div className="attendance-roster">
            {todayRecords.length ? todayRecords.slice(0, 3).map((record) => (
              <div className="attendance-roster-row" key={record.attendanceId}>
                <div className="activity-employee">
                  <div className="activity-avatar">{initialsForName(record.employeeName)}</div>
                  <div>
                    <p>{record.employeeName}</p>
                    <small>{record.attendanceStatus === "WORK_FROM_HOME" ? "Remote session" : "Current shift"}</small>
                  </div>
                </div>
                <span>{renderPresenceLabel(record.attendanceStatus)}</span>
                <strong>{formatTime(record.clockInAt)}</strong>
              </div>
            )) : (
              <div className="loading-state">No attendance records for today.</div>
            )}
          </div>
        </div>

        <div className="attendance-panel">
          <div className="attendance-panel-header">
            <div>
              <h3>Leave Balance</h3>
            </div>
          </div>
          <div className="leave-balance-stack">
            <LeaveBalanceItem label="Casual Leave (CL)" used={8} total={12} color="blue" />
            <LeaveBalanceItem label="Sick Leave (SL)" used={3} total={8} color="green" />
            <LeaveBalanceItem label="Earned Leave (EL)" used={14} total={20} color="amber" />
          </div>
        </div>

        <div className="attendance-panel">
          <div className="attendance-panel-header">
            <div>
              <h3>Leave Requests to Review</h3>
              <p>Pending managerial approvals</p>
            </div>
          </div>
          <div className="leave-review-list">
            {(todayRecords.length ? todayRecords.slice(0, 2) : [{ attendanceId: 1, employeeName: "Sarah Jenkins" }, { attendanceId: 2, employeeName: "Michael Aris" }]).map((record, index) => (
              <div className="leave-review-item" key={`${record.attendanceId}-review`}>
                <div className="activity-employee">
                  <div className="activity-avatar">{initialsForName(record.employeeName)}</div>
                  <div>
                    <p>{record.employeeName}</p>
                    <small>{index === 0 ? "Sick Leave - 24 Oct - 26 Oct (3 days)" : "Casual Leave - 28 Oct (1 day)"}</small>
                  </div>
                </div>
                <div className="header-actions">
                  <button className="leave-reject-button" type="button">Reject</button>
                  <button className="leave-approve-button" type="button">Approve</button>
                </div>
              </div>
            ))}
          </div>
        </div>
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

function formatTime(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

function renderPresenceLabel(status) {
  if (status === "WORK_FROM_HOME") {
    return "Work from Home";
  }
  if (status === "LATE") {
    return "Late";
  }
  return "On-Time";
}

function initialsForName(name) {
  return name
    ?.split(" ")
    .map((part) => part[0] || "")
    .slice(0, 2)
    .join("") || "TM";
}

function LeaveBalanceItem({ label, used, total, color }) {
  const width = `${Math.round((used / total) * 100)}%`;

  return (
    <div className="leave-balance-item">
      <div className="row-between">
        <span>{label}</span>
        <strong>{String(used).padStart(2, "0")} / {String(total).padStart(2, "0")}</strong>
      </div>
      <div className="leave-balance-track">
        <div className={`leave-balance-fill ${color}`} style={{ width }}></div>
      </div>
    </div>
  );
}
