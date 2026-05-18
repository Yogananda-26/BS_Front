import { useState, useEffect } from "react";
import { AppButton } from "../../components/common/AppButton";
import { AppTable } from "../../components/common/AppTable";
import { Card, Badge, Button, Form, Modal, Alert } from "react-bootstrap";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import vendorService from "../../services/vendorService";
import { toast } from "react-toastify";
const VendorApprovalsPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await vendorService.getPendingInvoices();
      setInvoices(data);
    } catch (error) {
      console.error("Failed to load vendor approvals:", error);
      toast.error("Failed to load vendor approvals");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, []);
  const handleApprove = async (approvalId) => {
    setProcessing(true);
    try {
      await vendorService.approveInvoice(approvalId);
      toast.success("Invoice approved successfully");
      loadData();
    } catch (error) {
      console.error("Failed to approve invoice:", error);
      toast.error("Failed to approve invoice");
    } finally {
      setProcessing(false);
    }
  };
  const handleReject = (invoice) => {
    setSelectedInvoice(invoice);
    setShowRejectModal(true);
  };
  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setProcessing(true);
    try {
      await vendorService.rejectInvoice(selectedInvoice.id, rejectionReason);
      toast.success("Invoice rejected successfully");
      setShowRejectModal(false);
      setRejectionReason("");
      setSelectedInvoice(null);
      loadData();
    } catch (error) {
      console.error("Failed to reject invoice:", error);
      toast.error("Failed to reject invoice");
    } finally {
      setProcessing(false);
    }
  };
  return <div className="p-4">
      <div className="mb-4">
        <h3 className="fw-bold text-dark mb-1">Vendor Invoice Approvals</h3>
        <p className="text-muted mb-0">Review and approve vendor invoices submitted for payment.</p>
      </div>

      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-4">
          {loading ? <div className="text-center py-5 text-muted">Loading...</div> : invoices.length === 0 ? <Alert variant="info" className="rounded-4">No pending invoice approvals</Alert> : <AppTable
              columns={['Invoice Number', 'Contract', 'Description', 'Amount', 'Due Date', 'Submitted', 'Actions']}
              responsive
              isEmpty={invoices.length === 0}
            >
                {invoices.map((invoice) => <tr key={invoice.id}>
                    <td className="py-3 px-4">
                      <div className="fw-bold">{invoice.invoiceNumber}</div>
                      <Badge bg="warning" className="mt-1">SUBMITTED</Badge>
                    </td>
                    <td className="py-3 px-4">{invoice.contractTitle}</td>
                    <td className="py-3 px-4">{invoice.description}</td>
                    <td className="py-3 px-4 fw-bold">${invoice.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 small">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4 small">
                      {invoice.submittedAt ? new Date(invoice.submittedAt).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="d-flex gap-2">
                        <AppButton
    variant="outline-success"
    size="sm"
    className="rounded-3"
    onClick={() => handleApprove(invoice.id)}
    disabled={processing}
  >
                          <FaCheckCircle />
                        </AppButton>
                        <AppButton
    variant="outline-danger"
    size="sm"
    className="rounded-3"
    onClick={() => handleReject(invoice)}
    disabled={processing}
  >
                          <FaTimesCircle />
                        </AppButton>
                      </div>
                    </td>
                  </tr>)}
            </AppTable>}
        </Card.Body>
      </Card>

      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Reject Invoice</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <strong>Invoice:</strong> {selectedInvoice?.invoiceNumber}
          </div>
          <div className="mb-3">
            <strong>Amount:</strong> ${selectedInvoice?.amount.toLocaleString()}
          </div>
          <Form.Group>
            <Form.Label className="fw-bold">Rejection Reason *</Form.Label>
            <Form.Control
    as="textarea"
    rows={3}
    value={rejectionReason}
    onChange={(e) => setRejectionReason(e.target.value)}
    placeholder="Please provide a reason for rejection..."
    required
  />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <AppButton variant="light" onClick={() => setShowRejectModal(false)} className="rounded-3">Cancel</AppButton>
          <AppButton variant="danger" onClick={handleRejectConfirm} disabled={processing} className="rounded-3">
            {processing ? "Rejecting..." : "Reject"}
          </AppButton>
        </Modal.Footer>
      </Modal>
    </div>;
};
export {
  VendorApprovalsPage
};
