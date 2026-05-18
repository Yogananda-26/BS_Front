import { useState, useEffect } from "react";
import { AppButton } from "../../components/common/AppButton";
import { Row, Col, Card, Badge, Button, Modal, Form, ProgressBar } from "react-bootstrap";
import { FaFileUpload, FaFileAlt, FaCheckCircle, FaDownload, FaPaperPlane, FaTimesCircle } from "react-icons/fa";
import vendorService from "../../services/vendorService";
import { toast } from "react-toastify";
const STATUS_CONFIG = {
  DRAFT:    { bg: "secondary", label: "Draft"    },
  PENDING:  { bg: "warning",   label: "Pending"  },
  APPROVED: { bg: "success",   label: "Approved" },
  REJECTED: { bg: "danger",    label: "Rejected" },
};
const DOC_TYPES = ["CONTRACT", "INVOICE", "DELIVERY_NOTE", "CERTIFICATE", "OTHER"];
const EMPTY_FORM = {
  documentType: "CERTIFICATE",
  description:  "",
  taskId:       "",
  projectId:    "",
  contractId:   "",
};

const UploadDocumentModal = ({ show, onHide, onUploaded }) => {
  const [form, setForm]         = useState(EMPTY_FORM);
  const [file, setFile]         = useState(null);
  const [tasks, setTasks]       = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError]       = useState("");

  const handleOpen = () => {
    setForm(EMPTY_FORM); setFile(null); setProgress(0); setError(""); setSelectedTask(null);
    setLoadingTasks(true);
    vendorService.getTasks()
      .then((data) => setTasks(Array.isArray(data) ? data : []))
      .catch(() => setTasks([]))
      .finally(() => setLoadingTasks(false));
  };

  const handleTaskChange = (e) => {
    const taskId = e.target.value;
    const task = tasks.find((t) => (t.assignedTaskId || t.id) === taskId) || null;
    setSelectedTask(task);
    setForm((f) => ({ ...f, taskId, projectId: task?.projectId || "" }));
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { setError("Please select a file to upload."); return; }
    if (!form.taskId.trim())    { setError("Task ID is required."); return; }
    if (!form.projectId.trim()) { setError("Project ID is required."); return; }

    setError("");
    setUploading(true);

    // Fake progress bar while the real request is in-flight
    const interval = setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + 10));
    }, 120);

    try {
      // File → multipart body  |  rest → query params (what the backend expects)
      await vendorService.uploadDocument(file, {
        documentType: form.documentType,
        description:  form.description.trim() || undefined,
        taskId:       form.taskId.trim(),
        projectId:    form.projectId.trim(),
        contractId:   form.contractId.trim() || undefined,
      });

      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        onUploaded();
        onHide();
        setUploading(false);
        setProgress(0);
        setFile(null);
        setForm(EMPTY_FORM);
      }, 500);
    } catch (err) {
      clearInterval(interval);
      setUploading(false);
      setProgress(0);
      const msg = err?.response?.data?.message
        || err?.response?.data?.error
        || (typeof err?.response?.data === "string" ? err.response.data : null)
        || err?.message
        || "Failed to upload document.";
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered onShow={handleOpen}>
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold">Upload Document</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <div className="alert alert-danger py-2 small mb-3">{error}</div>
        )}
        <Form onSubmit={handleUpload}>

          {/* Document Type */}
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted">DOCUMENT TYPE *</Form.Label>
            <Form.Select value={form.documentType} onChange={set("documentType")} required className="rounded-3">
              {DOC_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </Form.Select>
          </Form.Group>

          {/* Task dropdown + auto-fill project */}
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted">ASSIGNED TASK *</Form.Label>
            <Form.Select
              value={form.taskId}
              onChange={handleTaskChange}
              required
              className="rounded-3"
              disabled={loadingTasks}
            >
              <option value="">{loadingTasks ? "Loading tasks..." : "— Select a task —"}</option>
              {tasks.map((t) => {
                const internalId = t.assignedTaskId || t.id;
                const displayId = t.pmTaskId || t.assignedTaskId || t.id;
                return (
                  <option key={internalId} value={internalId}>
                    {displayId} — {t.taskDescription?.slice(0, 50) || t.description?.slice(0, 50) || "No description"}
                  </option>
                );
              })}
            </Form.Select>
            {!loadingTasks && tasks.length === 0 && (
              <Form.Text className="text-warning fw-semibold">No tasks found. Sync tasks from My Tasks first.</Form.Text>
            )}
          </Form.Group>
          {selectedTask && (
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">PROJECT (auto-filled from task)</Form.Label>
              <Form.Control readOnly value={selectedTask.projectId || "—"} className="rounded-3 bg-light" />
            </Form.Group>
          )}

          {/* Contract ID (optional) */}
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted">CONTRACT ID <span className="text-muted fw-normal">(optional)</span></Form.Label>
            <Form.Control
              value={form.contractId}
              onChange={set("contractId")}
              className="rounded-3"
              placeholder="e.g. CONBS001"
            />
          </Form.Group>

          {/* Description (optional) */}
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted">DESCRIPTION <span className="text-muted fw-normal">(optional)</span></Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={form.description}
              onChange={set("description")}
              className="rounded-3"
              placeholder="What is this document for?"
            />
          </Form.Group>

          {/* File drop zone */}
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted">FILE *</Form.Label>
            <div
              className={`border-2 rounded-4 p-4 text-center ${file ? "bg-light border-primary" : "border-secondary"}`}
              style={{ borderStyle: "dashed", cursor: "pointer" }}
              onClick={() => document.getElementById("docFileInput")?.click()}
            >
              <input
                type="file"
                id="docFileInput"
                hidden
                onChange={(e) => { setFile(e.target.files?.[0] || null); setError(""); }}
              />
              {file ? (
                <div>
                  <FaFileAlt size={32} className="text-primary mb-2" />
                  <div className="fw-bold small">{file.name}</div>
                  <div className="text-muted small">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  <div
                    className="text-danger small mt-1"
                    style={{ cursor: "pointer" }}
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  >
                    ✕ Remove
                  </div>
                </div>
              ) : (
                <div>
                  <FaFileUpload size={32} className="text-muted mb-2" />
                  <div className="text-muted small">Click to browse or drag a file here</div>
                  <div className="text-muted" style={{ fontSize: 11 }}>PDF, DOC, DOCX, XLS, PNG, JPG supported</div>
                </div>
              )}
            </div>
          </Form.Group>

          {/* Progress bar */}
          {uploading && (
            <div className="mb-3">
              <div className="d-flex justify-content-between small mb-1">
                <span className="text-muted">Uploading...</span>
                <span className="fw-bold">{progress}%</span>
              </div>
              <ProgressBar now={progress} variant="primary" className="rounded-pill" style={{ height: "8px" }} />
            </div>
          )}

          <div className="d-flex justify-content-end gap-2">
            <AppButton variant="light" className="rounded-3" onClick={onHide} disabled={uploading}>
              Cancel
            </AppButton>
            <AppButton variant="primary" type="submit" className="rounded-3" disabled={!file || uploading}>
              {uploading ? "Uploading..." : "Upload Document"}
            </AppButton>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};
