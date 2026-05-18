import { useState, useEffect } from "react";
import { AppButton } from "../../components/common/AppButton";
import { Row, Col, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaFileSignature, FaExclamationTriangle, FaTasks, FaTruckLoading, FaPlus } from "react-icons/fa";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { siteOpsService } from "../../services/siteOpsService";
import { useAuth } from "../../context/AuthContext";

const SiteOpsDashboard = () => {
  const [kpi, setKpi] = useState(null);
  const [progressData, setProgressData] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      if (!user?.userId) return;
      try {
        const today = new Date();
        const from = new Date(today);
        from.setDate(today.getDate() - 6);
        const fromStr = from.toISOString().split("T")[0];
        const toStr   = today.toISOString().split("T")[0];

        const last7Dates = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(from);
          d.setDate(from.getDate() + i);
          return d.toISOString().split("T")[0];
        });

        const [kpiData, tasksData] = await Promise.all([
          siteOpsService.getKpi(user.userId),
          siteOpsService.getTasks().catch(() => [])
        ]);

        /* ── Correct pending tasks count from actual tasks list ── */
        const tasks = Array.isArray(tasksData) ? tasksData : tasksData?.content || [];
        const pendingCount = tasks.filter((t) => t.status === "PENDING").length;
        setKpi({ ...kpiData, pendingTasks: pendingCount || kpiData?.pendingTasks || 0 });

        /* ── Weekly activity trend from site logs ── */
        const seen = new Set();
        const projectIds = tasks
          .filter((t) => t.projectId && !seen.has(t.projectId) && seen.add(t.projectId))
          .map((t) => t.projectId);

        const logsResults = await Promise.all(
          projectIds.map((pid) =>
            siteOpsService.getSiteLogs(pid, fromStr, toStr).catch(() => [])
          )
        );
        const logs = logsResults.flat();

        const dayCountMap = {};
        last7Dates.forEach((date) => {
          const label = new Date(date + "T12:00:00").toLocaleString("en-US", { weekday: "short" });
          dayCountMap[date] = { day: label, activity: 0 };
        });
        logs.forEach((log) => {
          const raw = log.logDate || log.date || log.createdAt || log.updatedAt;
          if (!raw) return;
          const dateStr = (typeof raw === "string" && raw.includes("T"))
            ? raw.split("T")[0]
            : String(raw).slice(0, 10);
          if (dayCountMap[dateStr]) dayCountMap[dateStr].activity++;
        });

        setProgressData(last7Dates.map((d) => dayCountMap[d]));
      } catch (e) {
        console.error("Dashboard load failed", e);
      }
    };
    loadData();
  }, [user?.userId]);

  const KpiCard = ({ label, value, icon: Icon, color, onClick }) => (
    <Card className="border-0 shadow-sm rounded-4 h-100" style={{ cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
      <Card.Body className="p-4 d-flex align-items-center justify-content-between">
        <div>
          <p className="small text-muted text-uppercase fw-bold mb-1">{label}</p>
          <h2 className={`fw-bold text-${color} mb-0`}>{value ?? "..."}</h2>
        </div>
        <div className={`bg-${color} bg-opacity-10 text-${color} p-3 rounded-circle`}>
          <Icon size={24} />
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <div className="p-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Site Operations Portal</h3>
          <p className="text-muted mb-0">Manage daily logs, track site issues, and verify deliveries.</p>
        </div>
        <AppButton
          variant="primary"
          className="rounded-3 d-flex align-items-center gap-2"
          style={{ backgroundColor: "#e67e22", borderColor: "#e67e22" }}
          onClick={() => navigate("/siteops/sitelogs")}
        >
          <FaPlus /> Daily Log
        </AppButton>
      </div>

      <Row className="g-3 mb-4">
        <Col xs={6} md={3}><KpiCard label="Today's Logs" value={kpi?.todaysLogs} icon={FaFileSignature} color="warning" onClick={() => navigate("/siteops/sitelogs")} /></Col>
        <Col xs={6} md={3}><KpiCard label="Open Issues" value={kpi?.openIssues} icon={FaExclamationTriangle} color="danger" onClick={() => navigate("/siteops/issues")} /></Col>
        <Col xs={6} md={3}><KpiCard label="Pending Tasks" value={kpi?.pendingTasks} icon={FaTasks} color="primary" onClick={() => navigate("/siteops/tasks")} /></Col>
        <Col xs={6} md={3}><KpiCard label="Pending Deliveries" value={kpi?.pendingDeliveries} icon={FaTruckLoading} color="info" onClick={() => navigate("/siteops/deliveries")} /></Col>
      </Row>

      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Body className="p-4">
          <h6 className="fw-bold text-muted text-uppercase mb-3">Quick Actions</h6>
          <div className="d-flex flex-wrap gap-3">
            <AppButton variant="outline-warning" className="rounded-3 d-flex align-items-center gap-2" onClick={() => navigate("/siteops/sitelogs")}>
              <FaFileSignature /> Create Site Log
            </AppButton>
            <AppButton variant="outline-danger" className="rounded-3 d-flex align-items-center gap-2" onClick={() => navigate("/siteops/issues")}>
              <FaExclamationTriangle /> Report New Issue
            </AppButton>
            <AppButton variant="outline-primary" className="rounded-3 d-flex align-items-center gap-2" onClick={() => navigate("/siteops/tasks")}>
              <FaTasks /> View My Tasks
            </AppButton>
            <AppButton variant="outline-info" className="rounded-3 d-flex align-items-center gap-2" onClick={() => navigate("/siteops/deliveries")}>
              <FaTruckLoading /> Confirm Deliveries
            </AppButton>
          </div>
        </Card.Body>
      </Card>

      <Row className="g-4">
        <Col xs={12}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-4">Weekly Activity Trend</h6>
              {progressData.length > 0 && progressData.some((d) => d.activity > 0) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip formatter={(v) => [v, "Activity"]} />
                    <Line type="monotone" dataKey="activity" stroke="#e67e22" strokeWidth={3} dot={{ r: 5 }} name="Activity" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-5 text-muted small">No activity data for the last 7 days.</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export { SiteOpsDashboard };
