import { useState } from "react";
import { Form, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import {
  FaBuilding,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowLeft,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";
import { DASHBOARD_ROUTES } from "../../utils/constants";
import { validateLoginForm, firstError } from "../../utils/validators";
import { AppButton } from "../../components/common/AppButton";

const resolveServerError = (err) => {
  const status = err.response?.status;
  const msg = err.response?.data?.message || err.response?.data?.error || "";

  if (err.code === "ERR_NETWORK" || !err.response) {
    return "Cannot connect to the server. Please check your connection or try again later.";
  }

  switch (status) {
    case 401: return "Invalid email or password. Please check your credentials and try again.";
    case 403: return "Your account has been suspended. Please contact your administrator.";
    case 423: return "Your account is pending verification. Please wait for admin approval.";
    case 500: return "Something went wrong on our end. Please try again shortly.";
    default:  return msg || "Login failed. Please check your credentials and try again.";
  }
};

const LoginPage = () => {
  const [email,        setEmail       ] = useState("");
  const [password,     setPassword    ] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors,  setFieldErrors ] = useState({});
  const [serverError,  setServerError ] = useState("");
  const [isLoading,    setIsLoading   ] = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const clearError = (field) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errors = validateLoginForm({ email, password });
    setFieldErrors(errors);
    return !firstError(errors);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      const data     = response.data?.data || response.data;

      if (!data?.token) {
        setServerError("Authentication failed. Server did not return a valid token.");
        return;
      }

      const backendRole    = data.role || "";
      const normalizedRole = backendRole.toUpperCase().trim().replace(/\s+/g, "_");

      if (!normalizedRole) {
        setServerError("Authentication failed. User role is missing in the response.");
        return;
      }

      let validUserId = data.userId || data.id || null;
      try {
        const payload = JSON.parse(atob(data.token.split(".")[1]));
        validUserId   = payload.validUserId || payload.userId || validUserId || data.email;
      } catch {
        validUserId = validUserId || data.email;
      }

      login(data.token, {
        userId: validUserId,
        name:   data.name,
        email:  data.email,
        phone:  data.phone,
        role:   normalizedRole,
        status: data.status || "ACTIVE",
      });

      navigate(DASHBOARD_ROUTES[normalizedRole] || "/admin/dashboard");
    } catch (err) {
      setServerError(resolveServerError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column flex-lg-row">
      <div className="construction-overlay d-none d-lg-flex flex-column justify-content-between align-items-start p-5 col-lg-6">
        {/* Back to Home button */}
        <Link to="/" className="d-flex align-items-center gap-2 text-white-50 text-decoration-none small fw-semibold">
          <FaArrowLeft size={12} />
          Back to Home
        </Link>

        {/* Middle content */}
        <div>
          <h1 className="fw-bold text-white mb-3">BuildSmart</h1>
          <p className="fw-bold text-uppercase mb-3 text-warning letter-spacing-1" style={{ fontSize: "11px" }}>
            Construction Management Platform
          </p>
          <p className="mb-0 text-white-50">
            A unified platform for project managers, site engineers, vendors,
            and finance teams — everything your construction workflow needs.
          </p>
        </div>

        {/* Empty bottom to balance flex */}
        <div />
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="d-flex flex-column justify-content-center bg-white p-4 p-md-5 col-lg-6">
        <div className="mx-auto w-100" style={{ maxWidth: 400 }}>
          {/* Mobile logo */}
          <div className="d-flex d-lg-none align-items-center gap-2 mb-4">
            <div
              className="d-flex align-items-center justify-content-center rounded-3 text-white bg-secondary"
              style={{ width: 38, height: 38 }}
            >
              <FaBuilding size={17} />
            </div>
            <span className="fw-bold fs-5 text-secondary">BuildSmart</span>
          </div>

          {/* Heading */}
          <div className="mb-4">
            <p className="fw-bold text-uppercase text-primary mb-1 letter-spacing-1" style={{ fontSize: "11px" }}>
              Welcome Back
            </p>
            <h2 className="fw-bold mb-1 text-secondary" style={{ fontSize: "26px" }}>
              Sign in to your account
            </h2>
            <p className="text-muted mb-0 small">
              Enter your credentials to access the portal
            </p>
          </div>

          {/* Server error */}
          {serverError && (
            <Alert variant="danger" className="d-flex align-items-start gap-2 py-2 rounded-3 small">
              <span>{serverError}</span>
            </Alert>
          )}

          {/* Form */}
          <Form onSubmit={handleLogin} noValidate>
            {/* Email */}
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted text-uppercase letter-spacing-1">
                Email Address
              </Form.Label>
              <div className="position-relative">
                <div className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" style={{ pointerEvents: "none" }}>
                  <FaEnvelope size={13} />
                </div>
                <Form.Control
                  type="email"
                  name="email" // <-- ADDED: Crucial mapping for Browser Cache
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
                  isInvalid={!!fieldErrors.email}
                  className="ps-5 py-3 bg-light border-0"
                  autoComplete="username email" // <-- OPTIMIZED: Fallback context hints for managers
                />
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.email}
                </Form.Control.Feedback>
              </div>
            </Form.Group>

            {/* Password */}
            <Form.Group className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <Form.Label className="small fw-bold text-muted text-uppercase mb-0 letter-spacing-1">
                  Password
                </Form.Label>
                <Link to="/forgot-password" className="small fw-semibold text-decoration-none text-primary">
                  Forgot password?
                </Link>
              </div>
              <div className="position-relative">
                <div className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" style={{ pointerEvents: "none" }}>
                  <FaLock size={13} />
                </div>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  name="password" // <-- ADDED: Crucial mapping for Browser Cache
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
                  isInvalid={!!fieldErrors.password}
                  className="ps-5 pe-5 py-3 bg-light border-0"
                  autoComplete="current-password"
                />

                {/* Eye toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="position-absolute top-50 end-0 translate-middle-y me-3 bg-transparent border-0 p-0 text-muted"
                >
                  {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>

                <Form.Control.Feedback type="invalid">
                  {fieldErrors.password}
                </Form.Control.Feedback>
              </div>
            </Form.Group>

            {/* Submit */}
            <AppButton
              variant="primary"
              type="submit" // <-- Ensure your custom AppButton passes this type to the native HTML button element
              disabled={isLoading}
              className="w-100 py-3 fw-bold shadow-sm d-flex justify-content-center align-items-center gap-2 mb-3"
            >
              {isLoading ? "Authenticating..." : "Access Portal"}
            </AppButton>

            {/* Signup */}
            <div className="text-center pt-3 border-top">
              <p className="small text-muted mb-0">
                New to BuildSmart?{" "}
                <Link to="/signup" className="fw-bold text-decoration-none text-primary">
                  Create an account
                </Link>
              </p>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;