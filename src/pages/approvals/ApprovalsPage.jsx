import { useState, useEffect } from "react";
import { AppButton } from "../../components/common/AppButton";
import { Row, Col, Card, Badge, Button, Modal, Form, Collapse } from "react-bootstrap";
import {
  FaClipboardCheck, FaCheckCircle, FaTimesCircle, FaClock,
  FaListAlt, FaChevronDown, FaChevronUp, FaUser, FaBuilding,
  FaTag, FaCalendarAlt, FaDollarSign, FaExclamationCircle
} from "react-icons/fa";
import projectService from "../../services/projectService";

const STATUS_COLOR = { PENDING: "warning", APPROVED: "success", ACCEPTED: "success", REJECTED: "danger" };

const DEPT_LABELS = {
  SAFETY_OFFICER: "Safety",
  SITE_ENGINEER: "Site Ops",
  VENDOR: "Vendor",
  FINANCE: "Finance",
  PROJECT_MANAGER: "PM"
};

const TYPE_COLOR = {
  SAFETY: "danger",
  FINANCE: "success",
  VENDOR: "primary",
  SITE_OPS: "info",
  GENERAL: "secondary"
};

const ApprovalsPage = () => {
  const [approvals, setApprovals] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectModal, setRejectModal] = useState({ show: false, approvalId: "", taskDescription: "" });
  const [rejectReason, setRejectReason] = useState("");
  const [acting, setActing] = useState("");
  const [actionError, setActionError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [all, statsData] = await Promise.all([
        projectService.getApprovals(),
        projectService.getApprovalStats().catch(() => null)
      ]);
      setApprovals(Array.isArray(all) ? all : []);
      setStats(statsData);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load approvals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const normalizeStatus = (s) => (s === "ACCEPTED" ? "APPROVED" : s);

  const filtered = activeTab === "ALL"
    ? approvals
    : approvals.filter((a) => normalizeStatus(a.status) === activeTab);

  const pendingCount = approvals.filter((a) => a.status === "PENDING").length;

  const handleApprove = async (id) => {
    setActing(id);
    setActionError("");
    try {
      await projectService.approveRequest(id);
      await loadData();
    } catch (err) {
      setActionError(err?.response?.data?.message || err?.message || "Failed to approve.");
    } finally {
      setActing("");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActing(rejectModal.approvalId);
    setActionError("");
    try {
      await projectService.rejectRequest(rejectModal.approvalId, rejectReason.trim());
      setRejectModal({ show: false, approvalId: "", taskDescription: "" });
      setRejectReason("");
      await loadData();
    } catch (err) {
      setActionError(err?.response?.data?.message || err?.message || "Failed to reject.");
    } finally {
      setActing("");
    }
  };

  const computedStats = {
    pending:  approvals.filter((a) => a.status === "PENDING").length,
    approved: approvals.filter((a) => a.status === "APPROVED" || a.status === "ACCEPTED").length,
    rejected: approvals.filter((a) => a.status === "REJECTED").length,
    total:    approvals.length
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="fw-bold text-dark mb-1">Approval Workflows</h3>
        <p className="text-muted mb-0">Review and act on pending approval requests from all departments.</p>
      </div>

      {/* KPI Stats */}
      <Row className="g-3 mb-4">
        {[
          { label: "Pending", value: computedStats.pending, icon: FaClock, color: "warning" },
          { label: "Approved", value: computedStats.approved, icon: FaCheckCircle, color: "success" },
          { label: "Rejected", value: computedStats.rejected, icon: FaTimesCircle, color: "danger" },
          { label: "Total", value: computedStats.total, icon: FaListAlt, color: "primary" }
        ].map(({ label, value, icon: Icon, color }) => (
          <Col xs={6} md={3} key={label}>
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body className="p-4 d-flex align-items-center justify-content-between">
                <div>
                  <p className="small text-muted text-uppercase fw-bold mb-1">{label}</p>
                  <h2 className={`fw-bold text-${color} mb-0`}>{value ?? 0}</h2>
                </div>
                <div className={`bg-${color} bg-opacity-10 text-${color} p-3 rounded-circle`}>
                  <Icon size={22} />
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4 bg-light p-1 rounded-4 flex-wrap" style={{ width: "fit-content" }}>
        {["PENDING", "APPROVED", "REJECTED", "ALL"].map((tab) => (
          <AppButton
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`btn btn-sm rounded-3 px-4 ${activeTab === tab ? "btn-primary" : "btn-light"}`}
          >
            {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            {tab === "PENDING" && pendingCount > 0 && (
              <Badge bg="danger" pill className="ms-2">{pendingCount}</Badge>
            )}
          </AppButton>
        ))}
      </div>

      {actionError && (
        <div className="alert alert-danger rounded-3 d-flex align-items-center gap-2 mb-3">
          <FaExclamationCircle /> {actionError}
          <AppButton className="btn-close ms-auto" onClick={() => setActionError("")} />
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-5 text-muted">Loading approvals...</div>
      ) : error ? (
        <div className="alert alert-danger rounded-4">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-5">
          <FaClipboardCheck size={48} className="text-muted opacity-25 mb-3" />
          <p className="text-muted">No {activeTab === "ALL" ? "" : activeTab.toLowerCase()} approval requests.</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filtered.map((approval) => {
            const isExpanded = expandedId === approval.approvalId;
            const statusColor = STATUS_COLOR[approval.status] || "secondary";
            const typeColor = TYPE_COLOR[approval.approvalType] || "secondary";
            const deptLabel = DEPT_LABELS[approval.requestedByDepartment] || approval.requestedByDepartment || "—";

            return (
              <Card
                key={approval.approvalId}
                className={`border-0 shadow-sm rounded-4 border-start border-4 border-${statusColor}`}
                style={{ transition: "box-shadow 0.2s" }}
              >
                <Card.Body className="p-4">
                  {/* Header row */}
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3">
                    <div className="flex-grow-1" style={{ cursor: "pointer" }} onClick={() => setExpandedId(isExpanded ? null : approval.approvalId)}>
                      {/* Title + badges */}
                      <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                        <h6 className="fw-bold mb-0">{approval.taskDescription || "—"}</h6>
                        <Badge bg={statusColor} className={approval.status === "PENDING" ? "text-dark" : ""}>
                          {normalizeStatus(approval.status)}
                        </Badge>
                        {approval.approvalType && (
                          <Badge bg={typeColor} className="bg-opacity-75">
                            {approval.approvalType.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </div>

                      {/* Summary meta row */}
                      <div className="d-flex flex-wrap gap-3 small text-muted">
                        <span className="d-flex align-items-center gap-1">
                          <FaBuilding className="text-primary opacity-75" />
                          {approval.projectName || approval.projectId || "—"}
                        </span>
                        <span className="d-flex align-items-center gap-1">
                          <FaUser className="text-secondary opacity-75" />
                          {approval.requestedByName || approval.requestedBy || "—"}
                          <Badge bg="light" text="dark" className="border ms-1 small">{deptLabel}</Badge>
                        </span>
                        <span className="d-flex align-items-center gap-1">
                          <FaCalendarAlt className="text-info opacity-75" />
                          {approval.requestedAt ? new Date(approval.requestedAt).toLocaleString() : "—"}
                        </span>
                        {approval.amount != null && (
                          <span className="d-flex align-items-center gap-1 fw-semibold text-success">
                            <FaDollarSign /> {Number(approval.amount).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                      {approval.status === "PENDING" && (
                        <>
                          <AppButton
                            variant="success"
                            size="sm"
                            className="rounded-3 d-flex align-items-center gap-2 px-3"
                            disabled={acting === approval.approvalId}
                            onClick={() => handleApprove(approval.approvalId)}
                          >
                            <FaCheckCircle />
                            {acting === approval.approvalId ? "..." : "Approve"}
                          </AppButton>
                          <AppButton
                            variant="outline-danger"
                            size="sm"
                            className="rounded-3 d-flex align-items-center gap-2 px-3"
                            disabled={acting === approval.approvalId}
                            onClick={() => setRejectModal({ show: true, approvalId: approval.approvalId, taskDescription: approval.taskDescription })}
                          >
                            <FaTimesCircle /> Reject
                          </AppButton>
                        </>
                      )}
                      <AppButton
                        variant="light"
                        size="sm"
                        className="rounded-circle p-2"
                        onClick={() => setExpandedId(isExpanded ? null : approval.approvalId)}
                      >
                        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                      </AppButton>
                    </div>
                  </div>

                  {/* Expanded details */}
                  <Collapse in={isExpanded}>
                    <div>
                      <div className="mt-3 pt-3 border-top">
                        <Row className="g-3 small">
                          <Col xs={12} sm={6} md={3}>
                            <div className="text-muted mb-1 fw-bold text-uppercase" style={{ fontSize: "0.7rem" }}>Approval ID</div>
                            <div className="fw-semibold font-monospace">{approval.approvalId}</div>
                          </Col>
                          <Col xs={12} sm={6} md={3}>
                            <div className="text-muted mb-1 fw-bold text-uppercase" style={{ fontSize: "0.7rem" }}>Task ID</div>
                            <div className="fw-semibold font-monospace">{approval.taskId || "—"}</div>
                          </Col>
                          <Col xs={12} sm={6} md={3}>
                            <div className="text-muted mb-1 fw-bold text-uppercase" style={{ fontSize: "0.7rem" }}>Project ID</div>
                            <div className="fw-semibold font-monospace">{approval.projectId || "—"}</div>
                          </Col>
                          <Col xs={12} sm={6} md={3}>
                            <div className="text-muted mb-1 fw-bold text-uppercase" style={{ fontSize: "0.7rem" }}>Department</div>
                            <div className="fw-semibold">{approval.requestedByDepartment?.replace(/_/g, " ") || "—"}</div>
                          </Col>

                          {approval.description && (
                            <Col md={12}>
                              <div className="text-muted mb-1 fw-bold text-uppercase" style={{ fontSize: "0.7rem" }}>Description</div>
                              <div className="p-3 bg-light rounded-3">{approval.description}</div>
                            </Col>
                          )}

                          {approval.status === "APPROVED" && approval.approvedByName && (
                            <Col md={12}>
                              <div className="p-3 bg-success bg-opacity-10 rounded-3 d-flex gap-3 flex-wrap">
                                <div>
                                  <div className="text-muted mb-1 fw-bold text-uppercase" style={{ fontSize: "0.7rem" }}>Approved By</div>
                                  <div className="fw-semibold text-success">{approval.approvedByName}</div>
                                </div>
                                {approval.approvedAt && (
                                  <div>
                                    <div className="text-muted mb-1 fw-bold text-uppercase" style={{ fontSize: "0.7rem" }}>Approved At</div>
                                    <div className="fw-semibold text-success">{new Date(approval.approvedAt).toLocaleString()}</div>
                                  </div>
                                )}
                              </div>
                            </Col>
                          )}

                          {approval.status === "REJECTED" && approval.rejectionReason && (
                            <Col md={12}>
                              <div className="p-3 bg-danger bg-opacity-10 rounded-3">
                                <div className="text-danger fw-bold small mb-1">Rejection Reason</div>
                                <div className="text-danger">{approval.rejectionReason}</div>
                              </div>
                            </Col>
                          )}
                        </Row>
                      </div>
                    </div>
                  </Collapse>
                </Card.Body>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      <Modal show={rejectModal.show} onHide={() => { setRejectModal({ show: false, approvalId: "", taskDescription: "" }); setRejectReason(""); }} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold text-danger d-flex align-items-center gap-2">
            <FaTimesCircle /> Reject Request
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {rejectModal.taskDescription && (
            <div className="p-3 bg-light rounded-3 mb-3 small text-muted">
              <FaTag className="me-1" /> {rejectModal.taskDescription}
            </div>
          )}
          <Form.Group>
            <Form.Label className="small fw-bold text-muted">REJECTION REASON <span className="text-danger">*</span></Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Explain why this request is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="rounded-3"
              required
            />
            <Form.Text className="text-muted">This reason will be visible to the requester.</Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <AppButton
            variant="light"
            className="rounded-3"
            onClick={() => { setRejectModal({ show: false, approvalId: "", taskDescription: "" }); setRejectReason(""); }}
          >
            Cancel
          </AppButton>
          <AppButton
            variant="danger"
            className="rounded-3 d-flex align-items-center gap-2"
            disabled={!rejectReason.trim() || acting === rejectModal.approvalId}
            onClick={handleReject}
          >
            <FaTimesCircle />
            {acting === rejectModal.approvalId ? "Rejecting..." : "Reject Request"}
          </AppButton>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export { ApprovalsPage };
