// import { useEffect, useState } from "react";
// import { Row, Col, Spinner, Card, Badge } from "react-bootstrap";
// import { StatWidget } from "../../components/dashboard/StatWidget";
// import { FaCalendarAlt, FaExclamationTriangle, FaCheckCircle, FaClock } from "react-icons/fa";
// import analyticsService from "../../services/analyticsService";
// import { siteOpsService } from "../../services/siteOpsService";

// const STATUS_COLOR = { SUBMITTED: "success", DRAFT: "secondary", IN_REVIEW: "primary", APPROVED: "success" };

// const SEDashboard = () => {
//   const [stats, setStats] = useState(null);
//   const [recentLogs, setRecentLogs] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const load = async () => {
//       try {
//         const [data, logsData] = await Promise.all([
//           analyticsService.getSiteProgressSummary(),
//           siteOpsService.getIssuesPaginated(0, 5).catch(() => ({ content: [] }))
//         ]);
//         setStats(data);
//         // Try to get recent site logs from analytics
//         const logsRes = await analyticsService.getSiteEngineerDailyLogs().catch(() => []);
//         const logs = Array.isArray(logsRes) ? logsRes : logsRes?.content || [];
//         setRecentLogs(logs.slice(0, 5));
//       } catch (err) {
//         console.error("Failed to load Site Engineer dashboard:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     load();
//   }, []);

//   return (
//     <div>
//       <h3 className="mb-4 fw-bold">Site Engineer Overview</h3>
//       <Row className="g-4 mb-4">
//         <Col xs={12} md={4}>
//           <StatWidget
//             title="Active Sites"
//             value={loading ? <Spinner animation="border" size="sm" /> : stats?.activeSites?.toString() || "0"}
//             icon="FaBuilding"
//             subtitle={<><span className="text-success fw-bold">{stats?.onTrackProjects || 0}</span> projects on track</>}
//             borderLeftColor="var(--bs-primary)"
//           />
//         </Col>
//         <Col xs={12} md={4}>
//           <StatWidget
//             title="Avg Task Completion"
//             value={loading ? "-" : stats?.avgTaskCompletionRate != null ? `${Math.round(stats.avgTaskCompletionRate * 100)}%` : "0%"}
//             icon="FaClipboardList"
//             iconColor="text-warning"
//             subtitle={<span className="text-muted">Across all engineers</span>}
//             borderLeftColor="var(--bs-warning)"
//           />
//         </Col>
//         <Col xs={12} md={4}>
//           <StatWidget
//             title="Delayed Tasks"
//             value={loading ? "-" : stats?.delayedTasksCount?.toString() || "0"}
//             icon="FaExclamationTriangle"
//             iconColor="text-danger"
//             subtitle={<span className="text-danger fw-bold">{(stats?.delayedTasksCount || 0) > 0 ? "Action required" : "On schedule"}</span>}
//             borderLeftColor="var(--bs-danger)"
//           />
//         </Col>
//       </Row>

//       <Card className="border-0 shadow-sm rounded-4">
//         <Card.Header className="bg-white border-bottom p-4">
//           <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
//             <FaCalendarAlt className="text-primary" /> Recent Daily Logs
//           </h6>
//         </Card.Header>
//         <Card.Body className="p-0">
//           {loading ? (
//             <div className="text-center py-5 text-muted"><Spinner animation="border" size="sm" className="me-2" />Loading logs...</div>
//           ) : recentLogs.length === 0 ? (
//             <div className="text-center py-5 text-muted small">No daily logs submitted yet.</div>
//           ) : (
//             <div className="d-flex flex-column">
//               {recentLogs.map((log, idx) => (
//                 <div key={log.logId || idx} className="px-4 py-3 border-bottom d-flex justify-content-between align-items-start">
//                   <div>
//                     <div className="fw-semibold text-dark">{log.siteLocation || log.projectName || "Site Log"}</div>
//                     <div className="small text-muted mt-1" style={{ maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
//                       {log.workDescription || log.description || "—"}
//                     </div>
//                     <div className="d-flex gap-3 mt-1 small text-muted">
//                       {log.hoursWorked != null && (
//                         <span className="d-flex align-items-center gap-1">
//                           <FaClock size={10} /> {log.hoursWorked}h worked
//                         </span>
//                       )}
//                       {log.issuesReported > 0 && (
//                         <span className="d-flex align-items-center gap-1 text-danger">
//                           <FaExclamationTriangle size={10} /> {log.issuesReported} issue{log.issuesReported > 1 ? "s" : ""}
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                   <div className="d-flex flex-column align-items-end gap-1 flex-shrink-0">
//                     <Badge bg={STATUS_COLOR[log.reviewStatus || log.status] || "secondary"} className="small">
//                       {(log.reviewStatus || log.status || "Draft").replace(/_/g, " ")}
//                     </Badge>
//                     <span className="small text-muted">{log.logDate || (log.createdAt ? new Date(log.createdAt).toLocaleDateString() : "—")}</span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </Card.Body>
//       </Card>
//     </div>
//   );
// };

// export { SEDashboard };
