import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/layout/Layout";
import AttendanceDashboardPage from "./features/attendance/AttendanceDashboardPage";
import AttendanceHistoryPage from "./features/attendance/AttendanceHistoryPage";
import ForgotPasswordPage from "./features/auth/ForgotPasswordPage";
import LoginPage from "./features/auth/LoginPage";
import RegisterCompanyPage from "./features/auth/RegisterCompanyPage";
import ResetPasswordPage from "./features/auth/ResetPasswordPage";
import EmployeeDashboard from "./features/dashboard/EmployeeDashboard";
import ExecutiveDashboardPage from "./features/dashboard/ExecutiveDashboardPage";
import EmployeeProfilePage from "./features/employees/EmployeeProfilePage";
import FilesPage from "./features/files/FilesPage";
import ApplyLeavePage from "./features/leave/ApplyLeavePage";
import LeaveApprovalPage from "./features/leave/LeaveApprovalPage";
import MyLeavesPage from "./features/leave/MyLeavesPage";
import MeetingsPage from "./features/meetings/MeetingsPage";
import PayrollDashboardPage from "./features/payroll/PayrollDashboardPage";
import SalarySlipPage from "./features/payroll/SalarySlipPage";
import ProjectsPage from "./features/projects/ProjectsPage";

function ProtectedLayout({ allowedRoles }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <Layout />
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register-company" element={<RegisterCompanyPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedLayout allowedRoles={[]} />}>
        <Route path="/dashboard" element={<ExecutiveDashboardPage />} />
        <Route path="/employees" element={<EmployeeDashboard />} />
        <Route path="/attendance" element={<AttendanceDashboardPage />} />
        <Route path="/attendance/history" element={<AttendanceHistoryPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/files" element={<FilesPage />} />
        <Route path="/meetings" element={<MeetingsPage />} />
        <Route path="/leaves/apply" element={<ApplyLeavePage />} />
        <Route path="/leaves/my" element={<MyLeavesPage />} />
      </Route>

      <Route element={<ProtectedLayout allowedRoles={["SUPER_ADMIN", "ADMIN", "HR", "MANAGER"]} />}>
        <Route path="/employees/:employeeId" element={<EmployeeProfilePage />} />
        <Route path="/leaves/approvals" element={<LeaveApprovalPage />} />
        <Route path="/payroll" element={<PayrollDashboardPage />} />
        <Route path="/payroll/slip/:employeeId" element={<SalarySlipPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
