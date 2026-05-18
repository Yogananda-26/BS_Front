import { useState } from "react";
import { AppButton } from "../../components/common/AppButton";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { FaBuilding, FaUser, FaEnvelope, FaLock, FaPhone, FaUserTie } from "react-icons/fa";
import { Role } from "../../utils/constants";
import { validateSignupForm, firstError } from "../../utils/validators";
import { authService } from "../../services/authService";
const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: Role.SITE_ENGINEER
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    const msg = firstError(validateSignupForm(formData));
    if (msg) { setError(msg); return; }
    setIsLoading(true);
    try {
      await authService.signup(formData);
      setTimeout(() => {
        setIsLoading(false);
        navigate("/pending-verification");
      }, 1e3);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
      setIsLoading(false);
    }
  };
  return <div className="min-vh-100 d-flex align-items-center justify-content-center construction-overlay py-5">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={6}>
            <Card className="border-0 shadow-lg rounded-4 bg-white opacity-95">
              <Card.Body className="p-4 p-md-5">
                <div className="text-center mb-4">
                  <div className="bg-primary bg-opacity-10 text-primary d-inline-block p-3 rounded-circle mb-3">
                    <FaBuilding size={32} />
                  </div>
                  <h2 className="fw-bold text-primary">Join BuildSmart</h2>
                  <p className="text-muted small">Register for portal access. Approval required.</p>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={handleSignup}>
                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">FULL NAME</Form.Label>
                        <div className="position-relative">
                          <div className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
                            <FaUser />
                          </div>
                          <Form.Control
    type="text"
    name="name"
    placeholder="John Doe"
    value={formData.name}
    onChange={handleChange}
    required
    className="ps-5 py-2 rounded-3 bg-light border-0"
  />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col xs={12} md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">GMAIL ADDRESS</Form.Label>
                        <div className="position-relative">
                          <div className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
                            <FaEnvelope />
                          </div>
                          <Form.Control
    type="email"
    name="email"
    placeholder="name@gmail.com"
    value={formData.email}
    onChange={handleChange}
    required
    className="ps-5 py-2 rounded-3 bg-light border-0"
  />
                        </div>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">PHONE</Form.Label>
                        <div className="position-relative">
                          <div className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
                            <FaPhone />
                          </div>
                          <Form.Control
    type="tel"
    name="phone"
    placeholder="9876543210"
    value={formData.phone}
    onChange={handleChange}
    required
    maxLength={10}
    className="ps-5 py-2 rounded-3 bg-light border-0"
  />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col xs={12} md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">PASSWORD</Form.Label>
                        <div className="position-relative">
                          <div className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
                            <FaLock />
                          </div>
                          <Form.Control
    type="password"
    name="password"
    placeholder="••••••••"
    value={formData.password}
    onChange={handleChange}
    required
    className="ps-5 py-2 rounded-3 bg-light border-0"
  />
                        </div>
                        <Form.Text className="text-muted" style={{ fontSize: "0.7rem" }}>
                          Min 6 chars, 1 uppercase, 1 lowercase, 1 number.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group className="mb-4">
                        <Form.Label className="small fw-bold text-muted">ROLE</Form.Label>
                        <div className="position-relative">
                          <div className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted z-1">
                            <FaUserTie />
                          </div>
                          <Form.Select
    name="role"
    value={formData.role}
    onChange={handleChange}
    className="ps-5 py-2 rounded-3 bg-light border-0 position-relative"
    style={{ paddingLeft: "2.5rem" }}
  >
                            {Object.values(Role).map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                          </Form.Select>
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>

                  <AppButton
    variant="primary"
    type="submit"
    className="w-100 py-3 rounded-3 fw-bold shadow-sm d-flex justify-content-center align-items-center gap-2 mb-4"
    disabled={isLoading}
  >
                    {isLoading ? "Submitting..." : "Register Account"}
                  </AppButton>

                  <div className="text-center pt-3 border-top">
                    <p className="small text-muted mb-0">
                      Already have an account? <Link to="/login" className="text-primary fw-bold text-decoration-none">Sign in</Link>
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
var stdin_default = SignupPage;
export {
  stdin_default as default
};
