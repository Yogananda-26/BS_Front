import { useState, useEffect } from "react";
import { AppButton } from "../../components/common/AppButton";
import { AppTable } from "../../components/common/AppTable";
import { Card, Badge, Modal, Form, Spinner } from "react-bootstrap";
import { FaPlus, FaTrash, FaCheckCircle, FaTimesCircle, FaLock } from "react-icons/fa";
import { toast } from "react-toastify";
import safetyService from "../../services/safetyService";

/* ── Backend enum: SCHEDULED | IN_PROGRESS | COMPLETED | NON_COMPLIANT | CLOSED ── */
const STATUS_CONFIG = {
  SCHEDULED:     { bg: "primary",   label: "Scheduled",     icon: null },
  IN_PROGRESS:   { bg: "warning",   label: "In Progress",   icon: null },
  COMPLETED:     { bg: "success",   label: "Completed",     icon: FaCheckCircle },
  NON_COMPLIANT: { bg: "danger",    label: "Non-Compliant", icon: FaTimesCircle },
  CLOSED:        { bg: "secondary", label: "Closed",        icon: FaLock }
};

/* Valid transitions per status — drives the dropdown options shown */
const ALLOWED_NEXT = {
  SCHEDULED:     ["SCHEDULED", "IN_PROGRESS"],
  IN_PROGRESS:   ["IN_PROGRESS", "COMPLETED"],
  COMPLETED:     ["COMPLETED", "CLOSED"],
  NON_COMPLIANT: ["NON_COMPLIANT", "CLOSED"],
  CLOSED:        []   // terminal — no dropdown shown
};

const INSPECTION_TYPES = [
  "FIRE_SAFETY", "SCAFFOLDING_SAFETY", "ELECTRICAL_SAFETY",
  "EQUIPMENT_INSPECTION", "HOUSEKEEPING", "HAZARDOUS_MATERIALS",
  "FIRST_AID_READINESS", "EXCAVATION_SAFETY", "EMERGENCY_EXIT_CHECK", "PPE_COMPLIANCE"
];

const EMPTY_FORM = { projectId: "", inspectionType: "", assignedTaskId: "", findings: "" };

