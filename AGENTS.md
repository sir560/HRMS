# SynQ HRMS - Codex Agent Configuration

## Project Overview

This is a full-stack HRMS system built with:

- Frontend: React (Vite + Tailwind)
- Backend: Java Spring Boot (REST APIs)
- Database: MySQL
- Architecture: Multi-tenant (company आधारित system)

## Core Modules

- Authentication (JWT + RBAC)
- Employee Management
- Attendance System
- Leave Management
- Payroll System
- Task & Project Management
- Notifications
- File Management
- Analytics Dashboard

## Development Rules

### Backend (Spring Boot)

- Use layered architecture:
  - Controller → Service → Repository
- Use DTO pattern for API responses
- Use JPA/Hibernate
- Follow REST standards
- Use global exception handling

### Frontend (React)

- Use functional components + hooks
- Use Axios for API calls
- Use Redux Toolkit or Context API
- Follow modular folder structure

### Database

- Use normalized schema from SRS
- Always include:
  - company_id (multi-tenant)
  - created_at, updated_at

### Security

- JWT authentication
- Role-based authorization (RBAC)
- Encrypt sensitive fields (PAN, Aadhaar)

---

## Codex Execution Guidelines

When implementing features:

1. Read feature file
2. Generate API contract
3. Implement backend first
4. Then generate frontend UI
5. Ensure DB schema alignment

---

## Folder Structure

/backend
/src/main/java/com/hrms
/frontend
/src
/features
/agents
/skills

---

## Coding Priorities

1. Authentication first
2. Employee module
3. Attendance
4. Leave
5. Payroll

---

## Testing Strategy

- Backend: JUnit + Mockito
- API: Postman / REST Assured
- Frontend: Playwright (optional)

---

## Commands Codex Should Use

- "Generate Spring Boot module for [feature]"
- "Create REST API for [feature]"
- "Create React UI for [feature]"
- "Connect frontend with backend"
