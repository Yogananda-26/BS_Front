import { useEffect, useState } from "react";
import { Container, Card, Row, Col, Spinner, Badge } from "react-bootstrap";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaUserTag,
  FaIdBadge,
  FaCircle
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { userService } from "../../services/userService";

/**
 * ProfilePage — read-only view of the logged-in user's account.
 * Uses GET /users/profile for fresh data and falls back to the
 * AuthContext user object if the endpoint fails.
 */
const ProfilePage = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(authUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const fresh = await userService.getProfile();
        if (!cancelled && fresh) {
          setProfile({ ...authUser, ...fresh });
        }
      } catch (err) {
        console.warn("Couldn't fetch fresh profile, using cached user:", err?.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [authUser]);

  const prettyRole = (profile?.role || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const statusVariant =
    profile?.status === "ACTIVE"
      ? "success"
      : profile?.status === "PENDING_VERIFICATION"
      ? "warning"
      : profile?.status === "SUSPENDED"
      ? "danger"
      : "secondary";

  const Field = ({ icon: Icon, label, value, valueNode }) => (
    <div className="d-flex align-items-center gap-3 py-3 border-bottom">
      <div
        className="bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
        style={{ width: "44px", height: "44px" }}
      >
        <Icon size={18} />
      </div>
      <div className="flex-grow-1 min-w-0">
        <div className="small text-uppercase fw-bold text-muted" style={{ letterSpacing: ".05em" }}>
          {label}
        </div>
        <div className="fw-semibold text-dark text-truncate">
          {valueNode || value || <span className="text-muted fst-italic">Not set</span>}
        </div>
      </div>
    </div>
  );

  if (loading && !profile) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  const initials = (profile?.name || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h3 className="fw-bold text-dark mb-1">My Profile</h3>
        <p className="text-muted mb-0">View your account details and current status.</p>
      </div>

      <Row className="g-4">
        <Col lg={4}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4 d-flex flex-column align-items-center text-center">
              <div
                className="bg-primary text-white d-flex align-items-center justify-content-center rounded-circle mb-3 shadow-sm"
                style={{ width: "104px", height: "104px", fontSize: "2.25rem", fontWeight: 700 }}
              >
                {initials}
              </div>
              <h5 className="fw-bold mb-1">{profile?.name || "Unnamed User"}</h5>
              <p className="text-muted small mb-3 font-monospace">{profile?.userId || "—"}</p>

              <Badge
                bg={statusVariant}
                className="px-3 py-2 d-inline-flex align-items-center gap-2"
                style={{ borderRadius: "999px" }}
              >
                <FaCircle size={8} />
                <span className="text-uppercase fw-bold" style={{ letterSpacing: ".05em", fontSize: ".75rem" }}>
                  {(profile?.status || "UNKNOWN").replace(/_/g, " ")}
                </span>
              </Badge>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-1">Account Details</h6>
              <p className="small text-muted mb-3">
                These details are managed by your administrator. Contact them to make changes.
              </p>

              <Field icon={FaUser}    label="Full Name" value={profile?.name} />
              <Field icon={FaEnvelope} label="Email"     value={profile?.email} />
              <Field icon={FaPhone}    label="Phone"     value={profile?.phone} />
              <Field icon={FaUserTag}  label="Role"      value={prettyRole} />
              <Field
                icon={FaIdBadge}
                label="User ID"
                valueNode={<span className="font-monospace">{profile?.userId}</span>}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export { ProfilePage };