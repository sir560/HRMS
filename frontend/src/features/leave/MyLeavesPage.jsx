import { useEffect, useState } from "react";
import { leaveApi, readApiErrorMessage } from "../../services/api";
import LeaveNav from "./LeaveNav";

export default function MyLeavesPage() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadRequests();
  }, []);

  async function loadRequests() {
    setIsLoading(true);
    setError("");

    try {
      const response = await leaveApi.getMyRequests();
      setRequests(response.data);
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to load your leave requests."));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <div className="eyebrow">Leave workspace</div>
          <h1>My Leave Requests</h1>
          <p>Track your leave history and approval progress.</p>
        </div>
      </header>

      <LeaveNav />

      {error ? <div className="banner banner-error">{error}</div> : null}

      <section className="panel data-panel">
        {isLoading ? (
          <div className="loading-state">Loading leave requests...</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Next Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.leaveRequestId}>
                    <td>
                      <div className="employee-cell">
                        <strong>{request.leaveTypeName}</strong>
                        <span>{request.leaveTypeCode}</span>
                      </div>
                    </td>
                    <td>{request.startDate} to {request.endDate}</td>
                    <td>{request.totalDays}</td>
                    <td><span className="status-chip">{request.status.replaceAll("_", " ")}</span></td>
                    <td>{request.nextActionRole || "Closed"}</td>
                  </tr>
                ))}
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-state">No leave requests found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
