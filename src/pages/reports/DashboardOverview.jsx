import { useEffect, useState } from "react";
import { Row, Col, Card, Form } from "react-bootstrap";
import { FaBuilding, FaMoneyBillWave, FaShieldAlt, FaArrowUp, FaArrowDown, FaFilter } from "react-icons/fa";
import projectService from "../../services/projectService";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from "recharts";
import mockService from "../../services/analyticsService";
import { ChartCard } from "../../components/common/ChartCard";
const DashboardOverview = () => {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [health, setHealth] = useState([]);
  const [safety, setSafety] = useState([]);
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
        const [sumRes, trendRes, healthRes, safetyRes] = await Promise.allSettled([
          mockService.getDashboardSummary(pid),
          mockService.getProjectProgressTrends(pid),
          mockService.getAllProjectHealth(),
          mockService.getSafetyComplianceBreakdown()
        ]);

        const healthData = healthRes.status === "fulfilled" ? (Array.isArray(healthRes.value) ? healthRes.value : []) : [];
        const filteredHealth = pid ? healthData.filter((h) => String(h.projectId) === String(pid)) : healthData;

        // Derive summary from project health data if the dashboard-summary endpoint fails
        const derivedSummary = sumRes.status === "fulfilled" && sumRes.value
          ? sumRes.value
          : {
              activeProjects: filteredHealth.filter((h) => h.status === "IN_PROGRESS" || !h.status || h.status === "ACTIVE").length || filteredHealth.length,
              averageBudgetVariance: filteredHealth.length
                ? Math.round(filteredHealth.reduce((s, h) => s + (h.budgetVariancePercent || h.budgetVariance || 0), 0) / filteredHealth.length)
                : 0,
              safetyComplianceRate: 0,
              resourceUtilizationRate: 0
            };

        setSummary(derivedSummary);
        setTrends(trendRes.status === "fulfilled" ? (trendRes.value || []) : []);
        setHealth(filteredHealth);
        setSafety(safetyRes.status === "fulfilled" ? (safetyRes.value || []) : []);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedProject]);
  const renderKpiCard = (title, value, icon, colorClass, subtext) => <Card className="border-0 shadow-sm rounded-4 h-100">
      <Card.Body className="p-4 d-flex align-items-center justify-content-between">
        <div>
          <p className="text-muted small fw-bold text-uppercase tracking-wider mb-1">{title}</p>
          <h2 className="fw-bold mb-0 text-dark">{value}</h2>
          {subtext && <div className="mt-2 small">{subtext}</div>}
        </div>
        <div className={`p-3 rounded-circle bg-${colorClass} bg-opacity-10 text-${colorClass}`}>
          {icon}
        </div>
      </Card.Body>
    </Card>;
  return <div className="p-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Overview Dashboard</h3>
          <p className="text-muted mb-0">High-level aggregations across all connected modules.</p>
        </div>
        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          <FaFilter className="text-muted" />
          <Form.Select size="sm" style={{ minWidth: 200 }} value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)} className="rounded-3">
            <option value="">All Projects</option>
            {projects.map((p) => <option key={p.projectId} value={p.projectId}>{p.projectName}</option>)}
          </Form.Select>
        </div>
      </div>

      {
    /* KPI Row */
  }
      <Row className="g-4 mb-4">
        <Col xs={12} md={4}>
          {renderKpiCard(
    "Active Projects",
    loading ? "-" : summary?.activeProjects,
    <FaBuilding size={24} />,
    "primary"
  )}
        </Col>
        <Col xs={6} md={4}>
          {renderKpiCard(
    "Avg Budget Variance",
    loading ? "-" : `${summary?.averageBudgetVariance || 0}%`,
    <FaMoneyBillWave size={24} />,
    (summary?.averageBudgetVariance || 0) < 0 ? "danger" : "success",
    <span className={`fw-bold text-${(summary?.averageBudgetVariance || 0) < 0 ? "danger" : "success"}`}>
              {(summary?.averageBudgetVariance || 0) < 0 ? <FaArrowDown className="me-1" /> : <FaArrowUp className="me-1" />}
              vs target
            </span>
  )}
        </Col>
        <Col xs={6} md={4}>
          {renderKpiCard(
    "Safety Compliance",
    loading ? "-" : `${summary?.safetyComplianceRate || 0}%`,
    <FaShieldAlt size={24} />,
    (summary?.safetyComplianceRate || 0) >= 90 ? "success" : "warning"
  )}
        </Col>
      </Row>

      {
    /* Charts Row */
  }
      <Row className="g-4 mb-4">
        <Col xs={12} lg={8}>
          <ChartCard title="Overall Project Progress Over Time" loading={loading} height={350}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                <Tooltip
    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
    formatter={(value) => [`${value}%`, "Completion"]}
  />
                <Line
    type="monotone"
    dataKey="progress"
    stroke="var(--bs-primary)"
    strokeWidth={4}
    dot={{ r: 4, strokeWidth: 2 }}
    activeDot={{ r: 8 }}
  />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </Col>

        <Col xs={12} lg={4}>
          <ChartCard title="Safety Compliance Breakdown" loading={loading} height={350}>
            <div className="d-flex flex-column w-100 h-100">
              <div style={{ flex: "1 1 auto", minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
    data={safety}
    cx="50%"
    cy="50%"
    innerRadius={55}
    outerRadius={85}
    paddingAngle={5}
    dataKey="value"
    nameKey="category"
    stroke="none"
  >
                      {safety.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip
    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
    formatter={(value) => [`${value}%`, ""]}
  />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {
    /* Custom Legend */
  }
              <div className="d-flex flex-wrap justify-content-center gap-3 mt-3 flex-shrink-0">
                {safety.map((item, idx) => <div key={idx} className="d-flex align-items-center gap-2 small">
                    <div style={{ width: "12px", height: "12px", backgroundColor: item.color, borderRadius: "2px" }} />
                    <span className="text-muted">{item.category}</span>
                  </div>)}
              </div>
            </div>
          </ChartCard>
        </Col>

        <Col xs={12} lg={12}>
          <ChartCard title="Budget Variance by Project (USD)" loading={loading} height={300}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={health} margin={{ top: 20, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="projectName" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val / 1e3}k`} />
                <Tooltip
    cursor={{ fill: "#f8f9fa" }}
    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
    formatter={(value) => [`$${value.toLocaleString()}`, "Variance"]}
  />
                <Bar dataKey="budgetVariance" radius={[4, 4, 0, 0]}>
                  {health.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.budgetVariance < 0 ? "var(--bs-danger)" : "var(--bs-success)"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Col>
      </Row>
    </div>;
};
export {
  DashboardOverview
};
