import { useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import { employeeApi, projectApi, readApiErrorMessage } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const initialProjectForm = {
  projectName: "",
  projectCode: "",
  description: "",
  ownerEmployeeId: "",
  startDate: "",
  endDate: "",
};

const initialTaskForm = {
  title: "",
  description: "",
  assigneeEmployeeId: "",
  priority: "MEDIUM",
  dueDate: "",
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectForm, setProjectForm] = useState(initialProjectForm);
  const [taskForm, setTaskForm] = useState(initialTaskForm);
  const [taskCommentDrafts, setTaskCommentDrafts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const canManage = useMemo(
    () => ["SUPER_ADMIN", "ADMIN", "HR", "MANAGER"].some((role) => user?.roles?.includes(role)),
    [user]
  );

  useEffect(() => {
    void hydrate();
  }, []);

  async function hydrate() {
    setIsLoading(true);
    setError("");
    try {
      const [projectsResponse, employeesResponse] = await Promise.all([
        projectApi.getProjects(),
        employeeApi.getEmployees({ page: 0, size: 100, active: true }),
      ]);
      const nextProjects = projectsResponse.data || [];
      const nextEmployees = employeesResponse.data.content || [];
      setProjects(nextProjects);
      setEmployees(nextEmployees);
      setSelectedProjectId((current) => current || String(nextProjects[0]?.projectId || ""));
      setProjectForm((current) => ({ ...current, ownerEmployeeId: current.ownerEmployeeId || String(nextEmployees[0]?.employeeId || "") }));
      setTaskForm((current) => ({ ...current, assigneeEmployeeId: current.assigneeEmployeeId || String(nextEmployees[0]?.employeeId || "") }));
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to load project workspace."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleProjectSubmit(event) {
    event.preventDefault();
    setIsSavingProject(true);
    setError("");
    setMessage("");
    try {
      const response = await projectApi.createProject({
        ...projectForm,
        ownerEmployeeId: projectForm.ownerEmployeeId ? Number(projectForm.ownerEmployeeId) : undefined,
      });
      setMessage("Project created successfully.");
      setProjectForm({ ...initialProjectForm, ownerEmployeeId: projectForm.ownerEmployeeId });
      await hydrate();
      setSelectedProjectId(String(response.data.projectId));
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to create project."));
    } finally {
      setIsSavingProject(false);
    }
  }

  async function handleTaskSubmit(event) {
    event.preventDefault();
    if (!selectedProjectId) {
      setError("Select a project before adding a task.");
      return;
    }
    setIsSavingTask(true);
    setError("");
    setMessage("");
    try {
      await projectApi.createTask(Number(selectedProjectId), {
        ...taskForm,
        assigneeEmployeeId: taskForm.assigneeEmployeeId ? Number(taskForm.assigneeEmployeeId) : undefined,
      });
      setMessage("Task created successfully.");
      setTaskForm((current) => ({ ...initialTaskForm, assigneeEmployeeId: current.assigneeEmployeeId, priority: "MEDIUM" }));
      await hydrate();
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to create task."));
    } finally {
      setIsSavingTask(false);
    }
  }

  async function handleStatusChange(taskId, status) {
    setError("");
    setMessage("");
    try {
      await projectApi.updateTaskStatus(taskId, { status });
      setMessage("Task status updated successfully.");
      await hydrate();
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to update task status."));
    }
  }

  async function handleAddComment(taskId) {
    const commentText = taskCommentDrafts[taskId]?.trim();
    if (!commentText) {
      setError("Enter a comment before posting.");
      return;
    }
    setError("");
    setMessage("");
    try {
      await projectApi.addTaskComment(taskId, { commentText });
      setTaskCommentDrafts((current) => ({ ...current, [taskId]: "" }));
      setMessage("Task comment added successfully.");
      await hydrate();
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to add task comment."));
    }
  }

  async function handleUploadAttachment(taskId, file) {
    if (!file) {
      return;
    }
    setError("");
    setMessage("");
    try {
      await projectApi.uploadTaskAttachment(taskId, file);
      setMessage("Task attachment uploaded successfully.");
      await hydrate();
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to upload task attachment."));
    }
  }

  async function handleDownloadAttachment(taskId, attachment) {
    setError("");
    try {
      const response = await projectApi.downloadTaskAttachment(taskId, attachment.taskAttachmentId);
      const objectUrl = window.URL.createObjectURL(response.blob);
      const link = window.document.createElement("a");
      link.href = objectUrl;
      link.download = response.fileName || attachment.originalFileName;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to download task attachment."));
    }
  }

  const selectedProject = projects.find((project) => String(project.projectId) === selectedProjectId) || null;
  const spotlightProject = selectedProject || projects[0] || null;
  const secondaryProject = projects.find((project) => project.projectId !== spotlightProject?.projectId) || null;
  const governanceColumns = {
    TODO: [],
    IN_PROGRESS: [],
    IN_REVIEW: [],
    DONE: [],
  };

  (spotlightProject?.tasks || []).forEach((task) => {
    if (governanceColumns[task.status]) {
      governanceColumns[task.status].push(task);
    }
  });

  const employeeCapacity = employees.slice(0, 4);

  return (
    <div className="space-y-8">
      <header className="page-header">
        <div>
          <div className="eyebrow">Architect HRMS</div>
          <h1 className="page-title">Operational Pulse</h1>
          <p className="page-description">Tracking {projects.length || 0} active high-scale developments.</p>
        </div>
        <div className="header-actions">
          <span className="hero-chip">{employees.length || 0} Staff</span>
          <Button variant="secondary">Filter View</Button>
        </div>
      </header>

      {(error || message) && <div className={`banner ${error ? "banner-error" : "banner-success"}`}>{error || message}</div>}

      <section className="projects-hero-grid">
        <article className="project-spotlight-card">
          <div className="project-spotlight-flag">High Priority</div>
          {spotlightProject ? (
            <>
              <div className="row-between">
                <div>
                  <h2>{spotlightProject.projectName}</h2>
                  <p>{spotlightProject.description || "Mixed-use sustainable development currently in active execution."}</p>
                </div>
                <div className="project-spotlight-date">
                  <span>Due Date</span>
                  <strong>{spotlightProject.endDate || "Oct 24, 2024"}</strong>
                </div>
              </div>

              <div className="project-spotlight-metrics">
                <SpotlightMetric label="Execution Progress" value={`${calculateProjectProgress(spotlightProject.tasks)}%`} detail="" />
                <SpotlightMetric label="Resource Load" value={`${countAssignedStaff(spotlightProject.tasks)} Staff`} detail={`${Math.max(countAssignedStaff(spotlightProject.tasks) - 2, 0)} Senior Leads`} />
                <SpotlightMetric label="Status" value={humanizeStatus(findPrimaryStatus(spotlightProject.tasks))} detail={`Updated ${formatRelativeUpdate(spotlightProject.updatedAt)}`} />
              </div>

              <div className="row-between">
                <div className="project-member-stack">
                  {employeeCapacity.map((employee) => (
                    <span key={employee.employeeId}>{employee.firstName?.[0]}{employee.lastName?.[0]}</span>
                  ))}
                  <small>+ {Math.max(employees.length - employeeCapacity.length, 0)} Team Members</small>
                </div>
                <Button>Project Space</Button>
              </div>
            </>
          ) : (
            <div className="empty-state">Create your first project to unlock the executive view.</div>
          )}
        </article>

        <article className="project-secondary-card">
          {secondaryProject ? (
            <>
              <div className="row-between">
                <span className="project-secondary-chip">On Track</span>
                <button className="project-dots-button" type="button">...</button>
              </div>
              <h3>{secondaryProject.projectName}</h3>
              <p>{secondaryProject.description || "Sustainable housing initiative integrating solar harvesting and vertical gardens."}</p>
              <div className="project-mini-metrics">
                <div><span>Phases Completed</span><strong>{Math.min(secondaryProject.tasks?.length || 0, 4)}/10</strong></div>
                <div><span>Budget Burn</span><strong>$1.2M / $3M</strong></div>
              </div>
              <div className="project-milestone-card">
                <span>Next Milestone</span>
                <strong>{secondaryProject.endDate || "Foundation Pouring"}</strong>
              </div>
            </>
          ) : (
            <div className="empty-state">A second project will appear here once your portfolio expands.</div>
          )}
        </article>
      </section>

      <section className="project-governance-panel">
        <div className="panel-header compact row-between wrap-row">
          <div>
            <span className="kicker">Task Governance</span>
            <h2>{spotlightProject?.projectName || "Task Governance"}</h2>
          </div>
          <div className="header-actions">
            <button className="project-view-toggle active" type="button">Board</button>
            <button className="project-view-toggle" type="button">List</button>
          </div>
        </div>
        {isLoading ? (
          <div className="loading-state">Loading projects...</div>
        ) : spotlightProject ? (
          <div className="project-governance-columns">
            {Object.entries(governanceColumns).map(([status, tasks]) => (
              <section className="project-governance-column" key={status}>
                <div className={`project-column-header ${status.toLowerCase()}`}>
                  <span>{humanizeStatus(status)}</span>
                  <strong>{tasks.length}</strong>
                </div>
                <div className="project-column-stack">
                  {tasks.length ? tasks.map((task) => (
                    <article className="project-governance-card" key={task.taskId}>
                      <span className="project-governance-tag">{task.category || "Documentation"}</span>
                      <h3>{task.title}</h3>
                      <p>{task.description || "No description provided."}</p>
                      <div className="project-governance-footer">
                        <div className="project-mini-avatars">
                          <span>{task.assigneeName?.split(" ").map((part) => part[0]).join("").slice(0, 2) || "NA"}</span>
                        </div>
                        <span className={`project-priority-badge ${task.priority.toLowerCase()}`}>{task.priority}</span>
                      </div>
                      <select value={task.status} onChange={(event) => void handleStatusChange(task.taskId, event.target.value)}>
                        <option value="TODO">Todo</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="DONE">Done</option>
                      </select>
                      <textarea rows="2" placeholder="Add a comment" value={taskCommentDrafts[task.taskId] || ""} onChange={(event) => setTaskCommentDrafts((current) => ({ ...current, [task.taskId]: event.target.value }))} />
                      <div className="project-card-actions">
                        <button className="project-link-button" type="button" onClick={() => void handleAddComment(task.taskId)}>Post Comment</button>
                        <label className="project-upload-label">
                          Attach
                          <input type="file" onChange={(event) => void handleUploadAttachment(task.taskId, event.target.files?.[0])} />
                        </label>
                      </div>
                      {(task.attachments || []).length ? (
                        <div className="project-attachment-list">
                          {task.attachments.map((attachment) => (
                            <button key={attachment.taskAttachmentId} type="button" onClick={() => void handleDownloadAttachment(task.taskId, attachment)}>
                              {attachment.originalFileName}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  )) : (
                    <div className="project-empty-card">No tasks in this lane.</div>
                  )}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="empty-state">Create or select a project to manage tasks.</div>
        )}
      </section>

      <section className="project-lower-grid">
        <article className="project-form-card">
          <div className="panel-header compact">
            <div>
              <span className="kicker">Projects</span>
              <h2>Create Project</h2>
            </div>
          </div>
          <form className="stack-form" onSubmit={handleProjectSubmit}>
            <input placeholder="Project name" value={projectForm.projectName} onChange={(event) => setProjectForm((current) => ({ ...current, projectName: event.target.value }))} required />
            <input placeholder="Project code" value={projectForm.projectCode} onChange={(event) => setProjectForm((current) => ({ ...current, projectCode: event.target.value }))} required />
            <textarea rows="3" placeholder="Project description" value={projectForm.description} onChange={(event) => setProjectForm((current) => ({ ...current, description: event.target.value }))} />
            <select value={projectForm.ownerEmployeeId} onChange={(event) => setProjectForm((current) => ({ ...current, ownerEmployeeId: event.target.value }))}>
              <option value="">Select owner</option>
              {employees.map((employee) => <option key={employee.employeeId} value={employee.employeeId}>{employee.firstName} {employee.lastName}</option>)}
            </select>
            <div className="project-form-dates">
              <input type="date" value={projectForm.startDate} onChange={(event) => setProjectForm((current) => ({ ...current, startDate: event.target.value }))} />
              <input type="date" value={projectForm.endDate} onChange={(event) => setProjectForm((current) => ({ ...current, endDate: event.target.value }))} />
            </div>
            <Button disabled={!canManage || isSavingProject} type="submit">{isSavingProject ? "Saving..." : "Create Project"}</Button>
          </form>
          {!canManage ? <p className="hint-text">Your role can review projects but cannot create them.</p> : null}
        </article>

        <article className="project-form-card">
          <div className="panel-header compact">
            <div>
              <span className="kicker">Tasks</span>
              <h2>Assign Task</h2>
            </div>
          </div>
          <select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}>
            <option value="">Select project</option>
            {projects.map((project) => <option key={project.projectId} value={project.projectId}>{project.projectName}</option>)}
          </select>
          <form className="stack-form" onSubmit={handleTaskSubmit}>
            <input placeholder="Task title" value={taskForm.title} onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))} required />
            <textarea rows="3" placeholder="Task description" value={taskForm.description} onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))} />
            <select value={taskForm.assigneeEmployeeId} onChange={(event) => setTaskForm((current) => ({ ...current, assigneeEmployeeId: event.target.value }))}>
              <option value="">Select assignee</option>
              {employees.map((employee) => <option key={employee.employeeId} value={employee.employeeId}>{employee.firstName} {employee.lastName}</option>)}
            </select>
            <div className="project-form-dates">
              <select value={taskForm.priority} onChange={(event) => setTaskForm((current) => ({ ...current, priority: event.target.value }))}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
              <input type="date" value={taskForm.dueDate} onChange={(event) => setTaskForm((current) => ({ ...current, dueDate: event.target.value }))} />
            </div>
            <Button disabled={!canManage || isSavingTask || !selectedProjectId} type="submit">{isSavingTask ? "Saving..." : "Create Task"}</Button>
          </form>
        </article>

        <article className="project-heatmap-card">
          <div className="panel-header compact">
            <div>
              <span className="kicker">Staff Allocation Heatmap</span>
              <h2>Team Capacity</h2>
            </div>
          </div>
          <div className="project-heatmap-grid">
            {employeeCapacity.length ? employeeCapacity.map((employee, index) => (
              <div className="project-heatmap-member" key={employee.employeeId}>
                <div className="project-heatmap-avatar">{employee.firstName?.[0]}{employee.lastName?.[0]}</div>
                <h3>{employee.firstName} {employee.lastName}</h3>
                <p>{employee.designation || "Operations Staff"}</p>
                <span className={`project-capacity-badge ${index % 2 === 0 ? "hot" : "cool"}`}>
                  {index % 2 === 0 ? "92% Capacity" : "45% Capacity"}
                </span>
              </div>
            )) : (
              <div className="empty-state">No active employees available for allocation.</div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function SpotlightMetric({ label, value, detail }) {
  return (
    <article className="project-spotlight-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function calculateProjectProgress(tasks = []) {
  if (!tasks.length) {
    return 0;
  }
  const doneCount = tasks.filter((task) => task.status === "DONE").length;
  return Math.round((doneCount / tasks.length) * 100);
}

function countAssignedStaff(tasks = []) {
  return new Set(tasks.map((task) => task.assigneeEmployeeId || task.assigneeName).filter(Boolean)).size;
}

function findPrimaryStatus(tasks = []) {
  if (!tasks.length) {
    return "TODO";
  }
  if (tasks.some((task) => task.status === "IN_REVIEW")) {
    return "IN_REVIEW";
  }
  if (tasks.some((task) => task.status === "IN_PROGRESS")) {
    return "IN_PROGRESS";
  }
  if (tasks.every((task) => task.status === "DONE")) {
    return "DONE";
  }
  return "TODO";
}

function humanizeStatus(status) {
  return status.replaceAll("_", " ");
}

function formatRelativeUpdate(value) {
  if (!value) {
    return "today";
  }
  const updatedAt = new Date(value);
  const diffHours = Math.max(Math.round((Date.now() - updatedAt.getTime()) / (1000 * 60 * 60)), 0);
  if (diffHours < 1) {
    return "just now";
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  return `${Math.round(diffHours / 24)}d ago`;
}
