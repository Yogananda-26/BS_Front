import { useState, useEffect } from "react";
import { AppTable } from "../../components/common/AppTable";
import { Row, Col, Card, ProgressBar, Form } from "react-bootstrap";
import { FaBoxes, FaUsers, FaTools, FaClock, FaFilter } from "react-icons/fa";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import analyticsService from "../../services/analyticsService";
import projectService from "../../services/projectService";
import { ChartCard } from "../../components/common/ChartCard";

const ResourceAnalytics = () => {
  const [utilization, setUtilization] = useState(null);
  const [allocation, setAllocation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");

  useEffect(() => {
    projectService.getProjects().then((p) => setProjects(Array.isArray(p) ? p : [])).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const pid = selectedProject || undefined;
        const [utilRes, allocRes] = await Promise.all([
          analyticsService.getResourceUtilization(pid),
          analyticsService.getLaborAllocation(pid)
        ]);
        setUtilization(utilRes);
        setAllocation(Array.isArray(allocRes) ? allocRes : allocRes?.content || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedProject]);

  const getGaugeColor = (rate) => {
    if (rate >= 0.8) return "var(--bs-success)";
    if (rate >= 0.5) return "var(--bs-warning)";
    return "var(--bs-danger)";
  };
  const getProgressVariant = (rate) => {
    if (rate >= 0.8) return "success";
    if (rate >= 0.5) return "warning";
    return "danger";
  };
  const gaugeData = utilization ? [
    { name: "Used", value: utilization.utilizationRate },
    { name: "Idle", value: 1 - utilization.utilizationRate }
  ] : [];

  return (
    <div className="p-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Resource &amp; Workforce Analytics</h3>
          <p className="text-muted mb-0">Track labor allocation, equipment uptime, and overall utilization.</p>
        </div>
        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          <FaFilter className="text-muted" />
          <Form.Select
            size="sm"
            style={{ minWidth: 200 }}
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="rounded-3"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.projectId} value={p.projectId}>{p.projectName}</option>
            ))}
          </Form.Select>
        </div>
      </div>

      {utilization && (
        <Row className="g-4 mb-4">
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm rounded-4 h-100 bg-light">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-circle"><FaClock size={20} /></div>
                  <span className="small text-muted fw-bold text-uppercase">Used Hours</span>
                </div>
                <h2 className="fw-bold text-dark mb-0">{(utilization.usedHours || 0).toLocaleString()}</h2>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm rounded-4 h-100 bg-light">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="bg-secondary bg-opacity-10 text-secondary p-2 rounded-circle"><FaClock size={20} /></div>
                  <span className="small text-muted fw-bold text-uppercase">Idle Hours</span>
                </div>
                <h2 className="fw-bold text-muted mb-0">{(utilization.idleHours || 0).toLocaleString()}</h2>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm rounded-4 h-100 bg-light">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="bg-info bg-opacity-10 text-info p-2 rounded-circle"><FaUsers size={20} /></div>
                  <span className="small text-muted fw-bold text-uppercase">Total Labor</span>
                </div>
                <h2 className="fw-bold text-dark mb-0">{utilization.totalLabors ?? 0} <span className="fs-6 fw-normal text-muted">personnel</span></h2>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm rounded-4 h-100 bg-light border-start border-success border-4">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="bg-success bg-opacity-10 text-success p-2 rounded-circle"><FaTools size={20} /></div>
                  <span className="small text-muted fw-bold text-uppercase">Eqp Uptime</span>
                </div>
                <h2 className="fw-bold text-success mb-0">{utilization.equipmentUptimePercent ?? 0}%</h2>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Row className="g-4 mb-4">
        <Col xs={12} lg={4}>
          <ChartCard title="Overall Labor Utilization" loading={loading} height={350}>
            {utilization ? (
              <div className="position-relative w-100 h-100 d-flex flex-column align-items-center justify-content-center">
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie data={gaugeData} cx="50%" cy="100%" startAngle={180} endAngle={0}
                      innerRadius={80} outerRadius={110} paddingAngle={0} dataKey="value" stroke="none">
                      <Cell fill={getGaugeColor(utilization.utilizationRate || 0)} />
                      <Cell fill="#f1f3f5" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="position-absolute" style={{ bottom: "20%", textAlign: "center" }}>
                  <h1 className="display-4 fw-bold mb-0" style={{ color: getGaugeColor(utilization.utilizationRate || 0) }}>
                    {((utilization.utilizationRate || 0) * 100).toFixed(0)}%
                  </h1>
                  <span className="text-muted small fw-bold text-uppercase">Utilization Rate</span>
                </div>
              </div>
            ) : (
              <div className="d-flex align-items-center justify-content-center h-100 text-muted small">No data available.</div>
            )}
          </ChartCard>
        </Col>

        <Col xs={12} lg={8}>
          <ChartCard title="Labor Allocation vs Available by Site" loading={loading} height={350}>
            {allocation.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={allocation} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="site" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} cursor={{ fill: "rgba(0,0,0,0.02)" }} />
                  <Legend />
                  <Bar dataKey="allocatedHours" name="Allocated Hours" fill="var(--bs-primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="availableHours" name="Available Hours" fill="#ced4da" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="d-flex align-items-center justify-content-center h-100 text-muted small">
                No allocation data{selectedProject ? " for this project" : ""}.
              </div>
            )}
          </ChartCard>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm rounded-4">
        <Card.Header className="bg-white border-bottom p-4">
          <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
            <FaBoxes className="text-primary" /> Allocation Breakdown Table
          </h5>
        </Card.Header>
        <AppTable
          columns={["Site / Project", "Allocated Hours", "Available Hours", "Utilization %", "Headcount"]}
          loading={loading}
          loadingText="Loading allocation data..."
          isEmpty={allocation.length === 0}
          emptyText={selectedProject ? "No allocation data for this project." : "No allocation data available."}
        >
          {allocation.map((item, idx) => {
            const utilPercent = item.availableHours ? item.allocatedHours / item.availableHours * 100 : 0;
            return (
              <tr key={idx}>
                <td className="py-3 px-4 fw-bold text-dark">{item.site}</td>
                <td className="py-3 px-4 text-center font-monospace">{item.allocatedHours}</td>
                <td className="py-3 px-4 text-center font-monospace text-muted">{item.availableHours}</td>
                <td className="py-3 px-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="small fw-bold">{utilPercent.toFixed(1)}%</span>
                  </div>
                  <ProgressBar variant={getProgressVariant(utilPercent / 100)} now={utilPercent} style={{ height: "6px" }} />
                </td>
                <td className="py-3 px-4 text-center fw-semibold">
                  <span className="badge bg-secondary bg-opacity-10 text-dark border border-secondary border-opacity-25 px-2 py-1">
                    <FaUsers className="me-1 opacity-50" /> {item.numberOfLabors}
                  </span>
                </td>
              </tr>
            );
          })}
        </AppTable>
      </Card>
    </div>
  );
};

export { ResourceAnalytics };
