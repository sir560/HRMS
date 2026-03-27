import { useEffect, useState } from "react";
import { leaveApi, readApiErrorMessage } from "../../services/api";
import LeaveNav from "./LeaveNav";

export default function LeaveApprovalPage() {
  const [requests, setRequests] = useState([]);
  const [reviewComment, setReviewComment] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeAction, setActiveAction] = useState("");

  useEffect(() => {
    void loadApprovals();
  }, []);

  async function loadApprovals() {
    setIsLoading(true);
    setError("");

    try {
      const response = await leaveApi.getApprovals();
      setRequests(response.data);
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to load leave approvals."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDecision(leaveRequestId, action) {
    setActiveAction(`${action}-${leaveRequestId}`);
    setError("");
    setMessage("");

    try {
      if (action === "approve") {
        await leaveApi.approveLeave(leaveRequestId, { reviewComment: reviewComment[leaveRequestId] || "" });
        setMessage("Leave request approved successfully.");
      } else {
        await leaveApi.rejectLeave(leaveRequestId, { reviewComment: reviewComment[leaveRequestId] || "" });
        setMessage("Leave request rejected successfully.");
      }
      await loadApprovals();
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to process the leave request."));
    } finally {
      setActiveAction("");
    }
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <div className="eyebrow">Leave workspace</div>
          <h1>Leave Approvals</h1>
          <p>Review pending requests through the manager, HR, and admin workflow.</p>
        </div>
      </header>

      <LeaveNav />

      {(error || message) && (
        <div className={`banner ${error ? "banner-error" : "banner-success"}`}>
          {error || message}
        </div>
      )}

      <section className="panel data-panel">
        {isLoading ? (
          <div className="loading-state">Loading approvals...</div>
        ) : (
          <div className="approval-grid">
            {requests.map((request) => (
              <article className="approval-card" key={request.leaveRequestId}>
                <div className="panel-header compact">
                  <div>
                    <span className="kicker">{request.nextActionRole || "Closed"}</span>
                    <h2>{request.employeeName}</h2>
                  </div>
                </div>
                <p>{request.leaveTypeName} · {request.startDate} to {request.endDate} · {request.totalDays} day(s)</p>
                <p>{request.reason}</p>
                <textarea
                  rows="3"
                  placeholder="Review comment"
                  value={reviewComment[request.leaveRequestId] || ""}
                  onChange={(event) =>
                    setReviewComment((current) => ({
                      ...current,
                      [request.leaveRequestId]: event.target.value,
                    }))
                  }
                />
                <div className="approval-actions">
                  <button
                    className="primary-button"
                    onClick={() => void handleDecision(request.leaveRequestId, "approve")}
                    disabled={activeAction === `approve-${request.leaveRequestId}` || activeAction === `reject-${request.leaveRequestId}`}
                  >
                    {activeAction === `approve-${request.leaveRequestId}` ? "Approving..." : "Approve"}
                  </button>
                  <button
                    className="ghost-button"
                    onClick={() => void handleDecision(request.leaveRequestId, "reject")}
                    disabled={activeAction === `approve-${request.leaveRequestId}` || activeAction === `reject-${request.leaveRequestId}`}
                  >
                    {activeAction === `reject-${request.leaveRequestId}` ? "Rejecting..." : "Reject"}
                  </button>
                </div>
              </article>
            ))}
            {requests.length === 0 ? <div className="empty-state">No leave requests are pending your action.</div> : null}
          </div>
        )}
      </section>
    </div>
  );
}
