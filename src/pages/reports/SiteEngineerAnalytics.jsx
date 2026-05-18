import { useState, useEffect } from "react";
import { Row, Col, Card, Badge, Accordion } from "react-bootstrap";
import { FaHardHat, FaCheckCircle, FaExclamationTriangle, FaImage } from "react-icons/fa";
import analyticsService from "../../services/analyticsService";
import { useAuth } from "../../context/AuthContext";
import { Role } from "../../utils/constants";

const SiteEngineerAnalytics = () => {
  const { user } = useAuth();
  const isSE = user?.role === Role.SITE_ENGINEER;
  const [performance, setPerformance] = useState([]);
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [perfRes, sumRes, logsRes] = await Promise.allSettled([
          analyticsService.getSiteEngineerPerformance(),
          analyticsService.getSiteProgressSummary(),
          analyticsService.getSiteEngineerDailyLogs()
        ]);
        let perf = perfRes.status === "fulfilled" ? (Array.isArray(perfRes.value) ? perfRes.value : []) : [];
        const sumData = sumRes.status === "fulfilled" ? sumRes.value : null;
        const logsRaw = logsRes.status === "fulfilled" ? logsRes.value : [];
        let logsList = Array.isArray(logsRaw) ? logsRaw : logsRaw?.content || [];

        // Filter by role — show only the current engineer's own data
        if (isSE) {
          const uid = user?.userId || user?.id || user?.engineerId || user?.username;
          perf = uid ? perf.filter((p) => p.engineerId === uid || p.engineerName === user?.name) : perf;
          logsList = uid ? logsList.filter((l) => l.engineerId === uid || l.engineerName === user?.name) : logsList;
        }

        setPerformance(perf);
        setLogs(logsList);
        setSummary(sumData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isSE]);

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="fw-bold text-dark mb-1">Site Engineer Analytics</h3>
        <p className="text-muted mb-0">Track field execution, daily logs, and site progress.</p>
      </div>

      {!isSE && summary && (
        <Row className="g-4 mb-4">
          <Col xs={12} md={6}>
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body className="p-4">
                <p className="small text-muted text-uppercase fw-bold mb-1">Active Sites</p>
                <h2 className="fw-bold text-dark mb-0">{summary.activeSites ?? 0}</h2>
                <div className="small text-success mt-1"><FaCheckCircle className="me-1" /> {summary.onTrackProjects ?? 0} on track</div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body className="p-4">
                <p className="small text-muted text-uppercase fw-bold mb-1">Total Engineers</p>
                <h2 className="fw-bold text-dark mb-0">{summary.totalSiteEngineers ?? 0}</h2>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Row className="g-4 mb-4">
        <Col xs={12} lg={7}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Header className="bg-white border-bottom p-4">
              <h5 className="fw-bold mb-0">Engineer Performance</h5>
            </Card.Header>
            <Card.Body className="p-4">
              {loading ? (
                <div className="text-center py-4 text-muted">Loading performance...</div>
              ) : performance.length === 0 ? (
                <div className="text-center py-5 text-muted small">No performance data.</div>
              ) : (
                <div className="d-flex flex-column gap-4">
                  {performance.map((eng) => (
                    <div key={eng.engineerId} className="p-3 border rounded-4 bg-light">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-circle">
                            <FaHardHat size={20} />
                          </div>
                          <div>
                            <h6 className="fw-bold mb-0">{eng.engineerName}</h6>
                            <small className="text-muted">{eng.assignedProject}</small>
                          </div>
                        </div>
                      </div>
                      <Row className="g-3 text-center">
                        <Col xs={4}>
                          <div className="p-2 bg-white rounded-3 border border-light shadow-sm">
                            <span className="d-block small text-muted">Completed</span>
                            <span className="fw-bold text-success">{eng.tasksCompleted ?? 0}</span>
                          </div>
                        </Col>
                        <Col xs={4}>
                          <div className="p-2 bg-white rounded-3 border border-light shadow-sm">
                            <span className="d-block small text-muted">Pending</span>
                            <span className="fw-bold text-warning">{eng.tasksPending ?? 0}</span>
                          </div>
                        </Col>
                        <Col xs={4}>
                          <div className="p-2 bg-white rounded-3 border border-light shadow-sm">
                            <span className="d-block small text-muted">Avg Time</span>
                            <span className="fw-bold text-info">{eng.avgCompletionTimeHours ?? "—"}h</span>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={5}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Header className="bg-white border-bottom p-4">
              <h6 className="fw-bold mb-0">Recent Daily Logs</h6>
            </Card.Header>
            <Card.Body className="p-0">
              {logs.length === 0 ? (
                <div className="text-center py-4 text-muted small">No daily logs.</div>
              ) : (
                <Accordion flush>
                  {logs.slice(0, 10).map((log, idx) => (
                    <Accordion.Item eventKey={idx.toString()} key={log.logId || idx}>
                      <Accordion.Header>
                        <div className="d-flex flex-column">
                          <span className="fw-bold text-dark">{log.siteLocation || log.projectName || "Site"}</span>
                          <span className="small text-muted">{log.logDate} • {log.engineerName}</span>
                        </div>
                      </Accordion.Header>
                      <Accordion.Body className="bg-light pt-4 pb-4">
                        <p className="mb-3">{log.workDescription}</p>
                        <div className="d-flex flex-wrap gap-3 mb-3">
                          <Badge bg="info" className="bg-opacity-10 text-dark border border-info border-opacity-25 px-2 py-1">
                            {log.hoursWorked} Hours
                          </Badge>
                          {log.issuesReported > 0 && (
                            <Badge bg="danger" className="bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1">
                              <FaExclamationTriangle className="me-1" /> {log.issuesReported} Issues
                            </Badge>
                          )}
                        </div>
                        {log.photosAttached > 0 && (
                          <div>
                            <p className="small fw-bold text-muted text-uppercase mb-2">Attached Photos ({log.photosAttached})</p>
                            <div className="d-flex gap-2">
                              {Array.from({ length: Math.min(log.photosAttached, 3) }).map((_, i) => (
                                <div key={i} className="bg-secondary bg-opacity-25 rounded d-flex align-items-center justify-content-center" style={{ width: "60px", height: "60px" }}>
                                  <FaImage className="text-secondary opacity-50" />
                                </div>
                              ))}
                              {log.photosAttached > 3 && (
                                <div className="bg-light border rounded d-flex align-items-center justify-content-center text-muted small fw-bold" style={{ width: "60px", height: "60px" }}>
                                  +{log.photosAttached - 3}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export { SiteEngineerAnalytics };
