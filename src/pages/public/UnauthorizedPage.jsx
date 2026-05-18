import { Container, Button, Card } from "react-bootstrap";
import { AppButton } from "../../components/common/AppButton";
import { FaLock, FaHome, FaShieldAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
const UnauthorizedPage = () => {
  const navigate = useNavigate();
  return <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4" style={{
    backgroundImage: "radial-gradient(circle at top right, #fee2e2 0%, #f8fafc 40%)"
  }}>
      <Container style={{ maxWidth: "500px" }}>
        <Card className="border-0 shadow-lg rounded-4 overflow-hidden text-center p-5">
          <div className="mb-4 d-inline-block">
            <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{ width: "80px", height: "80px" }}>
              <FaLock size={36} />
            </div>
          </div>

          <h2 className="fw-bold text-dark mb-2">Access Denied</h2>
          <h5 className="text-danger mb-4 fw-semibold text-uppercase small ls-widest">403 — Unauthorized</h5>
          
          <p className="text-muted mb-4 fs-6">
            You don't have the necessary permissions to access this specific module. Please contact your system administrator if you believe this is an error.
          </p>

          <div className="d-flex flex-column gap-2 mt-2">
            <AppButton
    variant="dark"
    className="rounded-3 py-2 d-flex align-items-center justify-content-center gap-2"
    onClick={() => navigate("/")}
  >
              <FaHome size={16} /> Return to Home
            </AppButton>
            <AppButton
    variant="outline-secondary"
    className="rounded-3 py-2 mt-2"
    onClick={() => navigate(-1)}
  >
              Go Back
            </AppButton>
          </div>
          
          <div className="mt-5 pt-3 border-top d-flex align-items-center justify-content-center gap-2 text-muted small">
            <FaShieldAlt /> Secure Access Control Active
          </div>
        </Card>
      </Container>
    </div>;
};
export {
  UnauthorizedPage
};