const ALL_TABS = ["ALL", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CLOSED"];

/* ── Create Inspection Modal ─────────────────────────────── */
const CreateInspectionModal = ({ show, onHide, onCreated }) => {
  const [types, setTypes]             = useState(INSPECTION_TYPES);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [tasks, setTasks]             = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState("");

  useEffect(() => {
    if (!show) return;
    setForm(EMPTY_FORM);
    setSelectedTask(null);
    setError("");
    safetyService.getInspectionTypes()
      .then((data) => { if (Array.isArray(data) && data.length > 0) setTypes(data); })
      .catch(() => {});
    setLoadingTasks(true);
    safetyService.getTasks()
      .then((data) => setTasks(Array.isArray(data) ? data : []))
      .catch(() => setTasks([]))
      .finally(() => setLoadingTasks(false));
  }, [show]);

  const handleTaskChange = (e) => {
    const taskId = e.target.value;
    const task   = tasks.find((t) => (t.assignedTaskId || t.id) === taskId) || null;
    setSelectedTask(task);
    setForm((f) => ({ ...f, assignedTaskId: taskId, projectId: task?.projectId || "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.assignedTaskId) { setError("Please select a task."); return; }
    if (!form.projectId)      { setError("Selected task has no project ID."); return; }
    if (!form.inspectionType) { setError("Please select an inspection type."); return; }
    setSubmitting(true);
    try {
      await safetyService.createInspection({
        projectId:      form.projectId,
        inspectionType: form.inspectionType,
        assignedTaskId: form.assignedTaskId,
        findings:       form.findings.trim() || "Initial inspection findings"
      });
      toast.success("Inspection scheduled successfully");
      onCreated();
      onHide();
      setForm(EMPTY_FORM);
      setSelectedTask(null);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to schedule inspection.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold text-primary">Schedule Inspection</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted">ASSIGNED TASK *</Form.Label>
            <Form.Select
              value={form.assignedTaskId}
              onChange={handleTaskChange}
              className="rounded-3"
              disabled={loadingTasks}
            >
              <option value="">{loadingTasks ? "Loading tasks..." : "— Select a task —"}</option>
              {tasks.map((t) => {
                const internalId = t.assignedTaskId || t.id;
                const displayId  = t.pmTaskId || t.assignedTaskId || t.id;
                return (
                  <option key={internalId} value={internalId}>
                    {displayId} — {(t.taskDescription || t.description || "No description").slice(0, 50)}
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
              {(selectedTask.taskDescription || selectedTask.description) && (
                <Form.Text className="text-muted">{selectedTask.taskDescription || selectedTask.description}</Form.Text>
              )}
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted">INSPECTION TYPE *</Form.Label>
            <Form.Select
              value={form.inspectionType}
              onChange={(e) => setForm((f) => ({ ...f, inspectionType: e.target.value }))}
              className="rounded-3"
            >
              <option value="">Select type...</option>
              {types.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted">
              INITIAL FINDINGS <span className="fw-normal">(optional)</span>
            </Form.Label>
            <Form.Control
              as="textarea" rows={3}
              value={form.findings}
              onChange={(e) => setForm((f) => ({ ...f, findings: e.target.value }))}
              placeholder="Describe initial findings or notes..."
              maxLength={200}
              className="rounded-3"
            />
            <Form.Text className="text-muted">{form.findings.length}/200</Form.Text>
          </Form.Group>

          {error && <div className="alert alert-danger py-2 small rounded-3">{error}</div>}

          <div className="d-flex justify-content-end gap-2 mt-3">
            <AppButton variant="light" className="rounded-3" onClick={onHide} disabled={submitting}>Cancel</AppButton>
            <AppButton variant="primary" type="submit" className="rounded-3" disabled={submitting}>
              {submitting ? <><Spinner size="sm" className="me-1" />Scheduling...</> : "Schedule Inspection"}
            </AppButton>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

/* ── Main Page ───────────────────────────────────────────── */
const InspectionsPage = () => {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showCreate, setShowCreate]   = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingId, setUpdatingId]   = useState("");
  const [deletingId, setDeletingId]   = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await safetyService.getInspections({
        status: statusFilter !== "ALL" ? statusFilter : undefined
      });
      setInspections(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      console.error("Inspections load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleStatusChange = async (ins, newStatus) => {
    const id = ins.id || ins.inspectionId;
    setUpdatingId(ins.inspectionId);
    try {
      await safetyService.updateInspectionStatus(id, newStatus);
      await load();
      toast.success(`Inspection marked as ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Failed to update status";
      toast.error(msg);
    } finally {
      setUpdatingId("");
    }
  };

  const handleDelete = async (ins) => {
    if (!window.confirm("Delete this scheduled inspection?")) return;
    const id = ins.id || ins.inspectionId;
    setDeletingId(ins.inspectionId);
    try {
      await safetyService.deleteInspection(id);
      toast.success("Inspection deleted");
      await load();
    } catch (err) {
      toast.error("Failed to delete. Only SCHEDULED inspections can be deleted.");
    } finally {
      setDeletingId("");
    }
  };

  /* Filtered list for the active tab */
  const displayed = statusFilter === "ALL"
    ? inspections
    : inspections.filter((i) => i.status === statusFilter);

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Inspections</h3>
          <p className="text-muted mb-0">{inspections.length} inspections found</p>
        </div>
        <AppButton variant="primary" className="rounded-3 d-flex align-items-center gap-2" onClick={() => setShowCreate(true)}>
          <FaPlus /> Schedule Inspection
        </AppButton>
      </div>

      {/* Status tabs */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {ALL_TABS.map((s) => {
          const count = s === "ALL" ? inspections.length : inspections.filter((i) => i.status === s).length;
          const cfg   = STATUS_CONFIG[s];
          return (
            <AppButton
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`btn btn-sm rounded-3 px-3 ${statusFilter === s ? "btn-primary" : "btn-light"}`}
            >
              {s === "ALL" ? "All" : cfg?.label || s}
              <Badge bg={statusFilter === s ? "light" : "secondary"} text="dark" pill className="ms-2">
                {count}
              </Badge>
            </AppButton>
          );
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-5 text-muted">
          <Spinner animation="border" size="sm" className="me-2" />Loading inspections...
        </div>
      ) : (
        <Card className="border-0 shadow-sm rounded-4">
          <AppTable
            columns={["Date", "Type", "Officer", "Findings", "Status", "Actions"]}
            responsive
            isEmpty={displayed.length === 0}
            emptyText="No inspections found."
          >
            {displayed.map((ins) => {
              const cfg      = STATUS_CONFIG[ins.status] || STATUS_CONFIG.SCHEDULED;
              const StatusIcon = cfg.icon;
              const allowed  = ALLOWED_NEXT[ins.status] || [];
              const isLocked = allowed.length === 0;   // CLOSED — terminal

              return (
                <tr key={ins.inspectionId}>
                  <td className="py-3 px-4 small text-muted">{ins.date}</td>
                  <td className="py-3 px-4">
                    <Badge bg="light" text="dark" className="border small">
                      {(ins.inspectionType || "").replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 small">{ins.officerName}</td>
                  <td className="py-3 px-4 small text-muted"
                    style={{ maxWidth: 220, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                    {ins.findings || <span className="fst-italic">No findings yet</span>}
                  </td>

                  {/* Status cell */}
                  <td className="py-3 px-4">
                    {isLocked ? (
                      /* CLOSED — static badge */
                      <span className={`badge bg-${cfg.bg} px-3 py-2 rounded-3 d-inline-flex align-items-center gap-1`}>
                        {StatusIcon && <StatusIcon size={11} />} {cfg.label}
                      </span>
                    ) : (
                      <div className="d-flex align-items-center gap-2">
                        <select
                          className="form-select form-select-sm rounded-3 w-auto"
                          value={ins.status}
                          disabled={updatingId === ins.inspectionId}
                          onChange={(e) => handleStatusChange(ins, e.target.value)}
                          style={{ minWidth: 150 }}
                        >
                          {allowed.map((opt) => (
                            <option key={opt} value={opt}>{STATUS_CONFIG[opt]?.label || opt}</option>
                          ))}
                        </select>
                        {updatingId === ins.inspectionId && <Spinner size="sm" />}
                      </div>
                    )}
                  </td>

                  {/* Actions cell */}
                  <td className="py-3 px-4">
                    {ins.status === "SCHEDULED" && (
                      <AppButton
                        variant="outline-danger"
                        size="sm"
                        className="rounded-3"
                        disabled={deletingId === ins.inspectionId}
                        onClick={() => handleDelete(ins)}
                      >
                        {deletingId === ins.inspectionId ? <Spinner size="sm" /> : <FaTrash />}
                      </AppButton>
                    )}
                  </td>
                </tr>
              );
            })}
          </AppTable>
        </Card>
      )}

      <CreateInspectionModal show={showCreate} onHide={() => setShowCreate(false)} onCreated={load} />
    </div>
  );
};

export { InspectionsPage };
