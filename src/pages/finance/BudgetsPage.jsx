import { useState, useEffect } from "react";
import { AppButton } from "../../components/common/AppButton";
import { AppTable } from "../../components/common/AppTable";
import { Card, Badge, Modal, Form, Row, Col, ProgressBar, Alert, Spinner } from "react-bootstrap";
import {
  FaPlus, FaTrash, FaEdit, FaChartBar, FaExclamationTriangle,
  FaCheckCircle, FaInfoCircle
} from "react-icons/fa";
import { financeService } from "../../services/financeService";
import { validateCreateBudgetForm, firstError } from "../../utils/validators";
import { toast } from "react-toastify";

const STATUS_CONFIG = {
  DRAFT:     { bg: "secondary", label: "Draft" },
  SUBMITTED: { bg: "warning",   label: "Submitted" },
  APPROVED:  { bg: "success",   label: "Approved" },
  REJECTED:  { bg: "danger",    label: "Rejected" }
};
const CATEGORIES  = ["LABOR", "SUBCONTRACT", "EQUIPMENT", "MATERIAL", "MISCELLANEOUS"];
const STATUS_TABS = ["ALL", "DRAFT", "SUBMITTED", "APPROVED", "REJECTED"];

/* ─── Create Budget Modal ─────────────────────────────────── */
const CreateBudgetModal = ({ tasks, show, onHide, onCreated }) => {
  const emptyForm = { taskId: "", budgetCategory: "MATERIAL", plannedAmount: "" };
  const [form, setForm]             = useState(emptyForm);
  const [selectedTask, setSelectedTask] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState(null);
  const [allocationResult, setAllocationResult] = useState(null);

  const pendingTasks = tasks.filter((t) => t.status === "PENDING");

  const reset = () => { setForm(emptyForm); setSelectedTask(null); setError(null); setAllocationResult(null); };

  const handleTaskChange = (e) => {
    const taskId = e.target.value;
    const task   = pendingTasks.find((t) => (t.pmTaskId || t.id) === taskId) || null;
    setSelectedTask(task);
    setForm((f) => ({ ...f, taskId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const msg = firstError(validateCreateBudgetForm(form));
    if (msg) { setError(msg); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await financeService.createBudget({
        taskId:         form.taskId,
        projectId:      selectedTask?.projectId || selectedTask?.projectName || "",
        budgetCategory: form.budgetCategory,
        plannedAmount:  Number(form.plannedAmount)
      });
      setAllocationResult(res);
      onCreated();
    } catch (err) {
      const data = err.response?.data;
      const fieldErrors = data?.errors
        ? Object.values(data.errors).join(", ")
        : data?.details?.join(", ") || null;
      setError(fieldErrors || data?.message || err.message || "Failed to create budget");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDone = () => { reset(); onHide(); };

  return (
    <Modal show={show} onHide={() => { if (!allocationResult) { onHide(); reset(); } }} centered>
      <Modal.Header closeButton={!allocationResult} className="border-0">
        <Modal.Title className="fw-bold">
          {allocationResult ? "Budget Created" : "Create New Budget"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {allocationResult ? (
          <div>
            <div className="text-center mb-4">
              <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
                <FaCheckCircle size={30} className="text-success" />
              </div>
              <h5 className="fw-bold mb-1">Budget Created Successfully</h5>
              <p className="text-muted small">{allocationResult.budgetId || ""}</p>
            </div>

            {allocationResult.allocationWarning && (
              <Alert variant="warning" className="rounded-3 d-flex align-items-start gap-2 mb-3">
                <FaExclamationTriangle className="mt-1 flex-shrink-0" />
                <div className="small">{allocationResult.allocationWarning}</div>
              </Alert>
            )}

            <div className="bg-light rounded-4 p-3 mb-3">
              <div className="small text-muted fw-bold mb-3 text-uppercase">Project Budget Summary</div>
              <Row className="g-2 text-center">
                <Col xs={4}>
                  <div className="small text-muted mb-1">Total Budget</div>
                  <div className="fw-bold text-dark">${(allocationResult.projectTotalBudget || 0).toLocaleString()}</div>
                </Col>
                <Col xs={4}>
                  <div className="small text-muted mb-1">Allocated</div>
                  <div className="fw-bold text-primary">${(allocationResult.projectAllocatedBudget || 0).toLocaleString()}</div>
                </Col>
                <Col xs={4}>
                  <div className="small text-muted mb-1">Remaining</div>
                  <div className={`fw-bold ${(allocationResult.projectRemainingBudget || 0) < 0 ? "text-danger" : "text-success"}`}>
                    ${(allocationResult.projectRemainingBudget || 0).toLocaleString()}
                  </div>
                </Col>
              </Row>
              {allocationResult.projectTotalBudget > 0 && (
                <div className="mt-3">
                  <div className="d-flex justify-content-between small mb-1">
                    <span className="text-muted">Allocation used</span>
                    <span className="fw-bold">
                      {(((allocationResult.projectAllocatedBudget || 0) / allocationResult.projectTotalBudget) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <ProgressBar
                    now={Math.min(((allocationResult.projectAllocatedBudget || 0) / allocationResult.projectTotalBudget) * 100, 100)}
                    variant={(allocationResult.projectRemainingBudget || 0) < 0 ? "danger" : "success"}
                    style={{ height: "8px" }}
                    className="rounded-pill"
                  />
                </div>
              )}
            </div>

            <div className="d-flex justify-content-end">
              <AppButton variant="dark" className="rounded-3 px-4" style={{ backgroundColor: "#2c3e50" }} onClick={handleDone}>
                Done
              </AppButton>
            </div>
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="danger" className="rounded-3 small py-2 d-flex align-items-center gap-2">
                <FaExclamationTriangle /> {error}
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">ASSIGNED TASK *</Form.Label>
              <Form.Select value={form.taskId} onChange={handleTaskChange} required className="rounded-3">
                <option value="">Select a synced task...</option>
                {pendingTasks.map((t) => (
                  <option key={t.pmTaskId || t.id} value={t.pmTaskId || t.id}>
                    {t.pmTaskId || t.id} — {t.description?.slice(0, 55) || "No description"}
                  </option>
                ))}
              </Form.Select>
              {pendingTasks.length === 0 && (
                <Form.Text className="text-warning fw-semibold">No pending tasks. Go to My Tasks and sync from PM first.</Form.Text>
              )}
            </Form.Group>

            {selectedTask && (
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">PROJECT (from task)</Form.Label>
                <Form.Control
                  readOnly
                  value={selectedTask.projectId || selectedTask.projectName || "—"}
                  className="rounded-3 bg-light"
                />
                {selectedTask.description && (
                  <Form.Text className="text-muted">{selectedTask.description}</Form.Text>
                )}
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">BUDGET CATEGORY *</Form.Label>
              <Form.Select
                value={form.budgetCategory}
                onChange={(e) => setForm((f) => ({ ...f, budgetCategory: e.target.value }))}
                required className="rounded-3"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-muted">PLANNED AMOUNT ($) *</Form.Label>
              <Form.Control
                type="number"
                value={form.plannedAmount}
                onChange={(e) => setForm((f) => ({ ...f, plannedAmount: e.target.value }))}
                required min={1} className="rounded-3" placeholder="0.00"
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <AppButton variant="light" className="rounded-3" onClick={() => { onHide(); reset(); }}>Cancel</AppButton>
              <AppButton variant="dark" type="submit" className="rounded-3 px-4" style={{ backgroundColor: "#2c3e50" }} disabled={submitting}>
                {submitting ? <><Spinner size="sm" className="me-2" />Creating...</> : "Create Budget"}
              </AppButton>
            </div>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
};

/* ─── Edit Budget Modal (DRAFT only) ─────────────────────── */
const EditBudgetModal = ({ budget, show, onHide, onUpdated }) => {
  const [form, setForm]           = useState({ budgetCategory: "", plannedAmount: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState(null);

  useEffect(() => {
    if (budget) setForm({ budgetCategory: budget.budgetCategory || "MATERIAL", plannedAmount: budget.plannedAmount });
  }, [budget]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await financeService.updateBudget(budget.budgetId, {
        budgetCategory: form.budgetCategory,
        plannedAmount:  Number(form.plannedAmount)
      });
      toast.success("Budget updated");
      onUpdated();
      onHide();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold">Edit Budget</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {error && (
            <Alert variant="danger" className="rounded-3 small py-2 d-flex align-items-center gap-2">
              <FaExclamationTriangle /> {error}
            </Alert>
          )}
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted">BUDGET CATEGORY *</Form.Label>
            <Form.Select
              value={form.budgetCategory}
              onChange={(e) => setForm((f) => ({ ...f, budgetCategory: e.target.value }))}
              required className="rounded-3"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label className="small fw-bold text-muted">PLANNED AMOUNT ($) *</Form.Label>
            <Form.Control
              type="number"
              value={form.plannedAmount}
              onChange={(e) => setForm((f) => ({ ...f, plannedAmount: e.target.value }))}
              required min={1} className="rounded-3"
            />
          </Form.Group>
          <div className="d-flex justify-content-end gap-2">
            <AppButton variant="light" className="rounded-3" onClick={onHide}>Cancel</AppButton>
            <AppButton variant="primary" type="submit" className="rounded-3 px-4" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </AppButton>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

/* ─── Delete Confirm Modal ────────────────────────────────── */
const DeleteModal = ({ budget, show, onHide, onDeleted }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await financeService.deleteBudget(budget.budgetId);
      toast.success("Budget deleted");
      onDeleted();
      onHide();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="sm">
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold text-danger">Delete Budget</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center pb-4">
        <FaTrash size={36} className="text-danger opacity-50 mb-3" />
        <p className="mb-1 fw-semibold">Are you sure?</p>
        <p className="text-muted small mb-4">
          Budget <strong>{budget?.budgetId}</strong> will be permanently deleted. This cannot be undone.
        </p>
        <div className="d-flex justify-content-center gap-2">
          <AppButton variant="light" className="rounded-3 px-4" onClick={onHide}>Cancel</AppButton>
          <AppButton variant="danger" className="rounded-3 px-4" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Yes, Delete"}
          </AppButton>
        </div>
      </Modal.Body>
    </Modal>
  );
};

/* ─── Utilization Modal ───────────────────────────────────── */
const UtilizationModal = ({ budget, show, onHide }) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && budget) {
      setLoading(true);
      financeService.getBudgetUtilization(budget.budgetId)
        .then(setData)
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }
  }, [show, budget]);

  const pct = data?.utilizationPercentage ?? 0;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold">Budget Utilization</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        {loading ? (
          <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>
        ) : data ? (
          <>
            {data.overBudget && (
              <Alert variant="danger" className="rounded-3 d-flex align-items-center gap-2 mb-4">
                <FaExclamationTriangle /> This budget has exceeded its planned amount.
              </Alert>
            )}
            <div className="text-center mb-4">
              <h1 className={`fw-bold mb-0 ${data.overBudget ? "text-danger" : "text-success"}`}>
                {pct.toFixed(1)}%
              </h1>
              <p className="text-muted small text-uppercase fw-bold">Budget Utilized</p>
            </div>
            <div className="mb-4">
              <div className="d-flex justify-content-between small fw-bold mb-1">
                <span>Utilization</span><span>{pct.toFixed(1)}%</span>
              </div>
              <ProgressBar
                now={Math.min(pct, 100)}
                variant={data.overBudget ? "danger" : pct > 80 ? "warning" : "success"}
                style={{ height: "10px" }}
                className="rounded-pill"
              />
            </div>
            <Row className="g-3 text-center">
              <Col xs={6}>
                <div className="p-3 bg-light rounded-4">
                  <div className="small text-muted mb-1">Planned</div>
                  <div className="fw-bold text-dark">${(data.plannedAmount || 0).toLocaleString()}</div>
                </div>
              </Col>
              <Col xs={6}>
                <div className="p-3 bg-light rounded-4">
                  <div className="small text-muted mb-1">Actual Spent</div>
                  <div className={`fw-bold ${data.overBudget ? "text-danger" : "text-dark"}`}>
                    ${(data.actualAmount || 0).toLocaleString()}
                  </div>
                </div>
              </Col>
              {budget?.projectId && (
                <>
                  <Col xs={6}>
                    <div className="p-3 bg-light rounded-4">
                      <div className="small text-muted mb-1">Project Allocated</div>
                      <div className="fw-bold">${(data.projectAllocatedBudget || 0).toLocaleString()}</div>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="p-3 bg-light rounded-4">
                      <div className="small text-muted mb-1">Project Remaining</div>
                      <div className="fw-bold text-success">${(data.projectRemainingBudget || 0).toLocaleString()}</div>
                    </div>
                  </Col>
                </>
              )}
            </Row>
          </>
        ) : (
          <div className="text-center py-4 text-muted">
            <FaInfoCircle size={32} className="opacity-25 mb-2" />
            <p>Utilization data not available.</p>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

/* ─── Main Page ───────────────────────────────────────────── */
const BudgetsPage = () => {
  const [budgets, setBudgets]           = useState([]);
  const [tasks, setTasks]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [syncing, setSyncing]           = useState(false); // NEW — tracks sync in progress
  const [activeStatus, setActiveStatus] = useState("ALL");
  const [submittingId, setSubmittingId] = useState("");

  const [showCreate, setShowCreate]     = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [utilTarget, setUtilTarget]     = useState(null);

  // ── NEW: calls POST /api/budgets/sync-approvals ──────────────────────────
  // Finance polls PM's approval list and updates any SUBMITTED budgets
  // that PM has already APPROVED or REJECTED.
  // Fire-and-forget — if PM is down the page still loads with last known status.
  const syncApprovals = async () => {
    setSyncing(true);
    try {
      await financeService.syncBudgetApprovals();
    } catch (err) {
      // Non-blocking — silently ignore, budgets will still load
      console.warn("Budget approval sync failed (PM may be down):", err.message);
    } finally {
      setSyncing(false);
    }
  };
  // ────────────────────────────────────────────────────────────────────────

  const load = async (status = activeStatus) => {
    setLoading(true);
    try {
      let data;
      if (status === "ALL") {
        const results = await Promise.all(
          ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"].map((s) =>
            financeService.getBudgetsByStatus(s).catch(() => [])
          )
        );
        data = results.flat();
      } else {
        data = await financeService.getBudgetsByStatus(status);
      }
      setBudgets(data);
    } catch (err) {
      console.error(err);
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const data = await financeService.getTasks();
      setTasks(Array.isArray(data) ? data : []);
    } catch {
      setTasks([]);
    }
  };

  // ── NEW: sync first, then load budgets ──────────────────────────────────
  // Order matters: sync updates Finance DB first, then we read the updated data.
  useEffect(() => {
    const init = async () => {
      await syncApprovals(); // tell Finance to check PM for any decisions
      await load();          // now fetch budgets — statuses will be correct
      await loadTasks();
    };
    init();
  }, []);
  // ────────────────────────────────────────────────────────────────────────

  const handleStatusTab = (status) => {
    setActiveStatus(status);
    load(status);
  };

  const handleSubmitAction = async (id) => {
    setSubmittingId(id);
    try {
      await financeService.submitBudget(id);
      toast.success("Budget submitted for approval");
      // ── NEW: sync after submit so if PM already has a decision it shows immediately
      await syncApprovals();
      load(activeStatus);
    } catch (err) {
      toast.error(err.response?.data?.message || "Submit failed");
    } finally {
      setSubmittingId("");
    }
  };

  const counts = STATUS_TABS.reduce((acc, s) => {
    acc[s] = s === "ALL" ? budgets.length : budgets.filter((b) => b.status === s).length;
    return acc;
  }, {});

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Budget Management</h3>
          <div className="text-muted mb-0 small">
            Track and allocate funds across construction projects.
            {/* NEW — subtle sync indicator so the user knows sync happened */}
            {syncing && (
              <span className="ms-2 text-muted small">
                <Spinner animation="border" size="sm" className="me-1" />
                Syncing approvals...
              </span>
            )}
          </div>
        </div>
        <AppButton
          variant="dark"
          className="rounded-3 d-flex align-items-center gap-2"
          style={{ backgroundColor: "#2c3e50" }}
          onClick={() => setShowCreate(true)}
        >
          <FaPlus /> Create Budget
        </AppButton>
      </div>

      {/* Status Filter Tabs */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {STATUS_TABS.map((s) => (
          <AppButton
            key={s}
            size="sm"
            className={`rounded-3 px-3 ${activeStatus === s ? "btn-dark" : "btn-light"}`}
            style={activeStatus === s ? { backgroundColor: "#2c3e50" } : {}}
            onClick={() => handleStatusTab(s)}
          >
            {s === "ALL" ? "All" : STATUS_CONFIG[s].label}
            <Badge
              bg={activeStatus === s ? "light" : "secondary"}
              text="dark"
              pill
              className="ms-2"
            >
              {counts[s]}
            </Badge>
          </AppButton>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="dark" />
          <p className="text-muted mt-2">Loading budgets...</p>
        </div>
      ) : (
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
          <AppTable
            columns={["Budget ID", "Task / Category", "Planned Amount", "Utilization", "Status", "Actions"]}
            responsive
            isEmpty={budgets.length === 0}
            emptyText="No budgets found for this filter."
          >
            {budgets.map((b) => {
              const sta        = STATUS_CONFIG[b.status] || STATUS_CONFIG.DRAFT;
              const actual     = b.actualAmount || 0;
              const planned    = b.plannedAmount || 1;
              const utilPct    = Math.min((actual / planned) * 100, 100);
              const isDraft    = b.status === "DRAFT";
              const isApproved = b.status === "APPROVED";

              return (
                <tr key={b.budgetId}>
                  <td className="py-3 px-4">
                    <div className="fw-bold text-primary font-monospace">{b.budgetId}</div>
                    <div className="small text-muted">{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "—"}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="fw-semibold small mb-1">{b.taskId || b.pmTaskId || "—"}</div>
                    <Badge bg="light" text="dark" className="border small">{b.budgetCategory}</Badge>
                    {b.projectName && <div className="small text-muted mt-1">{b.projectName}</div>}
                  </td>
                  <td className="py-3 px-4">
                    <div className="fw-bold">${(b.plannedAmount || 0).toLocaleString()}</div>
                    <div className="small text-muted">Actual: <span className="text-danger fw-semibold">${actual.toLocaleString()}</span></div>
                  </td>
                  <td className="py-3 px-4" style={{ minWidth: "140px" }}>
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="text-muted">Used</span>
                      <span className="fw-bold">{utilPct.toFixed(1)}%</span>
                    </div>
                    <ProgressBar
                      now={utilPct}
                      variant={utilPct > 90 ? "danger" : utilPct > 70 ? "warning" : "success"}
                      style={{ height: "6px" }}
                      className="rounded-pill"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <Badge bg={sta.bg} className={b.status === "SUBMITTED" ? "text-dark" : ""}>{sta.label}</Badge>
                    {b.rejectionReason && (
                      <div className="small text-danger mt-1" title={b.rejectionReason}>
                        {b.rejectionReason.slice(0, 30)}…
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-end">
                    <div className="d-flex justify-content-end gap-1 flex-wrap">
                      {isDraft && (
                        <>
                          <AppButton
                            variant="outline-success"
                            size="sm"
                            className="rounded-3"
                            disabled={submittingId === b.budgetId}
                            onClick={() => handleSubmitAction(b.budgetId)}
                          >
                            {submittingId === b.budgetId ? "..." : "Submit"}
                          </AppButton>
                          <AppButton
                            variant="light"
                            size="sm"
                            className="rounded-3"
                            title="Edit"
                            onClick={() => setEditTarget(b)}
                          >
                            <FaEdit className="text-primary" />
                          </AppButton>
                          <AppButton
                            variant="light"
                            size="sm"
                            className="rounded-3"
                            title="Delete"
                            onClick={() => setDeleteTarget(b)}
                          >
                            <FaTrash className="text-danger" />
                          </AppButton>
                        </>
                      )}
                      {isApproved && (
                        <AppButton
                          variant="light"
                          size="sm"
                          className="rounded-3 d-flex align-items-center gap-1"
                          onClick={() => setUtilTarget(b)}
                        >
                          <FaChartBar className="text-success" /> Utilization
                        </AppButton>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </AppTable>
        </Card>
      )}

      {/* Modals */}
      <CreateBudgetModal
        tasks={tasks}
        show={showCreate}
        onHide={() => setShowCreate(false)}
        onCreated={() => { load(activeStatus); loadTasks(); }}
      />
      <EditBudgetModal
        budget={editTarget}
        show={!!editTarget}
        onHide={() => setEditTarget(null)}
        onUpdated={() => { load(activeStatus); setEditTarget(null); }}
      />
      <DeleteModal
        budget={deleteTarget}
        show={!!deleteTarget}
        onHide={() => setDeleteTarget(null)}
        onDeleted={() => { load(activeStatus); setDeleteTarget(null); }}
      />
      <UtilizationModal
        budget={utilTarget}
        show={!!utilTarget}
        onHide={() => setUtilTarget(null)}
      />
    </div>
  );
};

export { BudgetsPage };
