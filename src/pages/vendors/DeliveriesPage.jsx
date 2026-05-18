import { useState, useEffect } from "react";
import { AppButton } from "../../components/common/AppButton";
import { Row, Col, Card, Badge, Button, Modal, Form } from "react-bootstrap";
import { FaPlus, FaTruck, FaExclamationTriangle } from "react-icons/fa";
import vendorService from "../../services/vendorService";
import projectService from "../../services/projectService";
import { notificationService } from "../../services/notificationService";
import { useAuth } from "../../context/AuthContext";
const today = new Date().toISOString().split("T")[0];

const STATUS_CONFIG = {
  PENDING:      { bg: "warning",   label: "Pending",      icon: "\u23F3" },
  RECEIVED:     { bg: "success",   label: "Received",     icon: "\u2705" },
  NOT_RECEIVED: { bg: "danger",    label: "Not Received", icon: "\u274C" }
};
const CreateDeliveryModal = ({ show, onHide, onCreated, currentUser }) => {
  const [form, setForm] = useState({
    contractId: "",
    date: "",
    item: "",
    quantity: "",
    status: "PENDING"
  });
  const [contracts, setContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!show) return;
    setLoadingContracts(true);
    vendorService.getContracts()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.content || [];
        setContracts(list);
      })
      .catch(() => setContracts([]))
      .finally(() => setLoadingContracts(false));
  }, [show]);

  const sendDeliveryNotification = async (deliveredForm, deliveryId) => {
    try {
      // Resolve the site engineer from the contract → project chain
      let siteEngineerUserId = null;
      const contract = await vendorService.getContractById(deliveredForm.contractId).catch(() => null);
      const projectId = contract?.projectId || contract?.project?.projectId;
      if (projectId) {
        const project = await projectService.getProject(projectId).catch(() => null);
        siteEngineerUserId =
          project?.siteEngineerId ||
          project?.siteEngineerUserId ||
          project?.assignedSiteEngineer ||
          project?.siteEngineerEmail;
      }
      if (!siteEngineerUserId) return; // can't determine recipient — skip

      await notificationService.createNotification({
        eventType: "DELIVERY_PENDING",
        message: `New delivery requires confirmation: ${deliveredForm.item} (${deliveredForm.quantity} units) — Contract ${deliveredForm.contractId}`,
        fromService: "VENDOR",
        fromRole: currentUser?.role || "VENDOR",
        fromUserId: currentUser?.userId || currentUser?.email,
        toUserId: siteEngineerUserId,
        referenceId: deliveryId,
        priority: "MEDIUM"
      });
    } catch {
      // Notification is best-effort; delivery was already created
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await vendorService.createDelivery(form);
      const deliveryId = result?.deliveryId || result?.id;
      // Fire correct notification to site engineer (backend sets toUserId = vendor — this corrects it)
      sendDeliveryNotification(form, deliveryId);
      onCreated();
      onHide();
      setForm({ contractId: "", date: "", item: "", quantity: "", status: "PENDING" });
    } catch (err) {
      const msg = err.response?.data?.message
        || err.response?.data?.error
        || (typeof err.response?.data === "string" ? err.response.data : null)
        || err.message
        || "Failed to create delivery";
      setError(msg);
      console.error("Failed to create delivery", err.response?.data || err);
    } finally {
      setSubmitting(false);
    }
  };
  return <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold">Create Delivery</Modal.Title>
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
                  disabled={loadingContracts}
                >
                  <option value="">{loadingContracts ? "Loading contracts..." : "— Select a contract —"}</option>
                  {contracts.map((c) => (
                    <option key={c.contractId} value={c.contractId}>
                      {c.contractId}{c.projectId ? ` — ${c.projectId}` : ""}
                    </option>
                  ))}
                </Form.Select>
                {!loadingContracts && contracts.length === 0 && (
                  <Form.Text className="text-warning fw-semibold">No contracts found.</Form.Text>
                )}
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
            <Col xs={12} md={8}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">ITEM *</Form.Label>
                <Form.Control
    value={form.item}
    onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))}
    required
    className="rounded-3"
    placeholder="e.g. Steel Beams"
  />
              </Form.Group>
            </Col>
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">QUANTITY *</Form.Label>
                <Form.Control
    type="number"
    value={form.quantity}
    onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
    required
    min={1}
    placeholder="e.g. 10"
    className="rounded-3"
  />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <AppButton variant="light" className="rounded-3" onClick={onHide}>Cancel</AppButton>
            <AppButton variant="info" type="submit" className="rounded-3 text-white" disabled={submitting}>{submitting ? "Creating..." : "Create Delivery"}</AppButton>
          </div>
        </Form>
      </Modal.Body>
    </Modal>;
};
const DeliveriesPage = () => {
  const { user: currentUser } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    const [delRes, conRes, notifRes] = await Promise.allSettled([
      vendorService.getDeliveries(0, 1000),
      vendorService.getContracts(),
      vendorService.getNotifications()
    ]);

    const rawList = delRes.status === "fulfilled"
      ? (delRes.value?.content || (Array.isArray(delRes.value) ? delRes.value : []))
      : [];

    // Build a map of deliveryId → siteStatus from notifications so status
    // reflects even when the backend /api/deliveries endpoint doesn't return siteStatus
    const notifications = notifRes.status === "fulfilled"
      ? (Array.isArray(notifRes.value) ? notifRes.value : notifRes.value?.content || [])
      : [];

    const siteStatusFromNotif = {};
    notifications.forEach((n) => {
      if (!n?.referenceId) return;
      const msg = (n.message || "").toUpperCase();
      if (msg.includes("RECEIVED") && !msg.includes("NOT RECEIVED")) {
        siteStatusFromNotif[n.referenceId] = "RECEIVED";
      } else if (msg.includes("NOT RECEIVED")) {
        siteStatusFromNotif[n.referenceId] = "NOT_RECEIVED";
      }
    });

    // Merge: prefer backend siteStatus, fall back to notification-derived status
    const enriched = rawList.map((d) => ({
      ...d,
      siteStatus: d.siteStatus || siteStatusFromNotif[d.deliveryId] || null
    }));

    setDeliveries(enriched);
    if (conRes.status === "fulfilled") {
      const conList = conRes.value?.content || (Array.isArray(conRes.value) ? conRes.value : []);
      setContracts(conList);
    }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    load();
    // Poll every 10 s so site engineer confirmation appears promptly
    const interval = setInterval(() => load(true), 10000);
    return () => clearInterval(interval);
  }, []);
  return <div className="p-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Deliveries</h3>
          <p className="text-muted mb-0">{deliveries.length} deliveries tracked</p>
        </div>
        <AppButton variant="info" className="rounded-3 d-flex align-items-center gap-2 text-white" onClick={() => setShowCreate(true)}>
          <FaPlus /> Create Delivery
        </AppButton>
      </div>

      {
    /* Status Summary */
  }
      <Row className="g-3 mb-4">
        {Object.entries(STATUS_CONFIG).map(([key, val]) => <Col xs={6} md={3} key={key}>
            <Card className="border-0 shadow-sm rounded-4 text-center py-3">
              <div className="fs-4 mb-1">{val.icon}</div>
              <div className={`fs-5 fw-bold text-${val.bg}`}>{deliveries.filter((d) => (d.siteStatus || d.status) === key).length}</div>
              <div className="small text-muted">{val.label}</div>
            </Card>
          </Col>)}
      </Row>

      {loading ? <div className="text-center py-5 text-muted">Loading deliveries...</div> : <Row className="g-3">
          {deliveries.map((d) => {
    /* siteStatus (RECEIVED / NOT_RECEIVED) takes priority over vendor status */
    const effectiveStatus = d.siteStatus || d.status;
    const sta = STATUS_CONFIG[effectiveStatus] || { bg: "secondary", label: effectiveStatus || d.status, icon: "\u{1F4E6}" };
    return <Col xs={12} md={6} lg={4} key={d.deliveryId}>
                <Card
      className="border-0 shadow-sm rounded-4 h-100"
      style={{ borderLeft: `4px solid var(--bs-${sta.bg})`, paddingLeft: 0 }}
    >
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <div className="fw-bold">{d.deliveryId}</div>
                        <div className="small text-muted">{d.contractTitle}</div>
                      </div>
                      <Badge bg={sta.bg}>{sta.icon} {sta.label}</Badge>
                    </div>
                    <div className="small text-muted mb-2">
                      <FaTruck className="me-1" />{d.deliveryAddress}
                    </div>
                    <div className="small mb-2">
                      <span className="text-muted">Date: </span><strong>{d.date || d.deliveryDate}</strong>
                    </div>
                    <div className="bg-light rounded-3 p-3 small border-0">
                      <div className="fw-bold text-dark">{d.quantity || 0} units</div>
                      <div className="text-muted">{d.item || "No description"}</div>
                    </div>
                    {d.notes && <div className="mt-2 small text-muted fst-italic">📝 {d.notes}</div>}
                  </Card.Body>
                </Card>
              </Col>;
  })}
        </Row>}
      <CreateDeliveryModal show={showCreate} onHide={() => setShowCreate(false)} onCreated={load} currentUser={currentUser} />
    </div>;
};
export {
  DeliveriesPage
};
