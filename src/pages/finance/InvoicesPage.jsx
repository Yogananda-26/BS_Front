import { useState, useEffect, useCallback } from "react";
import { Row, Col, Card, Badge, Button, Table, Modal, Form, Alert, Spinner } from "react-bootstrap";
import { FaFileInvoiceDollar, FaEye, FaSync, FaSearch, FaCreditCard } from "react-icons/fa";
import { financeService } from "../../services/financeService";
import { useNavigate } from "react-router-dom";

// ── helpers ───────────────────────────────────────────────────────────────────

const fmt = (v) =>
  v != null ? `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : null;

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : null;

const STATUS_CFG = {
  APPROVED:  { bg: "success" },
  SUBMITTED: { bg: "warning"  },
  PENDING:   { bg: "warning"  },
  PAID:      { bg: "primary"  },
  REJECTED:  { bg: "danger"   },
};

// ── Invoice Detail Modal ──────────────────────────────────────────────────────

const InvoiceDetailModal = ({ show, onHide, invoice, onCreatePayment }) => {
  if (!invoice) return null;
  const status = invoice.status || "SUBMITTED";
  const cfg    = STATUS_CFG[status] || { bg: "secondary" };
  const canPay = status === "SUBMITTED" || status === "APPROVED";

  const fields = [
    { label: "Invoice ID",   value: invoice.invoiceId || invoice.id },
    { label: "Amount",       value: fmt(invoice.amount || invoice.totalAmount) },
    { label: "Status",       value: <Badge bg={cfg.bg} className="px-2">{status}</Badge> },
    { label: "Contract ID",  value: invoice.contractId },
    { label: "Vendor",       value: invoice.vendorName || invoice.vendor || invoice.submittedBy },
    { label: "Description",  value: invoice.description },
  ].filter(f => f.value); // only show fields that have a value

  return (
    <Modal show={show} onHide={onHide} centered size="md">
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold fs-6">Invoice Details</Modal.Title>
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
      <Modal.Footer className="border-0 justify-content-between">
        <Button variant="light" className="rounded-3" onClick={onHide}>Close</Button>
        {canPay && (
          <Button
            variant="dark"
            className="rounded-3 d-flex align-items-center gap-2"
            style={{ backgroundColor: "#2c3e50" }}
            onClick={() => { onHide(); onCreatePayment(invoice); }}
          >
            <FaCreditCard size={13} /> Create Payment
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const InvoicesPage = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState("");
  const [showDetail, setShowDetail]       = useState(false);
  const [selected, setSelected]           = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [toast, setToast]                 = useState({ show: false, msg: "", variant: "success" });

  const showToast = (msg, variant = "success") => {
    setToast({ show: true, msg, variant });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await financeService.getApprovedInvoices();
      setInvoices(Array.isArray(data) ? data : []);
    } catch {
      showToast("Failed to load invoices from vendor service.", "danger");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleView = async (inv) => {
    setLoadingDetail(true);
    try {
      const detail = await financeService.getInvoiceById(inv.invoiceId || inv.id);
      setSelected(detail);
    } catch {
      setSelected(inv);
    } finally {
      setLoadingDetail(false);
      setShowDetail(true);
    }
  };

  const handleCreatePayment = (invoice) => {
    navigate("/finance/payments", { state: { prefillInvoice: invoice } });
  };

  const filtered = invoices.filter((inv) => {
    const t = search.toLowerCase();
    return !t
      || (inv.invoiceId || inv.id || "").toLowerCase().includes(t)
      || (inv.vendorName || inv.vendor || inv.submittedBy || "").toLowerCase().includes(t)
      || (inv.contractId || "").toLowerCase().includes(t)
      || (inv.projectId  || "").toLowerCase().includes(t);
  });

  const totalAmount = invoices.reduce((s, inv) => s + (Number(inv.amount || inv.totalAmount) || 0), 0);

  return (
    <div className="p-4">
      {/* Toast */}
      {toast.show && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <Alert variant={toast.variant} className="shadow mb-0 py-2 small">{toast.msg}</Alert>
        </div>
      )}

      {/* ── Header ── */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Vendor Invoices</h3>
          <p className="text-muted mb-0">Submitted invoices from Vendor Service — create payments from here.</p>
        </div>
        <Button
          variant="light"
          className="rounded-3 d-flex align-items-center gap-2 border"
          onClick={load}
          disabled={loading}
        >
          <FaSync className={loading ? "spin" : ""} size={13} /> Refresh
        </Button>
      </div>

      {/* ── KPI Cards ── */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4 d-flex align-items-center justify-content-between">
              <div>
                <p className="small text-muted text-uppercase fw-bold mb-1">Invoices</p>
                <h4 className="fw-bold text-success mb-0">{invoices.length}</h4>
                <div className="small text-muted mt-1">From vendor service</div>
              </div>
              <div className="bg-success bg-opacity-10 text-success p-3 rounded-circle">
                <FaFileInvoiceDollar size={22} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4 d-flex align-items-center justify-content-between">
              <div>
                <p className="small text-muted text-uppercase fw-bold mb-1">Total Invoice Value</p>
                <h4 className="fw-bold text-primary mb-0">
                  {totalAmount > 0 ? `₹${totalAmount.toLocaleString("en-IN")}` : "₹0"}
                </h4>
                <div className="small text-muted mt-1">Combined amount</div>
              </div>
              <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle">
                <FaCreditCard size={22} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ── Search ── */}
      <div className="position-relative mb-4">
        <FaSearch className="position-absolute text-muted" style={{ top: "50%", left: 14, transform: "translateY(-50%)" }} />
        <Form.Control
          className="ps-5 rounded-3"
          placeholder="Search by invoice ID, vendor name, contract ID, or project ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Table ── */}
      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="dark" />
            <p className="text-muted small mt-2">Fetching invoices from Vendor Service...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <FaFileInvoiceDollar size={40} className="mb-3 opacity-25" />
            <h6>{invoices.length === 0 ? "No submitted invoices found" : "No invoices match your search"}</h6>
            <p className="small">Invoices are fetched from the Vendor Service. Only SUBMITTED invoices are shown.</p>
            <Button variant="outline-dark" size="sm" className="rounded-3" onClick={load}>
              <FaSync className="me-1" /> Refresh
            </Button>
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="small fw-bold text-muted ps-4 py-3 border-0">INVOICE ID</th>
                  <th className="small fw-bold text-muted py-3 border-0">VENDOR</th>
                  <th className="small fw-bold text-muted py-3 border-0">AMOUNT</th>
                  <th className="small fw-bold text-muted py-3 border-0">STATUS</th>
                  <th className="small fw-bold text-muted py-3 border-0">CONTRACT ID</th>
                  <th className="small fw-bold text-muted text-end pe-4 py-3 border-0">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const invId  = inv.invoiceId || inv.id;
                  const status = inv.status || "SUBMITTED";
                  const cfg    = STATUS_CFG[status] || { bg: "secondary" };
                  const vendor = inv.vendorName || inv.vendor || inv.submittedBy;
                  const canPay = status === "SUBMITTED" || status === "APPROVED";
                  return (
                    <tr key={invId}>
                      <td className="ps-4 py-3">
                        <span className="fw-bold text-primary font-monospace small">{invId}</span>
                      </td>
                      <td className="py-3">
                        {vendor
                          ? <span className="small fw-semibold">{vendor}</span>
                          : <span className="text-muted small">—</span>
                        }
                      </td>
                      <td className="py-3">
                        <span className="fw-bold text-success small">
                          {fmt(inv.amount || inv.totalAmount) || "—"}
                        </span>
                      </td>
                      <td className="py-3">
                        <Badge bg={cfg.bg} className="px-2 py-1 small">{status}</Badge>
                      </td>
                      <td className="py-3">
                        <span className="small text-muted">{inv.contractId || "—"}</span>
                      </td>
                      <td className="py-3 text-end pe-4">
                        <div className="d-flex gap-2 justify-content-end">
                          <Button
                            size="sm"
                            variant="light"
                            className="rounded-3 border"
                            onClick={() => handleView(inv)}
                            disabled={loadingDetail}
                            title="View Details"
                          >
                            {loadingDetail ? <Spinner size="sm" /> : <FaEye className="text-primary" />}
                          </Button>
                          {canPay && (
                            <Button
                              size="sm"
                              variant="dark"
                              className="rounded-3 d-flex align-items-center gap-1"
                              style={{ backgroundColor: "#2c3e50", fontSize: 12 }}
                              onClick={() => handleCreatePayment(inv)}
                              title="Create Payment"
                            >
                              <FaCreditCard size={11} /> Pay
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

        {filtered.length > 0 && (
          <div className="px-4 py-2 border-top text-muted small">
            Showing {filtered.length} of {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
            {search && ` matching "${search}"`}
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      <InvoiceDetailModal
        show={showDetail}
        onHide={() => { setShowDetail(false); setSelected(null); }}
        invoice={selected}
        onCreatePayment={handleCreatePayment}
      />
    </div>
  );
};

export { InvoicesPage };
export default InvoicesPage;
