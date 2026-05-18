import { useEffect, useState } from "react";
import { SITE_LOG_SUBMITTED_EVENT } from "../../utils/siteLogSync";
import { Row, Col, Spinner } from "react-bootstrap";
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
import { StatWidget } from "../../components/dashboard/StatWidget";
import { ChartCard } from "../../components/common/ChartCard";
import analyticsService from "../../services/analyticsService";
import projectService from "../../services/projectService";
import { notificationService } from "../../services/notificationService";
import { useAuth } from "../../context/AuthContext";

const PMDashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [health, setHealth] = useState([]);
  const [safety, setSafety] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const [sum, trendData, healthData, safetyData, apprs] = await Promise.all([
          analyticsService.getDashboardSummary().catch(() => null),
          analyticsService.getProjectProgressTrends().catch(() => []),
          analyticsService.getAllProjectHealth().catch(() => []),
          analyticsService.getSafetyComplianceBreakdown().catch(() => []),
          projectService.getPendingApprovals().catch(() => [])
        ]);
        // notifications fetched only to keep the bell badge fresh; result unused here
        notificationService.getNotifications(user, 0, 50).catch(() => []);

        if (cancelled) return;
        setSummary(sum);
        setTrends(Array.isArray(trendData) ? trendData : []);
        setHealth(Array.isArray(healthData) ? healthData : []);
        setSafety(Array.isArray(safetyData) ? safetyData : []);
        setApprovals(Array.isArray(apprs) ? apprs : []);
      } catch (err) {
        console.error("Failed to load PM Dashboard data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadData();

    const onSiteLogSubmitted = () => loadData();
    window.addEventListener(SITE_LOG_SUBMITTED_EVENT, onSiteLogSubmitted);
    return () => {
      cancelled = true;
      window.removeEventListener(SITE_LOG_SUBMITTED_EVENT, onSiteLogSubmitted);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div>
      {/* KPI row — unchanged */}
      <Row className="g-4 mb-4">
        <Col xs={12} md={4}>
          <StatWidget
            title="Active Projects"
            value={summary?.activeProjects?.toString() || "0"}
            icon="FaBuilding"
            subtitle={<><span className="text-success fw-bold">+0</span> from last month</>}
            borderLeftColor="var(--bs-primary)"
          />
        </Col>
        <Col xs={6} md={4}>
          <StatWidget
            title="Pending"
            value={summary?.pendingItems?.toString() || approvals.length.toString()}
            icon="FaClipboardList"
            subtitle={<span className="fst-italic">Awaiting signature</span>}
            borderLeftColor="var(--bs-warning)"
          />
        </Col>
        <Col xs={6} md={4}>
          <StatWidget
            title="Safety"
            value={`${summary?.safetyComplianceRate || 0}%`}
            icon="FaHardHat"
            iconColor={(summary?.safetyComplianceRate || 0) > 90 ? "text-success" : "text-warning"}
            subtitle={
              <>
                <span className={(summary?.safetyComplianceRate || 0) > 90 ? "text-success" : "text-warning"}>●</span>{" "}
                {(summary?.safetyComplianceRate || 0) > 90 ? "All systems clear" : "Check reports"}
              </>
            }
            borderLeftColor="var(--bs-success)"
          />
        </Col>
      </Row>

      {/* Charts row 1: progress line + safety pie */}
      <Row className="g-4 mb-4">
        <Col lg={5}>
          <ChartCard title="Overall Project Progress Over Time" height={350}>
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

        <Col lg={7}>
          <ChartCard title="Safety Compliance Breakdown" height={350}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={safety}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="category"
                  stroke="none"
                >
                  {safety.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  formatter={(value) => [`${value}%`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="d-flex flex-wrap justify-content-center gap-3 mt-3">
              {safety.map((item, idx) => (
                <div key={idx} className="d-flex align-items-center gap-2 small">
                  <div style={{ width: "12px", height: "12px", backgroundColor: item.color, borderRadius: "2px" }} />
                  <span className="text-muted">{item.category}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </Col>
      </Row>

      {/* Charts row 2: budget variance bar chart */}
      <Row className="g-4 mb-4">
        <Col xs={12}>
          <ChartCard title="Budget Variance by Project (USD)" height={350}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={health} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="projectName" axisLine={false} tickLine={false} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(3)}k`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, "Variance"]}
                />
                <Bar dataKey="budgetVariance" radius={[4, 4, 0, 0]}>
                  {health.map((entry, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={(entry.budgetVariance || 0) >= 0 ? "var(--bs-success)" : "var(--bs-danger)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Col>
      </Row>
    </div>
  );
};

export { PMDashboard };