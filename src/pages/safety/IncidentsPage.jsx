import { useState, useEffect } from "react";
import { AppButton } from "../../components/common/AppButton";
import { AppTable } from "../../components/common/AppTable";
import { Row, Col, Card, Badge, Button, Modal, Form } from "react-bootstrap";
import { FaPlus, FaExclamationTriangle, FaFilter, FaTrash, FaEye } from "react-icons/fa";
import safetyService from "../../services/safetyService";
import { toast } from "react-toastify";
const SEVERITY_CONFIG = {
  LOW: { bg: "success", label: "Low" },
  MEDIUM: { bg: "warning", label: "Medium" },
  HIGH: { bg: "danger", label: "High" },
  CRITICAL: { bg: "danger", label: "Critical" }
};
const STATUS_CONFIG = {
  OPEN: { bg: "danger", label: "Open" },
  UNDER_INVESTIGATION: { bg: "primary", label: "Investigating" },
  RESOLVED: { bg: "success", label: "Resolved" },
  CLOSED: { bg: "secondary", label: "Closed" }
};
const CreateIncidentModal = ({ show, onHide, onCreated }) => {
  const [form, setForm] = useState({ projectId: "", description: "", severity: "MEDIUM" });
  const [taskProjects, setTaskProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
 
  useEffect(() => {
    if (!show) return;
    setForm({ projectId: "", description: "", severity: "MEDIUM" });
    setLoadingProjects(true);
    safetyService.getTasks()
      .then((data) => {
        const tasks = Array.isArray(data) ? data : [];
        const seen = new Set();
        const unique = tasks
          .filter((t) => t.projectId && !seen.has(t.projectId) && seen.add(t.projectId))
          .map((t) => ({ projectId: t.projectId, projectName: t.projectName || t.projectId }));
        setTaskProjects(unique);
      })
      .catch(() => setTaskProjects([]))
      .finally(() => setLoadingProjects(false));
  }, [show]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.projectId) {
      setError("Please select a project.");
      return;
    }
    if (form.description.length < 10) {
      setError("Description must be at least 10 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await safetyService.createIncident({
        incidentId: "",
        projectId: form.projectId,
        description: form.description,
        severity: form.severity,
        date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      });
      onCreated();
      onHide();
      setForm({ projectId: "", description: "", severity: "MEDIUM" });
    } catch (err) {
      setError(
        err.response?.data?.message
        || err.response?.data?.error
        || (typeof err.response?.data === "string" ? err.response.data : null)
        || err.message
        || "Failed to create incident."
      );
    } finally {
      setSubmitting(false);
    }
  };
  return <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold text-danger"><FaExclamationTriangle className="me-2" />Report New Incident</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted">PROJECT *</Form.Label>
            <Form.Select
              value={form.projectId}
              onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
              className="rounded-3"
              required
              disabled={loadingProjects}
            >
              <option value="">{loadingProjects ? "Loading projects..." : "— Select a project —"}</option>
              {taskProjects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.projectId}{p.projectName !== p.projectId ? ` — ${p.projectName}` : ""}
                </option>
              ))}
            </Form.Select>
            {!loadingProjects && taskProjects.length === 0 && (
              <Form.Text className="text-warning fw-semibold">No projects found. Sync tasks from My Tasks first.</Form.Text>
            )}
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted">SEVERITY *</Form.Label>
            <Form.Select value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))} className="rounded-3">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted">DESCRIPTION *</Form.Label>
            <Form.Control
    as="textarea"
    rows={4}
    value={form.description}
    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
    placeholder="Describe the incident in detail..."
    maxLength={5e3}
    className="rounded-3"
    required
  />
            <Form.Text className="text-muted">{form.description.length}/5000</Form.Text>
          </Form.Group>
          {error && <div className="alert alert-danger py-2 small rounded-3">{error}</div>}
          <div className="d-flex justify-content-end gap-2 mt-3">
            <AppButton variant="light" className="rounded-3" onClick={onHide}>Cancel</AppButton>
            <AppButton variant="danger" type="submit" className="rounded-3" disabled={submitting}>
              {submitting ? "Reporting..." : "Report Incident"}
            </AppButton>
          </div>
        </Form>
      </Modal.Body>
    </Modal>;
};
const IncidentsPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const load = async () => {
    setLoading(true);
    try {
      const data = await safetyService.getIncidents({
        status: statusFilter !== "ALL" ? statusFilter : void 0,
        severity: severityFilter !== "ALL" ? severityFilter : void 0
      });
      setIncidents(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      console.error("Final Incidents Load Error:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [statusFilter, severityFilter]);
  const handleStatusChange = async (apiId, uiKey, status) => {
    setUpdatingId(uiKey);
    try {
      await safetyService.updateIncidentStatus(apiId, status);
      toast.success(`Incident status updated to ${status}`);
      await load();
    } catch (err) {
      console.error("Failed to update incident status:", err);
      const msg = err.response?.data?.message
        || err.response?.data?.error
        || (typeof err.response?.data === "string" ? err.response.data : null)
        || err.message
        || "Failed to update incident status";
      toast.error(msg);
    } finally {
      setUpdatingId("");
    }
  };
  const openDeleteModal = (incident) => {
    setIncidentToDelete(incident);
    setShowDeleteModal(true);
  };
  const handleDeleteConfirm = async () => {
    if (!incidentToDelete) return;
    setDeletingId(incidentToDelete.id);
    try {
      await safetyService.deleteIncident(incidentToDelete.id);
      toast.success("Incident deleted successfully");
      setShowDeleteModal(false);
      setIncidentToDelete(null);
      await load();
    } catch (err) {
      console.error("Failed to delete incident:", err);
      toast.error("Failed to delete incident. Only OPEN incidents can be deleted.");
    } finally {
      setDeletingId("");
    }
  };
  const openDetailModal = (incident) => {
    setSelectedIncident(incident);
    setShowDetailModal(true);
  };
  return <div className="p-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Incident Management</h3>
          <p className="text-muted mb-0">{incidents.length} incidents found</p>
        </div>
        <AppButton variant="danger" className="rounded-3 d-flex align-items-center gap-2" onClick={() => setShowCreate(true)}>
          <FaPlus /> Report Incident
        </AppButton>
      </div>
 
      {
    /* Filters */
  }
      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Body className="p-3">
          <div className="d-flex flex-wrap gap-3 align-items-center">
            <FaFilter className="text-muted" />
            <Form.Select size="sm" className="rounded-3 w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="UNDER_INVESTIGATION">Investigating</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </Form.Select>
            <Form.Select size="sm" className="rounded-3 w-auto" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </Form.Select>
          </div>
        </Card.Body>
      </Card>
 
      {
    /* Incident Stats Row */
  }
      <Row className="g-3 mb-4">
        {["OPEN", "UNDER_INVESTIGATION", "RESOLVED", "CLOSED"].map((s) => <Col xs={6} md={3} key={s}>
            <Card
    className="border-0 shadow-sm rounded-4 text-center py-3"
    style={{ cursor: "pointer" }}
    onClick={() => setStatusFilter(statusFilter === s ? "ALL" : s)}
  >
              <div className={`fs-4 fw-bold text-${STATUS_CONFIG[s].bg}`}>{incidents.filter((i) => i.status === s).length}</div>
              <div className="small text-muted">{STATUS_CONFIG[s].label}</div>
            </Card>
          </Col>)}
      </Row>
 
      {
    /* Incidents Table */
  }
      {loading ? <div className="text-center py-5 text-muted">Loading incidents...</div> : <Card className="border-0 shadow-sm rounded-4">
          <AppTable
            columns={['ID', 'Project', 'Date', 'Severity', 'Description', 'Reported By', 'Status', 'Actions']}
            responsive
            isEmpty={incidents.length === 0}
            emptyText="No incidents found."
          >
            {incidents.map((inc) => {
    const sev = SEVERITY_CONFIG[inc.severity];
    return <tr key={inc.incidentId}>
                    <td className="py-3 px-4 font-monospace small text-muted" style={{ whiteSpace: "nowrap" }}>{inc.incidentId}</td>
                    <td className="py-3 px-4 small fw-semibold">{inc.projectName || inc.projectId || "—"}</td>
                    <td className="py-3 px-4 small text-muted">{inc.date}</td>
                    <td className="py-3 px-4">
                      <Badge bg={sev.bg} className={inc.severity === "MEDIUM" ? "text-dark" : ""}>{sev.label}</Badge>
                    </td>
                    <td className="py-3 px-4 small" style={{ maxWidth: 260, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                      {inc.description}
                    </td>
                    <td className="py-3 px-4 small">{inc.reportedByName}</td>
                    <td className="py-3 px-4">
                      <select
      className="form-select form-select-sm rounded-3 w-auto"
      value={inc.status}
      disabled={updatingId === inc.incidentId}
      onChange={(e) => handleStatusChange(inc.id || inc.incidentId, inc.incidentId, e.target.value)}
    >
                        <option value="OPEN">Open</option>
                        <option value="UNDER_INVESTIGATION">Investigating</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <div className="d-flex gap-2">
                        <AppButton
      variant="outline-primary"
      size="sm"
      className="rounded-3"
      onClick={() => openDetailModal(inc)}
    >
                          <FaEye />
                        </AppButton>
                        {inc.status === "OPEN" && <AppButton
      variant="outline-danger"
      size="sm"
      className="rounded-3"
      disabled={deletingId === inc.id}
      onClick={() => openDeleteModal(inc)}
    >
                            <FaTrash />
                          </AppButton>}
                      </div>
                    </td>
                  </tr>;
  })}
          </AppTable>
        </Card>}
 
      <CreateIncidentModal show={showCreate} onHide={() => setShowCreate(false)} onCreated={load} />
 
      {
    /* Delete Confirmation Modal */
  }
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold text-danger"><FaExclamationTriangle className="me-2" />Delete Incident</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this incident? This action cannot be undone.</p>
          {incidentToDelete && <div className="bg-light p-3 rounded-3">
              <div className="mb-1"><strong>ID:</strong> {incidentToDelete.incidentId}</div>
              <div className="mb-1"><strong>Project:</strong> {incidentToDelete.projectName || incidentToDelete.projectId || "—"}</div>
              <div className="mb-1"><strong>Severity:</strong> <Badge bg={SEVERITY_CONFIG[incidentToDelete.severity].bg}>{SEVERITY_CONFIG[incidentToDelete.severity].label}</Badge></div>
              <div><strong>Description:</strong> {incidentToDelete.description}</div>
            </div>}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <AppButton variant="light" className="rounded-3" onClick={() => setShowDeleteModal(false)}>Cancel</AppButton>
          <AppButton variant="danger" className="rounded-3" onClick={handleDeleteConfirm} disabled={deletingId === incidentToDelete?.id}>
            {deletingId === incidentToDelete?.id ? "Deleting..." : "Delete Incident"}
          </AppButton>
        </Modal.Footer>
      </Modal>
 
      {
    /* Detail View Modal */
  }
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Incident Details</Modal.Title>
        </Modal.Header>
        {selectedIncident && <Modal.Body className="p-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <Badge bg={SEVERITY_CONFIG[selectedIncident.severity].bg} className="fs-6">{SEVERITY_CONFIG[selectedIncident.severity].label}</Badge>
              <Badge bg={STATUS_CONFIG[selectedIncident.status].bg} className="fs-6">{STATUS_CONFIG[selectedIncident.status].label}</Badge>
            </div>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <div className="small text-muted">Incident ID</div>
                <div className="fw-semibold font-monospace">{selectedIncident.incidentId}</div>
              </div>
              <div className="col-md-6">
                <div className="small text-muted">Date</div>
                <div className="fw-semibold">{selectedIncident.date}</div>
              </div>
              <div className="col-md-6">
                <div className="small text-muted">Project</div>
                <div className="fw-semibold">{selectedIncident.projectName || selectedIncident.projectId || "—"}</div>
              </div>
              <div className="col-md-6">
                <div className="small text-muted">Reported By</div>
                <div className="fw-semibold">{selectedIncident.reportedByName}</div>
              </div>
            </div>
            <div className="mb-3">
              <div className="small text-muted fw-bold mb-1">Description</div>
              <div className="p-3 bg-light rounded-3">{selectedIncident.description}</div>
            </div>
          </Modal.Body>}
        <Modal.Footer className="border-0">
          <AppButton variant="light" className="rounded-3" onClick={() => setShowDetailModal(false)}>Close</AppButton>
        </Modal.Footer>
      </Modal>
    </div>;
};
export {
  IncidentsPage
};
 
 