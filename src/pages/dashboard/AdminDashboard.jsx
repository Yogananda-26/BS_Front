import { useEffect, useState } from "react";
import { Row, Col, Spinner, Card, Badge, Button, ProgressBar } from "react-bootstrap";
import { FaUsers, FaChartLine, FaShieldAlt, FaArrowUp, FaClipboardList, FaCalendarCheck, FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import analyticsService from "../../services/analyticsService";
const ROLE_COLORS = {
  ADMIN: "#dc3545",
  PROJECT_MANAGER: "#0d6efd",
  SITE_ENGINEER: "#0dcaf0",
  SAFETY_OFFICER: "#ffc107",
  FINANCE_OFFICER: "#198754",
  VENDOR: "#6c757d"
};
const ROLE_ABBREVIATIONS = {
  ADMIN: "AD",
  PROJECT_MANAGER: "PM",
  SITE_ENGINEER: "SE",
  SAFETY_OFFICER: "SO",
  FINANCE_OFFICER: "FO",
  VENDOR: "VM"
};
const GREETING = () => {
  const hour = (/* @__PURE__ */ new Date()).getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(/* @__PURE__ */ new Date());
  const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await analyticsService.getUserAnalyticsSummary();
        setStats(data);
      } catch (error) {
        console.error("Error fetching admin dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(/* @__PURE__ */ new Date()), 1e3);
    return () => clearInterval(timer);
  }, []);
  const rolesChartData = Object.entries(stats?.usersByRole || {}).map(([role, count]) => ({
    name: ROLE_ABBREVIATIONS[role] || role.substring(0, 2).toUpperCase(),
    fullName: role.replace(/_/g, " "),
    value: count,
    color: ROLE_COLORS[role] || "#adb5bd"
  }));
  const totalUsers = stats?.totalUsers || 0;
  const activeUsers = stats?.activeUsers || 0;
  const inactiveUsers = (stats?.inactiveUsers || 0) + (stats?.suspendedUsers || 0);
  const pendingUsers = stats?.pendingUsers || 0;
  const activePercent = totalUsers > 0 ? Math.round(activeUsers / totalUsers * 100) : 0;
  const inactivePercent = totalUsers > 0 ? Math.round(inactiveUsers / totalUsers * 100) : 0;
  const pendingPercent = totalUsers > 0 ? Math.round(pendingUsers / totalUsers * 100) : 0;
  return <div>
      {
    /* Header with Greeting & Clock */
  }
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">{GREETING()}, Admin 👋</h3>
          <p className="text-muted mb-0">Here's what's happening on your platform today.</p>
        </div>
        <div className="text-md-end mt-2 mt-md-0">
          <div className="d-inline-flex align-items-center gap-2 bg-white px-3 py-2 rounded-pill shadow-sm border">
            <div className="bg-success rounded-circle" style={{ width: 8, height: 8, animation: "pulse-dot 2s infinite" }} />
            <span className="fw-bold text-dark" style={{ fontVariantNumeric: "tabular-nums" }}>
              {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <span className="text-muted small ms-1">
              {currentTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {
    /* KPI Cards */
  }
      <Row className="g-3 mb-3">
        <Col xs={12} sm={6} md={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100 overflow-hidden" style={{ borderTop: "3px solid #0d6efd" }}>
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <span className="small text-uppercase fw-bold text-muted">Total Users</span>
                <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-3"><FaUsers size={14} /></div>
              </div>
              <h3 className="fw-bold text-dark mb-1" style={{ fontSize: "1.75rem" }}>
                {isLoading ? <Spinner animation="border" size="sm" /> : totalUsers}
              </h3>
              <div className="d-flex align-items-center gap-1 mt-2">
                <FaArrowUp className="text-success" size={12} />
                <span className="text-success small fw-bold">{activePercent}%</span>
                <span className="text-muted small">active rate</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100 overflow-hidden" style={{ borderTop: "3px solid #198754" }}>
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <span className="small text-uppercase fw-bold text-muted">Active Users</span>
                <div className="bg-success bg-opacity-10 text-success p-2 rounded-3"><FaChartLine size={14} /></div>
              </div>
             <h3 className="fw-bold text-dark mb-1" style={{ fontSize: "1.75rem" }}>
                {isLoading ? <Spinner animation="border" size="sm" /> : activeUsers}
              </h3>
              <ProgressBar now={activePercent} variant="success" className="mt-2" style={{ height: 6, borderRadius: 4 }} />
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100 overflow-hidden" style={{ borderTop: "3px solid #ffc107" }}>
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <span className="small text-uppercase fw-bold text-muted">Inactive / Suspended</span>
                <div className="bg-warning bg-opacity-10 text-warning p-2 rounded-3"><FaBell size={14} /></div>
              </div>
              <h3 className="fw-bold text-dark mb-1" style={{ fontSize: "1.75rem" }}>
                {isLoading ? <Spinner animation="border" size="sm" /> : inactiveUsers}
              </h3>
              <div className="d-flex align-items-center gap-1 mt-1 mb-2">
                <span className="text-warning small fw-bold">{inactivePercent}%</span>
                <span className="text-muted small">of total users</span>
              </div>
              <ProgressBar now={inactivePercent} variant="warning" style={{ height: 6, borderRadius: 4 }} />
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100 overflow-hidden" style={{ borderTop: "3px solid #dc3545" }}>
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <span className="small text-uppercase fw-bold text-muted">Pending Users</span>
                <div className="bg-danger bg-opacity-10 text-danger p-2 rounded-3"><FaShieldAlt size={14} /></div>
              </div>
              <h3 className="fw-bold text-dark mb-1" style={{ fontSize: "1.75rem" }}>
                {isLoading ? <Spinner animation="border" size="sm" /> : pendingUsers}
              </h3>
              <div className="d-flex align-items-center gap-1 mt-1 mb-2">
                <span className="text-danger small fw-bold">{pendingPercent}%</span>
                <span className="text-muted small">awaiting approval</span>
              </div>
              <ProgressBar now={pendingPercent} variant="danger" style={{ height: 6, borderRadius: 4 }} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {
    /* Main Content Row: Role Chart + Quick Actions + Role Breakdown Details */
  }
      <Row className="g-4 mb-4">
        {/* Role Breakdown Chart */}
        <Col lg={5}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4 d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0">User Roles Distribution</h5>
                <Badge bg="primary" pill className="bg-opacity-10 text-primary border border-primary-subtle px-3 py-2">{totalUsers} Total</Badge>
              </div>
              
              {/* Changed to flex-grow-1 and minimum height so chart dynamically fills available empty space */}
              <div className="flex-grow-1 w-100" style={{ minHeight: "280px" }}>
                {isLoading ? (
                  <div className="h-100 d-flex justify-content-center align-items-center"><Spinner animation="border" /></div>
                ) : rolesChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={rolesChartData} 
                      margin={{ top: 10, right: 10, bottom: 0, left: -25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        // Text is horizontal now, font made slightly bolder to stand out
                        tick={{ fontSize: '0.80rem', fill: '#6c757d', fontWeight: 'bold' }}
                        interval={0}
                        padding={{ left: 15, right: 15 }} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: '0.75rem', fill: '#6c757d' }} 
                        allowDecimals={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                        contentStyle={{
                          borderRadius: "10px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
                          backgroundColor: "#FFFFFF",
                          fontSize: "0.8rem"
                        }}
                        formatter={(value) => [`${value} users`, 'Count']}
                        // Map the tooltip title back to the full length role name
                        labelFormatter={(label, payload) => payload && payload.length ? payload[0].payload.fullName : label}
                      />
                      <Bar 
                        dataKey="value" 
                        radius={[4, 4, 0, 0]} 
                        maxBarSize={55}
                        isAnimationActive={false} 
                      >
                        {rolesChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color} 
                            className="staggered-bar"
                            style={{ animationDelay: `${index * 150}ms` }}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-100 d-flex justify-content-center align-items-center text-muted">No role data available</div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Quick Actions + System Services */}
        <Col lg={7}>
          <Row className="g-4">
            {/* Quick Actions */}
            <Col xs={12}>
              <Card className="border-0 shadow-sm rounded-4">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-3">Quick Actions</h5>
                  <Row className="g-3">
                    {[
                      { label: "Manage Users", icon: <FaUsers size={20} />, color: "primary", path: "/admin/iam/users" },
                      { label: "Audit Logs", icon: <FaClipboardList size={20} />, color: "info", path: "/admin/iam/audit-logs" },
                      { label: "System Reports", icon: <FaCalendarCheck size={20} />, color: "success", path: "/reports/dashboard" }
                    ].map((action, idx) => (
                      <Col sm={6} md={4} key={idx}>
                        <Button
                          variant="light"
                          className="w-100 p-2 rounded-3 d-flex flex-column align-items-center gap-1 border shadow-sm hover-shadow transition-all"
                          style={{ minHeight: "72px" }}
                          onClick={() => navigate(action.path)}
                        >
                          <div className={`bg-${action.color} bg-opacity-10 text-${action.color} p-1 rounded-2`}>
                            {action.icon}
                          </div>
                          <span className="fw-bold text-dark" style={{ fontSize: "0.75rem" }}>{action.label}</span>
                        </Button>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            {/* Platform Services Status */}
            <Col xs={12}>
              <Card className="border-0 shadow-sm rounded-4">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-3">Platform Services</h5>
                  <div className="d-flex flex-column gap-3">
                    {[
                      { name: "Authentication Server", status: "Operational", uptime: "99.98%", color: "success" },
                      { name: "Database Cluster", status: "Operational", uptime: "99.95%", color: "success" },
                      { name: "File Storage (S3)", status: "Operational", uptime: "99.99%", color: "success" },
                      { name: "Notification Service", status: "Operational", uptime: "99.90%", color: "success" }
                    ].map((service, idx) => (
                      <div key={idx} className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3 border">
                        <div className="d-flex align-items-center gap-3">
                          <div className={`bg-${service.color} rounded-circle`} style={{ width: 10, height: 10, animation: "pulse-dot 2s infinite" }} />
                          <span className="fw-bold text-dark small">{service.name}</span>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                          <span className="text-muted small">{service.uptime} uptime</span>
                          <Badge bg={service.color} pill className="bg-opacity-10 border px-2 py-1">
                            <span className={`text-${service.color} small fw-bold`}>{service.status}</span>
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {
    /* Inline animation styles */
  }
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .hover-shadow:hover { box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important; transform: translateY(-2px); }
        .transition-all { transition: all 0.25s ease; }
      `}</style>
    </div>;
};
export {
  AdminDashboard
};
