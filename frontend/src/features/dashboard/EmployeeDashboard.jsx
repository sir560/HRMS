import { Link } from "react-router-dom";
import { startTransition, useDeferredValue, useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Loader from "../../components/ui/Loader";
import { employeeApi, readApiErrorMessage } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const initialDepartmentForm = {
  departmentName: "",
  departmentCode: "",
  description: "",
};

const initialDesignationForm = {
  designationName: "",
  designationCode: "",
  description: "",
};

const initialEmployeeForm = {
  employeeCode: "",
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  designationId: "",
  dateOfJoining: "",
  employmentStatus: "ACTIVE",
  departmentId: "",
  active: true,
};

const initialPageState = {
  content: [],
  page: 0,
  size: 8,
  totalElements: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

const initialFilters = {
  search: "",
  departmentId: "",
  designationId: "",
  employmentStatus: "",
  active: "true",
};

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [employeesPage, setEmployeesPage] = useState(initialPageState);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [departmentForm, setDepartmentForm] = useState(initialDepartmentForm);
  const [designationForm, setDesignationForm] = useState(initialDesignationForm);
  const [employeeForm, setEmployeeForm] = useState(initialEmployeeForm);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isListLoading, setIsListLoading] = useState(false);
  const [isSavingDepartment, setIsSavingDepartment] = useState(false);
  const [isSavingDesignation, setIsSavingDesignation] = useState(false);
  const [isSavingEmployee, setIsSavingEmployee] = useState(false);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState(null);

  const deferredSearch = useDeferredValue(filters.search);
  const canManageEmployees = hasAnyRole(user, ["SUPER_ADMIN", "ADMIN", "HR"]);
  const canDeleteEmployees = hasAnyRole(user, ["SUPER_ADMIN", "ADMIN"]);

  useEffect(() => {
    void hydrateReferenceData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      void fetchEmployees(0);
    }
  }, [deferredSearch, filters.departmentId, filters.designationId, filters.employmentStatus, filters.active]);

  async function hydrateReferenceData() {
    setIsLoading(true);
    setError("");

    try {
      const [departmentResponse, designationResponse] = await Promise.all([
        employeeApi.getDepartments(),
        employeeApi.getDesignations(),
      ]);

      const nextDepartments = departmentResponse.data || [];
      const nextDesignations = designationResponse.data || [];

      startTransition(() => {
        setDepartments(nextDepartments);
        setDesignations(nextDesignations);
        setEmployeeForm((current) => ({
          ...current,
          departmentId: current.departmentId || String(nextDepartments[0]?.departmentId || ""),
          designationId: current.designationId || String(nextDesignations[0]?.designationId || ""),
        }));
      });

      await fetchEmployees(0);
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to load directory data."));
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchEmployees(nextPage = employeesPage.page) {
    setIsListLoading(true);
    setError("");

    try {
      const response = await employeeApi.getEmployees(
        buildEmployeeQuery({
          ...filters,
          search: deferredSearch,
          page: nextPage,
          size: employeesPage.size,
        })
      );
      startTransition(() => {
        setEmployeesPage(response.data || initialPageState);
      });
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to load employees."));
    } finally {
      setIsListLoading(false);
    }
  }

  async function handleDepartmentSubmit(event) {
    event.preventDefault();
    setIsSavingDepartment(true);
    setError("");
    setFeedback("");

    try {
      await employeeApi.createDepartment(departmentForm);
      setDepartmentForm(initialDepartmentForm);
      setFeedback("Department created successfully.");
      await hydrateReferenceData();
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to create department."));
    } finally {
      setIsSavingDepartment(false);
    }
  }

  async function handleDesignationSubmit(event) {
    event.preventDefault();
    setIsSavingDesignation(true);
    setError("");
    setFeedback("");

    try {
      await employeeApi.createDesignation(designationForm);
      setDesignationForm(initialDesignationForm);
      setFeedback("Designation created successfully.");
      await hydrateReferenceData();
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to create designation."));
    } finally {
      setIsSavingDesignation(false);
    }
  }

  async function handleEmployeeSubmit(event) {
    event.preventDefault();
    setIsSavingEmployee(true);
    setError("");
    setFeedback("");

    try {
      const payload = {
        ...employeeForm,
        departmentId: Number(employeeForm.departmentId),
        designationId: Number(employeeForm.designationId),
        active: Boolean(employeeForm.active),
      };

      if (editingEmployeeId) {
        await employeeApi.updateEmployee(editingEmployeeId, payload);
        setFeedback("Employee updated successfully.");
      } else {
        await employeeApi.createEmployee(payload);
        setFeedback("Employee created successfully.");
      }

      resetEmployeeForm();
      await fetchEmployees(editingEmployeeId ? employeesPage.page : 0);
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, editingEmployeeId ? "Unable to update employee." : "Unable to create employee."));
    } finally {
      setIsSavingEmployee(false);
    }
  }

  async function handleDeleteEmployee(employee) {
    const confirmed = window.confirm(`Delete ${employee.firstName} ${employee.lastName}?`);
    if (!confirmed) {
      return;
    }

    setDeletingEmployeeId(employee.employeeId);
    setError("");
    setFeedback("");

    try {
      await employeeApi.deleteEmployee(employee.employeeId);
      if (editingEmployeeId === employee.employeeId) {
        resetEmployeeForm();
      }
      setFeedback("Employee deleted successfully.");
      await fetchEmployees(employeesPage.content.length === 1 && employeesPage.page > 0 ? employeesPage.page - 1 : employeesPage.page);
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to delete employee."));
    } finally {
      setDeletingEmployeeId(null);
    }
  }

  function startEditingEmployee(employee) {
    setEditingEmployeeId(employee.employeeId);
    setEmployeeForm({
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phoneNumber: employee.phoneNumber || "",
      designationId: String(employee.designationId || ""),
      dateOfJoining: employee.dateOfJoining,
      employmentStatus: employee.employmentStatus,
      departmentId: String(employee.department?.departmentId || ""),
      active: employee.active,
    });
    setFeedback(`Editing ${employee.firstName} ${employee.lastName}.`);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetEmployeeForm() {
    setEditingEmployeeId(null);
    setEmployeeForm({
      ...initialEmployeeForm,
      departmentId: String(departments[0]?.departmentId || ""),
      designationId: String(designations[0]?.designationId || ""),
      active: true,
    });
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  const employees = employeesPage.content || [];

  return (
    <div className="space-y-8">
      <header className="page-header">
        <div>
          <h1 className="page-title">Employee Directory</h1>
          <p className="page-description">Manage and monitor {employeesPage.totalElements || 0} active team members across {departments.length || 0} departments.</p>
        </div>
        <div className="header-actions">
          <Button onClick={resetEmployeeForm} type="button" disabled={!canManageEmployees}>Add New Employee</Button>
        </div>
      </header>

      {(error || feedback) && <div className={`banner ${error ? "banner-error" : "banner-success"}`}>{error || feedback}</div>}

      <section className="directory-toolbar">
        <div className="directory-filter-pill">
          <span>Filter By</span>
          <select name="departmentId" onChange={handleFilterChange} value={filters.departmentId}>
            <option value="">All Departments</option>
            {departments.map((department) => (
              <option key={department.departmentId} value={department.departmentId}>{department.departmentName}</option>
            ))}
          </select>
        </div>

        <div className="directory-filter-pill">
          <span>Status</span>
          <select name="active" onChange={handleFilterChange} value={filters.active}>
            <option value="true">Active Status</option>
            <option value="">All Records</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>

        <div className="directory-view-toggle">
          <button className="active" type="button">Grid</button>
          <button type="button">List</button>
        </div>
      </section>

      <section className="directory-shell">
        {isLoading || isListLoading ? (
          <div className="loading-state gap-3">
            <Loader /> Loading employee directory...
          </div>
        ) : employees.length ? (
          <>
            <div className="directory-head">
              <span>Employee Info</span>
              <span>Employee ID</span>
              <span>Department</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>

            <div className="directory-list">
              {employees.map((employee) => (
                <div className="directory-row" key={employee.employeeId}>
                  <div className={`directory-ribbon ${ribbonClass(employee.employmentStatus)}`}></div>
                  <div className="directory-person">
                    <div className="directory-avatar">{initialsFor(employee.firstName, employee.lastName)}</div>
                    <div>
                      <h4>{employee.firstName} {employee.lastName}</h4>
                      <p>{employee.designation || "Team Member"}</p>
                    </div>
                  </div>
                  <div className="directory-meta">#{employee.employeeCode}</div>
                  <div className="directory-meta">{employee.department?.departmentName || "-"}</div>
                  <div>
                    <span className={`directory-status ${statusClass(employee.employmentStatus)}`}>{formatEmploymentStatus(employee.employmentStatus)}</span>
                  </div>
                  <div className="directory-actions">
                    <Link className="directory-action-link" to={`/employees/${employee.employeeId}`}>See</Link>
                    {canManageEmployees ? <button className="directory-action-link" onClick={() => startEditingEmployee(employee)} type="button">Edit</button> : null}
                    {canDeleteEmployees ? (
                      <button className="directory-action-link danger" disabled={deletingEmployeeId === employee.employeeId} onClick={() => void handleDeleteEmployee(employee)} type="button">
                        {deletingEmployeeId === employee.employeeId ? "..." : "Remove"}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="directory-pagination">
              <p>Showing {employeesPage.page * employeesPage.size + 1}-{employeesPage.page * employeesPage.size + employees.length} of {employeesPage.totalElements || employees.length} entries</p>
              <div className="pagination-actions">
                <Button variant="ghost" disabled={!employeesPage.hasPrevious} onClick={() => void fetchEmployees(employeesPage.page - 1)} type="button">Previous</Button>
                <Button variant="ghost" disabled={!employeesPage.hasNext} onClick={() => void fetchEmployees(employeesPage.page + 1)} type="button">Next</Button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState title="No employees found" description="Adjust filters or create a new employee record." />
        )}
      </section>

      <section className="workspace-grid workspace-grid-wide">
        <Card title="Departments" description="Create the teams that employees belong to.">
          <form className="stack-form" onSubmit={handleDepartmentSubmit}>
            <input placeholder="Department name" required value={departmentForm.departmentName} onChange={(event) => setDepartmentForm((current) => ({ ...current, departmentName: event.target.value }))} />
            <input placeholder="Department code" required value={departmentForm.departmentCode} onChange={(event) => setDepartmentForm((current) => ({ ...current, departmentCode: event.target.value }))} />
            <textarea rows="3" placeholder="Short description" value={departmentForm.description} onChange={(event) => setDepartmentForm((current) => ({ ...current, description: event.target.value }))} />
            <Button className="w-full" type="submit" disabled={isSavingDepartment}>{isSavingDepartment ? <span className="flex items-center gap-2"><Loader /> Saving</span> : "Create department"}</Button>
          </form>
        </Card>

        <Card title="Designations" description="Maintain a consistent role catalog across the company.">
          <form className="stack-form" onSubmit={handleDesignationSubmit}>
            <input placeholder="Designation name" required value={designationForm.designationName} onChange={(event) => setDesignationForm((current) => ({ ...current, designationName: event.target.value }))} />
            <input placeholder="Designation code" required value={designationForm.designationCode} onChange={(event) => setDesignationForm((current) => ({ ...current, designationCode: event.target.value }))} />
            <textarea rows="3" placeholder="Short description" value={designationForm.description} onChange={(event) => setDesignationForm((current) => ({ ...current, description: event.target.value }))} />
            <Button className="w-full" type="submit" disabled={isSavingDesignation}>{isSavingDesignation ? <span className="flex items-center gap-2"><Loader /> Saving</span> : "Create designation"}</Button>
          </form>
        </Card>

        <Card title={editingEmployeeId ? "Update employee profile" : "Add team member"} description="Use this form to create or update employee records.">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="badge">{canManageEmployees ? "HR management access" : "Read-only access"}</span>
            {editingEmployeeId ? <Button variant="ghost" onClick={resetEmployeeForm} type="button">Cancel edit</Button> : null}
          </div>

          <form className="employee-form-grid" onSubmit={handleEmployeeSubmit}>
            <input placeholder="Employee code" disabled={Boolean(editingEmployeeId)} required value={employeeForm.employeeCode} onChange={(event) => setEmployeeForm((current) => ({ ...current, employeeCode: event.target.value }))} />
            <input placeholder="First name" required value={employeeForm.firstName} onChange={(event) => setEmployeeForm((current) => ({ ...current, firstName: event.target.value }))} />
            <input placeholder="Last name" required value={employeeForm.lastName} onChange={(event) => setEmployeeForm((current) => ({ ...current, lastName: event.target.value }))} />
            <input placeholder="Work email" required type="email" value={employeeForm.email} onChange={(event) => setEmployeeForm((current) => ({ ...current, email: event.target.value }))} />
            <input placeholder="Phone number" value={employeeForm.phoneNumber} onChange={(event) => setEmployeeForm((current) => ({ ...current, phoneNumber: event.target.value }))} />
            <select required value={employeeForm.designationId} onChange={(event) => setEmployeeForm((current) => ({ ...current, designationId: event.target.value }))}>
              <option value="">Select designation</option>
              {designations.map((designation) => (
                <option key={designation.designationId} value={designation.designationId}>{designation.designationName}</option>
              ))}
            </select>
            <input required type="date" value={employeeForm.dateOfJoining} onChange={(event) => setEmployeeForm((current) => ({ ...current, dateOfJoining: event.target.value }))} />
            <select value={employeeForm.employmentStatus} onChange={(event) => setEmployeeForm((current) => ({ ...current, employmentStatus: event.target.value }))}>
              <option value="ACTIVE">Active</option>
              <option value="ON_PROBATION">On probation</option>
              <option value="NOTICE_PERIOD">Notice period</option>
              <option value="RESIGNED">Resigned</option>
              <option value="TERMINATED">Terminated</option>
            </select>
            <select required value={employeeForm.departmentId} onChange={(event) => setEmployeeForm((current) => ({ ...current, departmentId: event.target.value }))}>
              <option value="">Select department</option>
              {departments.map((department) => (
                <option key={department.departmentId} value={department.departmentId}>{department.departmentName}</option>
              ))}
            </select>
            {editingEmployeeId ? (
              <label className="inline-toggle">
                <input checked={employeeForm.active} onChange={(event) => setEmployeeForm((current) => ({ ...current, active: event.target.checked }))} type="checkbox" />
                Keep employee active
              </label>
            ) : null}
            <Button className="wide-button" type="submit" disabled={isSavingEmployee || departments.length === 0 || designations.length === 0 || !canManageEmployees}>
              {isSavingEmployee ? <span className="flex items-center gap-2"><Loader /> Saving employee</span> : editingEmployeeId ? "Update employee" : "Create employee"}
            </Button>
          </form>
        </Card>
      </section>
    </div>
  );
}

function buildEmployeeQuery({ search, departmentId, designationId, employmentStatus, active, page, size }) {
  return {
    page,
    size,
    ...(search ? { search } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(designationId ? { designationId } : {}),
    ...(employmentStatus ? { employmentStatus } : {}),
    ...(active !== "" ? { active } : {}),
  };
}

function hasAnyRole(user, roles) {
  const userRoles = user?.roles || [];
  return roles.some((role) => userRoles.includes(role));
}

function initialsFor(firstName, lastName) {
  return `${firstName?.[0] || "E"}${lastName?.[0] || "M"}`;
}

function formatEmploymentStatus(status) {
  return status.replaceAll("_", " ");
}

function statusClass(status) {
  if (status === "ACTIVE") {
    return "active";
  }
  if (status === "TERMINATED" || status === "RESIGNED") {
    return "inactive";
  }
  return "on-leave";
}

function ribbonClass(status) {
  if (status === "ACTIVE") {
    return "active";
  }
  if (status === "TERMINATED" || status === "RESIGNED") {
    return "inactive";
  }
  return "on-leave";
}
