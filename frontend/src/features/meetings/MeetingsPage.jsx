import Button from "../../components/ui/Button";

const meetings = [
  { time: "09:30", title: "Q4 Resource Planning Audit", meta: "Digital War Room | MS Teams", tag: "Internal" },
  { time: "13:15", title: "Meridian Site Safety Inspection", meta: "Sector 9 Construction Zone | NW1 2EB", tag: "Field Visit" },
  { time: "16:45", title: "Post-Visit Debrief: Safety Hub", meta: "Conference B (Main Wing)", tag: "Tentative" },
];

export default function MeetingsPage() {
  return (
    <div className="space-y-8">
      <header className="page-header">
        <div>
          <h1 className="page-title">Engagements &amp; Logistical Flow</h1>
          <p className="page-description">Orchestrate cross-functional meetings and manage field visit compliance within a unified operational stream.</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary">Schedule Meeting</Button>
          <Button>Schedule Visit</Button>
        </div>
      </header>

      <section className="meetings-grid">
        <div className="meetings-sidebar-panel">
          <div className="meetings-calendar-card">
            <h3>October 2024</h3>
            <div className="meetings-calendar-days">
              {["MO", "TU", "WE", "TH", "FR", "SA", "SU"].map((day) => <span key={day}>{day}</span>)}
              {[26, 27, 28, 29, 30, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((day) => <button key={day} className={day === 4 ? "active" : ""} type="button">{day}</button>)}
            </div>
          </div>

          <div className="meetings-focus-card">
            <h3>Focus View</h3>
            <div className="meetings-focus-list">
              <div><span>Client Site Visits</span><strong>12</strong></div>
              <div><span>Internal Strategy</span><strong>08</strong></div>
              <div><span>Safety Compliance Audits</span><strong>03</strong></div>
            </div>
          </div>

          <div className="meetings-map-card">
            <p>Live Visit Stream</p>
            <strong>3 Active On-Site</strong>
          </div>
        </div>

        <div className="meetings-timeline">
          {meetings.map((meeting, index) => (
            <article className={`meeting-event-card ${index === 1 ? "field" : ""}`} key={meeting.title}>
              <div className="meeting-time">{meeting.time}</div>
              <div className="meeting-content">
                <div className="row-between">
                  <h3>{meeting.title}</h3>
                  <span className="meeting-tag">{meeting.tag}</span>
                </div>
                <p>{meeting.meta}</p>
                {index === 1 ? (
                  <div className="meeting-inline-banner">
                    <span>Awaiting Check-in</span>
                    <strong>View Geofence</strong>
                  </div>
                ) : null}
              </div>
            </article>
          ))}

          <article className="meeting-tomorrow-card">
            <span>Coming Up Tomorrow</span>
            <h3>Executive Town Hall &amp; Benefits Launch</h3>
            <p>Starts at 09:00 AM | 212 Participants Invited</p>
          </article>
        </div>
      </section>
    </div>
  );
}

