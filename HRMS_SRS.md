# 🧾 HRMS SYSTEM - SOFTWARE REQUIREMENT SPECIFICATION (SRS)

---

## 📌 1. PROJECT OVERVIEW

The HRMS system is a **multi-tenant web application** designed to manage:

- Employee data
- Attendance
- Leave
- Payroll
- Organizational workflows

### 🛠️ Tech Stack

- Backend: Java Spring Boot
- Frontend: React
- Database: MySQL
- Authentication: JWT

---

## 🧩 2. MODULES & FEATURES

### 🔐 2.1 Authentication & Authorization

- Company Registration
- User Login (email + password + company_code)
- JWT Authentication
- Refresh Token
- Logout
- Forgot Password (OTP)
- Reset Password

#### Roles

- SUPER_ADMIN
- ADMIN
- HR
- MANAGER
- EMPLOYEE

---

### 👨‍💼 2.2 Employee Management

- Create Employee
- Update Employee
- Delete Employee (Soft Delete)
- Employee Profile (personal + job details)
- Department Management
- Designation Management
- Employee Directory (Search / Filter)
- Employee Document Upload

---

### ⏱️ 2.3 Attendance Management

- Clock-in
- Clock-out
- Working Hours Calculation

#### Attendance Status

- Present
- Absent
- Late
- Half-Day
- Work From Home

- Manual Correction (Admin)
- Attendance History
- Attendance Reports

---

### 🌴 2.4 Leave Management

- Leave Types (CL, SL, EL)
- Leave Balance Tracking
- Apply Leave

#### Approval Workflow

- Manager → HR → Admin

- Leave History

---

### 💰 2.5 Payroll Management

- Salary Structure (CTC based)
- Payroll Processing

#### Deductions

- PF
- ESI
- TDS
- LOP

- Salary Slip Generation (PDF)
- Payroll History

---

### 📋 2.6 Task & Project Management

- Create Project
- Assign Tasks
- Task Status Tracking
- Task Comments
- Attachments
- Priority Levels

---

### 📍 2.7 Visit & Meeting Management

- Schedule Visits
- GPS Check-in
- Schedule Meetings
- Manage Participants

---

### 📁 2.8 File Management

- Upload Files
- File Categorization

#### Access Levels

- Private
- Department
- Company

---

### 🔔 2.9 Notifications

- In-App Notifications
- Push Notifications
- Read / Unread Tracking

---

### 📊 2.10 Analytics & Reports

- Dashboard Metrics
- Attendance Reports
- Payroll Reports
- Leave Reports
- Export Reports (PDF / Excel)

---

## 🔌 3. API REQUIREMENTS

### 🔐 Authentication APIs

- POST `/api/v1/auth/register-company`
- POST `/api/v1/auth/login`
- POST `/api/v1/auth/refresh`
- POST `/api/v1/auth/logout`
- POST `/api/v1/auth/forgot-password`
- POST `/api/v1/auth/reset-password`
- GET `/api/v1/auth/me`

---

### 👨‍💼 Employee APIs

- GET `/api/v1/employees`
- POST `/api/v1/employees`
- GET `/api/v1/employees/{id}`
- PUT `/api/v1/employees/{id}`
- DELETE `/api/v1/employees/{id}`

---

### ⏱️ Attendance APIs

- POST `/api/v1/attendance/clock-in`
- POST `/api/v1/attendance/clock-out`
- GET `/api/v1/attendance`
- GET `/api/v1/attendance/today`
- GET `/api/v1/attendance/report`

---

### 🌴 Leave APIs

- GET `/api/v1/leave-types`
- POST `/api/v1/leave/apply`
- GET `/api/v1/leave/my-requests`
- POST `/api/v1/leave/{id}/approve`
- POST `/api/v1/leave/{id}/reject`

---

### 💰 Payroll APIs

- POST `/api/v1/payroll/run`
- GET `/api/v1/payroll/{month}/{year}`
- GET `/api/v1/payroll/slip/{empId}`

---

## 🗄️ 4. DATABASE SCHEMA

### 🧱 Core Tables

- companies
- users
- roles
- employees
- departments
- designations

---

### ⏱️ Attendance

- attendance

---

### 🌴 Leave

- leave_types
- leave_requests

---

### 💰 Payroll

- salary_structures
- payroll

---

### 📋 Tasks

- projects
- tasks

---

### 📦 Others

- visits
- meetings
- files
- notifications

---

## ⚙️ 5. SYSTEM RULES

### 🏢 Multi-Tenancy

- Every table must include: `company_id`

### 🕒 Common Fields

- created_at
- updated_at
- deleted_at (soft delete)

### 🔐 Security

- Password encryption (bcrypt)
- JWT authentication
- Secure sensitive data

---

# ✅ END OF DOCUMENT