const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [activeType, setActiveType] = useState("ALL");
  const [submitting, setSubmitting]   = useState("");
  const [actionLoading, setActionLoading] = useState(""); // tracks which doc is loading for view/download

  const load = async () => {
    setLoading(true);
    try {
      const data = await vendorService.getDocuments();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load documents:", err);
      setDocuments([]);
      toast.error("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // POST /api/documents/{id}/submit — sends PENDING doc to PM for review
  const handleAction = async (id, action) => {
    if (action === "SUBMIT") {
      setSubmitting(id);
      try {
        await vendorService.submitDocument(id);
        toast.success("Document submitted to Project Manager for review.");
        await load();
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to submit document.");
      } finally {
        setSubmitting("");
      }
    }
  };

  // Forces a file download to the user's machine — GET /api/documents/{id}/download
  const handleDownload = async (doc) => {
    const key = `dl-${doc.documentId}`;
    setActionLoading(key);
    try {
      const blob = await vendorService.downloadDocument(doc.documentId);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = doc.documentName || `document-${doc.documentId}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`"${doc.documentName}" downloaded.`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to download document.");
    } finally {
      setActionLoading("");
    }
  };
  const filtered = activeType === "ALL" ? documents : documents.filter((d) => d.documentType === activeType);
  return <div className="p-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Document</h3>
          <p className="text-muted mb-0">{documents.length} files</p>
        </div>
        <AppButton variant="primary" className="rounded-3 d-flex align-items-center gap-2" onClick={() => setShowUpload(true)}>
          <FaFileUpload /> Upload Document
        </AppButton>
      </div>

      <div className="d-flex gap-2 mb-4 flex-wrap">
        {["ALL", ...DOC_TYPES].map((t) => <AppButton
    key={t}
    onClick={() => setActiveType(t)}
    className={`btn btn-sm rounded-3 px-3 ${activeType === t ? "btn-primary" : "btn-light"}`}
  >
            {t === "ALL" ? "All Files" : t.replace("_", " ")}
            <Badge bg={activeType === t ? "light" : "secondary"} text="dark" pill className="ms-2">
              {t === "ALL" ? documents.length : documents.filter((d) => d.documentType === t).length}
            </Badge>
          </AppButton>)}
      </div>

      {loading ? <div className="text-center py-5 text-muted">Loading repository...</div> : <Row className="g-3">
          {filtered.length === 0 ? <Col xs={12} className="text-center py-5 text-muted">No documents found in this category.</Col> : filtered.map((doc) => {
    const sta     = STATUS_CONFIG[doc.status] || { bg: "secondary", label: doc.status || "Unknown" };
    const docType = (doc.documentType || "").replace(/_/g, " ");
    const sizeKb  = doc.fileSize ? (doc.fileSize / 1024).toFixed(0) + " KB" : "—";
    const date    = doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "—";
    return <Col xs={12} md={6} lg={4} key={doc.documentId}>
                  <Card className="border-0 shadow-sm rounded-4 h-100 position-relative">
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="bg-light p-3 rounded-4">
                          <FaFileAlt size={24} className="text-primary" />
                        </div>
                        <Badge bg={sta.bg}>{sta.label}</Badge>
                      </div>
                      <h6 className="fw-bold text-truncate mb-1" title={doc.documentName}>{doc.documentName || "Unnamed"}</h6>
                      <div className="small text-muted mb-3">
                        <div className="text-uppercase fw-bold" style={{ fontSize: "0.65rem" }}>{docType}</div>
                        <div>{sizeKb} · {date}</div>
                      </div>
                      <div className="d-flex gap-2 mt-auto">

                        {/* Submit — only for PENDING documents */}
                        {doc.status === "PENDING" && (
                          <AppButton
                            variant="warning"
                            size="sm"
                            className="rounded-3 flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                            onClick={() => handleAction(doc.documentId, "SUBMIT")}
                            disabled={submitting === doc.documentId}
                            title="Submit to Project Manager for review"
                          >
                            {submitting === doc.documentId
                              ? <span className="spinner-border spinner-border-sm" />
                              : <><FaPaperPlane size={11} /> Submit</>}
                          </AppButton>
                        )}

                        {/* Approved badge — no action needed */}
                        {doc.status === "APPROVED" && (
                          <span className="flex-grow-1 d-flex align-items-center justify-content-center gap-1 small text-success fw-semibold">
                            <FaCheckCircle size={12} /> Approved
                          </span>
                        )}

                        {/* Rejected badge */}
                        {doc.status === "REJECTED" && (
                          <span className="flex-grow-1 d-flex align-items-center justify-content-center gap-1 small text-danger fw-semibold">
                            <FaTimesCircle size={12} /> Rejected
                          </span>
                        )}

                        {/* Download — always available */}
                        <AppButton
                          variant="light"
                          size="sm"
                          className="rounded-3 flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                          onClick={() => handleDownload(doc)}
                          disabled={actionLoading === `dl-${doc.documentId}`}
                          title="Download file"
                        >
                          {actionLoading === `dl-${doc.documentId}`
                            ? <span className="spinner-border spinner-border-sm" />
                            : <><FaDownload size={12} /> Download</>}
                        </AppButton>

                      </div>
                    </Card.Body>
                  </Card>
                </Col>;
  })}
        </Row>}

      <UploadDocumentModal show={showUpload} onHide={() => setShowUpload(false)} onUploaded={load} />
    </div>;
};
export {
  DocumentsPage
};
