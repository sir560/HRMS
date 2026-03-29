import { Link } from "react-router-dom";
import { startTransition, useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Loader from "../../components/ui/Loader";
import { useAuth } from "../../context/AuthContext";
import { authApi, employeeApi, readApiErrorMessage } from "../../services/api";

const initialPageState = {
  content: [],
  page: 0,
  size: 8,
  totalElements: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

export default function ExecutiveDashboardPage() {
  const { user, setSession } = useAuth();
  const [employeesPage, setEmployeesPage] = useState(initialPageState);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void hydrate();
  }, []);

  async function hydrate() {
    setIsLoading(true);
    setError("");

    try {
      const [meResponse, departmentResponse, employeesResponse] = await Promise.all([
        authApi.me(),
        employeeApi.getDepartments(),
        employeeApi.getEmployees({ page: 0, size: 8, active: true }),
      ]);

      startTransition(() => {
        setSession((current) => ({
          ...current,
          user: meResponse.data,
        }));
        setDepartments(departmentResponse.data || []);
        setEmployeesPage(employeesResponse.data || initialPageState);
      });
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to load executive dashboard."));
    } finally {
      setIsLoading(false);
    }
  }

  const employees = employeesPage.content || [];

  return (
    <div className="space-y-8">
      <header className="page-header">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-description">Personnel metrics and operational overview for June 12, 2024.</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" onClick={() => void hydrate()}>Export Report</Button>
          <Link to="/employees">
            <Button>New Hire</Button>
          </Link>
        </div>
      </header>

      {error ? <div className="banner banner-error">{error}</div> : null}

      <section className="stats-grid dashboard-stats-grid">
        <StatCard icon="PE" label="Total Employees" value={employeesPage.totalElements || 0} detail="Active workforce across departments" status="+4% mo/mo" />
        <StatCard icon="AT" label="Today's Attendance" value={employees.length} detail="Updated as of 08:30 AM" variant="warning" status={employeesPage.totalElements ? `${Math.round((employees.length / employeesPage.totalElements) * 100)}% today` : "0% today"} />
        <StatCard icon="LV" label="Pending Leave Requests" value={Math.max(0, employeesPage.totalElements - employees.length)} detail="Requiring immediate attention" variant="danger" status="Critical" />
        <StatCard icon="PY" label="Next Payroll Run" value="June 28, 2024" detail="Est. $142,000 disbursement" />
      </section>

      <section className="executive-grid">
        <div className="executive-panel">
          <div className="executive-panel-header">
            <h3>Weekly Attendance Trends</h3>
            <div className="executive-legend">
              <span><i className="legend-dot present"></i>Present</span>
              <span><i className="legend-dot late"></i>Late</span>
            </div>
          </div>
          <div className="attendance-bars">
            {[
              { day: "MON", value: 85 },
              { day: "TUE", value: 92 },
              { day: "WED", value: 78 },
              { day: "THU", value: 88 },
              { day: "FRI", value: 82 },
              { day: "SAT", value: 15, muted: true },
            ].map((item) => (
              <div className="attendance-bar-col" key={item.day}>
                <div className={`attendance-bar-shell ${item.muted ? "muted" : ""}`}>
                  <div className="attendance-bar-fill" style={{ height: `${item.value}%` }}></div>
                </div>
                <span>{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="quick-actions-panel">
          <h3>Quick Actions</h3>
          <div className="quick-actions-list">
            <QuickAction icon="CI" label="Clock-in Manual Entry" to="/attendance" />
            <QuickAction icon="LV" label="Apply for Official Leave" to="/leaves/apply" />
            <QuickAction icon="NH" label="Add New Employee Record" to="/employees" />
            <QuickAction icon="PY" label="Generate Payroll Preview" to="/payroll" />
          </div>
        </div>
      </section>

      <section className="activity-panel">
        <div className="activity-panel-header">
          <h3>Recent Employee Activity</h3>
          <div className="activity-panel-actions">
            <span>Filter</span>
            <span>More</span>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-state gap-3">
            <Loader /> Loading activity feed...
          </div>
        ) : employees.length ? (
          <>
            <div className="activity-table">
              <div className="activity-table-head">
                <span>Employee</span>
                <span>Department</span>
                <span>Action/Event</span>
                <span>Status</span>
                <span>Time</span>
              </div>
              {employees.slice(0, 4).map((employee, index) => (
                <div className="activity-row" key={employee.employeeId}>
                  <div className="activity-employee">
                    <div className="activity-avatar">{initialsFor(employee.firstName, employee.lastName)}</div>
                    <div>
                      <p>{employee.firstName} {employee.lastName}</p>
                      <small>ID: {employee.employeeCode}</small>
                    </div>
                  </div>
                  <span>{employee.department?.departmentName || "-"}</span>
                  <span>{index % 3 === 1 ? "Sick Leave Request" : index % 2 === 0 ? "Check-in (Office)" : "Profile Updated"}</span>
                  <span className={`mini-status ${index % 3 === 1 ? "pending" : index === 2 ? "late" : "present"}`}>
                    {index % 3 === 1 ? "Pending" : index === 2 ? "Late" : "Present"}
                  </span>
                  <span>{fakeTime(index)}</span>
                </div>
              ))}
            </div>
            <div className="activity-panel-footer">
              <p>Showing {Math.min(4, employees.length)} of {employeesPage.totalElements || employees.length} daily activities</p>
              <Link to="/employees">View All Activity</Link>
            </div>
          </>
        ) : (
          <EmptyState title="No activity found" description="Employee activity will appear here once records are available." />
        )}
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, detail, variant = "default", status = "" }) {
  return (
    <article className={`stat-card ${variant}`}>
      <div className="stat-card-icon">{icon}</div>
      {status ? <em>{status}</em> : null}
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function QuickAction({ icon, label, to }) {
  return (
    <Link className="quick-action-item" to={to}>
      <span className="quick-action-copy"><i>{icon}</i>{label}</span>
      <strong>{">"}</strong>
    </Link>
  );
}

function initialsFor(firstName, lastName) {
  return `${firstName?.[0] || "E"}${lastName?.[0] || "M"}`;
}

function fakeTime(index) {
  const times = ["08:52 AM", "09:15 AM", "09:42 AM", "08:45 AM"];
  return times[index] || "09:00 AM";
}
