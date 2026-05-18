import { useState, useEffect, useCallback } from "react";
import { Row, Col, Card, Badge, Button, Table, Modal, Form, Alert, Spinner } from "react-bootstrap";
import {
  FaCreditCard, FaPlus, FaEye, FaCheck, FaTimes,
  FaFileInvoice, FaMoneyBillWave, FaSync,
  FaClock, FaExclamationTriangle, FaCheckCircle,
  FaBan, FaArrowRight, FaSearch,
} from "react-icons/fa";
import { financeService } from "../../services/financeService";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  INITIATED: { bg: "warning",  label: "Initiated", text: "dark" },
  PENDING:   { bg: "info",     label: "Pending",   text: "white" },
  COMPLETED: { bg: "success",  label: "Completed", text: "white" },
  REJECTED:  { bg: "danger",   label: "Rejected",  text: "white" },
};

const PAYMENT_METHODS = [
  { value: "BANK_TRANSFER",   label: "Bank Transfer" },
  { value: "CHEQUE",          label: "Cheque" },
  { value: "ONLINE_TRANSFER", label: "Online Transfer" },
  { value: "NEFT",            label: "NEFT" },
  { value: "RTGS",            label: "RTGS" },
  { value: "IMPS",            label: "IMPS" },
  { value: "CASH",            label: "Cash" },
];

