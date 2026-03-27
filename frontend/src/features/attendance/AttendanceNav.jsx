import { Link } from "react-router-dom";

export default function AttendanceNav() {
  return (
    <div className="module-nav">
      <Link className="ghost-button" to="/attendance">Attendance Dashboard</Link>
      <Link className="ghost-button" to="/attendance/history">Attendance History</Link>
      <Link className="ghost-button" to="/dashboard">Employee Dashboard</Link>
    </div>
  );
}
