import { useState, useEffect } from "react";
import { AppButton } from "../../components/common/AppButton";
import { Card, Row, Col, Modal, Form } from "react-bootstrap";
import { FaTruckLoading, FaCheckCircle, FaTimesCircle, FaSyncAlt } from "react-icons/fa";
import { siteOpsService } from "../../services/siteOpsService";
import vendorService from "../../services/vendorService";
import { notificationService } from "../../services/notificationService";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

const SITE_STATUS_CONFIG = {
  RECEIVED: { bg: "success", icon: FaCheckCircle },
  NOT_RECEIVED: { bg: "danger", icon: FaTimesCircle }
};


const DeliveriesPage = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelivery, setConfirmDelivery] = useState(null);
  const [confirmStatus, setConfirmStatus] = useState("RECEIVED");
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await siteOpsService.getInboundDeliveries();
      setDeliveries(data || []);
    } catch (e) {
      console.error("Failed to load deliveries", e);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRefresh = async () => {
    setSyncing(true);
    try {
      await load();
      toast.success("Deliveries refreshed");
    } catch (e) {
      toast.error("Failed to refresh deliveries");
    } finally {
      setSyncing(false);
    }
  };

  const openConfirm = (delivery) => {
    setConfirmDelivery(delivery);
    setConfirmStatus("RECEIVED");
  };

  const handleConfirm = async () => {
    if (!confirmDelivery) return;
    setSubmitting(true);
    const { deliveryId, item, quantity, contractId, vendorId, vendorUserId } = confirmDelivery;
    try {
      // 1. Update siteStatus in siteops backend
      await siteOpsService.confirmDelivery(deliveryId, confirmStatus);

      // 2. Propagate the site status to the vendor-facing delivery record
      await Promise.allSettled([
        vendorService.updateSiteDeliveryStatus(deliveryId, { status: confirmStatus }),
        vendorService.syncDeliveryFromSite(deliveryId)
      ]);

      // 3. Notify the vendor
      const targetVendorId = vendorId || vendorUserId || (() => {
        // Try to resolve vendorId from the delivery's contract (best-effort)
        return vendorService.getContractById(contractId)
          .then((c) => c?.vendorId || c?.vendorUserId || null)
          .catch(() => null);
      })();

      const resolvedVendorId = typeof targetVendorId === "object"
        ? await targetVendorId
        : targetVendorId;

      const label = confirmStatus === "RECEIVED" ? "RECEIVED" : "NOT RECEIVED";
      notificationService.createNotification({
        eventType: "DELIVERY_STATUS_UPDATE",
        message: `Your delivery ${deliveryId} (${quantity} units of ${item}) has been marked as ${label} by the site engineer.`,
        fromService: "SITE_OPS",
        fromRole: user?.role || "SITE_ENGINEER",
        fromUserId: user?.userId || user?.id,
        toUserId: resolvedVendorId,
        toRole: "VENDOR",
        referenceId: deliveryId,
        priority: confirmStatus === "RECEIVED" ? "MEDIUM" : "HIGH"
      }).catch(() => {});  // notification is best-effort

      toast.success(`Delivery marked as ${confirmStatus === "RECEIVED" ? "Received" : "Not Received"} — vendor notified`);
      setConfirmDelivery(null);
      await load();
    } catch (e) {
      console.error("Failed to confirm delivery", e);
      toast.error(e?.response?.data?.message || e?.response?.data?.error || "Failed to confirm delivery");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Inbound Deliveries</h3>
          <p className="text-muted mb-0">Review and confirm incoming materials from vendors.</p>
        </div>
        <AppButton variant="outline-secondary" className="rounded-3 d-flex align-items-center gap-2" onClick={handleRefresh} disabled={syncing}>
          <FaSyncAlt className={syncing ? "fa-spin" : ""} /> {syncing ? "Refreshing..." : "Refresh"}
        </AppButton>
      </div>

      {loading ? (
        <div className="text-center py-5 text-muted">Loading deliveries...</div>
      ) : deliveries.length === 0 ? (
        <div className="text-center py-5 bg-light rounded-4">
          <FaTruckLoading size={40} className="text-muted mb-3 opacity-25" />
          <p className="text-muted mb-0">No inbound deliveries found.</p>
        </div>
      ) : (
        <Row className="g-3">
          {deliveries.map((d) => {
            const alreadyConfirmed = !!d.siteStatus;
            const siteSta = d.siteStatus ? SITE_STATUS_CONFIG[d.siteStatus] : null;
            return (
              <Col xs={12} md={6} lg={4} key={d.deliveryId}>
                <Card className="border-0 shadow-sm rounded-4 h-100">
                  <Card.Body className="p-4 d-flex flex-column">
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <div className="fw-bold text-primary font-monospace">{d.deliveryId}</div>
                        <div className="small text-muted">{d.contractId}</div>
                      </div>
                    </div>

                    {/* Item details */}
                    <div className="mb-3">
                      <h6 className="fw-bold mb-1">{d.item}</h6>
                      <div className="fs-4 fw-bold">
                        {d.quantity} <span className="small text-muted fw-normal">units</span>
                      </div>
                    </div>

                    <div className="small text-muted mb-3">
                      <FaTruckLoading className="me-1" /> Expected: {d.deliveryDate || "—"}
                    </div>

                    {/* Status / Action */}
                    <div className="mt-auto">
                      {alreadyConfirmed ? (
                        <div className={`p-3 rounded-3 bg-${siteSta.bg} bg-opacity-10 text-${siteSta.bg}`}>
                          <div className="fw-bold small d-flex align-items-center gap-2">
                            <siteSta.icon />
                            {d.siteStatus === "RECEIVED" ? "Received" : "Not Received"}
                          </div>
                          {d.siteRemarks && <div className="small mt-1 opacity-75">{d.siteRemarks}</div>}
                          {d.receivedAt && (
                            <div className="text-end mt-1" style={{ fontSize: "0.65rem" }}>
                              {new Date(d.receivedAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="d-flex gap-2">
                          <AppButton
                            variant="success"
                            size="sm"
                            className="rounded-3 flex-fill d-flex align-items-center justify-content-center gap-1"
                            onClick={() => { openConfirm(d); setConfirmStatus("RECEIVED"); }}
                          >
                            <FaCheckCircle /> Received
                          </AppButton>
                          <AppButton
                            variant="outline-danger"
                            size="sm"
                            className="rounded-3 flex-fill d-flex align-items-center justify-content-center gap-1"
                            onClick={() => { openConfirm(d); setConfirmStatus("NOT_RECEIVED"); }}
                          >
                            <FaTimesCircle /> Not Received
                          </AppButton>
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Confirm Modal */}
      <Modal show={!!confirmDelivery} onHide={() => setConfirmDelivery(null)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold fs-6">
            {confirmStatus === "RECEIVED" ? "Confirm Delivery Received" : "Mark as Not Received"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className={`p-3 rounded-3 mb-3 bg-${confirmStatus === "RECEIVED" ? "success" : "danger"} bg-opacity-10`}>
            <div className="small text-muted mb-1 font-monospace">{confirmDelivery?.deliveryId}</div>
            <h6 className="fw-bold mb-0">{confirmDelivery?.quantity} units of {confirmDelivery?.item}</h6>
          </div>
          <Form.Group>
            <Form.Label className="small fw-bold text-muted">RECEIPT STATUS *</Form.Label>
            <div className="d-flex gap-3 mt-1">
              <Form.Check
                type="radio"
                label="Received"
                name="status"
                checked={confirmStatus === "RECEIVED"}
                onChange={() => setConfirmStatus("RECEIVED")}
              />
              <Form.Check
                type="radio"
                label="Not Received"
                name="status"
                checked={confirmStatus === "NOT_RECEIVED"}
                onChange={() => setConfirmStatus("NOT_RECEIVED")}
              />
            </div>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <AppButton variant="light" className="rounded-3" onClick={() => setConfirmDelivery(null)}>Cancel</AppButton>
          <AppButton
            variant={confirmStatus === "RECEIVED" ? "success" : "danger"}
            className="rounded-3 px-4 d-flex align-items-center gap-2"
            disabled={submitting}
            onClick={handleConfirm}
          >
            {confirmStatus === "RECEIVED" ? <FaCheckCircle /> : <FaTimesCircle />}
            {submitting ? "Updating..." : confirmStatus === "RECEIVED" ? "Confirm Received" : "Confirm Not Received"}
          </AppButton>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export { DeliveriesPage };
