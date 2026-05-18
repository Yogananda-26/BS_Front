import { Nav } from "react-bootstrap";
import { NavLink, Outlet, useLocation, Navigate } from "react-router-dom";
import * as Icons from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { Role } from "../../utils/constants";
const ADMIN_PM_TABS = [
  { label: "Overview", path: "/reports/dashboard", icon: "FaChartPie" },
  { label: "Projects", path: "/reports/projects", icon: "FaBuilding" },
  { label: "Site Engineers", path: "/reports/site-engineers", icon: "FaHardHat" },
  { label: "Resources", path: "/reports/resources", icon: "FaBoxes" },
  { label: "Safety", path: "/reports/safety", icon: "FaShieldAlt" },
  { label: "Users", path: "/reports/users", icon: "FaUsers" }
];
const SAFETY_TABS = [
  { label: "Safety Analytics", path: "/reports/safety", icon: "FaShieldAlt" }
];
const ReportsLayout = () => {
  const location = useLocation();
  const { user } = useAuth();
  if (!user) return null;
  const isSafetyOfficer = user.role === Role.SAFETY_OFFICER;
  const _isAdminOrPM = user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER;
  if (isSafetyOfficer && !location.pathname.startsWith("/reports/safety")) {
    return <Navigate to="/reports/safety" replace />;
  }
  const reportTabs = isSafetyOfficer ? SAFETY_TABS : ADMIN_PM_TABS;
  return <div className="d-flex flex-column h-100">
      <div className="bg-white border-bottom shadow-sm mb-4 sticky-top" style={{ top: "64px", zIndex: 1010 }}>
        <div className="px-4 pt-3">
          <h4 className="fw-bold mb-3 d-flex align-items-center gap-2">
            <Icons.FaChartLine className="text-primary" />
            {isSafetyOfficer ? "Safety Analytics" : "Report & Analytics Module"}
          </h4>
          <Nav variant="tabs" className="border-bottom-0 gap-2">
            {reportTabs.map((tab, idx) => {
    const IconComp = Icons[tab.icon] || Icons.FaCircle;
    const isActive = location.pathname.startsWith(tab.path);
    return <Nav.Item key={idx}>
                  <Nav.Link
      as={NavLink}
      to={tab.path}
      className={`d-flex align-items-center gap-2 px-3 py-2 border-0 border-bottom border-3 fw-semibold ${isActive ? "border-primary text-primary bg-primary bg-opacity-10 rounded-top" : "border-transparent text-secondary"}`}
    >
                    <IconComp size={16} />
                    <span className="d-none d-md-inline">{tab.label}</span>
                  </Nav.Link>
                </Nav.Item>;
  })}
          </Nav>
        </div>
      </div>

      <div className="flex-grow-1">
        <Outlet />
      </div>
    </div>;
};
export {
  ReportsLayout
};