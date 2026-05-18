import { useState, useMemo } from "react";
import { AppTable } from "../../components/common/AppTable";
import { Row, Col, Card, Form, InputGroup, Badge } from "react-bootstrap";
import {
  FaProjectDiagram,
  FaSearch,
  FaRegClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaChartLine
} from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";
const MOCK_PROJECTS = [
  { id: "ALL", name: "All Projects" },
  { id: "PRJ-001", name: "Skyline Residences" },
  { id: "PRJ-002", name: "Tech Hub Campus" },
  { id: "PRJ-003", name: "Riverfront Marina" }
];
const MOCK_PERFORMANCE_DATA = [
  { month: "Jan", Skyline: 1200, TechHub: 800, Riverfront: 0 },
  { month: "Feb", Skyline: 1400, TechHub: 950, Riverfront: 0 },
  { month: "Mar", Skyline: 1100, TechHub: 1200, Riverfront: 300 },
  { month: "Apr", Skyline: 1600, TechHub: 1500, Riverfront: 600 },
  { month: "May", Skyline: 1800, TechHub: 1700, Riverfront: 1100 }
];
const MOCK_USERS = [
  { id: "USR-101", name: "David Chen", role: "SITE_ENGINEER", project: "PRJ-001", hours: 42, tasks: 18, incidents: 0, status: "ACTIVE" },
  { id: "USR-102", name: "Sarah Jenkins", role: "PROJECT_MANAGER", project: "PRJ-001", hours: 45, tasks: 12, incidents: 0, status: "ACTIVE" },
  { id: "USR-103", name: "Marcus Thorne", role: "SITE_ENGINEER", project: "PRJ-002", hours: 38, tasks: 22, incidents: 1, status: "ACTIVE" },
  { id: "USR-104", name: "Elena Rodriguez", role: "SAFETY_OFFICER", project: "PRJ-002", hours: 40, tasks: 15, incidents: 2, status: "ACTIVE" },
  { id: "USR-105", name: "James Wilson", role: "SITE_ENGINEER", project: "PRJ-003", hours: 35, tasks: 8, incidents: 0, status: "INACTIVE" },
  { id: "USR-106", name: "Anita Patel", role: "PROJECT_MANAGER", project: "PRJ-003", hours: 48, tasks: 25, incidents: 0, status: "ACTIVE" },
  { id: "USR-107", name: "Tom Hardy", role: "VENDOR", project: "PRJ-001", hours: 20, tasks: 5, incidents: 0, status: "ACTIVE" }
];
const SystemReports = () => {
  const [selectedProject, setSelectedProject] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const filteredUsers = useMemo(() => {
    return MOCK_USERS.filter((u) => {
      const matchProject = selectedProject === "ALL" || u.project === selectedProject;
      const matchSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.role.toLowerCase().includes(searchQuery.toLowerCase());
      return matchProject && matchSearch;
    });
  }, [selectedProject, searchQuery]);
  const totalHours = filteredUsers.reduce((sum, u) => sum + u.hours, 0);
  const totalTasks = filteredUsers.reduce((sum, u) => sum + u.tasks, 0);
  const totalIncidents = filteredUsers.reduce((sum, u) => sum + u.incidents, 0);
  const roleDistribution = useMemo(() => {
    const dist = {};
    filteredUsers.forEach((u) => {
      dist[u.role] = (dist[u.role] || 0) + u.tasks;
    });
    return Object.keys(dist).map((key) => ({ name: key.replace("_", " "), tasks: dist[key] }));
  }, [filteredUsers]);
  const getRoleColor = (role) => {
    if (role.includes("MANAGER")) return "primary";
    if (role.includes("ENGINEER")) return "info";
    if (role.includes("SAFETY")) return "danger";
    return "secondary";
  };
  return <div className="pb-4">
      {
    /* Top Header / Filter Bar */
  }
      <Card className="border-0 shadow-sm rounded-4 mb-4 bg-white sticky-top" style={{ top: "64px", zIndex: 1010 }}>
        <Card.Body className="p-3 px-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-circle">
              <FaChartLine size={24} />
            </div>
            <div>
              <h4 className="fw-bold mb-0">System Reports &amp; Analytics</h4>
              <p className="text-muted small mb-0 d-none d-md-block">Monitor aggregate performance across all active sites.</p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <InputGroup style={{ minWidth: "250px" }}>
              <InputGroup.Text className="bg-light border-end-0 text-muted"><FaProjectDiagram /></InputGroup.Text>
              <Form.Select
    className="bg-light border-start-0 fw-semibold text-dark"
    value={selectedProject}
    onChange={(e) => setSelectedProject(e.target.value)}
  >
                {MOCK_PROJECTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Form.Select>
            </InputGroup>
          </div>
        </Card.Body>
      </Card>

      {
    /* KPI Widgets */
  }
      <Row className="g-4 mb-4">
        <Col xs={12} md={4}>
          <Card className="border-0 shadow-sm rounded-4 h-100" style={{ borderLeft: "4px solid var(--bs-primary)" }}>
            <Card.Body className="p-4 d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted small fw-bold text-uppercase mb-1">Labor Hours Logged</p>
                <h2 className="fw-bold text-dark mb-0">{totalHours} <span className="fs-6 text-muted fw-normal">hrs this week</span></h2>
              </div>
              <FaRegClock size={32} className="text-primary opacity-50" />
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card className="border-0 shadow-sm rounded-4 h-100" style={{ borderLeft: "4px solid var(--bs-info)" }}>
            <Card.Body className="p-4 d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted small fw-bold text-uppercase mb-1">Tasks Completed</p>
                <h2 className="fw-bold text-dark mb-0">{totalTasks} <span className="fs-6 text-success fw-bold small">+12%</span></h2>
              </div>
              <FaCheckCircle size={32} className="text-info opacity-50" />
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card className="border-0 shadow-sm rounded-4 h-100" style={{ borderLeft: "4px solid var(--bs-danger)" }}>
            <Card.Body className="p-4 d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted small fw-bold text-uppercase mb-1">Reported Incidents</p>
                <h2 className="fw-bold text-danger mb-0">{totalIncidents}</h2>
              </div>
              <FaExclamationTriangle size={32} className="text-danger opacity-50" />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {
    /* Charts Row */
  }
      <Row className="g-4 mb-4">
        <Col xs={12} lg={8}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <h5 className="fw-bold mb-4">Labor Hours Trend (YTD)</h5>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={MOCK_PERFORMANCE_DATA} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <RechartsTooltip
    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}
  />
                    <Legend />
                    <Line type="monotone" dataKey="Skyline" stroke="var(--bs-primary)" strokeWidth={3} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="TechHub" stroke="var(--bs-info)" strokeWidth={3} />
                    <Line type="monotone" dataKey="Riverfront" stroke="var(--bs-success)" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} lg={4}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <h5 className="fw-bold mb-4">Tasks by Role (Current)</h5>
              {roleDistribution.length > 0 ? <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={roleDistribution} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} />
                      <RechartsTooltip cursor={{ fill: "transparent" }} contentStyle={{ borderRadius: "8px" }} />
                      <Bar dataKey="tasks" fill="var(--bs-primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div> : <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                  No task data available for this filter.
                </div>}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {
    /* User Reports Table */
  }
      <Card className="border-0 shadow-sm rounded-4">
        <Card.Header className="bg-white border-bottom p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <h5 className="fw-bold mb-0">Individual Performance Reports</h5>
          <InputGroup style={{ maxWidth: "300px" }}>
            <InputGroup.Text className="bg-light border-end-0 text-muted"><FaSearch /></InputGroup.Text>
            <Form.Control
    placeholder="Search personnel..."
    className="bg-light border-start-0"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
  />
          </InputGroup>
        </Card.Header>
        <AppTable
          columns={['Personnel', 'Role', 'Project Assignment', 'Hours (Wk)', 'Tasks Done', 'Incidents']}
          isEmpty={filteredUsers.length === 0}
          emptyText="No personnel records found for this filter."
        >
          {filteredUsers.map((user, idx) => <tr key={user.id} className={idx % 2 === 0 ? "bg-light bg-opacity-50" : "bg-white"}>
                    <td className="py-3 px-4">
                      <div className="fw-bold text-dark">{user.name}</div>
                      <div className="small text-muted font-monospace">{user.id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge bg={getRoleColor(user.role)} className="bg-opacity-10 text-dark px-2 py-1 rounded border border-secondary border-opacity-10">
                        {user.role.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted small fw-semibold">
                      {MOCK_PROJECTS.find((p) => p.id === user.project)?.name || user.project}
                    </td>
                    <td className="py-3 px-4 text-center fw-bold">{user.hours}</td>
                    <td className="py-3 px-4 text-center text-success fw-bold">{user.tasks}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`badge ${user.incidents > 0 ? "bg-danger" : "bg-success bg-opacity-10 text-success"}`}>
                        {user.incidents}
                      </span>
                    </td>
                  </tr>)}
        </AppTable>
      </Card>
    </div>;
};
export {
  SystemReports
};
