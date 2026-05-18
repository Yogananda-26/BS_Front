import { useState, useEffect } from "react";
import { AppButton } from "../../components/common/AppButton";
import { AppTable } from "../../components/common/AppTable";
import { Row, Col, Card, Badge, Button, Modal, Form } from "react-bootstrap";
import { FaPlus, FaFileInvoiceDollar, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import vendorService from "../../services/vendorService";
import { toast } from "react-toastify";
const today = new Date().toISOString().split("T")[0];

const STATUS_CONFIG = {
  PENDING:   { bg: "warning",  label: "Pending"   },
  SUBMITTED: { bg: "info",     label: "Submitted" },
  APPROVED:  { bg: "success",  label: "Approved"  },
  REJECTED:  { bg: "danger",   label: "Rejected"  },
  PAID:      { bg: "primary",  label: "Paid"      }
};
const CreateInvoiceModal = ({ show, onHide, onCreated }) => {
  const [form, setForm] = useState({
    contractId: "",
    amount: "",
    date: "",
    description: "",
    taskId: ""
  });
  const [tasks, setTasks] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!show) return;
    setForm({ contractId: "", amount: "", date: "", description: "", taskId: "" });
    setLoadingTasks(true);
    Promise.all([
      vendorService.getTasks().catch(() => []),
      vendorService.getContracts().catch(() => ({ content: [] }))
    ]).then(([taskData, contractData]) => {
      setTasks(Array.isArray(taskData) ? taskData : []);
      const contractList = Array.isArray(contractData) ? contractData : contractData?.content || [];
      setContracts(contractList);
    }).finally(() => setLoadingTasks(false));
  }, [show]);

  const handleTaskChange = (e) => {
    const pmTaskId = e.target.value;
    setForm((f) => ({ ...f, taskId: pmTaskId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) { setError("Invoice amount must be greater than 0."); return; }
    if (!form.description?.trim()) { setError("Description is required."); return; }
    if (!form.date) { setError("Invoice date is required."); return; }
    setSubmitting(true);
    setError(null);
    try {
      await vendorService.createInvoice(form);
      onCreated();
      onHide();
      setForm({ contractId: "", amount: "", date: "", description: "", taskId: "" });
    } catch (err) {
      const msg = err.response?.data?.message
        || err.response?.data?.error
        || (typeof err.response?.data === "string" ? err.response.data : null)
        || err.message
        || "Failed to create invoice";
      setError(msg);
      console.error("Failed to create invoice", err.response?.data || err);
    } finally {
      setSubmitting(false);
    }
  };
  return <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold">Create Invoice</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <div className="alert alert-danger rounded-3 small d-flex align-items-center gap-2 mb-3">
            <FaExclamationTriangle /> {error}
          </div>}
        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">CONTRACT *</Form.Label>
                <Form.Select
                  value={form.contractId}
                  onChange={(e) => setForm((f) => ({ ...f, contractId: e.target.value }))}
                  required
                  className="rounded-3"
                  disabled={loadingTasks}
                >
                  <option value="">{loadingTasks ? "Loading..." : "— Select a contract —"}</option>
                  {contracts.map((c) => (
                    <option key={c.contractId} value={c.contractId}>
                      {c.contractId}{c.projectId ? ` — ${c.projectId}` : ""}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
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
                        {pmId} — {t.taskDescription?.slice(0, 40) || t.description?.slice(0, 40) || "No description"}
                      </option>
                    );
                  })}
                </Form.Select>
                {!loadingTasks && tasks.length === 0 && (
                  <Form.Text className="text-warning fw-semibold">No tasks found. Sync tasks first.</Form.Text>
                )}
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">AMOUNT (USD) *</Form.Label>
                <Form.Control
    type="number"
    value={form.amount}
    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
    required
    min={1}
    className="rounded-3"
  />
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">DATE *</Form.Label>
                <Form.Control
    type="date"
    value={form.date}
    min={today}
    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
    required
    className="rounded-3"
  />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">DESCRIPTION *</Form.Label>
                <Form.Control
    as="textarea"
    rows={2}
    value={form.description}
    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
    required
    className="rounded-3"
    placeholder="Billing details..."
  />
              </Form.Group>
            </Col>
          </Row>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <AppButton variant="light" className="rounded-3" onClick={onHide}>Cancel</AppButton>
            <AppButton variant="success" type="submit" className="rounded-3" disabled={submitting}>{submitting ? "Creating..." : "Create Invoice"}</AppButton>
          </div>
        </Form>
      </Modal.Body>
    </Modal>;
};
const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState("");
  const load = async () => {
    setLoading(true);
    const [invRes, conRes] = await Promise.all([
      vendorService.getInvoices(),
      vendorService.getContracts()
    ]);
    setInvoices(invRes?.content || []);
    setContracts(conRes?.content || []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);
  const handleSubmit = async (id) => {
    setSubmitting(id);
    try {
      await vendorService.submitInvoice(id);
      toast.success("Invoice submitted for PM review");
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || err?.message || "Failed to submit invoice");
    } finally {
      setSubmitting("");
    }
  };
  const totalApproved = invoices.filter((i) => i.status === "APPROVED").reduce((s, i) => s + i.amount, 0);
  return <div className="p-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Invoices</h3>
          <p className="text-muted mb-0">{invoices.length} invoices</p>
        </div>
        <AppButton variant="success" className="rounded-3 d-flex align-items-center gap-2" onClick={() => setShowCreate(true)}>
          <FaPlus /> Create Invoice
        </AppButton>
      </div>

      {loading ? <div className="text-center py-5 text-muted">Loading invoices...</div> : <Card className="border-0 shadow-sm rounded-4">
          <AppTable
            columns={['Invoice', 'Contract', 'Amount', 'Due Date', 'Status', 'Actions']}
            responsive
            isEmpty={invoices.length === 0}
          >
            {invoices.map((inv) => {
    const sta = STATUS_CONFIG[inv.status] || { bg: "secondary", label: inv.status };
    return <tr key={inv.invoiceId}>
                    <td className="py-3 px-4">
                      <div className="d-flex align-items-center gap-2">
                        <FaFileInvoiceDollar className="text-success" />
                        <div>
                          <div className="fw-bold small">{inv.invoiceNumber}</div>
                          <div className="text-muted" style={{ fontSize: "0.72rem" }}>{inv.invoiceId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 small font-monospace">{inv.contractId || inv.contractTitle || "—"}</td>
                    <td className="py-3 px-4 fw-bold text-success">${inv.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 small text-muted">{inv.date || inv.dueDate}</td>
                    <td className="py-3 px-4">
                      <Badge bg={sta.bg} className={inv.status === "SUBMITTED" ? "text-dark" : ""}>{sta.label}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      {inv.status === "PENDING" && (
                        <AppButton
                          variant="outline-success"
                          size="sm"
                          className="rounded-3 d-flex align-items-center gap-1"
                          disabled={submitting === inv.invoiceId}
                          onClick={() => handleSubmit(inv.invoiceId)}
                        >
                          <FaCheckCircle size={12} />
                          {submitting === inv.invoiceId ? "Submitting..." : "Submit"}
                        </AppButton>
                      )}
                    </td>
                  </tr>;
  })}
          </AppTable>
        </Card>}
      <CreateInvoiceModal show={showCreate} onHide={() => setShowCreate(false)} onCreated={load} />
    </div>;
};
export {
  InvoicesPage
};
