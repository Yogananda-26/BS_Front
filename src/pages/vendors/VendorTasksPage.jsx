import { useState, useEffect } from "react";
import { AppButton } from "../../components/common/AppButton";
import { Badge, Modal, Form, Alert, Spinner, Row, Col } from "react-bootstrap";
import {
  FaSyncAlt, FaClipboardList, FaProjectDiagram, FaUser,
  FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaExclamationTriangle,
  FaChevronDown, FaChevronUp, FaClock, FaPaperPlane
} from "react-icons/fa";
import vendorService from "../../services/vendorService";
import { toast } from "react-toastify";

const STATUS_CONFIG = {
  PENDING:   { bg: "warning",  label: "Pending",   text: "dark",  icon: FaClock },
  SUBMITTED: { bg: "primary",  label: "Submitted", text: "white", icon: FaPaperPlane }
};

const TABS = ["ALL", "PENDING", "SUBMITTED"];

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  } catch { return "—"; }
};

const extractPlannedEnd = (description) => {
  const match = (description || "").match(/Planned:\s*[\d-]+\s+to\s+([\d-]+)/i);
  return match ? match[1] : null;
};

const SubmitTaskModal = ({ task, show, onHide, onSubmitted }) => {
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) { setError("Please enter your submission notes."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const id = task?.assignedTaskId || task?.id || task?.taskId;
      await vendorService.submitTask(id, { description: description.trim() });

      // Update linked contract to COMPLETED
      await (async () => {
        try {
          const pmTaskId = task?.pmTaskId || task?.assignedTaskId;
          const contractData = await vendorService.getContracts(0, 200);
          const contractList = Array.isArray(contractData) ? contractData : contractData?.content || [];

          // Match by every possible taskId field name
          let linked = contractList.find((c) => {
            const cId = c.taskId || c.pmTaskId || c.assignedTaskId || c.linkedTaskId;
            return cId && (cId === pmTaskId || cId === task?.assignedTaskId || cId === task?.taskId);
          });
          // Fallback: any ACTIVE contract for the same project
          if (!linked && task?.projectId) {
            linked = contractList.find((c) =>
              String(c.projectId) === String(task.projectId) && c.status === "ACTIVE"
            );
          }
          // Last resort: first ACTIVE contract if vendor only has one
          if (!linked) {
            linked = contractList.find((c) => c.status === "ACTIVE");
          }

          if (!linked?.contractId) {
            toast.warn("Task submitted, but no matching ACTIVE contract found to mark COMPLETED.");
            return;
          }

          // Try PATCH first (partial update), fall back to full PUT
          try {
            await vendorService.patchContract(linked.contractId, { status: "COMPLETED" });
          } catch {
            const full = await vendorService.getContractById(linked.contractId).catch(() => null);
            await vendorService.updateContract(linked.contractId, { ...(full || linked), status: "COMPLETED" });
          }
          window.dispatchEvent(new CustomEvent("vendorTaskSubmitted"));
        } catch (contractErr) {
          console.error("Contract status update failed:", contractErr);
          toast.warn("Task submitted, but contract status could not be updated automatically.");
        }
      })();

      toast.success("Task submitted to Project Manager");
      setDescription("");
      onSubmitted();
      onHide();
    } catch (err) {
      setError(
        err.response?.data?.message || err.response?.data?.error ||
        (typeof err.response?.data === "string" ? err.response.data : null) ||
        err.message || "Submission failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => { setDescription(""); setError(null); onHide(); };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold">Submit Task to PM</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="rounded-3 small py-2 d-flex align-items-center gap-2">
            <FaExclamationTriangle /> {error}
          </Alert>
        )}
        {task && (
          <div className="bg-light rounded-3 p-3 mb-3">
            <div className="small text-muted fw-bold mb-1">TASK</div>
            <div className="fw-semibold font-monospace small text-primary">{task.pmTaskId || task.assignedTaskId}</div>
            <div className="small text-dark mt-1">{task.taskDescription || task.description}</div>
          </div>
        )}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-4">
            <Form.Label className="small fw-bold text-muted">WHAT DID YOU COMPLETE? *</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe findings, actions taken, and any notes for the PM..."
              className="rounded-3"
              required
            />
            <div className="d-flex justify-content-end mt-1">
              <span className="small text-muted">{description.length} chars</span>
            </div>
          </Form.Group>
          <div className="d-flex justify-content-end gap-2">
            <AppButton variant="light" className="rounded-3" onClick={handleClose}>Cancel</AppButton>
            <AppButton variant="success" type="submit" className="rounded-3 px-4" disabled={submitting}>
              {submitting
                ? <><Spinner size="sm" className="me-2" />Submitting...</>
                : <><FaCheckCircle className="me-2" />Submit to PM</>}
            </AppButton>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

const TaskCard = ({ task, onSubmit }) => {
  const [expanded, setExpanded] = useState(false);
  const sta        = STATUS_CONFIG[task.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = sta.icon;
  const isPending  = task.status === "PENDING";
  const isRejected = task.status === "REJECTED";
  const dueDate    = task.plannedEnd || task.actualEnd || task.taskDeadline || task.plannedEndDate
                  || task.endDate || task.deadline || task.dueDate
                  || extractPlannedEnd(task.taskDescription || task.description)
                  || task.syncedAt || task.assignedAt;

  return (
    <div className={`bg-white rounded-4 shadow-sm border-start border-4 border-${sta.bg} overflow-hidden`}
      style={{ transition: "box-shadow 0.2s" }}>
      <div className="p-4">
        <Row className="align-items-start g-3">
          <Col xs="auto">
            <div className={`bg-${sta.bg} bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center`}
              style={{ width: 44, height: 44 }}>
              <StatusIcon size={20} className={`text-${sta.bg}`} />
            </div>
          </Col>
          <Col>
            <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
              <span className="fw-bold font-monospace text-primary small">
                {task.pmTaskId || task.assignedTaskId || "—"}
              </span>
              <Badge bg={sta.bg} text={sta.text} className="px-2 py-1">{sta.label}</Badge>
              {task.projectId && (
                <Badge bg="light" text="dark" className="border px-2 py-1 small font-monospace">
                  {task.projectId}
                </Badge>
              )}
            </div>
            <p className="mb-2 text-dark" style={{ lineHeight: 1.5 }}>
              {task.taskDescription || task.description || "No description provided."}
            </p>
            {isRejected && task.rejectionReason && (
              <div className="d-flex align-items-start gap-2 bg-danger bg-opacity-10 rounded-3 p-2 mb-2">
                <FaTimesCircle className="text-danger mt-1 flex-shrink-0" size={13} />
                <span className="small text-danger"><strong>Rejected by PM:</strong> {task.rejectionReason}</span>
              </div>
            )}
            <div className="d-flex flex-wrap gap-3 small text-muted">
              {(task.assignedByName || task.assignedBy) && (
                <span className="d-flex align-items-center gap-1">
                  <FaUser size={11} /> {task.assignedByName || task.assignedBy}
                </span>
              )}
              {dueDate && (
                <span className="d-flex align-items-center gap-1">
                  <FaCalendarAlt size={11} />
                  {(task.plannedEnd || task.actualEnd || task.taskDeadline || task.plannedEndDate || task.endDate || task.deadline || task.dueDate || extractPlannedEnd(task.taskDescription || task.description)) ? "Due: " : "Synced: "}
                  {formatDate(dueDate)}
                </span>
              )}
              {task.projectName && (
                <span className="d-flex align-items-center gap-1">
                  <FaProjectDiagram size={11} /> {task.projectName}
                </span>
              )}
            </div>
          </Col>
          <Col xs="auto" className="d-flex flex-column align-items-end gap-2">
            {(isPending || isRejected) && (
              <AppButton
                variant={isRejected ? "warning" : "success"}
                size="sm"
                className="rounded-3 d-flex align-items-center gap-2 px-3"
                onClick={() => onSubmit(task)}
              >
                <FaCheckCircle size={13} /> {isRejected ? "Resubmit" : "Submit"}
              </AppButton>
            )}
            <AppButton
              variant="light"
              size="sm"
              className="rounded-3 d-flex align-items-center gap-1 text-muted"
              onClick={() => setExpanded((p) => !p)}
            >
              {expanded ? <><FaChevronUp size={11} /> Less</> : <><FaChevronDown size={11} /> Details</>}
            </AppButton>
          </Col>
        </Row>
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-top pt-3 bg-light bg-opacity-50">
          <Row className="g-3">
            <Col md={3} xs={6}>
              <div className="small text-muted fw-bold mb-1">TASK ID</div>
              <div className="small fw-semibold font-monospace">{task.pmTaskId || task.assignedTaskId || "—"}</div>
            </Col>
            <Col md={3} xs={6}>
              <div className="small text-muted fw-bold mb-1">PROJECT ID</div>
              <div className="small fw-semibold font-monospace">{task.projectId || "—"}</div>
            </Col>
            <Col md={3} xs={6}>
              <div className="small text-muted fw-bold mb-1">ASSIGNED BY</div>
              <div className="small fw-semibold">{task.assignedByName || task.assignedBy || "—"}</div>
            </Col>
            <Col md={3} xs={6}>
              <div className="small text-muted fw-bold mb-1">DUE DATE</div>
              <div className="small fw-semibold">{formatDate(dueDate) || "—"}</div>
            </Col>
            {task.submissionDescription && (
              <Col xs={12}>
                <div className="small text-muted fw-bold mb-1">MY SUBMISSION NOTES</div>
                <div className="bg-white rounded-3 p-3 small border">{task.submissionDescription}</div>
              </Col>
            )}
            {isRejected && task.rejectionReason && (
              <Col xs={12}>
                <div className="small text-danger fw-bold mb-1">REJECTION REASON FROM PM</div>
                <div className="bg-danger bg-opacity-10 rounded-3 p-3 small text-danger border border-danger border-opacity-25">
                  {task.rejectionReason}
                </div>
              </Col>
            )}
          </Row>
        </div>
      )}
    </div>
  );
};

