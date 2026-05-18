import { useState, useEffect } from "react";
import { AppButton } from "../../components/common/AppButton";
import { Card, Badge, Button, Row, Col, Modal, Form, ProgressBar } from "react-bootstrap";
import { FaPlus, FaSyncAlt, FaTrash, FaEye, FaCamera, FaTimes } from "react-icons/fa";
import { siteOpsService } from "../../services/siteOpsService";
import { notifySiteLogSubmitted, syncMilestoneProgressFromSiteLog } from "../../utils/siteLogSync";
import { toast } from "react-toastify";
const STATUS_CONFIG = {
  DRAFT:     { bg: "secondary", label: "Draft" },
  SUBMITTED: { bg: "warning",   label: "Submitted" },
  PENDING:   { bg: "warning",   label: "Submitted" },
  APPROVED:  { bg: "success",   label: "Approved" },
  REJECTED:  { bg: "danger",    label: "Rejected" }
};
const CreateSiteLogModal = ({ show, onHide, onCreated, projects }) => {
  const [form, setForm] = useState({ projectId: "", logDate: new Date().toISOString().split("T")[0], activities: "", issuesSummary: "", progressPercent: 0 });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.projectId) { setFormError("Please select a project."); return; }
    if (!form.activities?.trim()) { setFormError("Activities description is required."); return; }
    if (form.progressPercent < 0 || form.progressPercent > 100) { setFormError("Progress must be between 0 and 100."); return; }
    setSubmitting(true);
    try {
      await siteOpsService.createSiteLog(form);
      onCreated(form.projectId);
      onHide();
      setForm({ projectId: "", logDate: new Date().toISOString().split("T")[0], activities: "", issuesSummary: "", progressPercent: 0 });
      setFormError("");
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        (typeof error.response?.data === "string" ? error.response.data : null) ||
        error.message ||
        "Failed to create site log. Please try again.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };
  return <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className="border-0"><Modal.Title className="fw-bold">Create Daily Site Log</Modal.Title></Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {formError && (
            <div className="alert alert-danger rounded-3 small d-flex align-items-center gap-2 mb-3">
              {formError}
            </div>
          )}
          <Row className="g-3">
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">PROJECT *</Form.Label>
                <Form.Select
                  value={form.projectId}
                  onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
                  required
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
              <Form.Group><Form.Label className="small fw-bold text-muted">DATE *</Form.Label><Form.Control type="date" value={form.logDate} onChange={(e) => setForm((f) => ({ ...f, logDate: e.target.value }))} required className="rounded-3" /></Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">ACTIVITIES (WORK DONE) *</Form.Label>
                <Form.Control as="textarea" rows={3} value={form.activities} onChange={(e) => setForm((f) => ({ ...f, activities: e.target.value }))} required className="rounded-3" placeholder="Describe the main activities conducted today..." />
                <div className="text-end small text-muted mt-1">{form.activities.length} characters</div>
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group><Form.Label className="small fw-bold text-muted">ISSUES & CONSTRAINTS</Form.Label><Form.Control as="textarea" rows={2} value={form.issuesSummary} onChange={(e) => setForm((f) => ({ ...f, issuesSummary: e.target.value }))} className="rounded-3" placeholder="Any delays, resource shortages, or technical problems..." /></Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <div className="d-flex justify-content-between">
                  <Form.Label className="small fw-bold text-muted">ESTIMATED PROGRESS (%)</Form.Label>
                  <span className="fw-bold text-primary">{form.progressPercent}%</span>
                </div>
                <Form.Range value={form.progressPercent} onChange={(e) => setForm((f) => ({ ...f, progressPercent: Number(e.target.value) }))} className="mt-1" />
              </Form.Group>
            </Col>
          </Row>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <AppButton variant="light" className="rounded-3" onClick={onHide}>Cancel</AppButton>
            <AppButton variant="warning" type="submit" className="rounded-3 text-white" disabled={submitting}>{submitting ? "Saving..." : "Save Site Log"}</AppButton>
          </div>
        </Form>
      </Modal.Body>
    </Modal>;
};
const SiteLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState("");
  const [filterProjectId, setFilterProjectId] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [logToDelete, setLogToDelete] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingLog, setUploadingLog] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "N/A";
    }
  };
  const load = async (pId) => {
    const targetId = pId || filterProjectId;
    if (!targetId) return;
    setLoading(true);
    try {
      const data = await siteOpsService.getSiteLogs(targetId);
      setLogs(data || []);
    } catch (e) {
      console.error("Failed to load logs", e);
      setLogs([]);
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
  const handleCreated = (newProjectId) => {
    setFilterProjectId(newProjectId);
    load(newProjectId);
    toast.success("Site log created successfully");
  };
  const openDeleteModal = (log) => {
    setLogToDelete(log);
    setShowDeleteModal(true);
  };
  const handleDeleteConfirm = async () => {
    if (!logToDelete) return;
    try {
      await siteOpsService.deleteSiteLog(logToDelete.id);
      toast.success("Site log deleted successfully");
      setShowDeleteModal(false);
      setLogToDelete(null);
      await load();
    } catch (err) {
      console.error("Failed to delete site log:", err);
      toast.error("Failed to delete site log");
    }
  };
  const openDetailModal = (log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };
  const handleRefresh = async () => {
    setSyncing(true);
    try {
      await load();
      toast.success("Site logs refreshed");
    } catch (e) {
      console.error("Failed to refresh logs", e);
      toast.error("Failed to refresh logs");
    } finally {
      setSyncing(false);
    }
  };
  const openUploadModal = (log) => {
    setUploadingLog(log);
    setSelectedFile(null);
    setPreviewUrl("");
    setShowUploadModal(true);
  };
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (e2) => setPreviewUrl(e2.target?.result);
        reader.readAsDataURL(file);
      } else {
        toast.error("Please select an image file");
      }
    }
  };
  const handlePhotoUpload = async () => {
    if (!selectedFile || !uploadingLog) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", selectedFile);
      await siteOpsService.uploadPhoto(uploadingLog.logId, formData);
      toast.success("Photo uploaded successfully");
      setShowUploadModal(false);
      setSelectedFile(null);
      setPreviewUrl("");
      setUploadingLog(null);
      await load();
    } catch (err) {
      console.error("Failed to upload photo:", err);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };
  const submitLogForApproval = async (log) => {
    const projectId = log.projectId || filterProjectId;
    setSubmitting(log.logId);
    try {
      await siteOpsService.submitSiteLog(log.logId);
      notifySiteLogSubmitted({ projectId, progressPercent: log.progressPercent, logId: log.logId });
      try {
        await syncMilestoneProgressFromSiteLog(projectId, log);
        toast.success("Site log submitted and milestone progress updated");
      } catch (syncErr) {
        console.error("Milestone progress sync failed:", syncErr);
        toast.success("Site log submitted successfully");
        toast.warn("Milestone sync failed: " + (syncErr?.response?.data?.message || syncErr?.message || "check console"));
      }
      await load();
    } catch (err) {
      console.error("Failed to submit site log:", err);
      const msg = err.response?.data?.message || err.message || "Failed to submit site log";
      toast.error(msg);
    } finally {
      setSubmitting("");
    }
  };
  return <div className="p-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Daily Site Logs</h3>
          <p className="text-muted mb-0">{logs.length} logs recorded for project {filterProjectId}.</p>
        </div>
        <div className="d-flex gap-2">
          <Form.Select
            value={filterProjectId}
            onChange={(e) => { setFilterProjectId(e.target.value); load(e.target.value); }}
            className="rounded-3"
            style={{ maxWidth: "240px" }}
          >
            <option value="">— Select a project —</option>
            {projects.map((p) => (
              <option key={p.projectId} value={p.projectId}>{p.projectId} — {p.projectName}</option>
            ))}
          </Form.Select>
          <AppButton variant="outline-secondary" className="rounded-3 d-flex align-items-center gap-2" onClick={handleRefresh} disabled={syncing}>
            <FaSyncAlt className={syncing ? "fa-spin" : ""} /> {syncing ? "Refreshing..." : "Refresh"}
          </AppButton>
          <AppButton variant="warning" className="rounded-3 d-flex align-items-center gap-2 text-white" onClick={() => setShowCreate(true)}>
            <FaPlus /> Create New Log
          </AppButton>
        </div>
      </div>

      {loading ? <div className="text-center py-5 text-muted">Loading logs...</div> : <Row className="g-3">
          {logs.map((log) => {
    const sta = STATUS_CONFIG[log.reviewStatus];
    return <Col md={12} key={log.logId}>
                <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                  <Card.Body className="p-0">
                    <div className="d-flex flex-column flex-md-row">
                      <div className="bg-light p-4 d-flex flex-column align-items-center justify-content-center border-end" style={{ minWidth: "120px" }}>
                        <div className="small fw-bold text-muted text-uppercase">{new Date(log.logDate).toLocaleDateString("en-US", { month: "short" })}</div>
                        <div className="fs-2 fw-bold text-dark">{new Date(log.logDate).getDate()}</div>
                        <div className="small text-muted">{new Date(log.logDate).getFullYear()}</div>
                      </div>
                      <div className="p-4 flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h5 className="fw-bold mb-0">{log.projectName}</h5>
                            <div className="small text-muted font-monospace">{log.logId}</div>
                          </div>
                          <Badge bg={sta.bg} className={log.reviewStatus === "SUBMITTED" ? "text-dark" : ""}>{sta.label}</Badge>
                        </div>
                        <p className="text-muted small mb-3 text-truncate-2" style={{ maxHeight: "40px", overflow: "hidden" }}>{log.activities}</p>
                        <div className="d-flex align-items-center gap-3">
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between small mb-1"><span className="text-muted">Progress</span><span className="fw-bold">{log.progressPercent}%</span></div>
                            <ProgressBar now={log.progressPercent} variant="warning" className="rounded-pill" style={{ height: "6px" }} />
                          </div>
                          <div className="d-flex gap-2">
                            <div className="d-flex gap-2">
                            {log.reviewStatus === "DRAFT" && <AppButton variant="outline-warning" size="sm" className="rounded-3 px-3" disabled={submitting === log.logId} onClick={() => submitLogForApproval(log)}>
                                {submitting === log.logId ? "..." : "Submit Approval"}
                              </AppButton>}
                            <AppButton variant="outline-primary" size="sm" className="rounded-3" onClick={() => openDetailModal(log)}>
                              <FaEye />
                            </AppButton>
                            <AppButton variant="outline-info" size="sm" className="rounded-3" onClick={() => openUploadModal(log)}>
                              <FaCamera />
                            </AppButton>
                            {log.reviewStatus === "DRAFT" && <AppButton variant="outline-danger" size="sm" className="rounded-3" onClick={() => openDeleteModal(log)}>
                                <FaTrash />
                              </AppButton>}
                          </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>;
  })}
        </Row>}
      <CreateSiteLogModal show={showCreate} onHide={() => setShowCreate(false)} onCreated={handleCreated} projects={projects} />

      {
    /* Photo Upload Modal */
  }
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold"><FaCamera className="me-2" />Upload Photo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {uploadingLog && <div className="mb-3">
              <div className="small text-muted fw-bold mb-1">Site Log</div>
              <div className="p-2 bg-light rounded-3">
                <div className="fw-bold">{uploadingLog.logId}</div>
                <div className="small">{uploadingLog.projectName}</div>
              </div>
            </div>}
          
          <div className="mb-3">
            <div className="small text-muted fw-bold mb-2">SELECT PHOTO</div>
            <div className="border-2 border-dashed rounded-3 p-4 text-center bg-light">
              {previewUrl ? <div className="position-relative">
                  <img src={previewUrl} alt="Preview" className="img-fluid rounded-3" style={{ maxHeight: "200px" }} />
                  <AppButton
    variant="danger"
    size="sm"
    className="position-absolute top-0 end-0 m-2 rounded-circle"
    onClick={() => {
      setSelectedFile(null);
      setPreviewUrl("");
    }}
  >
                    <FaTimes />
                  </AppButton>
                </div> : <div>
                  <FaCamera size={48} className="text-muted mb-3" />
                  <div className="mb-3">
                    <Form.Control
    type="file"
    accept="image/*"
    onChange={handleFileSelect}
    className="d-none"
    id="photo-upload"
  />
                    <label htmlFor="photo-upload" className="btn btn-outline-primary rounded-3 cursor-pointer">
                      Choose Photo
                    </label>
                  </div>
                  <div className="small text-muted">
                    Supported formats: JPG, PNG, GIF<br />
                    Maximum size: 5MB
                  </div>
                </div>}
            </div>
          </div>
          
          {selectedFile && <div className="small text-muted">
              <strong>Selected file:</strong> {selectedFile.name}<br />
              <strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </div>}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <AppButton variant="light" className="rounded-3" onClick={() => setShowUploadModal(false)}>Cancel</AppButton>
          <AppButton
    variant="primary"
    className="rounded-3"
    onClick={handlePhotoUpload}
    disabled={!selectedFile || uploading}
  >
            {uploading ? "Uploading..." : "Upload Photo"}
          </AppButton>
        </Modal.Footer>
      </Modal>

      {
    /* Delete Confirmation Modal */
  }
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold text-danger"><FaTrash className="me-2" />Delete Site Log</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this site log? This action cannot be undone.</p>
          {logToDelete && <div className="bg-light p-3 rounded-3">
              <div className="mb-1"><strong>Log ID:</strong> {logToDelete.logId}</div>
              <div className="mb-1"><strong>Project:</strong> {logToDelete.projectName}</div>
              <div className="mb-1"><strong>Date:</strong> {formatDate(logToDelete.logDate)}</div>
              <div className="mb-1"><strong>Status:</strong> <Badge bg={STATUS_CONFIG[logToDelete.reviewStatus].bg}>{STATUS_CONFIG[logToDelete.reviewStatus].label}</Badge></div>
              <div><strong>Activities:</strong> {logToDelete.activities}</div>
            </div>}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <AppButton variant="light" className="rounded-3" onClick={() => setShowDeleteModal(false)}>Cancel</AppButton>
          <AppButton variant="danger" className="rounded-3" onClick={handleDeleteConfirm}>Delete Site Log</AppButton>
        </Modal.Footer>
      </Modal>

      {
    /* Detail View Modal */
  }
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Site Log Details</Modal.Title>
        </Modal.Header>
        {selectedLog && <Modal.Body className="p-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <Badge bg={STATUS_CONFIG[selectedLog.reviewStatus].bg} className="fs-6">{STATUS_CONFIG[selectedLog.reviewStatus].label}</Badge>
            </div>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <div className="small text-muted">Log ID</div>
                <div className="fw-semibold font-monospace">{selectedLog.logId}</div>
              </div>
              <div className="col-md-6">
                <div className="small text-muted">Date</div>
                <div className="fw-semibold">{formatDate(selectedLog.logDate)}</div>
              </div>
              <div className="col-md-6">
                <div className="small text-muted">Project</div>
                <div className="fw-semibold">{selectedLog.projectName}</div>
              </div>
              <div className="col-md-6">
                <div className="small text-muted">Submitted By</div>
                <div className="fw-semibold">{selectedLog.submittedByName}</div>
              </div>
            </div>
            <div className="mb-3">
              <div className="small text-muted fw-bold mb-1">Activities</div>
              <div className="p-3 bg-light rounded-3">{selectedLog.activities}</div>
            </div>
            <div className="mb-3">
              <div className="small text-muted fw-bold mb-1">Issues & Constraints</div>
              <div className="p-3 bg-light rounded-3">{selectedLog.issuesSummary}</div>
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <div className="small text-muted">Progress</div>
                <div className="fw-semibold">{selectedLog.progressPercent}%</div>
              </div>
              <div className="col-md-6">
                <div className="small text-muted">Submitted At</div>
                <div className="fw-semibold">{formatDate(selectedLog.submittedAt)}</div>
              </div>
            </div>
            
            {selectedLog.photoPath && <div className="mt-3">
                <div className="small text-muted fw-bold mb-2">ATTACHED PHOTO</div>
                <div className="border rounded-3 p-2 bg-light">
                  <img
    src={selectedLog.photoPath}
    alt="Site photo"
    className="img-fluid rounded-3"
    style={{ maxHeight: "300px", objectFit: "cover" }}
  />
                </div>
              </div>}
          </Modal.Body>}
        <Modal.Footer className="border-0">
          <AppButton variant="light" className="rounded-3" onClick={() => setShowDetailModal(false)}>Close</AppButton>
        </Modal.Footer>
      </Modal>
    </div>;
};
export {
  SiteLogsPage
};
