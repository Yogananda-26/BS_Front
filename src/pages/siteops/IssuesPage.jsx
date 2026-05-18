import { useState, useEffect } from "react";
import { AppButton } from "../../components/common/AppButton";
import { AppTable } from "../../components/common/AppTable";
import { Alert, Card, Badge, Row, Col, Modal, Form, Spinner } from "react-bootstrap";
import { FaPlus, FaEye, FaArrowRight, FaCheckCircle, FaLockOpen, FaLock } from "react-icons/fa";
import { siteOpsService } from "../../services/siteOpsService";
import { toast } from "react-toastify";

const SEVERITY_CONFIG = {
  LOW:      { bg: "success", label: "Low" },
  MEDIUM:   { bg: "warning", label: "Medium" },
  HIGH:     { bg: "orange",  label: "High" },
  CRITICAL: { bg: "danger",  label: "Critical" }
};

const STATUS_CONFIG = {
  OPEN:        { color: "danger",    label: "Open" },
  IN_PROGRESS: { color: "primary",   label: "In Progress" },
  RESOLVED:    { color: "success",   label: "Resolved" },
  CLOSED:      { color: "secondary", label: "Closed" }
};

/* Status cycle: OPEN → IN_PROGRESS → RESOLVED → CLOSED → OPEN */
const NEXT_STATUS = {
  OPEN:        { next: "IN_PROGRESS", label: "Mark In Progress", Icon: FaArrowRight,   variant: "outline-primary" },
  IN_PROGRESS: { next: "RESOLVED",    label: "Mark Resolved",    Icon: FaCheckCircle,  variant: "outline-success" },
  RESOLVED:    { next: "CLOSED",      label: "Close Issue",      Icon: FaLock,         variant: "outline-secondary" },
  CLOSED:      { next: "OPEN",        label: "Reopen",           Icon: FaLockOpen,     variant: "outline-warning" }
};

