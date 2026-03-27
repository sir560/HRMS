import { useEffect, useMemo, useState } from "react";
import { employeeApi, projectApi, readApiErrorMessage } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import ProjectNav from "./ProjectNav";

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

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <div className="eyebrow">Project workspace</div>
          <h1>Projects and tasks</h1>
          <p>Create projects, assign tasks, track status, and collaborate with files and comments.</p>
        </div>
      </header>

      <ProjectNav />

      {(error || message) && <div className={`banner ${error ? "banner-error" : "banner-success"}`}>{error || message}</div>}

      <section className="workspace-grid workspace-grid-wide">
        <article className="panel form-panel">
          <div className="panel-header compact">
            <div>
              <span className="kicker">Projects</span>
              <h2>Create project</h2>
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
            <input type="date" value={projectForm.startDate} onChange={(event) => setProjectForm((current) => ({ ...current, startDate: event.target.value }))} />
            <input type="date" value={projectForm.endDate} onChange={(event) => setProjectForm((current) => ({ ...current, endDate: event.target.value }))} />
            <button className="primary-button" disabled={!canManage || isSavingProject} type="submit">{isSavingProject ? "Saving..." : "Create project"}</button>
          </form>
          {!canManage ? <p className="hint-text">Your role can view projects but cannot create them.</p> : null}
        </article>

        <article className="panel form-panel">
          <div className="panel-header compact">
            <div>
              <span className="kicker">Tasks</span>
              <h2>Assign task</h2>
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
            <select value={taskForm.priority} onChange={(event) => setTaskForm((current) => ({ ...current, priority: event.target.value }))}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <input type="date" value={taskForm.dueDate} onChange={(event) => setTaskForm((current) => ({ ...current, dueDate: event.target.value }))} />
            <button className="primary-button" disabled={!canManage || isSavingTask || !selectedProjectId} type="submit">{isSavingTask ? "Saving..." : "Create task"}</button>
          </form>
        </article>
      </section>

      <section className="panel data-panel">
        <div className="panel-header compact row-between wrap-row">
          <div>
            <span className="kicker">Project board</span>
            <h2>{selectedProject?.projectName || "Select a project"}</h2>
          </div>
          {selectedProject ? <span className="status-chip">{selectedProject.projectCode}</span> : null}
        </div>
        {isLoading ? (
          <div className="loading-state">Loading projects...</div>
        ) : selectedProject ? (
          <div className="project-task-grid">
            {selectedProject.tasks?.length ? selectedProject.tasks.map((task) => (
              <article className="project-task-card" key={task.taskId}>
                <div className="row-between wrap-row">
                  <strong>{task.title}</strong>
                  <span className={`status-chip task-priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
                </div>
                <p>{task.description || "No description provided."}</p>
                <div className="task-meta-grid">
                  <span>Assignee: {task.assigneeName || "Unassigned"}</span>
                  <span>Due: {task.dueDate || "-"}</span>
                </div>
                <select value={task.status} onChange={(event) => void handleStatusChange(task.taskId, event.target.value)}>
                  <option value="TODO">Todo</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                </select>
                <div className="comment-stack">
                  <strong>Comments</strong>
                  {(task.comments || []).map((comment) => (
                    <div className="comment-card" key={comment.taskCommentId}>
                      <span>{comment.commentedByName}</span>
                      <p>{comment.commentText}</p>
                    </div>
                  ))}
                  {!(task.comments || []).length ? <div className="hint-text">No comments yet.</div> : null}
                  <textarea rows="2" placeholder="Add a comment" value={taskCommentDrafts[task.taskId] || ""} onChange={(event) => setTaskCommentDrafts((current) => ({ ...current, [task.taskId]: event.target.value }))} />
                  <button className="ghost-button compact-button" type="button" onClick={() => void handleAddComment(task.taskId)}>Post comment</button>
                </div>
                <div className="comment-stack">
                  <strong>Attachments</strong>
                  <input type="file" onChange={(event) => void handleUploadAttachment(task.taskId, event.target.files?.[0])} />
                  {(task.attachments || []).map((attachment) => (
                    <button className="ghost-button compact-button align-left" key={attachment.taskAttachmentId} type="button" onClick={() => void handleDownloadAttachment(task.taskId, attachment)}>
                      {attachment.originalFileName}
                    </button>
                  ))}
                  {!(task.attachments || []).length ? <div className="hint-text">No attachments yet.</div> : null}
                </div>
              </article>
            )) : (
              <div className="empty-state">No tasks have been created for this project.</div>
            )}
          </div>
        ) : (
          <div className="empty-state">Create or select a project to manage tasks.</div>
        )}
      </section>
    </div>
  );
}
