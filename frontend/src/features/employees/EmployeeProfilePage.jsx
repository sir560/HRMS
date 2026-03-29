import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Loader from "../../components/ui/Loader";
import { useAuth } from "../../context/AuthContext";
import { employeeApi, readApiErrorMessage } from "../../services/api";

const initialUploadForm = {
  documentType: "GENERAL",
  file: null,
};

export default function EmployeeProfilePage() {
  const { employeeId } = useParams();
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [uploadForm, setUploadForm] = useState(initialUploadForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const canManageDocuments = useMemo(
    () => ["SUPER_ADMIN", "ADMIN", "HR", "MANAGER"].some((role) => user?.roles?.includes(role)),
    [user]
  );

  const canDeleteDocuments = useMemo(
    () => ["SUPER_ADMIN", "ADMIN", "HR"].some((role) => user?.roles?.includes(role)),
    [user]
  );

  useEffect(() => {
    void loadEmployee();
  }, [employeeId]);

  async function loadEmployee() {
    setIsLoading(true);
    setError("");

    try {
      const response = await employeeApi.getEmployeeById(employeeId);
      setEmployee(response.data);
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to load employee profile."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpload(event) {
    event.preventDefault();
    if (!uploadForm.file) {
      setError("Select a document file to upload.");
      return;
    }

    setIsUploading(true);
    setError("");
    setFeedback("");

    try {
      await employeeApi.uploadEmployeeDocument(employeeId, uploadForm);
      setUploadForm(initialUploadForm);
      setFeedback("Employee document uploaded successfully.");
      await loadEmployee();
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to upload employee document."));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDeleteDocument(document) {
    const confirmed = window.confirm(`Delete ${document.originalFileName}?`);
    if (!confirmed) {
      return;
    }

    setDeletingDocumentId(document.employeeDocumentId);
    setError("");
    setFeedback("");

    try {
      await employeeApi.deleteEmployeeDocument(employeeId, document.employeeDocumentId);
      setFeedback("Employee document deleted successfully.");
      await loadEmployee();
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to delete employee document."));
    } finally {
      setDeletingDocumentId(null);
    }
  }

  async function handleDownloadDocument(employeeDocument) {
    setError("");

    try {
      const response = await employeeApi.downloadEmployeeDocument(employeeId, employeeDocument.employeeDocumentId);
      const objectUrl = window.URL.createObjectURL(response.blob);
      const link = window.document.createElement("a");
      link.href = objectUrl;
      link.download = response.fileName || employeeDocument.originalFileName;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (requestError) {
      setError(readApiErrorMessage(requestError, "Unable to download employee document."));
    }
  }

  if (isLoading) {
    return <div className="loading-state gap-3"><Loader /> Loading employee profile...</div>;
  }

  if (!employee) {
    return <EmptyState title="Employee unavailable" description="The requested employee profile could not be loaded." />;
  }

  const initials = `${employee.firstName?.[0] || ""}${employee.lastName?.[0] || ""}`.toUpperCase();
  const documents = employee.documents || [];
  const assignments = documents.slice(0, 2);
  const bioParagraphs = [
    `${employee.firstName} ${employee.lastName} is currently working as ${employee.designation || "a team member"}${employee.department?.departmentName ? ` in the ${employee.department.departmentName} department` : ""}. This profile consolidates the core employment details, contact channels, and attached records available in the HRMS workspace.`,
    employee.phoneNumber
      ? `Primary coordination happens through ${employee.email} and ${employee.phoneNumber}. Managers can use the document vault below to review contracts, resumes, identity proofs, and related employee records.`
      : `Primary coordination happens through ${employee.email}. Managers can use the document vault below to review contracts, resumes, identity proofs, and related employee records.`,
  ];

  return (
    <div className="space-y-6">
      <section className="profile-hero-shell">
        <div className="profile-hero-topbar">
          <div className="profile-crumbs">
            <Link to="/dashboard">Architectural HRMS</Link>
            <span>Employee Profile</span>
          </div>
          <div className="profile-top-actions">
            <span className="hero-chip">Live Record</span>
          </div>
        </div>

        <div className="profile-hero-card">
          <div className="profile-hero-main">
            <div className="profile-avatar-frame">
              <div className="profile-avatar-large">{initials}</div>
              <span className={`profile-avatar-status ${employee.active ? "active" : "inactive"}`}>
                {employee.active ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="profile-identity-block">
              <div className="eyebrow"># {employee.employeeCode || "EMP"}</div>
              <h1>{employee.firstName} {employee.lastName}</h1>
              <div className="profile-title-line">
                <span>{employee.designation || "Team Member"}</span>
                <span>{employee.department?.departmentName || "Core Operations"}</span>
              </div>
            </div>
          </div>

          <div className="profile-hero-actions">
            <Button>Edit Profile</Button>
            <Button variant="ghost" onClick={() => window.print()} type="button">Export CV</Button>
            <Link className="profile-message-link" to="/employees">Employee Directory</Link>
          </div>
        </div>

        <div className="profile-tabs-row">
          <span className="active">Overview</span>
          <span>Personal Details</span>
          <span>Job &amp; Pay</span>
          <span>Attendance &amp; Leave</span>
          <span>Documents</span>
        </div>
      </section>

      {(error || feedback) && <div className={`banner ${error ? "banner-error" : "banner-success"}`}>{error || feedback}</div>}

      <section className="profile-content-grid">
        <div className="profile-main-column">
          <section className="profile-metric-row">
            <MetricCard accent="blue" label="Tenure" value={calculateTenure(employee.dateOfJoining)} sublabel="Years" />
            <MetricCard accent="amber" label="Completed" value={documents.length || 0} sublabel="Records" />
            <MetricCard accent="green" label="Performance" value={employee.active ? "4.8" : "3.6"} sublabel="/ 5.0" />
          </section>

          <section className="profile-section-card">
            <div className="profile-section-heading blue">
              <span></span>
              <h2>Professional Bio</h2>
            </div>
            <div className="profile-bio-card">
              {bioParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>

          <section className="profile-section-card">
            <div className="profile-section-heading amber">
              <span></span>
              <h2>Current Assignments</h2>
            </div>
            <div className="profile-assignment-stack">
              {assignments.length ? assignments.map((item, index) => (
                <article className="profile-assignment-card" key={item.employeeDocumentId}>
                  <div className="row-between">
                    <div>
                      <h3>{item.originalFileName}</h3>
                      <p>Type: {item.documentType.replaceAll("_", " ")}</p>
                    </div>
                    <span className={`profile-assignment-chip ${index === 0 ? "priority" : "steady"}`}>
                      {index === 0 ? "High Priority" : "On Track"}
                    </span>
                  </div>
                  <div className="profile-assignment-progress">
                    <div style={{ width: `${index === 0 ? 75 : 42}%` }}></div>
                  </div>
                  <div className="row-between">
                    <span className="profile-assignment-label">Progress</span>
                    <strong>{index === 0 ? "75%" : "42%"}</strong>
                  </div>
                </article>
              )) : (
                <div className="empty-state">No active assignments or documents are attached to this employee yet.</div>
              )}
            </div>
          </section>

          <section className="profile-section-card">
            <div className="profile-section-heading blue">
              <span></span>
              <h2>Document Vault</h2>
            </div>

            {canManageDocuments ? (
              <form className="profile-upload-form" onSubmit={handleUpload}>
                <select value={uploadForm.documentType} onChange={(event) => setUploadForm((current) => ({ ...current, documentType: event.target.value }))}>
                  <option value="GENERAL">General</option>
                  <option value="ID_PROOF">ID Proof</option>
                  <option value="OFFER_LETTER">Offer Letter</option>
                  <option value="RESUME">Resume</option>
                  <option value="CONTRACT">Contract</option>
                </select>
                <input accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={(event) => setUploadForm((current) => ({ ...current, file: event.target.files?.[0] || null }))} type="file" />
                <Button type="submit" disabled={isUploading}>{isUploading ? <span className="flex items-center gap-2"><Loader /> Uploading</span> : "Upload Document"}</Button>
              </form>
            ) : null}

            <div className="profile-document-stack">
              {documents.length ? (
                documents.map((item) => (
                  <article className="profile-document-card" key={item.employeeDocumentId}>
                    <div>
                      <h3>{item.originalFileName}</h3>
                      <p>{item.documentType.replaceAll("_", " ")} | {formatFileSize(item.fileSize)}</p>
                      <small>Uploaded {formatDateTime(item.createdAt)}</small>
                    </div>
                    <div className="table-actions">
                      <Button variant="ghost" size="sm" onClick={() => void handleDownloadDocument(item)} type="button">Download</Button>
                      {canDeleteDocuments ? (
                        <Button variant="danger" size="sm" disabled={deletingDocumentId === item.employeeDocumentId} onClick={() => void handleDeleteDocument(item)} type="button">
                          {deletingDocumentId === item.employeeDocumentId ? "Deleting..." : "Delete"}
                        </Button>
                      ) : null}
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState className="min-h-[180px]" title="No documents uploaded" description="Add contracts, ID proofs, resumes, or other records for this employee." />
              )}
            </div>
          </section>
        </div>

        <aside className="profile-side-column">
          <section className="profile-side-card">
            <h3>Contact Channels</h3>
            <div className="profile-contact-list">
              <ProfileContactItem label="Work Email" value={employee.email} />
              <ProfileContactItem label="Personal Email" value={employee.personalEmail || employee.email} />
              <ProfileContactItem label="Phone" value={employee.phoneNumber || "-"} />
            </div>
          </section>

          <section className="profile-side-card">
            <h3>Employment Node</h3>
            <dl className="profile-side-list">
              <ProfileItem label="Reporting Manager" value={employee.reportingManagerName || "Not assigned"} />
              <ProfileItem label="Joining Date" value={employee.dateOfJoining || "-"} />
              <ProfileItem label="Pay Grade" value={employee.payGrade || "L7 - Executive"} />
              <ProfileItem label="Bank Details" value="View Encrypted" />
            </dl>
          </section>

          <section className="profile-side-card">
            <h3>Personal Profile</h3>
            <dl className="profile-side-grid">
              <ProfileItem label="Birth Date" value={employee.dateOfBirth || "-"} />
              <ProfileItem label="Nationality" value={employee.nationality || "Indian"} />
              <ProfileItem label="Gender" value={employee.gender || "-"} />
              <ProfileItem label="Marital Status" value={employee.maritalStatus || "-"} />
              <ProfileItem label="Status" value={employee.employmentStatus.replaceAll("_", " ")} />
              <ProfileItem label="Last Updated" value={formatDateTime(employee.updatedAt)} />
            </dl>
          </section>
        </aside>
      </section>
    </div>
  );
}

function MetricCard({ accent, label, value, sublabel }) {
  return (
    <article className={`profile-metric-card ${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{sublabel}</small>
    </article>
  );
}

function ProfileContactItem({ label, value }) {
  return (
    <div className="profile-contact-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProfileItem({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatFileSize(bytes) {
  if (!bytes) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function calculateTenure(dateOfJoining) {
  if (!dateOfJoining) {
    return "0.0";
  }

  const joinDate = new Date(dateOfJoining);
  const years = (Date.now() - joinDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  return Math.max(years, 0).toFixed(1);
}
