import Button from "../../components/ui/Button";

const documents = [
  { name: "Q3_Earnings_Strategy.pdf", type: "PDF", size: "4.2 MB", modified: "Oct 12, 2023", access: "Department" },
  { name: "Employee_Handbook_2024.docx", type: "DOCX", size: "1.8 MB", modified: "Oct 09, 2023", access: "Company" },
  { name: "Payroll_Summary_OCT.xlsx", type: "XLSX", size: "842 KB", modified: "Oct 15, 2023", access: "Private" },
  { name: "Brand_Identity_Assets_V2.zip", type: "ZIP", size: "124.5 MB", modified: "Sep 28, 2023", access: "Company" },
];

export default function FilesPage() {
  return (
    <div className="space-y-8">
      <header className="page-header">
        <div>
          <h1 className="page-title">File Management</h1>
          <p className="page-description">Manage and organize secure organizational documents.</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary">Filter</Button>
          <Button>Upload File</Button>
        </div>
      </header>

      <section className="file-summary-grid">
        <FileVaultCard title="Private Files" subtitle="Payroll, contracts, and sensitive assets." count="124 Files" size="2.4 GB" variant="blue" />
        <FileVaultCard title="Department" subtitle="Strategy docs, project briefs, and assets." count="856 Files" size="14.8 GB" variant="amber" />
        <FileVaultCard title="Company Wide" subtitle="Policies, branding, and standard procedures." count="3,492 Files" size="156.2 GB" variant="cyan" />
      </section>

      <section className="activity-panel">
        <div className="activity-panel-header">
          <h3>Recent Documents</h3>
          <div className="header-actions">
            <Button variant="ghost">Grid</Button>
            <Button variant="ghost">List</Button>
          </div>
        </div>

        <div className="files-table">
          <div className="files-table-head">
            <span>File Name</span>
            <span>Type</span>
            <span>Size</span>
            <span>Last Modified</span>
            <span>Access Level</span>
            <span>Actions</span>
          </div>
          {documents.map((doc) => (
            <div className="files-table-row" key={doc.name}>
              <div>
                <strong>{doc.name}</strong>
                <small>Organizational asset</small>
              </div>
              <span>{doc.type}</span>
              <span>{doc.size}</span>
              <span>{doc.modified}</span>
              <span>{doc.access}</span>
              <span>Open</span>
            </div>
          ))}
        </div>

        <div className="directory-pagination">
          <p>Showing 1-10 of 4,472 items</p>
          <div className="pagination-actions">
            <Button variant="ghost">1</Button>
            <Button variant="ghost">2</Button>
            <Button variant="ghost">3</Button>
          </div>
        </div>
      </section>

      <section className="files-lower-grid">
        <div className="files-integration-card">
          <h3>Sync External Repositories</h3>
          <p>Connect your enterprise cloud drives to manage distributed assets directly from the workspace.</p>
          <Button variant="ghost">Connect Integration</Button>
        </div>

        <div className="files-compliance-card">
          <h3>GDPR Compliant</h3>
          <p>All files are encrypted at rest with audit-ready policy controls.</p>
        </div>
      </section>
    </div>
  );
}

function FileVaultCard({ title, subtitle, count, size, variant }) {
  return (
    <article className={`file-vault-card ${variant}`}>
      <div className="row-between">
        <div>
          <span>{title}</span>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <strong>{size}</strong>
      </div>
      <div className="row-between mt-6">
        <em>{count}</em>
      </div>
      <div className="file-vault-progress">
        <div></div>
      </div>
    </article>
  );
}
