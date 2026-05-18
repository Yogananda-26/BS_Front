import { useState, useEffect } from "react";
import { AppButton } from "../../components/common/AppButton";
import { Row, Col, Card, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  FaExclamationTriangle, FaClipboardCheck, FaTasks, FaSkullCrossbones,
  FaPlus, FaCalendarPlus, FaBell, FaSyncAlt, FaCheckCircle
} from "react-icons/fa";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import safetyService from "../../services/safetyService";

const SEVERITY_COLORS = { LOW: "#27ae60", MEDIUM: "#f39c12", HIGH: "#e74c3c", CRITICAL: "#c0392b" };
const MONTH_ORDER = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const SafetyDashboard = () => {
  const [kpi, setKpi] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [trendData, setTrendData] = useState([]);
  const [complianceData, setComplianceData] = useState([]);
  const [currentCompliance, setCurrentCompliance] = useState(null);
  const navigate = useNavigate();
  const [pieData, setPieData] = useState([
    { name: "Low", value: 0, color: "#27ae60" },
    { name: "Medium", value: 0, color: "#f39c12" },
    { name: "High", value: 0, color: "#e74c3c" },
    { name: "Critical", value: 0, color: "#c0392b" }
  ]);

  const loadData = async () => {
    const [kpiData, incidentsData, inspectionsData] = await Promise.all([
      safetyService.getKpiSummary().catch(() => null),
      safetyService.getIncidents({ size: 500 }).catch(() => ({ content: [] })),
      safetyService.getInspections({ size: 500 }).catch(() => ({ content: [] }))
    ]);

    setKpi(kpiData);

    /* Normalise: service returns { content: [...] } or an array */
    const incidents   = Array.isArray(incidentsData)   ? incidentsData   : (incidentsData?.content   || []);
    const inspections = Array.isArray(inspectionsData) ? inspectionsData : (inspectionsData?.content || []);

    /* ── Severity pie ── */
    const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    incidents.forEach((i) => { if (counts[i.severity] !== undefined) counts[i.severity]++; });
    setPieData([
      { name: "Low",      value: counts.LOW,      color: "#27ae60" },
      { name: "Medium",   value: counts.MEDIUM,   color: "#f39c12" },
      { name: "High",     value: counts.HIGH,     color: "#e74c3c" },
      { name: "Critical", value: counts.CRITICAL, color: "#c0392b" }
    ]);

    /* ── Monthly incident trend ── */
    const trendMap = {};
    incidents.forEach((i) => {
      /* try every known date field name the backend might use */
      const raw = i.date || i.reportedAt || i.incidentDate || i.createdAt || i.updatedAt;
      if (!raw) return;
      const dt = new Date(raw);
      if (isNaN(dt.getTime())) return;
      const month = MONTH_ORDER[dt.getMonth()];
      if (!trendMap[month]) trendMap[month] = { month, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
      if (trendMap[month][i.severity] !== undefined) trendMap[month][i.severity]++;
    });
    const sorted = Object.values(trendMap).sort(
      (a, b) => MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month)
    );
    setTrendData(sorted);

    /* ── Inspection compliance ── */
    const compMap = {};
    inspections.forEach((i) => {
      const raw = i.date || i.scheduledDate || i.inspectionDate || i.createdAt || i.updatedAt;
      if (!raw) return;
      const dt = new Date(raw);
      if (isNaN(dt.getTime())) return;
      const month = MONTH_ORDER[dt.getMonth()];
      if (!compMap[month]) compMap[month] = { month, total: 0, completed: 0 };
      compMap[month].total++;
      if (i.status === "COMPLETED") compMap[month].completed++;
    });
    const compSorted = Object.values(compMap)
      .sort((a, b) => MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month))
      .map((m) => ({ month: m.month, rate: m.total > 0 ? Math.round(m.completed / m.total * 100) : 0 }));
    setComplianceData(compSorted);

    /* ── All-time compliance rate ── */
    if (inspections.length > 0) {
      const completed = inspections.filter((i) => i.status === "COMPLETED").length;
      setCurrentCompliance(Math.round(completed / inspections.length * 100));
    } else {
      setCurrentCompliance(0);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    const result = await safetyService.syncTasks();
    setSyncMsg(result.message);
    setSyncing(false);
    setTimeout(() => setSyncMsg(""), 4000);
  };

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
          <h3 className="fw-bold text-dark mb-1">Safety Overview</h3>
          <p className="text-muted mb-0">Monitor incidents, inspections, and task compliance across all sites.</p>
        </div>
        {syncMsg && (
          <div className="alert alert-success d-flex align-items-center gap-2 mb-0 py-2 px-3 rounded-3">
            <FaCheckCircle /> {syncMsg}
          </div>
        )}
      </div>

      <Row className="g-3 mb-4">
        <Col xs={6} md={3}><KpiCard label="Open Incidents" value={kpi?.openIncidents} icon={FaExclamationTriangle} color="danger" onClick={() => navigate("/safety/incidents")} /></Col>
        <Col xs={6} md={3}><KpiCard label="Pending Inspections" value={kpi?.pendingInspections} icon={FaClipboardCheck} color="primary" onClick={() => navigate("/safety/inspections")} /></Col>
        <Col xs={6} md={3}><KpiCard label="Assigned Tasks" value={kpi?.assignedTasks} icon={FaTasks} color="warning" onClick={() => navigate("/safety/tasks")} /></Col>
        <Col xs={6} md={3}><KpiCard label="High Severity" value={kpi?.highSeverityIncidents} icon={FaSkullCrossbones} color="danger" /></Col>
      </Row>

      <Row className="g-3 mb-4">
        <Col xs={12}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4">
              <h6 className="fw-bold text-muted text-uppercase mb-3">Quick Actions</h6>
              <div className="d-flex flex-wrap gap-3">
                <AppButton variant="danger" className="rounded-3 d-flex align-items-center gap-2" onClick={() => navigate("/safety/incidents")}>
                  <FaPlus /> Report Incident
                </AppButton>
                <AppButton variant="primary" className="rounded-3 d-flex align-items-center gap-2" onClick={() => navigate("/safety/inspections")}>
                  <FaCalendarPlus /> Schedule Inspection
                </AppButton>
                <AppButton variant="warning" className="rounded-3 d-flex align-items-center gap-2" onClick={() => navigate("/safety/tasks")}>
                  <FaTasks /> View My Tasks
                </AppButton>
                <AppButton variant="outline-secondary" className="rounded-3 d-flex align-items-center gap-2" onClick={handleSync} disabled={syncing}>
                  <FaSyncAlt className={syncing ? "fa-spin" : ""} /> {syncing ? "Syncing..." : "Sync Tasks"}
                </AppButton>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col xs={12} lg={7}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-4">Incident Trends by Severity</h6>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    {Object.entries(SEVERITY_COLORS).map(([key, color]) => (
                      <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={{ r: 3 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-5 text-muted small">No incident data available yet.</div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={5}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-4">Severity Distribution</h6>
              {pieData.some((d) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-5 text-muted small">No incidents recorded.</div>
              )}
              <div className="d-flex flex-wrap justify-content-center gap-3 mt-2">
                {pieData.map((d) => (
                  <div key={d.name} className="d-flex align-items-center gap-1 small">
                    <div className="rounded-circle" style={{ width: 10, height: 10, background: d.color }} />
                    <span>{d.name}</span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={6}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h6 className="fw-bold mb-0">Inspection Compliance Rate</h6>
                <div className="text-center">
                  <div className={`fs-2 fw-bold text-${currentCompliance === null ? "muted" : currentCompliance >= 80 ? "success" : currentCompliance >= 60 ? "warning" : "danger"}`}>
                    {currentCompliance === null ? "—" : `${currentCompliance}%`}
                  </div>
                  <div className="small text-muted">All Time</div>
                </div>
              </div>
              {complianceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={complianceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="rate" fill="#27ae60" radius={[4, 4, 0, 0]} name="Compliance %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-4 text-muted small">No inspection data available yet.</div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={6}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0"><FaBell className="me-2 text-warning" />Recent Notifications</h6>
              </div>
              <NotificationsList />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const NotificationsList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        /* primary: dedicated notifications endpoint */
        let data = await safetyService.getNotifications().catch(() => []);
        data = Array.isArray(data) ? data : data?.content || [];

        /* fallback: if empty, synthesise from recent tasks */
        if (data.length === 0) {
          const tasks = await safetyService.getTasks().catch(() => []);
          data = tasks.slice(0, 5).map((t) => ({
            notificationId: t.assignedTaskId || t.id,
            type:    "TASK_ASSIGNED",
            message: `Task assigned: ${(t.taskDescription || t.description || "New safety task").slice(0, 80)}`,
            createdAt: t.assignedAt || t.syncedAt || new Date().toISOString(),
            read:    t.status === "SUBMITTED"
          }));
        }
        setNotifications(data);
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const markRead = (id) => {
    safetyService.markRead(id).catch(() => {});
    setNotifications((prev) =>
      prev.map((x) => (x.notificationId === id || x.id === id ? { ...x, read: true } : x))
    );
  };

  const markAllRead = () => {
    safetyService.markAllRead().catch(() => {});
    setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
  };

  const TYPE_ICON = {
    TASK_ASSIGNED:       "📋",
    INCIDENT_ASSIGNED:   "⚠️",
    INSPECTION_REMINDER: "🔍",
    TASK_APPROVED:       "✅",
    TASK_REJECTED:       "❌",
    GENERAL:             "🔔"
  };

  if (loading) {
    return <div className="text-center py-3"><Spinner size="sm" /></div>;
  }

  return (
    <div className="d-flex flex-column gap-2">
      {notifications.some((n) => !n.read) && (
        <div className="text-end mb-1">
          <AppButton variant="link" size="sm" className="p-0 text-muted text-decoration-none small" onClick={markAllRead}>
            Mark all read
          </AppButton>
        </div>
      )}
      {notifications.length === 0 && (
        <div className="text-muted small text-center py-3">No notifications yet.</div>
      )}
      {notifications.slice(0, 5).map((n) => {
        const nId = n.notificationId || n.id;
        const ts  = n.createdAt || n.timestamp;
        return (
          <div
            key={nId}
            className={`p-3 rounded-3 d-flex align-items-start gap-3 ${
              n.read ? "bg-light" : "bg-primary bg-opacity-10 border border-primary border-opacity-25"
            }`}
            style={{ cursor: "pointer" }}
            onClick={() => markRead(nId)}
          >
            <span style={{ fontSize: 18 }}>{TYPE_ICON[n.type] || TYPE_ICON[n.eventType] || "🔔"}</span>
            <div className="flex-grow-1 overflow-hidden">
              <p className={`mb-1 small text-truncate ${n.read ? "text-muted" : "fw-semibold"}`}>
                {n.message}
              </p>
              <p className="mb-0 text-muted" style={{ fontSize: "0.72rem" }}>
                {ts ? new Date(ts).toLocaleString() : "—"}
              </p>
            </div>
            {!n.read && (
              <div className="bg-primary rounded-circle flex-shrink-0" style={{ width: 8, height: 8, marginTop: 6 }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export { SafetyDashboard };