/* ── Report Issue Modal ───────────────────────────────────── */
const ReportIssueModal = ({ show, onHide, onCreated, projects }) => {
  const today = new Date().toISOString().split("T")[0];
  const emptyForm = {
    projectId: "", logId: "", title: "", description: "",
    severity: "MEDIUM", resourceType: "LABOR",
    resourceDescription: "", resourceFromDate: today, resourceToDate: today
  };

  const [form, setForm]             = useState(emptyForm);
  const [siteLogs, setSiteLogs]     = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState("");

  useEffect(() => {
    if (!form.projectId) { setSiteLogs([]); return; }
    setLoadingLogs(true);
    setForm((f) => ({ ...f, logId: "" }));
    siteOpsService.getSiteLogs(form.projectId)
      .then((data) => setSiteLogs(Array.isArray(data) ? data : data?.content || []))
      .catch(() => setSiteLogs([]))
      .finally(() => setLoadingLogs(false));
  }, [form.projectId]);

  const handleClose = () => {
    setForm(emptyForm);
    setSiteLogs([]);
    setFormError("");
    onHide();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    /* Client-side validation */
    if (!form.projectId)            { setFormError("Please select a project."); return; }
    if (!form.logId)                { setFormError("Please select a site log."); return; }
    if (!form.title.trim())         { setFormError("Title is required."); return; }
    if (!form.resourceDescription.trim()) { setFormError("Resource description is required."); return; }
    if (form.resourceToDate < form.resourceFromDate) {
      setFormError("To Date cannot be before From Date.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        description: form.description.trim()
          ? `${form.title}: ${form.description}`.trim()
          : form.title
      };
      await siteOpsService.reportIssue(payload);
      onCreated();
      handleClose();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        (typeof error.response?.data === "string" ? error.response.data : null) ||
        error.message ||
        "Failed to report issue";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold">Report Site Issue</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {formError && (
          <Alert variant="danger" className="rounded-3 small py-2 d-flex align-items-center gap-2 mb-3">
            <FaPlus className="flex-shrink-0" style={{ transform: "rotate(45deg)" }} />
            {formError}
          </Alert>
        )}
        <Form onSubmit={handleSubmit} noValidate>
          <Row className="g-3">
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">PROJECT *</Form.Label>
                <Form.Select
                  value={form.projectId}
                  onChange={(e) => { setFormError(""); setForm((f) => ({ ...f, projectId: e.target.value })); }}
                  className="rounded-3"
                >
                  <option value="">— Select a project —</option>
                  {(projects || []).map((p) => (
                    <option key={p.projectId} value={p.projectId}>
                      {p.projectId} — {p.projectName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">SITE LOG ID *</Form.Label>
                <Form.Select
                  value={form.logId}
                  onChange={(e) => { setFormError(""); setForm((f) => ({ ...f, logId: e.target.value })); }}
                  className="rounded-3"
                  disabled={!form.projectId || loadingLogs}
                >
                  <option value="">
                    {!form.projectId ? "Select a project first" : loadingLogs ? "Loading logs..." : "— Select a site log —"}
                  </option>
                  {siteLogs.map((log) => (
                    <option key={log.logId} value={log.logId}>
                      {log.logId}{log.logDate ? ` — ${log.logDate}` : ""}
                    </option>
                  ))}
                </Form.Select>
                {form.projectId && !loadingLogs && siteLogs.length === 0 && (
                  <Form.Text className="text-warning fw-semibold">No site logs found for this project.</Form.Text>
                )}
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">TITLE *</Form.Label>
                <Form.Control
                  value={form.title}
                  onChange={(e) => { setFormError(""); setForm((f) => ({ ...f, title: e.target.value })); }}
                  className="rounded-3"
                  placeholder="Brief summary of the issue"
                />
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">DESCRIPTION</Form.Label>
                <Form.Control
                  as="textarea" rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="rounded-3"
                  placeholder="Provide more details..."
                />
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">SEVERITY *</Form.Label>
                <div className="d-flex gap-2 flex-wrap">
                  {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => (
                    <AppButton
                      key={s}
                      variant={form.severity === s ? SEVERITY_CONFIG[s].bg : "light"}
                      className={`rounded-3 flex-grow-1 small py-2 ${form.severity === s && (s === "MEDIUM" || s === "HIGH") ? "text-dark" : ""}`}
                      onClick={() => setForm((f) => ({ ...f, severity: s }))}
                    >
                      {SEVERITY_CONFIG[s].label}
                    </AppButton>
                  ))}
                </div>
              </Form.Group>
            </Col>

            <Col xs={12} className="mt-2">
              <hr /><h6 className="fw-bold mb-3">Resource Request Details</h6>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">RESOURCE TYPE *</Form.Label>
                <Form.Select
                  value={form.resourceType}
                  onChange={(e) => setForm((f) => ({ ...f, resourceType: e.target.value }))}
                  className="rounded-3"
                >
                  <option value="LABOR">Labor</option>
                  <option value="EQUIPMENT">Equipment</option>
                  <option value="MATERIAL">Material</option>
                  <option value="OTHER">Other</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">RESOURCE DESCRIPTION *</Form.Label>
                <Form.Control
                  value={form.resourceDescription}
                  onChange={(e) => { setFormError(""); setForm((f) => ({ ...f, resourceDescription: e.target.value })); }}
                  className="rounded-3"
                  placeholder="e.g. Crane Operator, 10 Bags Cement"
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">FROM DATE *</Form.Label>
                <Form.Control
                  type="date"
                  value={form.resourceFromDate}
                  onChange={(e) => { setFormError(""); setForm((f) => ({ ...f, resourceFromDate: e.target.value })); }}
                  className="rounded-3"
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">TO DATE *</Form.Label>
                <Form.Control
                  type="date"
                  value={form.resourceToDate}
                  onChange={(e) => { setFormError(""); setForm((f) => ({ ...f, resourceToDate: e.target.value })); }}
                  className="rounded-3"
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <AppButton variant="light" className="rounded-3" onClick={handleClose}>Cancel</AppButton>
            <AppButton variant="danger" type="submit" className="rounded-3" disabled={submitting}>
              {submitting ? <><Spinner size="sm" className="me-2" />Reporting...</> : "Report Issue"}
            </AppButton>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

/* ── Main Page ───────────────────────────────────────────── */
const IssuesPage = () => {
  const [issues, setIssues]             = useState([]);
  const [projects, setProjects]         = useState([]);
  const [loading, setLoading]           = useState(false);
  const [showReport, setShowReport]     = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterProjectId, setFilterProjectId] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedIssue, setSelectedIssue]     = useState(null);
  const [updatingId, setUpdatingId]           = useState("");

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch { return "N/A"; }
  };

  const load = async (pId) => {
    const targetId = pId !== undefined ? pId : filterProjectId;
    setLoading(true);
    try {
      const filters = targetId ? { projectId: targetId } : {};
      const data = await siteOpsService.getIssues(filters);
      setIssues(data || []);
    } catch (e) {
      console.error("Failed to load issues", e);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    siteOpsService.getTasks()
      .then((data) => {
        const tasks = Array.isArray(data) ? data : [];
        const seen = new Set();
        setProjects(
          tasks
            .filter((t) => t.projectId && !seen.has(t.projectId) && seen.add(t.projectId))
            .map((t) => ({ projectId: t.projectId, projectName: t.projectName || t.projectId }))
        );
      })
      .catch(() => setProjects([]));
    load();
  }, []);

  const handleCreated = () => {
    load();
    toast.success("Issue reported successfully");
  };

  const openDetailModal = (issue) => {
    setSelectedIssue(issue);
    setShowDetailModal(true);
  };

  const handleStatusChange = async (issue) => {
    const { next } = NEXT_STATUS[issue.status] || NEXT_STATUS.OPEN;
    setUpdatingId(issue.issueId);
    try {
      await siteOpsService.updateIssue(issue.issueId, { status: next });
      toast.success(`Issue status updated to ${STATUS_CONFIG[next]?.label || next}`);
      await load();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to update issue status";
      toast.error(msg);
    } finally {
      setUpdatingId("");
    }
  };

  const filtered = filterStatus === "ALL" ? issues : issues.filter((i) => i.status === filterStatus);

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Issue Management</h3>
          <p className="text-muted mb-0">
            {issues.filter((i) => i.status === "OPEN").length} open issues
            {filterProjectId ? ` for project ${filterProjectId}` : ""}.
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Form.Select
            value={filterProjectId}
            onChange={(e) => { setFilterProjectId(e.target.value); load(e.target.value); }}
            className="rounded-3"
            style={{ maxWidth: "220px" }}
          >
            <option value="">— Filter by project —</option>
            {projects.map((p) => (
              <option key={p.projectId} value={p.projectId}>{p.projectId} — {p.projectName}</option>
            ))}
          </Form.Select>
          <AppButton variant="danger" className="rounded-3 d-flex align-items-center gap-2" onClick={() => setShowReport(true)}>
            <FaPlus /> Report Issue
          </AppButton>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="d-flex gap-2 mb-4 overflow-auto pb-2">
        {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => (
          <AppButton
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`btn btn-sm rounded-3 px-3 text-nowrap ${filterStatus === s ? "btn-dark" : "btn-light"}`}
          >
            {s === "ALL" ? "All Issues" : s.replace("_", " ")}
            <Badge bg={filterStatus === s ? "light" : "secondary"} text="dark" pill className="ms-2">
              {s === "ALL" ? issues.length : issues.filter((i) => i.status === s).length}
            </Badge>
          </AppButton>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-5 text-muted">
          <Spinner animation="border" size="sm" className="me-2" />Loading issues...
        </div>
      ) : (
        <Card className="border-0 shadow-sm rounded-4">
          <AppTable
            columns={["Issue", "Severity", "Status", "Reported By", "Date", "Actions"]}
            responsive
            isEmpty={filtered.length === 0}
          >
            {filtered.map((issue) => {
              const sev  = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.MEDIUM;
              const sta  = STATUS_CONFIG[issue.status]    || STATUS_CONFIG.OPEN;
              const next = NEXT_STATUS[issue.status]      || NEXT_STATUS.OPEN;
              const NextIcon = next.Icon;
              return (
                <tr key={issue.issueId}>
                  <td className="py-3 px-4">
                    <div className="fw-bold">{issue.title}</div>
                    <div className="small text-muted font-monospace">{issue.issueId} · {issue.projectName}</div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge style={{ backgroundColor: `var(--bs-${sev.bg})` }}>{sev.label}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className={`d-flex align-items-center gap-1 small fw-bold text-${sta.color}`}>
                      <div className={`bg-${sta.color} rounded-circle`} style={{ width: 8, height: 8 }} />
                      {sta.label}
                    </div>
                  </td>
                  <td className="py-3 px-4 small">{issue.reportedByName}</td>
                  <td className="py-3 px-4 small text-muted">{new Date(issue.reportedAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-end">
                    <div className="d-flex gap-2 justify-content-end">
                      <AppButton
                        variant="outline-primary"
                        size="sm"
                        className="rounded-3"
                        title="View details"
                        onClick={() => openDetailModal(issue)}
                      >
                        <FaEye />
                      </AppButton>
                      <AppButton
                        variant={next.variant}
                        size="sm"
                        className="rounded-3"
                        title={next.label}
                        onClick={() => handleStatusChange(issue)}
                        disabled={updatingId === issue.issueId}
                      >
                        {updatingId === issue.issueId
                          ? <Spinner size="sm" />
                          : <NextIcon size={13} />}
                      </AppButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </AppTable>
        </Card>
      )}

      {/* Report Issue Modal */}
      <ReportIssueModal
        show={showReport}
        onHide={() => setShowReport(false)}
        onCreated={handleCreated}
        projects={projects}
      />

      {/* Detail View Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Issue Details</Modal.Title>
        </Modal.Header>
        {selectedIssue && (
          <Modal.Body className="p-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <Badge bg={SEVERITY_CONFIG[selectedIssue.severity]?.bg} className="fs-6">
                {SEVERITY_CONFIG[selectedIssue.severity]?.label}
              </Badge>
              <Badge bg={STATUS_CONFIG[selectedIssue.status]?.color} className="fs-6">
                {STATUS_CONFIG[selectedIssue.status]?.label}
              </Badge>
            </div>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <div className="small text-muted">Issue ID</div>
                <div className="fw-semibold font-monospace">{selectedIssue.issueId}</div>
              </div>
              <div className="col-md-6">
                <div className="small text-muted">Date</div>
                <div className="fw-semibold">{formatDate(selectedIssue.reportedAt)}</div>
              </div>
              <div className="col-md-6">
                <div className="small text-muted">Project</div>
                <div className="fw-semibold">{selectedIssue.projectName}</div>
              </div>
              <div className="col-md-6">
                <div className="small text-muted">Reported By</div>
                <div className="fw-semibold">{selectedIssue.reportedByName}</div>
              </div>
            </div>
            <div className="mb-3">
              <div className="small text-muted fw-bold mb-1">Title</div>
              <div className="p-3 bg-light rounded-3">{selectedIssue.title}</div>
            </div>
            <div className="mb-3">
              <div className="small text-muted fw-bold mb-1">Description</div>
              <div className="p-3 bg-light rounded-3">{selectedIssue.description || "—"}</div>
            </div>
          </Modal.Body>
        )}
        <Modal.Footer className="border-0">
          <AppButton variant="light" className="rounded-3" onClick={() => setShowDetailModal(false)}>Close</AppButton>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export { IssuesPage };
