import { useState, useEffect } from "react";
import { AppButton } from "../../components/common/AppButton";
import { AppTable } from "../../components/common/AppTable";
import { Card, Badge, Button, Modal, Form, Row, Col } from "react-bootstrap";
import { FaPlus, FaFileContract, FaExclamationTriangle } from "react-icons/fa";
import vendorService from "../../services/vendorService";

const STATUS_CONFIG = {
  ACTIVE:    { bg: "success" },
  COMPLETED: { bg: "primary" }
};

const today = new Date().toISOString().split("T")[0];

const CreateContractModal = ({ show, onHide, onCreated }) => {
  const [form, setForm] = useState({
    projectId:   "",
    startDate:   "",
    endDate:     "",
    value:       "",
    taskId:      "",
    status:      "ACTIVE",
    description: ""
  });
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!show) return;
    setSelectedTask(null);
    setError(null);
    setForm({ projectId: "", startDate: "", endDate: "", value: "", taskId: "", status: "ACTIVE", description: "" });
    setLoadingTasks(true);
    vendorService.getTasks()
      .then((data) => setTasks(Array.isArray(data) ? data : []))
      .catch(() => setTasks([]))
      .finally(() => setLoadingTasks(false));
  }, [show]);

  const handleTaskChange = (e) => {
    const pmTaskId = e.target.value;
    const task = tasks.find((t) => (t.pmTaskId || t.assignedTaskId || t.id) === pmTaskId) || null;
    setSelectedTask(task);
    setForm((f) => ({ ...f, taskId: pmTaskId, projectId: task?.projectId || "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Client-side validation
    if (Number(form.value) <= 0) { setError("Contract value must be greater than 0."); return; }
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
      setError("End date must be after start date."); return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await vendorService.createContract(form);
      onCreated();
      onHide();
      setForm({ projectId: "", startDate: "", endDate: "", value: "", taskId: "", status: "ACTIVE", description: "" });
    } catch (err) {
      const msg = err.response?.data?.message
        || err.response?.data?.error
        || (typeof err.response?.data === "string" ? err.response.data : null)
        || err.message
        || "Failed to create contract";
      setError(msg);
      console.error("Failed to create contract", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold">Create New Contract</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <div className="alert alert-danger rounded-3 small d-flex align-items-center gap-2 mb-3">
            <FaExclamationTriangle /> {error}
          </div>
        )}
        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={12}>
              <Form.Group>
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
                    const pmId = t.pmTaskId || t.assignedTaskId || t.id;
                    return (
                      <option key={pmId} value={pmId}>
                        {pmId} — {t.taskDescription?.slice(0, 55) || t.description?.slice(0, 55) || "No description"}
                      </option>
                    );
                  })}
                </Form.Select>
                {!loadingTasks && tasks.length === 0 && (
                  <Form.Text className="text-warning fw-semibold">No tasks found. Sync tasks from My Tasks first.</Form.Text>
                )}
              </Form.Group>
            </Col>
            {selectedTask && (
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted">PROJECT (auto-filled from task)</Form.Label>
                  <Form.Control readOnly value={selectedTask.projectId || "—"} className="rounded-3 bg-light" />
                </Form.Group>
              </Col>
            )}
            <Col md={12}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">VALUE (USD) *</Form.Label>
                <Form.Control type="number" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} required min={1} className="rounded-3" />
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">START DATE *</Form.Label>
                <Form.Control type="date" value={form.startDate} min={today} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} required className="rounded-3" />
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">END DATE *</Form.Label>
                <Form.Control type="date" value={form.endDate} min={form.startDate || today} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} required className="rounded-3" />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">DESCRIPTION</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="rounded-3"
                  placeholder="Enter contract description..."
                />
              </Form.Group>
            </Col>
          </Row>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <AppButton variant="light" className="rounded-3" onClick={onHide}>Cancel</AppButton>
            <AppButton variant="primary" type="submit" className="rounded-3" disabled={submitting}>{submitting ? "Creating..." : "Create Contract"}</AppButton>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

const ContractsPage = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const load = async () => {
    setLoading(true);
    const res = await vendorService.getContracts();
    setContracts(Array.isArray(res) ? res : res?.content || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    window.addEventListener("vendorTaskSubmitted", load);
    return () => window.removeEventListener("vendorTaskSubmitted", load);
  }, []);

  const normalizeStatus = (s) =>
    (s === "DRAFT" || s === "EXPIRED" || s === "TERMINATED") ? "ACTIVE" : (s || "ACTIVE");

  const filtered   = statusFilter === "ALL" ? contracts : contracts.filter((c) => normalizeStatus(c.status) === statusFilter);
  const totalValue = filtered.reduce((s, c) => s + (c.value || 0), 0);

  return (
    <div className="p-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Contracts</h3>
          <p className="text-muted mb-0">{filtered.length} contracts · Total value: <strong>${totalValue.toLocaleString()}</strong></p>
        </div>
        <AppButton variant="primary" className="rounded-3 d-flex align-items-center gap-2" onClick={() => setShowCreate(true)}>
          <FaPlus /> New Contract
        </AppButton>
      </div>

      <div className="d-flex gap-2 mb-4 flex-wrap">
        {["ALL", "ACTIVE", "COMPLETED"].map((s) => (
          <AppButton
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`btn btn-sm rounded-3 px-3 ${statusFilter === s ? "btn-primary" : "btn-light"}`}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            <Badge bg={statusFilter === s ? "light" : "secondary"} text="dark" pill className="ms-2">
              {s === "ALL" ? contracts.length : contracts.filter((c) => normalizeStatus(c.status) === s).length}
            </Badge>
          </AppButton>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5 text-muted">Loading contracts...</div>
      ) : (
        <Card className="border-0 shadow-sm rounded-4">
          <AppTable
            columns={['Contract', 'Project', 'Value', 'Period', 'Status']}
            responsive
            isEmpty={filtered.length === 0}
            emptyText="No contracts found."
          >
            {filtered.map((c) => {
              const s = normalizeStatus(c.status);
              return (
                <tr key={c.contractId}>
                  <td className="py-3 px-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-3"><FaFileContract /></div>
                      <div>
                        <div className="fw-bold">{c.contractTitle || c.contractId}</div>
                        <div className="small text-muted font-monospace">{c.contractId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 small">{c.projectName || c.projectId || "—"}</td>
                  <td className="py-3 px-4 fw-bold">${(c.value || 0).toLocaleString()}</td>
                  <td className="py-3 px-4 small text-muted">{c.startDate} → {c.endDate}</td>
                  <td className="py-3 px-4">
                    <Badge bg={STATUS_CONFIG[s]?.bg || "success"}>
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </AppTable>
        </Card>
      )}

      <CreateContractModal show={showCreate} onHide={() => setShowCreate(false)} onCreated={load} />
    </div>
  );
};

export { ContractsPage };
