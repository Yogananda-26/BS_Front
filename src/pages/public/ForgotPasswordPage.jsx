import { useState } from "react";
import { AppButton } from "../../components/common/AppButton";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaBuilding, FaEnvelope } from "react-icons/fa";
import { passwordService } from "../../services/passwordService";
const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: null, message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: null, message: "" });
    setIsLoading(true);
    try {
      await passwordService.forgotPassword(email);
      setTimeout(() => {
        setStatus({
          type: "success",
          message: "If an account exists with that email, a password reset link has been sent."
        });
        setIsLoading(false);
      }, 1e3);
    } catch (err) {
      setStatus({
        type: "error",
        message: err.response?.data?.message || "Something went wrong. Please try again."
      });
      setIsLoading(false);
    }
  };
  return <div className="min-vh-100 d-flex align-items-center justify-content-center construction-overlay py-5">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={5}>
            <Card className="border-0 shadow-lg rounded-4 bg-white opacity-95">
              <Card.Body className="p-4 p-md-5">
                <div className="text-center mb-4">
                  <div className="bg-primary bg-opacity-10 text-primary d-inline-block p-3 rounded-circle mb-3">
                    <FaBuilding size={32} />
                  </div>
                  <h2 className="fw-bold text-primary">Forgot Password</h2>
                  <p className="text-muted small">Enter your email to receive a reset link.</p>
                </div>

                {status.type === "error" && <Alert variant="danger">{status.message}</Alert>}
                {status.type === "success" && <Alert variant="success">{status.message}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4">
                    <Form.Label className="small fw-bold text-muted">EMAIL ADDRESS</Form.Label>
                    <div className="position-relative">
                      <div className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
                        <FaEnvelope />
                      </div>
                      <Form.Control
    type="email"
    placeholder="name@gmail.com"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    required
    className="ps-5 py-3 rounded-3 bg-light border-0"
  />
                    </div>
                  </Form.Group>

                  <AppButton
    variant="primary"
    type="submit"
    className="w-100 py-3 rounded-3 fw-bold shadow-sm d-flex justify-content-center align-items-center gap-2 mb-4"
    disabled={isLoading}
  >
                    {isLoading ? "Sending Link..." : "Send Reset Link"}
                  </AppButton>

                  <div className="text-center pt-3 border-top">
                    <p className="small text-muted mb-0">
                      Remember your password? <Link to="/login" className="text-primary fw-bold text-decoration-none">Return to login</Link>
                    </p>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>;
};
var stdin_default = ForgotPasswordPage;
export {
  stdin_default as default
};
