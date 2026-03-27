import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
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

  return (
    <div className="space-y-6">
      <header className="page-header">
        <div>
          <div className="eyebrow">Employee profile</div>
          <h1 className="page-title">{employee.firstName} {employee.lastName}</h1>
          <p className="page-description">{employee.employeeCode} · {employee.email}</p>
        </div>
        <div className="header-actions">
          <Link className="badge" to="/dashboard">Back to dashboard</Link>
          <Link className="badge" to="/leaves/my">My Leaves</Link>
        </div>
      </header>

      {(error || feedback) && <div className={`banner ${error ? "banner-error" : "banner-success"}`}>{error || feedback}</div>}

      <section className="workspace-grid">
        <Card title="Core details" description="Primary employment and contact information.">
          <dl className="profile-grid">
            <ProfileItem label="Full name" value={`${employee.firstName} ${employee.lastName}`} />
            <ProfileItem label="Employee code" value={employee.employeeCode} />
            <ProfileItem label="Email" value={employee.email} />
            <ProfileItem label="Phone" value={employee.phoneNumber || "-"} />
            <ProfileItem label="Department" value={employee.department?.departmentName || "-"} />
            <ProfileItem label="Designation" value={employee.designation || "-"} />
            <ProfileItem label="Date of joining" value={employee.dateOfJoining} />
            <ProfileItem label="Status" value={employee.employmentStatus.replaceAll("_", " ")} />
            <ProfileItem label="Record state" value={employee.active ? "Active" : "Inactive"} />
            <ProfileItem label="Last updated" value={formatDateTime(employee.updatedAt)} />
          </dl>
        </Card>

        <Card title="Document vault" description="Upload, download, and review employee records.">
          {canManageDocuments ? (
            <form className="stack-form" onSubmit={handleUpload}>
              <select value={uploadForm.documentType} onChange={(event) => setUploadForm((current) => ({ ...current, documentType: event.target.value }))}>
                <option value="GENERAL">General</option>
                <option value="ID_PROOF">ID proof</option>
                <option value="OFFER_LETTER">Offer letter</option>
                <option value="RESUME">Resume</option>
                <option value="CONTRACT">Contract</option>
              </select>
              <input accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={(event) => setUploadForm((current) => ({ ...current, file: event.target.files?.[0] || null }))} type="file" />
              <Button type="submit" disabled={isUploading}>{isUploading ? <span className="flex items-center gap-2"><Loader /> Uploading</span> : "Upload document"}</Button>
            </form>
          ) : null}

          <div className="document-list">
            {employee.documents?.length ? (
              employee.documents.map((item) => (
                <article className="document-card" key={item.employeeDocumentId}>
                  <div className="space-y-1">
                    <strong className="text-slate-900">{item.originalFileName}</strong>
                    <p className="text-sm text-slate-500">{item.documentType.replaceAll("_", " ")} · {formatFileSize(item.fileSize)}</p>
                    <small className="text-xs text-slate-400">Uploaded {formatDateTime(item.createdAt)}</small>
                  </div>
                  <div className="mt-4 table-actions">
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
        </Card>
      </section>
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