const TABS = ["ALL", "INITIATED", "PENDING", "COMPLETED", "REJECTED"];

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (v) =>
  v != null ? `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
};

// ── Create Payment Modal ──────────────────────────────────────────────────────

const CreatePaymentModal = ({ show, onHide, onSuccess }) => {
  const [step, setStep]                       = useState(1);
  const [invoices, setInvoices]               = useState([]);
  const [budgets, setBudgets]                 = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loadingDetail, setLoadingDetail]     = useState(false);
  const [searchTerm, setSearchTerm]           = useState("");
  const [form, setForm] = useState({ budgetId: "", paymentMethod: "", bankReferenceNumber: "" });
  const [error, setError]       = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      setStep(1);
      setSelectedInvoice(null);
      setForm({ budgetId: "", paymentMethod: "", bankReferenceNumber: "" });
      setError("");
      setSearchTerm("");
      loadInvoices();
      loadBudgets();
    }
  }, [show]);

  const loadInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const data = await financeService.getApprovedInvoices();
      setInvoices(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load invoices.");
    } finally {
      setLoadingInvoices(false);
    }
  };

  const loadBudgets = async () => {
    try {
      const data = await financeService.getBudgetsByStatus("APPROVED");
      setBudgets(Array.isArray(data) ? data : []);
    } catch {
      setBudgets([]);
    }
  };

  const handleSelectInvoice = async (invoice) => {
    setLoadingDetail(true);
    setError("");
    try {
      const detail = await financeService.getInvoiceById(invoice.invoiceId || invoice.id);
      setSelectedInvoice(detail || invoice);
      setStep(2);
    } catch {
      setSelectedInvoice(invoice);
      setStep(2);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.budgetId)     { setError("Please select a budget."); return; }
    if (!form.paymentMethod){ setError("Please select a payment method."); return; }
    setError("");
    setSubmitting(true);
    try {
      await financeService.createPayment({
        invoiceId:           selectedInvoice.invoiceId || selectedInvoice.id,
        budgetId:            form.budgetId,
        paymentMethod:       form.paymentMethod,
        bankReferenceNumber: form.bankReferenceNumber.trim() || null,
      });
      onSuccess("Payment created successfully!");
      onHide();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = invoices.filter((inv) => {
    const t = searchTerm.toLowerCase();
    return !t
      || (inv.invoiceId || inv.id || "").toLowerCase().includes(t)
      || (inv.vendorName || inv.vendor || inv.submittedBy || "").toLowerCase().includes(t);
  });

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold fs-6">
          {step === 1 ? "Step 1 of 2 — Select Invoice" : "Step 2 of 2 — Payment Details"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small rounded-3">{error}</Alert>}

        {/* Step indicator */}
        <div className="d-flex align-items-center mb-4">
          <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${step >= 1 ? "text-white" : "text-muted border"}`}
            style={{ width: 32, height: 32, fontSize: 13, flexShrink: 0, background: step >= 1 ? "#2c3e50" : "#e9ecef" }}>1</div>
          <div className="flex-grow-1 mx-2" style={{ height: 3, borderRadius: 2, background: step >= 2 ? "#2c3e50" : "#e9ecef" }} />
          <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${step >= 2 ? "text-white" : "text-muted"}`}
            style={{ width: 32, height: 32, fontSize: 13, flexShrink: 0, background: step >= 2 ? "#2c3e50" : "#e9ecef" }}>2</div>
        </div>

        {/* Step 1 — Select Invoice */}
        {step === 1 && (
          <>
            <div className="position-relative mb-3">
              <FaSearch className="position-absolute text-muted" style={{ top: "50%", left: 12, transform: "translateY(-50%)" }} />
              <Form.Control className="ps-5 rounded-3" placeholder="Search by invoice ID or vendor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            {loadingInvoices ? (
              <div className="text-center py-4"><Spinner animation="border" variant="dark" /><p className="text-muted small mt-2">Loading invoices...</p></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <FaFileInvoice size={36} className="mb-2 opacity-25" />
                <p className="small mb-0">{invoices.length === 0 ? "No submitted invoices available." : "No invoices match your search."}</p>
              </div>
            ) : (
              <div style={{ maxHeight: 340, overflowY: "auto" }}>
                {filtered.map((inv) => {
                  const invId = inv.invoiceId || inv.id;
                  const vendor = inv.vendorName || inv.vendor || inv.submittedBy || "Unknown Vendor";
                  return (
                    <Card key={invId} className="mb-2 border rounded-3" style={{ cursor: loadingDetail ? "wait" : "pointer" }}
                      onClick={() => !loadingDetail && handleSelectInvoice(inv)}>
                      <Card.Body className="py-2 px-3 d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-bold text-primary small font-monospace">{invId}</div>
                          <div className="text-muted small">{vendor}</div>
                        </div>
                        <div className="text-end">
                          <div className="fw-bold text-success small">{fmt(inv.amount || inv.totalAmount)}</div>
                          <Badge bg="warning" text="dark" className="small mt-1">{inv.status || "SUBMITTED"}</Badge>
                        </div>
                      </Card.Body>
                    </Card>
                  );
                })}
              </div>
            )}
            {loadingDetail && <div className="text-center py-2 small text-muted"><Spinner size="sm" className="me-1" />Loading details...</div>}
          </>
        )}

        {/* Step 2 — Payment Form */}
        {step === 2 && selectedInvoice && (
          <Form onSubmit={handleSubmit}>
            {/* Invoice Summary */}
            <div className="bg-light rounded-3 p-3 mb-4">
              <p className="small fw-bold text-muted text-uppercase mb-2">Selected Invoice</p>
              <Row className="g-2">
                <Col xs={6}><div className="small text-muted">Invoice ID</div><div className="fw-semibold small font-monospace">{selectedInvoice.invoiceId || selectedInvoice.id}</div></Col>
                <Col xs={6}><div className="small text-muted">Amount</div><div className="fw-bold text-success small">{fmt(selectedInvoice.amount || selectedInvoice.totalAmount)}</div></Col>
                <Col xs={6}><div className="small text-muted">Vendor</div><div className="fw-semibold small">{selectedInvoice.vendorName || selectedInvoice.vendor || selectedInvoice.submittedBy || "—"}</div></Col>
                <Col xs={6}><div className="small text-muted">Status</div><Badge bg="warning" text="dark" className="small">{selectedInvoice.status || "SUBMITTED"}</Badge></Col>
              </Row>
            </div>

            {/* Budget Selection */}
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">BUDGET <span className="text-danger">*</span></Form.Label>
              <Form.Select className="rounded-3" value={form.budgetId} onChange={(e) => setForm(f => ({ ...f, budgetId: e.target.value }))} required>
                <option value="">— Select Approved Budget —</option>
                {budgets.map((b) => (
                  <option key={b.budgetId} value={b.budgetId}>
                    {b.budgetId} · {b.budgetCategory} · {fmt(b.plannedAmount)}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">Select which budget this payment is charged against</Form.Text>
            </Form.Group>

            {/* Payment Method */}
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">PAYMENT METHOD <span className="text-danger">*</span></Form.Label>
              <Form.Select className="rounded-3" value={form.paymentMethod} onChange={(e) => setForm(f => ({ ...f, paymentMethod: e.target.value }))} required>
                <option value="">— Select Payment Method —</option>
                {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </Form.Select>
            </Form.Group>

            {/* Bank Reference */}
            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-muted">BANK REFERENCE NUMBER</Form.Label>
              <Form.Control className="rounded-3" placeholder="e.g. UTR / TXN / Cheque number" value={form.bankReferenceNumber} onChange={(e) => setForm(f => ({ ...f, bankReferenceNumber: e.target.value }))} />
            </Form.Group>

            <div className="d-flex justify-content-between gap-2">
              <Button variant="light" className="rounded-3 border" onClick={() => setStep(1)}>← Back</Button>
              <Button type="submit" className="rounded-3 px-4" style={{ backgroundColor: "#2c3e50", border: "none" }} disabled={submitting}>
                {submitting ? <><Spinner size="sm" className="me-1" />Creating...</> : <><FaCheck className="me-1" />Create Payment</>}
              </Button>
            </div>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
};

// ── Payment Detail Modal ──────────────────────────────────────────────────────

const PaymentDetailModal = ({ show, onHide, payment }) => {
  if (!payment) return null;
  const cfg = STATUS_CONFIG[payment.status] || { bg: "secondary", text: "white" };
  const fields = [
    { label: "Payment ID",     value: payment.paymentId },
    { label: "Invoice ID",     value: payment.invoiceId },
    { label: "Budget ID",      value: payment.budgetId },
    { label: "Amount",         value: fmt(payment.amount) },
    { label: "Payment Method", value: payment.paymentMethod?.replace(/_/g, " ") },
    { label: "Bank Reference", value: payment.bankReferenceNumber },
    { label: "Status",         value: <Badge bg={cfg.bg} text={cfg.text}>{payment.status}</Badge> },
    { label: "Created By",     value: payment.createdBy },
    { label: "Approved By",    value: payment.approvedBy },
    { label: "Created At",     value: fmtDate(payment.createdAt) },
    { label: "Payment Date",   value: fmtDate(payment.paymentDate) },
    ...(payment.rejectionReason ? [{ label: "Rejection Reason", value: <span className="text-danger">{payment.rejectionReason}</span> }] : []),
  ].filter(f => f.value && f.value !== "—");

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold fs-6">Payment Details</Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-0">
        <Row className="g-3">
          {fields.map(({ label, value }) => (
            <Col xs={6} key={label}>
              <div className="small text-muted mb-1">{label}</div>
              <div className="fw-semibold small">{value}</div>
            </Col>
          ))}
        </Row>
      </Modal.Body>
      <Modal.Footer className="border-0">
        <Button variant="light" className="rounded-3 border" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

// ── Update Status Modal ───────────────────────────────────────────────────────

const UpdateStatusModal = ({ show, onHide, payment, onSuccess }) => {
  const [newStatus, setNewStatus]         = useState("COMPLETED");
  const [rejectionReason, setRejection]   = useState("");
  const [error, setError]                 = useState("");
  const [submitting, setSubmitting]       = useState(false);

  useEffect(() => { if (show) { setNewStatus("COMPLETED"); setRejection(""); setError(""); } }, [show]);

  const handleSubmit = async () => {
    if (newStatus === "REJECTED" && !rejectionReason.trim()) { setError("Rejection reason is required."); return; }
    setSubmitting(true); setError("");
    try {
      const user = getStoredUser();
      await financeService.updatePaymentStatusFull(payment.paymentId, {
        status:          newStatus,
        approvedBy:      user?.email || user?.userId || "FINANCE_OFFICER",
        rejectionReason: newStatus === "REJECTED" ? rejectionReason.trim() : "",
      });
      onSuccess(newStatus === "COMPLETED" ? "Payment completed! Budget actual amount updated." : "Payment rejected.");
      onHide();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update payment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!payment) return null;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold fs-6">Update Payment Status</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small rounded-3">{error}</Alert>}

        {/* Payment summary */}
        <div className="bg-light rounded-3 p-3 mb-4">
          <Row className="g-2">
            <Col xs={6}><div className="small text-muted">Payment ID</div><div className="fw-semibold small font-monospace">{payment.paymentId}</div></Col>
            <Col xs={6}><div className="small text-muted">Amount</div><div className="fw-bold text-success small">{fmt(payment.amount)}</div></Col>
            <Col xs={6}><div className="small text-muted">Invoice</div><div className="fw-semibold small">{payment.invoiceId}</div></Col>
            <Col xs={6}><div className="small text-muted">Current Status</div><Badge bg={STATUS_CONFIG[payment.status]?.bg} text={STATUS_CONFIG[payment.status]?.text} className="small">{payment.status}</Badge></Col>
          </Row>
        </div>

        {/* Status buttons */}
        <Form.Group className="mb-3">
          <Form.Label className="small fw-bold text-muted">SET NEW STATUS</Form.Label>
          <div className="d-flex gap-2">
            <Button type="button" variant={newStatus === "COMPLETED" ? "success" : "outline-success"} className="flex-grow-1 rounded-3" onClick={() => setNewStatus("COMPLETED")}>
              <FaCheck className="me-1" /> Complete
            </Button>
            <Button type="button" variant={newStatus === "REJECTED" ? "danger" : "outline-danger"} className="flex-grow-1 rounded-3" onClick={() => setNewStatus("REJECTED")}>
              <FaTimes className="me-1" /> Reject
            </Button>
          </div>
        </Form.Group>

        {newStatus === "REJECTED" && (
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted">REJECTION REASON <span className="text-danger">*</span></Form.Label>
            <Form.Control as="textarea" rows={3} className="rounded-3" placeholder="Enter reason..." value={rejectionReason} onChange={(e) => setRejection(e.target.value)} />
          </Form.Group>
        )}

        {newStatus === "COMPLETED" && (
          <Alert variant="info" className="py-2 small rounded-3 mb-0">
            <FaMoneyBillWave className="me-1" />
            Completing this payment will update the linked budget's actual amount.
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0">
        <Button variant="light" className="rounded-3 border" onClick={onHide}>Cancel</Button>
        <Button variant={newStatus === "COMPLETED" ? "success" : "danger"} className="rounded-3 px-4" onClick={handleSubmit} disabled={submitting}>
          {submitting && <Spinner size="sm" className="me-1" />}
          Confirm {newStatus === "COMPLETED" ? "Completion" : "Rejection"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// ── Main PaymentsPage ─────────────────────────────────────────────────────────

const PaymentsPage = () => {
  const [allPayments, setAllPayments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState("ALL");
  const [showCreate, setShowCreate]   = useState(false);
  const [showDetail, setShowDetail]   = useState(false);
  const [showUpdate, setShowUpdate]   = useState(false);
  const [selected, setSelected]       = useState(null);
  const [toast, setToast]             = useState({ show: false, msg: "", variant: "success" });

  const showToast = (msg, variant = "success") => {
    setToast({ show: true, msg, variant });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        financeService.getPaymentsByStatus("INITIATED"),
        financeService.getPaymentsByStatus("PENDING"),
        financeService.getPaymentsByStatus("COMPLETED"),
        financeService.getPaymentsByStatus("REJECTED"),
      ]);
      const combined = results.flatMap(r => r.status === "fulfilled" ? r.value : []);
      combined.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setAllPayments(combined);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed  = activeTab === "ALL" ? allPayments : allPayments.filter(p => p.status === activeTab);
  const countFor   = (s) => allPayments.filter(p => p.status === s).length;
  const canUpdate  = (s) => s === "INITIATED" || s === "PENDING";

  return (
    <div className="p-4">
      {/* Toast */}
      {toast.show && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <Alert variant={toast.variant} className="shadow mb-0 py-2 small rounded-3">{toast.msg}</Alert>
        </div>
      )}

      {/* ── Header ── */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Payments</h3>
          <p className="text-muted mb-0">Manage invoice payments. Flow: INITIATED → COMPLETED</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="light" className="rounded-3 border d-flex align-items-center gap-2" onClick={load} disabled={loading}>
            <FaSync size={13} className={loading ? "spin" : ""} /> Refresh
          </Button>
          <Button className="rounded-3 d-flex align-items-center gap-2" style={{ backgroundColor: "#2c3e50", border: "none" }} onClick={() => setShowCreate(true)}>
            <FaPlus size={13} /> New Payment
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <Row className="g-3 mb-4">
        {[
          { label: "Total Payments", value: allPayments.length,    color: "primary", icon: FaCreditCard },
          { label: "Initiated",      value: countFor("INITIATED"), color: "warning",  icon: FaClock },
          { label: "Completed",      value: countFor("COMPLETED"), color: "success",  icon: FaCheckCircle },
          { label: "Rejected",       value: countFor("REJECTED"),  color: "danger",   icon: FaBan },
        ].map(({ label, value, color, icon: Icon }) => (
          <Col xs={6} md={3} key={label}>
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body className="p-4 d-flex align-items-center justify-content-between">
                <div>
                  <p className="small text-muted text-uppercase fw-bold mb-1">{label}</p>
                  <h4 className={`fw-bold text-${color} mb-0`}>{value}</h4>
                </div>
                <div className={`bg-${color} bg-opacity-10 text-${color} p-3 rounded-circle`}>
                  <Icon size={22} />
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Status Tabs ── */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {TABS.map((tab) => {
          const count  = tab === "ALL" ? allPayments.length : countFor(tab);
          const active = activeTab === tab;
          return (
            <Button key={tab} size="sm"
              className={`rounded-3 px-3 ${active ? "btn-dark" : "btn-light"}`}
              style={active ? { backgroundColor: "#2c3e50" } : {}}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "ALL" ? "All" : STATUS_CONFIG[tab]?.label || tab}
              <Badge bg={active ? "light" : "secondary"} text="dark" pill className="ms-2">{count}</Badge>
            </Button>
          );
        })}
      </div>

      {/* ── Table ── */}
      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="dark" />
            <p className="text-muted small mt-2">Loading payments...</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <FaCreditCard size={40} className="mb-3 opacity-25" />
            <h6>{activeTab === "ALL" ? "No payments yet" : `No ${activeTab.toLowerCase()} payments`}</h6>
            {activeTab === "ALL" && (
              <Button size="sm" className="rounded-3 mt-2" style={{ backgroundColor: "#2c3e50", border: "none" }} onClick={() => setShowCreate(true)}>
                <FaPlus className="me-1" /> Create First Payment
              </Button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="small fw-bold text-muted ps-4 py-3 border-0">PAYMENT ID</th>
                  <th className="small fw-bold text-muted py-3 border-0">INVOICE ID</th>
                  <th className="small fw-bold text-muted py-3 border-0">BUDGET ID</th>
                  <th className="small fw-bold text-muted py-3 border-0">AMOUNT</th>
                  <th className="small fw-bold text-muted py-3 border-0">METHOD</th>
                  <th className="small fw-bold text-muted py-3 border-0">STATUS</th>
                  <th className="small fw-bold text-muted py-3 border-0">CREATED</th>
                  <th className="small fw-bold text-muted text-end pe-4 py-3 border-0">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((p) => {
                  const cfg = STATUS_CONFIG[p.status] || { bg: "secondary", text: "white" };
                  return (
                    <tr key={p.paymentId}>
                      <td className="ps-4 py-3">
                        <span className="fw-bold text-primary font-monospace small">{p.paymentId}</span>
                      </td>
                      <td className="py-3"><span className="small text-muted">{p.invoiceId || "—"}</span></td>
                      <td className="py-3"><span className="small text-muted font-monospace">{p.budgetId || "—"}</span></td>
                      <td className="py-3"><span className="fw-bold small">{fmt(p.amount)}</span></td>
                      <td className="py-3"><span className="small text-muted">{p.paymentMethod?.replace(/_/g, " ") || "—"}</span></td>
                      <td className="py-3">
                        <Badge bg={cfg.bg} text={cfg.text} className="px-2 py-1 small">{p.status}</Badge>
                      </td>
                      <td className="py-3"><span className="small text-muted">{fmtDate(p.createdAt)}</span></td>
                      <td className="py-3 text-end pe-4">
                        <div className="d-flex gap-2 justify-content-end">
                          <Button size="sm" variant="light" className="rounded-3 border" onClick={() => { setSelected(p); setShowDetail(true); }} title="View">
                            <FaEye className="text-primary" />
                          </Button>
                          {canUpdate(p.status) && (
                            <Button size="sm" variant="light" className="rounded-3 border" onClick={() => { setSelected(p); setShowUpdate(true); }} title="Update Status">
                              <FaArrowRight className="text-success" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
        {displayed.length > 0 && (
          <div className="px-4 py-2 border-top text-muted small">
            Showing {displayed.length} payment{displayed.length !== 1 ? "s" : ""}
            {activeTab !== "ALL" && ` · ${activeTab}`}
          </div>
        )}
      </Card>

      {/* Modals */}
      <CreatePaymentModal show={showCreate} onHide={() => setShowCreate(false)} onSuccess={(msg) => { load(); showToast(msg); }} />
      <PaymentDetailModal show={showDetail} onHide={() => { setShowDetail(false); setSelected(null); }} payment={selected} />
      <UpdateStatusModal  show={showUpdate} onHide={() => { setShowUpdate(false); setSelected(null); }} payment={selected} onSuccess={(msg) => { load(); showToast(msg); }} />
    </div>
  );
};

export { PaymentsPage };
export default PaymentsPage;
