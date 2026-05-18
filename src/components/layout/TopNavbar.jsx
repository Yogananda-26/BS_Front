import { Navbar, Dropdown } from "react-bootstrap";
import { FaBars, FaBuilding, FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { NotificationBell } from "./NotificationBell";

const TopNavbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Navbar
      bg="white"
      expand="lg"
      fixed="top"
      className="shadow-sm border-bottom px-3 px-md-4"
      style={{ height: "64px", zIndex: 1030 }}
    >
      {/* Hamburger — mobile only */}
      <button
        className="btn btn-light d-flex d-md-none align-items-center justify-content-center me-2 flex-shrink-0"
        onClick={onToggleSidebar}
        style={{ width: "38px", height: "38px", border: "none" }}
        aria-label="Toggle sidebar"
      >
        <FaBars size={17} className="text-secondary" />
      </button>

      {/* Brand — always visible, sits above the sidebar on desktop */}
      <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2 me-auto">
        <div
          className="bg-primary bg-opacity-10 text-primary p-2 rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: "36px", height: "36px" }}
        >
          <FaBuilding size={18} />
        </div>
        <span className="fs-5 fw-bold text-primary">BuildSmart</span>
      </Navbar.Brand>

      {/* Right side — notifications + user dropdown */}
      <div className="d-flex align-items-center gap-2 gap-md-3">
        <NotificationBell />

        <Dropdown align="end">
          <Dropdown.Toggle
            variant="light"
            id="user-dropdown"
            className="d-flex align-items-center gap-2 border-0 bg-transparent shadow-none px-2"
          >
            <FaUserCircle size={24} className="text-secondary" />
            <span className="d-none d-md-block fw-semibold text-dark">{user?.name}</span>
          </Dropdown.Toggle>

          <Dropdown.Menu className="shadow border-0 mt-2">
            <Dropdown.Header className="text-capitalize">
              {user?.role?.replace(/_/g, " ").toLowerCase() || ""}
            </Dropdown.Header>
            <Dropdown.Item onClick={handleLogout} className="text-danger">
              <FaSignOutAlt className="me-2" /> Logout
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </Navbar>
  );
};

export { TopNavbar };
