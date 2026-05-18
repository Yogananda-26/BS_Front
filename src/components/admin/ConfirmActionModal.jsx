import { useState } from "react";
import { AppButton } from "../common/AppButton";
import { Modal, Button, Alert } from "react-bootstrap";
import { FaExclamationTriangle } from "react-icons/fa";
const ConfirmActionModal = ({
  show,
  onHide,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  confirmVariant = "danger"
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onConfirm();
      onHide();
    } catch (err) {
      setError(err?.response?.data?.message || "Action failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  return <Modal show={show} onHide={onHide} centered>
      <Modal.Body className="p-4 text-center">
        <div className={`bg-${confirmVariant} bg-opacity-10 text-${confirmVariant} rounded-circle d-inline-flex p-3 mb-3`}>
          <FaExclamationTriangle size={28} />
        </div>
        <h5 className="fw-bold mb-2">{title}</h5>
        <p className="text-muted mb-0">{message}</p>
        {error && <Alert variant="danger" className="mt-3 rounded-3 text-start">{error}</Alert>}
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0 justify-content-center gap-3 pb-4">
        <AppButton variant="light" onClick={onHide} className="px-4 rounded-3" disabled={isLoading}>
          Cancel
        </AppButton>
        <AppButton
    variant={confirmVariant}
    onClick={handleConfirm}
    disabled={isLoading}
    className="px-4 rounded-3 fw-semibold"
  >
          {isLoading ? "Processing..." : confirmLabel}
        </AppButton>
      </Modal.Footer>
    </Modal>;
};
export {
  ConfirmActionModal
};
