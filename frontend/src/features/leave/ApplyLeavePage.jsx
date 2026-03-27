import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { employeeApi, leaveApi, readApiErrorMessage } from "../../services/api";
import LeaveNav from "./LeaveNav";

const initialForm = {
  employeeId: "",
  leaveTypeId: "",
  startDate: "",
  endDate: "",
  reason: "",
};

export default function ApplyLeavePage() {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isManagement = user?.roles?.some((role) => ["SUPER_ADMIN", "ADMIN", "HR", "MANAGER"].includes(role));

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    setError("");

    try {
      const requests = [leaveApi.getLeaveTypes()];
      if (isManagement) {
        requests.push(employeeApi.getEmployees({ page: 0, size: 100, active: true }));
      }

      const [leaveTypesResponse, employeesResponse] = await Promise.all(requests);
      const nextLeaveTypes = leaveTypesResponse.data;
      const nextEmployees = employeesResponse?.data?.content || [];

      setLeaveTypes(nextLeaveTypes);
      setEmployees(nextEmployees);
      setForm((current) => ({
        ...current,
        leaveTypeId: current.leaveTypeId || String(nextLeaveTypes[0]?.leaveTypeId || ""),
        employeeId: current.employeeId || String(nextEmployees[0]?.employeeId || ""),
      }));
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to load leave form data."));
    } finally {
      setIsLoading(false);
    }
  }

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
      await leaveApi.applyLeave({
        ...(isManagement && form.employeeId ? { employeeId: Number(form.employeeId) } : {}),
        leaveTypeId: Number(form.leaveTypeId),
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
      });
      setMessage("Leave request submitted successfully.");
      setForm((current) => ({
        ...initialForm,
        leaveTypeId: current.leaveTypeId,
        employeeId: current.employeeId,
      }));
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to submit leave request."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <div className="eyebrow">Leave workspace</div>
          <h1>Apply Leave</h1>
          <p>Submit leave requests with tenant-aware approval routing.</p>
        </div>
      </header>

      <LeaveNav />

      {(error || message) && (
        <div className={`banner ${error ? "banner-error" : "banner-success"}`}>
          {error || message}
        </div>
      )}

      <section className="panel form-panel narrow-panel">
        {isLoading ? (
          <div className="loading-state">Loading leave configuration...</div>
        ) : (
          <form className="stack-form" onSubmit={handleSubmit}>
            {isManagement ? (
              <select name="employeeId" value={form.employeeId} onChange={handleChange}>
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.employeeId} value={employee.employeeId}>
                    {employee.firstName} {employee.lastName} ({employee.employeeCode})
                  </option>
                ))}
              </select>
            ) : null}

            <select name="leaveTypeId" value={form.leaveTypeId} onChange={handleChange} required>
              <option value="">Select leave type</option>
              {leaveTypes.map((leaveType) => (
                <option key={leaveType.leaveTypeId} value={leaveType.leaveTypeId}>
                  {leaveType.leaveName} ({leaveType.leaveCode})
                </option>
              ))}
            </select>

            <input type="date" name="startDate" value={form.startDate} onChange={handleChange} required />
            <input type="date" name="endDate" value={form.endDate} onChange={handleChange} required />
            <textarea
              rows="4"
              name="reason"
              placeholder="Reason for leave"
              value={form.reason}
              onChange={handleChange}
              required
            />

            <button className="primary-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit leave request"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
