import { useState, useEffect } from "react";
import { Row, Col, Card, Form } from "react-bootstrap";
import { FaShieldAlt, FaCalendarCheck, FaClipboardList, FaCheckCircle, FaFilter } from "react-icons/fa";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import analyticsService from "../../services/analyticsService";
import projectService from "../../services/projectService";
import { ChartCard } from "../../components/common/ChartCard";

const SafetyAnalytics = () => {
  const [trends, setTrends] = useState([]);
  const [summary, setSummary] = useState(null);
  const [overviewComplianceRate, setOverviewComplianceRate] = useState(null);
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
        const [trendRes, sumRes, dashRes] = await Promise.allSettled([
          analyticsService.getSafetyTrends(pid),
          analyticsService.getSafetyInspectionSummary(pid),
          analyticsService.getDashboardSummary(pid)
        ]);
        if (trendRes.status === "fulfilled") setTrends(trendRes.value || []);
        if (sumRes.status === "fulfilled" && sumRes.value) setSummary(sumRes.value);
        if (dashRes.status === "fulfilled" && dashRes.value) {
          setOverviewComplianceRate(dashRes.value.safetyComplianceRate ?? null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedProject]);

  const complianceRate = overviewComplianceRate ?? summary?.complianceRate ?? 0;

  const chartData = trends.reduce((acc, curr) => {
    const existing = acc.find((item) => item.date === curr.date);
    if (existing) {
      existing[curr.severityCategory] = curr.incidentCount;
    } else {
      acc.push({
        date: curr.date,
        LOW: curr.severityCategory === "LOW" ? curr.incidentCount : 0,
        MEDIUM: curr.severityCategory === "MEDIUM" ? curr.incidentCount : 0,
        HIGH: curr.severityCategory === "HIGH" ? curr.incidentCount : 0
      });
    }
    return acc;
  }, []);

  return (
    <div className="p-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Safety &amp; Compliance</h3>
          <p className="text-muted mb-0">Monitor site safety incidents and inspection statuses.</p>
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

      {summary && (
        <Row className="g-4 mb-4">
          <Col xs={6} md={4}>
            <Card className="border-0 shadow-sm rounded-4 h-100 bg-light">
              <Card.Body className="p-4 d-flex align-items-center justify-content-between">
                <div>
                  <p className="small text-muted text-uppercase fw-bold mb-1">Scheduled</p>
                  <h2 className="fw-bold text-dark mb-0">{summary.scheduled ?? 0}</h2>
                </div>
                <FaCalendarCheck size={32} className="text-secondary opacity-25" />
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} md={4}>
            <Card className="border-0 shadow-sm rounded-4 h-100 bg-light border-start border-warning border-4">
              <Card.Body className="p-4 d-flex align-items-center justify-content-between">
                <div>
                  <p className="small text-muted text-uppercase fw-bold mb-1">In Progress</p>
                  <h2 className="fw-bold text-dark mb-0">{summary.inProgress ?? 0}</h2>
                </div>
                <FaClipboardList size={32} className="text-warning opacity-50" />
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} md={4}>
            <Card className="border-0 shadow-sm rounded-4 h-100 bg-light border-start border-success border-4">
              <Card.Body className="p-4 d-flex align-items-center justify-content-between">
                <div>
                  <p className="small text-muted text-uppercase fw-bold mb-1">Completed</p>
                  <h2 className="fw-bold text-dark mb-0">{summary.completed ?? 0}</h2>
                </div>
                <FaCheckCircle size={32} className="text-success opacity-50" />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Row className="g-4 mb-4">
        <Col xs={12} lg={8}>
          <ChartCard title="Incident Trends by Severity" loading={loading} height={350}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                  <Legend />
                  <Line type="monotone" dataKey="LOW" stroke="var(--bs-info)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="MEDIUM" stroke="var(--bs-warning)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="HIGH" stroke="var(--bs-danger)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="d-flex align-items-center justify-content-center h-100 text-muted small">
                No incident trend data{selectedProject ? " for this project" : ""}.
              </div>
            )}
          </ChartCard>
        </Col>

        <Col xs={12} lg={4}>
          <Card className="border-0 shadow-sm rounded-4 h-100 bg-dark text-white">
            <Card.Body className="p-4 d-flex flex-column align-items-center justify-content-center text-center">
              <FaShieldAlt size={48} className={`mb-3 ${complianceRate >= 90 ? "text-success" : "text-warning"}`} />
              <h6 className="fw-bold text-uppercase text-white-50 mb-2">Overall Compliance Rate</h6>
              {loading ? (
                <div className="fs-1 fw-bold">--%</div>
              ) : (
                <>
                  <div className="fs-1 fw-bold mb-4">{complianceRate}%</div>
                  <div className="w-100 position-relative mt-4" style={{ height: "30px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "15px" }}>
                    <div
                      className={`h-100 rounded-pill ${complianceRate >= 90 ? "bg-success" : complianceRate >= 70 ? "bg-warning" : "bg-danger"}`}
                      style={{ width: `${complianceRate}%`, transition: "width 1s ease-in-out" }}
                    />
                    <div
                      className={`position-absolute ${complianceRate >= 90 ? "bg-success" : complianceRate >= 70 ? "bg-warning" : "bg-danger"}`}
                      style={{ width: "40px", height: "40px", borderRadius: "50%", left: "-15px", top: "-5px" }}
                    />
                  </div>
                  <div className="w-100 d-flex justify-content-between mt-2 small text-white-50 px-3">
                    <span>0%</span><span>50%</span><span>100%</span>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export { SafetyAnalytics };
