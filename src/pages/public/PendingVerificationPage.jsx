import { Container, Button, Card } from "react-bootstrap";
import { AppButton } from "../../components/common/AppButton";
import { FaHourglassHalf, FaArrowLeft, FaShieldAlt, FaEnvelope } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
const PendingVerificationPage = () => {
  const navigate = useNavigate();
  return <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4" style={{
    backgroundImage: "radial-gradient(circle at top right, #e0e7ff 0%, #f8fafc 40%)"
  }}>
      <Container style={{ maxWidth: "600px" }}>
        <Card className="border-0 shadow-lg rounded-4 overflow-hidden text-center p-5">
          <div className="mb-4 d-inline-block">
            <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{ width: "80px", height: "80px" }}>
              <FaHourglassHalf size={36} className="animate-spin-slow" />
            </div>
          </div>

          <h2 className="fw-bold text-dark mb-3">Pending Verification</h2>
          <p className="text-muted mb-4 fs-5">
            Your account has been successfully created, but it requires manual approval from an administrator before you can access the dashboard.
          </p>

          <div className="bg-light rounded-4 p-4 mb-4 text-start">
            <div className="d-flex gap-3 mb-3">
              <div className="text-primary mt-1"><FaShieldAlt /></div>
              <div>
                <h6 className="fw-bold mb-1">Security Audit</h6>
                <p className="small text-muted mb-0">We verify every user to maintain the integrity of our construction workflows.</p>
              </div>
            </div>
            <div className="d-flex gap-3">
              <div className="text-primary mt-1"><FaEnvelope /></div>
              <div>
                <h6 className="fw-bold mb-1">Notification</h6>
                <p className="small text-muted mb-0">You will receive an email once your account is activated (usually within 24 hours).</p>
              </div>
            </div>
          </div>

          <div className="d-flex flex-column gap-2">
            <AppButton
    variant="outline-secondary"
    className="rounded-3 py-2 d-flex align-items-center justify-content-center gap-2"
    onClick={() => navigate("/login")}
  >
              <FaArrowLeft size={14} /> Back to Login
            </AppButton>
            <p className="small text-muted mt-3 mb-0">
              Need urgent access? <a href="mailto:admin@buildsmart.com" className="text-decoration-none fw-bold">Contact Support</a>
            </p>
          </div>
        </Card>
      </Container>

      <style>
        {`
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin-slow {
            animation: spin-slow 8s linear infinite;
          }
        `}
      </style>
    </div>;
};
export {
  PendingVerificationPage
};