const VendorTasksPage = () => {
  const [tasks, setTasks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [syncing, setSyncing]       = useState(false);
  const [activeTab, setActiveTab]   = useState("ALL");
  const [submitTask, setSubmitTask] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await vendorService.getTasks();
      const list = Array.isArray(data) ? data : data?.content || [];
      setTasks(list);
    } catch (err) {
      console.error("Failed to load vendor tasks:", err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const silentRefresh = async () => {
    try {
      await vendorService.syncTasks();
      const data = await vendorService.getTasks();
      setTasks(Array.isArray(data) ? data : data?.content || []);
    } catch { /* silent */ }
  };

  useEffect(() => {
    load();
    const interval = setInterval(silentRefresh, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await vendorService.syncTasks();
      await load();
      toast.success("Tasks synced from PM successfully");
    } catch (err) {
      toast.error("Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const filtered     = activeTab === "ALL" ? tasks : tasks.filter((t) => t.status === activeTab);
  const pendingCount = tasks.filter((t) => t.status === "PENDING").length;

  return (
    <div className="p-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">My Assigned Tasks</h3>
          <p className="text-muted mb-0">
            Tasks assigned by Project Manager for your action.
            {pendingCount > 0 && <Badge bg="danger" pill className="ms-2">{pendingCount} pending</Badge>}
          </p>
        </div>
        <AppButton variant="outline-secondary" className="rounded-3 d-flex align-items-center gap-2" onClick={handleSync} disabled={syncing}>
          {syncing ? <Spinner size="sm" /> : <FaSyncAlt />}
          {syncing ? "Syncing..." : "Sync from PM"}
        </AppButton>
      </div>

      <div className="d-flex gap-2 mb-4 flex-wrap">
        {TABS.map((tab) => {
          const count = tab === "ALL" ? tasks.length : tasks.filter((t) => t.status === tab).length;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`btn btn-sm rounded-3 px-3 ${activeTab === tab ? "btn-dark" : "btn-light text-muted"}`}
              style={activeTab === tab ? { backgroundColor: "#2c3e50" } : {}}>
              {tab === "ALL" ? "All" : STATUS_CONFIG[tab]?.label || tab}
              <Badge bg={tab === "PENDING" && count > 0 ? "danger" : (activeTab === tab ? "light" : "secondary")}
                text={activeTab === tab && tab !== "PENDING" ? "dark" : undefined} pill className="ms-2">
                {count}
              </Badge>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-2">Loading tasks...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-5 bg-white rounded-4 shadow-sm">
          <FaClipboardList size={48} className="text-muted opacity-25 mb-3" />
          <p className="text-muted fw-semibold mb-1">No {activeTab !== "ALL" ? activeTab.toLowerCase() : ""} tasks found</p>
          <p className="text-muted small">
            {activeTab === "PENDING" || activeTab === "ALL"
              ? 'Click "Sync from PM" to pull the latest tasks assigned to you.'
              : "No tasks in this status yet."}
          </p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filtered.map((task) => (
            <TaskCard
              key={task.assignedTaskId || task.id || task.pmTaskId}
              task={task}
              onSubmit={setSubmitTask}
            />
          ))}
        </div>
      )}

      <SubmitTaskModal task={submitTask} show={!!submitTask} onHide={() => setSubmitTask(null)} onSubmitted={load} />
    </div>
  );
};

export { VendorTasksPage };
