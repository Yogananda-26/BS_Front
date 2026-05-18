import { useState, useEffect } from "react";
import { Nav } from "react-bootstrap";
import { NavLink, useLocation } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { NAVIGATION_MENUS } from "../../utils/constants";
import * as Icons from "react-icons/fa";

export const SIDEBAR_WIDTH = 260;
export const SIDEBAR_MINI_WIDTH = 64;
const MOBILE_BREAKPOINT = 768;

const Sidebar = ({ isOpen, onToggle, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < MOBILE_BREAKPOINT
  );

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Auto-close drawer on route change (mobile only)
  useEffect(() => {
    if (isMobile) onClose();
  }, [location.pathname]);

  if (!user) return null;

  const menuItems = NAVIGATION_MENUS[user.role] || [];

  const sidebarStyle = isMobile
    ? {
        width: `${SIDEBAR_WIDTH}px`,
        transform: isOpen ? "translateX(0)" : `translateX(-${SIDEBAR_WIDTH}px)`,
        transition: "transform 0.3s ease",
      }
    : {
        width: isOpen ? `${SIDEBAR_WIDTH}px` : `${SIDEBAR_MINI_WIDTH}px`,
        transition: "width 0.3s ease",
        transform: "translateX(0)",
      };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && (
        <div
          onClick={onClose}
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{
            backgroundColor: "rgba(0,0,0,0.45)",
            zIndex: 1024,
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? "auto" : "none",
            transition: "opacity 0.3s ease",
          }}
        />
      )}

      {/* Sidebar panel */}
      <div
        className="d-flex flex-column bg-white border-end shadow-sm position-fixed"
        style={{
          ...sidebarStyle,
          top: "64px",
          height: "calc(100vh - 64px)",
          zIndex: 1025,
          overflowX: "hidden",
          overflowY: "auto",
        }}
      >
        {/* ── Header — brand + toggle on desktop, brand only on mobile ── */}
        <div
          className="d-flex align-items-center border-bottom flex-shrink-0"
          style={{ minHeight: "64px", padding: "0 12px" }}
        >
          {/* Desktop expanded — role label + collapse button */}
          {!isMobile && isOpen && (
            <div className="d-flex align-items-center w-100">
              <div className="flex-grow-1 ps-2 overflow-hidden">
                <p className="text-muted small mb-0 text-nowrap text-capitalize fw-semibold" style={{ fontSize: "12px" }}>
                  {user?.role?.replace(/_/g, " ").toLowerCase()}
                </p>
              </div>
              <button
                className="btn btn-light d-flex align-items-center justify-content-center flex-shrink-0 ms-auto"
                style={{ width: "34px", height: "34px", border: "none" }}
                onClick={onToggle}
                aria-label="Collapse sidebar"
              >
                <FaBars size={15} className="text-secondary" />
              </button>
            </div>
          )}

          {/* Desktop collapsed — just toggle button centered */}
          {!isMobile && !isOpen && (
            <div className="w-100 d-flex justify-content-center">
              <button
                className="btn btn-light d-flex align-items-center justify-content-center"
                style={{ width: "34px", height: "34px", border: "none" }}
                onClick={onToggle}
                aria-label="Expand sidebar"
              >
                <FaBars size={15} className="text-secondary" />
              </button>
            </div>
          )}

          {/* Mobile — brand only */}
          {isMobile && (
            <div className="d-flex align-items-center gap-2 ps-1">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 text-primary flex-shrink-0"
                style={{ width: "32px", height: "32px" }}
              >
                <Icons.FaBuilding size={15} />
              </div>
              <div>
                <h6 className="fw-bold text-primary mb-0">BuildSmart</h6>
                <p className="text-muted small mb-0 text-capitalize" style={{ fontSize: "11px" }}>
                  {user?.role?.replace(/_/g, " ").toLowerCase()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Nav links ── */}
        <Nav className="flex-column flex-grow-1 py-2 gap-1" style={{ padding: "8px" }}>
          {menuItems.map((item, index) => {
            const IconComponent = Icons[item.icon] || Icons.FaQuestionCircle;
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);
            const showLabel = isOpen || isMobile;

            return (
              <Nav.Link
                as={NavLink}
                to={item.path}
                key={index}
                title={!showLabel ? item.label : undefined}
                className={`d-flex align-items-center rounded-3 text-decoration-none fw-semibold ${
                  showLabel ? "gap-3 py-3 px-3" : "justify-content-center py-3 px-0"
                } ${isActive ? "text-primary" : "text-secondary"}`}
                style={{
                  backgroundColor: isActive
                    ? "rgba(var(--bs-primary-rgb), 0.08)"
                    : "transparent",
                  opacity: isActive ? 1 : 0.8,
                  transition: "background-color 0.15s ease",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                <IconComponent
                  size={19}
                  className={isActive ? "text-primary" : "text-secondary"}
                  style={{ flexShrink: 0 }}
                />
                {showLabel && <span>{item.label}</span>}
              </Nav.Link>
            );
          })}
        </Nav>

        {/* ── Footer ── */}
        {(isOpen || isMobile) && (
          <div className="px-4 py-3 border-top flex-shrink-0">
            <p className="text-muted small mb-0 opacity-50 text-center">V2.4.1</p>
          </div>
        )}
      </div>
    </>
  );
};

export { Sidebar };