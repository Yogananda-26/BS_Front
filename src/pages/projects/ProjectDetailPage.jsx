import { useState, useEffect, useCallback } from "react";
import { AppButton } from "../../components/common/AppButton";
import { AppTable } from "../../components/common/AppTable";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, Card, Badge, Button, Nav, Tab, ProgressBar } from "react-bootstrap";
import { FaArrowLeft, FaCalendarAlt, FaExclamationTriangle, FaTools, FaExternalLinkAlt, FaSyncAlt, FaCamera, FaFileAlt, FaDownload, FaImage, FaPhotoVideo } from "react-icons/fa";
import { toast } from "react-toastify";
import projectService from "../../services/projectService";
import safetyService from "../../services/safetyService";
import vendorService from "../../services/vendorService";
import { financeService } from "../../services/financeService";
import { siteOpsService } from "../../services/siteOpsService";
import { notificationService } from "../../services/notificationService";
import { resourceService } from "../../services/resourceService";
import { userService } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import { SITE_LOG_SUBMITTED_EVENT } from "../../utils/siteLogSync";

function normalizeStatus(status) {
  if (!status) return "NOT_STARTED";
  return status.toUpperCase().replace(/ /g, "_");
}

function getMilestoneBarPercent(m) {
  const s = normalizeStatus(m.status);
  if (s === "COMPLETED") return 100;
  const raw = m.progressPercent ?? m.progressPercentage;
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 0) return Math.min(100, n);
  return s === "IN_PROGRESS" ? 65 : 0;
}

const STATUS_CONFIG = {
  IN_PROGRESS: "primary",
  COMPLETED: "success",
  ON_HOLD: "warning",
  CANCELLED: "danger",
  NOT_STARTED: "secondary",
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  OPEN: "danger",
  RESOLVED: "success",
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "success"
};
const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [issues, setIssues] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  // Media tab state
  const [siteLogs, setSiteLogs]         = useState([]);
  const [vendorDocs, setVendorDocs]     = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaLoaded, setMediaLoaded]   = useState(false);
  const [mediaSubTab, setMediaSubTab]   = useState("site");
  const [photoLoading, setPhotoLoading] = useState(""); // logId being fetched
  const [docDownloading, setDocDownloading] = useState(""); // docId being downloaded
  const [lightboxSrc, setLightboxSrc]   = useState(null); // blob URL for photo modal
  const [syncingMilestones, setSyncingMilestones] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskError, setTaskError] = useState(null);
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [newTask, setNewTask] = useState({
    description: "",
    assignedDepartment: "SITE_ENGINEER",
    assignedTo: "",
    plannedStart: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    plannedEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0]
  });
  const [deptUsers, setDeptUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const loadProjectBundle = useCallback(async () => {
    if (!projectId) return;
    const [proj, ms, tasks2, approvals2, issues2, res] = await Promise.all([
      projectService.getProject(projectId),
      projectService.getMilestones(projectId).catch(() => []),
      projectService.getTasks(projectId).catch(() => []),
      projectService.getApprovals().catch(() => []),
      projectService.getIssues(projectId).catch(() => []),
      resourceService.getAllocationsByProject(projectId).catch(() => [])
    ]);
    setProject(proj || null);
    setMilestones(Array.isArray(ms) ? ms.map((m) => ({ ...m, status: normalizeStatus(m.status) })) : []);
    setTasks(Array.isArray(tasks2) ? tasks2 : []);
    setApprovals(Array.isArray(approvals2) ? approvals2.filter((a) => a.projectId === projectId) : []);
    setIssues(Array.isArray(issues2) ? issues2 : []);
    setAllocations(Array.isArray(res) ? res : []);
  }, [projectId]);

  // Lazy-load media only when the tab is first opened
  const loadMedia = useCallback(async () => {
    if (mediaLoaded || !projectId) return;
    setMediaLoading(true);
    const [logsRes, docsRes] = await Promise.allSettled([
      projectService.getProjectSiteLogs(projectId),
      projectService.getProjectMediaDocuments(projectId),
    ]);

    if (logsRes.status === "fulfilled") {
      setSiteLogs(logsRes.value);
    } else {
      console.error("Site logs fetch failed:", logsRes.reason);
      toast.error("Could not load site photos: " + (logsRes.reason?.response?.data?.message || logsRes.reason?.message || "Service unavailable"));
      setSiteLogs([]);
    }

    if (docsRes.status === "fulfilled") {
      setVendorDocs(docsRes.value);
    } else {
      console.error("Vendor docs fetch failed:", docsRes.reason);
      toast.error("Could not load vendor documents: " + (docsRes.reason?.response?.data?.message || docsRes.reason?.message || "Service unavailable"));
      setVendorDocs([]);
    }

    setMediaLoaded(true);
    setMediaLoading(false);
  }, [projectId, mediaLoaded]);

  const handleViewPhoto = async (log) => {
    const id = log.logId || log.id;
    setPhotoLoading(id);
    try {
      const blob = await projectService.getSiteLogPhoto(projectId, id);
      const url  = URL.createObjectURL(blob);
      setLightboxSrc(url);
    } catch {
      toast.error("Failed to load photo.");
    } finally {
      setPhotoLoading("");
    }
  };

  const handleDocDownload = async (doc) => {
    const id = doc.documentId || doc.id;
    setDocDownloading(id);
    try {
      const blob = await projectService.downloadProjectMediaDocument(projectId, id);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = doc.documentName || `document-${id}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`"${doc.documentName || "Document"}" downloaded.`);
    } catch {
      toast.error("Failed to download document.");
    } finally {
      setDocDownloading("");
    }
  };

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    setLoadError(null);
    loadProjectBundle()
      .catch((err) => setLoadError(err?.response?.data?.message || err?.message || "Failed to load project"))
      .finally(() => setLoading(false));
  }, [projectId, loadProjectBundle]);

  useEffect(() => {
    const onSiteLogSubmitted = (e) => {
      if (e.detail?.projectId === projectId) loadProjectBundle();
    };
    window.addEventListener(SITE_LOG_SUBMITTED_EVENT, onSiteLogSubmitted);
    return () => window.removeEventListener(SITE_LOG_SUBMITTED_EVENT, onSiteLogSubmitted);
  }, [projectId, loadProjectBundle]);

  // Re-run loadMedia whenever mediaLoaded is reset to false (e.g. after Refresh click)
  useEffect(() => {
    if (!mediaLoaded) loadMedia();
  }, [mediaLoaded, loadMedia]);

  useEffect(() => {
    if (!showTaskModal) return;
    setLoadingUsers(true);
    setNewTask((t) => ({ ...t, assignedTo: "" }));
    userService.getAllUsersList()
      .then((data) => {
        const all = Array.isArray(data) ? data : [];
        setDeptUsers(all.filter((u) => u.role === newTask.assignedDepartment));
      })
      .catch(() => setDeptUsers([]))
      .finally(() => setLoadingUsers(false));
  }, [showTaskModal, newTask.assignedDepartment]);

  if (loading) return <div className="p-4 text-center text-muted">Loading project details...</div>;
  if (loadError) return <div className="p-4 text-center"><div className="alert alert-danger d-inline-block rounded-4">{loadError}</div></div>;
  if (!project) return <div className="p-4 text-center text-danger">Project not found.</div>;
  const progress = project.totalMilestones > 0 ? Math.round(project.completedMilestones / project.totalMilestones * 100) : 0;
  const statusVariant = STATUS_CONFIG[project.status] || "secondary";
  const handleTaskStatusChange = async (taskId, status) => {
    await projectService.updateTaskStatus(taskId, status);
    setTasks((prev) => prev.map((t) => t.taskId === taskId ? { ...t, status } : t));
  };

  const handleSyncMilestones = async () => {
    setSyncingMilestones(true);
    try {
      // Empty body → PM service fetches latest site log from SiteOps via Feign
      await projectService.updateMilestoneProgress(projectId, {});
      await loadProjectBundle();
      toast.success("Milestones synced from latest site log");
    } catch (err) {
      toast.error("Milestone sync failed: " + (err?.response?.data?.message || err?.message || "Unknown error"));
    } finally {
      setSyncingMilestones(false);
    }
  };
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!projectId || taskSubmitting) return;
    setTaskError(null);
    if (!newTask.plannedStart || !newTask.plannedEnd) {
      setTaskError("Planned start and end dates are required.");
      return;
    }
    const taskStart = new Date(newTask.plannedStart);
    const taskEnd   = new Date(newTask.plannedEnd);
    if (taskEnd <= taskStart) {
      setTaskError("End date must be after start date.");
      return;
    }
    const taskMaxEnd = new Date(taskStart);
    taskMaxEnd.setFullYear(taskMaxEnd.getFullYear() + 5);
    if (taskEnd > taskMaxEnd) {
      setTaskError("End date must be within 5 years of the start date.");
      return;
    }
    setTaskSubmitting(true);
    try {
      const payload = {
        description: newTask.description,
        assignedDepartment: newTask.assignedDepartment,
        assignedTo: newTask.assignedTo || "ADMIN",
        plannedStart: newTask.plannedStart,
        plannedEnd: newTask.plannedEnd,
        actualStart: newTask.plannedStart,
        actualEnd: newTask.plannedEnd
      };
      const created = await projectService.createTask(projectId, payload);
      setTasks((prev) => [...prev, created]);
      try {
        const syncMap = {
          "SAFETY_OFFICER": safetyService.syncTasks,
          "VENDOR": vendorService.syncTasks,
          "FINANCE_OFFICER": financeService.syncTasks,
          "SITE_ENGINEER": siteOpsService.syncTasks
        };
        const syncFn = syncMap[newTask.assignedDepartment];
        if (syncFn) await syncFn();
        await notificationService.createNotification({
          eventType: "TASK_ASSIGNED",
          message: `New task assigned to ${newTask.assignedDepartment}: ${newTask.description}`,
          fromService: "PROJECT_MANAGER",
          fromRole: currentUser?.role || "PROJECT_MANAGER",
          referenceId: created.taskId,
          priority: "MEDIUM",
          toUser: newTask.assignedTo
        });
      } catch (err) {
        console.warn("Post-creation sync/notification failed", err);
      }
      toast.success(`Task assigned successfully to ${newTask.assignedDepartment.replace(/_/g, " ").toLowerCase()}`);
      setShowTaskModal(false);
      setNewTask({
        description: "",
        assignedDepartment: "SITE_ENGINEER",
        assignedTo: "",
        plannedStart: new Date().toISOString().split("T")[0],
        plannedEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to create task";
      setTaskError(msg);
    } finally {
      setTaskSubmitting(false);
    }
  };
  return <div className="p-4">
      <div
        className="rounded-4 mb-4 p-4 position-relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, var(--bs-${statusVariant}) 0%, color-mix(in srgb, var(--bs-${statusVariant}) 60%, #000) 100%)`,
          minHeight: "120px"
        }}
      >
        <div className="position-absolute top-0 end-0 opacity-10" style={{ fontSize: "8rem", lineHeight: 1, transform: "translate(10%, -10%)" }}>
          ◈
        </div>
        <div className="d-flex align-items-start gap-3">
          <AppButton variant="light" className="rounded-circle p-2 flex-shrink-0" onClick={() => navigate("/projects")}>
            <FaArrowLeft />
          </AppButton>
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
              <h3 className="fw-bold mb-0 text-white">{project.projectName}</h3>
              <Badge bg="light" text="dark" className="rounded-pill px-3">{(project.status || "").replace("_", " ")}</Badge>
            </div>
            <p className="text-white-50 small mb-0">{project.description}</p>
          </div>
        </div>
      </div>

      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm rounded-4 bg-primary text-white">
            <Card.Body className="p-3">
              <div className="small text-white-50 text-uppercase mb-1">Budget</div>
              <div className="fs-5 fw-bold">${(project.budget / 1e6).toFixed(2)}M</div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-3">
              <div className="small text-muted text-uppercase mb-1">Timeline</div>
              <div className="small fw-bold"><FaCalendarAlt className="me-1 text-primary" />{project.startDate} → {project.endDate}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-3">
              <div className="small text-muted text-uppercase mb-1">Milestones</div>
              <div className="fs-5 fw-bold">{project.completedMilestones}/{project.totalMilestones}</div>
              <ProgressBar variant="success" now={progress} style={{ height: "4px" }} className="mt-1" />
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-3">
              <div className="small text-muted text-uppercase mb-1">Tasks</div>
              <div className="fs-5 fw-bold">{project.completedTasks}/{project.totalTasks}</div>
              <ProgressBar variant="primary" now={project.totalTasks > 0 ? project.completedTasks / project.totalTasks * 100 : 0} style={{ height: "4px" }} className="mt-1" />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Tab.Container defaultActiveKey="milestones" onSelect={(k) => { if (k === "media") loadMedia(); }}>
        <Nav variant="pills" className="mb-4 bg-light rounded-4 p-1 gap-1 flex-wrap">
          {["milestones", "tasks", "resources", "approvals", "issues", "media"].map((tab) => <Nav.Item key={tab}>
              <Nav.Link eventKey={tab} className="rounded-3 text-capitalize px-4">
                {tab === "media" ? <><FaPhotoVideo className="me-1" />Media</> : tab}
                {tab === "resources" && allocations.length > 0 && <Badge bg="primary" pill className="ms-2">{allocations.length}</Badge>}
                {tab === "approvals" && approvals.filter((a) => a.status === "PENDING").length > 0 && <Badge bg="danger" pill className="ms-2">{approvals.filter((a) => a.status === "PENDING").length}</Badge>}
                {tab === "issues" && issues.filter((i) => i.status === "OPEN").length > 0 && <Badge bg="danger" pill className="ms-2">{issues.filter((i) => i.status === "OPEN").length}</Badge>}
                {tab === "media" && mediaLoaded && (siteLogs.length + vendorDocs.length) > 0 && <Badge bg="info" pill className="ms-2">{siteLogs.length + vendorDocs.length}</Badge>}
              </Nav.Link>
            </Nav.Item>)}
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey="milestones">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-muted small">{milestones.length} milestone{milestones.length !== 1 ? "s" : ""}</span>
              <AppButton variant="outline-secondary" size="sm" className="rounded-3 d-flex align-items-center gap-2" onClick={handleSyncMilestones} disabled={syncingMilestones}>
                <FaSyncAlt className={syncingMilestones ? "fa-spin" : ""} />
                {syncingMilestones ? "Syncing..." : "Sync from Site"}
              </AppButton>
            </div>
            <div className="milestone-timeline position-relative ps-4 py-2">
              {milestones.length === 0 ? <p className="text-muted">No milestones for this project.</p> : milestones.map((m, index) => {
    const isLast = index === milestones.length - 1;
    const statusColor = STATUS_CONFIG[m.status] || "secondary";
    const barPct = getMilestoneBarPercent(m);
    return <div key={m.milestoneId} className="timeline-item position-relative mb-5">
                      {!isLast && <div
      className="timeline-connector position-absolute"
      style={{
        left: "-26px",
        top: "32px",
        bottom: "-48px",
        width: "4px",
        backgroundColor: m.status === "COMPLETED" ? "var(--bs-success)" : "#e9ecef",
        zIndex: 1
      }}
    >
                          {m.status === "IN_PROGRESS" && <div className="bg-primary" style={{ width: "100%", height: `${barPct}%`, transition: "height 1s ease" }} />}
                        </div>}
                      
                      <div
      className={`timeline-dot position-absolute rounded-circle shadow-sm d-flex align-items-center justify-content-center fw-bold border border-4 border-white text-white bg-${statusColor}`}
      style={{
        left: "-40px",
        top: "0",
        width: "32px",
        height: "32px",
        zIndex: 2,
        transition: "all 0.3s ease"
      }}
    >
                        {m.status === "COMPLETED" ? "\u2713" : m.order}
                      </div>

                      <Card className="border-0 shadow-sm rounded-4 overflow-hidden translate-hover">
                        <Card.Body className="p-4">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h5 className="fw-bold mb-1">{m.name}</h5>
                              <p className="small text-muted mb-0">{m.description}</p>
                            </div>
                            <div className="text-end">
                              <Badge bg={statusColor} className="rounded-pill px-3 py-2 text-uppercase letter-spacing-1">
                                {m.status.replace(/_/g, " ")}
                              </Badge>
                              <div className="mt-2 text-muted small font-monospace" style={{ fontSize: "0.7rem" }}>
                                {m.status === "COMPLETED" ? "Finalized" : m.status === "IN_PROGRESS" ? "Active" : "Queued"}
                              </div>
                            </div>
                          </div>
                          
                          <div className="d-flex flex-wrap gap-4 small text-muted mb-3">
                            <div className="d-flex align-items-center gap-2">
                              <span className="opacity-50">Timeline:</span>
                              <span className="fw-medium">{m.plannedStartDate} → {m.plannedEndDate}</span>
                            </div>
                            {m.isOverdue && <Badge bg="danger" className="shake-animation">OVERDUE</Badge>}
                            {m.daysRemaining > 0 && <div className="d-flex align-items-center gap-2">
                                <span className="opacity-50">Remaining:</span>
                                <span className="text-primary fw-bold">{m.daysRemaining} days</span>
                              </div>}
                          </div>

                          <div className="position-relative mt-4">
                            <div className="progress rounded-pill bg-light" style={{ height: "10px" }}>
                              <div
      className={`progress-bar progress-bar-striped progress-bar-animated bg-${statusColor}`}
      style={{
        width: `${barPct}%`,
        transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)"
      }}
    />
                            </div>
                            {m.status === "IN_PROGRESS" && barPct > 0 && <div
      className="position-absolute bg-white border border-primary border-3 rounded-circle shadow-sm"
      style={{
        left: `${barPct}%`,
        top: "-4px",
        width: "18px",
        height: "18px",
        transform: "translateX(-50%)",
        zIndex: 3
      }}
    />}
                          </div>
                        </Card.Body>
                      </Card>
                    </div>;
  })}
            </div>
          </Tab.Pane>

          <Tab.Pane eventKey="tasks">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Project Tasks</h5>
              <AppButton variant="primary" size="sm" className="rounded-3" onClick={() => setShowTaskModal(true)}>
                + Assign New Task
              </AppButton>
            </div>
            <Card className="border-0 shadow-sm rounded-4">
              <AppTable
                columns={['Task', 'Assigned To', 'Dept.', 'Due']}
                isEmpty={tasks.length === 0}
                emptyText="No tasks for this project."
              >
                {tasks.map((task) => <tr key={task.taskId}>
                    <td className="py-3 px-4">
                      <div className="fw-semibold text-dark">{task.description}</div>
                      <div className="small text-muted font-monospace">{task.taskId}</div>
                      {task.rejectionReason && <div className="small text-danger mt-1">⚠ {task.rejectionReason}</div>}
                    </td>
                    <td className="py-3 px-4 small">{task.assignedTo}</td>
                    <td className="py-3 px-4">
                      <Badge bg="light" text="dark" className="border small">{task.assignedDepartment.replace("_", " ")}</Badge>
                    </td>
                    <td className="py-3 px-4 small text-muted">{task.plannedEnd}</td>
                  </tr>)}
              </AppTable>
            </Card>
          </Tab.Pane>

          <Tab.Pane eventKey="resources">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="fw-bold mb-0">Resource Allocations</h5>
                <p className="text-muted small mb-0">Total cost committed: <strong>${allocations.reduce((s, a) => s + (a.resource?.totalCost || 0), 0).toLocaleString()}</strong></p>
              </div>
              <AppButton variant="outline-primary" size="sm" className="rounded-3 d-flex align-items-center gap-2" onClick={() => navigate("/allocations")}>
                <FaExternalLinkAlt size={12} /> Manage Allocations
              </AppButton>
            </div>

            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
              <AppTable
                columns={['Resource', 'Type', 'Cost Summary', 'Period', 'Status']}
                responsive
                isEmpty={allocations.length === 0}
                emptyText="No resources allocated to this project yet."
              >
                {allocations.map((a) => <tr key={a.id}>
                    <td className="py-3 px-4">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-3">
                          <FaTools />
                        </div>
                        <div>
                          <div className="fw-bold">{a.resource?.equipmentName || `Labors (${a.resource?.numberOfLabors})`}</div>
                          <div className="text-muted" style={{ fontSize: "0.75rem" }}>{a.resource?.resourceId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge bg="light" text="dark" className="border">{a.resource?.type}</Badge>
                      <div className="small text-muted mt-1">{a.resource?.purpose}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="fw-bold text-success">${a.resource?.totalCost?.toLocaleString()}</div>
                      <div className="small text-muted">${a.resource?.costPerHour}/hr · {a.resource?.totalHours}h</div>
                    </td>
                    <td className="py-3 px-4 small">
                      <div>{a.assignedDate}</div>
                      <div className="text-muted">to {a.releasedDate || "Present"}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge bg={a.status === "Active" ? "success" : a.status === "Released" ? "secondary" : "warning"}>
                        {a.status}
                      </Badge>
                    </td>
                  </tr>)}
              </AppTable>
            </Card>
          </Tab.Pane>

          <Tab.Pane eventKey="approvals">
            <div className="d-flex flex-column gap-3">
              {approvals.length === 0 ? <p className="text-muted">No approvals for this project.</p> : approvals.map((a) => <Card key={a.approvalId} className="border-0 shadow-sm rounded-4">
                  <Card.Body className="p-4 d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold mb-1">{a.taskDescription}</div>
                      <div className="small text-muted">Requested by {a.requestedBy} · {new Date(a.requestedAt).toLocaleString()}</div>
                      {a.requestType && <Badge bg="light" text="dark" className="border mt-1">{a.requestType.replace(/_/g, " ")}</Badge>}
                    </div>
                    <Badge bg={STATUS_CONFIG[a.status] || "secondary"}>{a.status || "—"}</Badge>
                  </Card.Body>
                </Card>)}
            </div>
          </Tab.Pane>

          {
    /* Issues Tab */
  }
          <Tab.Pane eventKey="issues">
            <div className="d-flex flex-column gap-3">
              {issues.length === 0 ? <p className="text-muted">No issues reported for this project.</p> : issues.map((issue) => <Card key={issue.issueId} className={`border-0 shadow-sm rounded-4 border-start border-4 border-${STATUS_CONFIG[issue.severity]}`}>
                  <Card.Body className="p-4 d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold mb-1">{issue.title}</div>
                      <p className="small text-muted mb-1">{issue.description}</p>
                      <div className="d-flex gap-2">
                        <Badge bg={STATUS_CONFIG[issue.severity]}>{issue.severity}</Badge>
                        <Badge bg={STATUS_CONFIG[issue.status]}>{issue.status}</Badge>
                      </div>
                    </div>
                    <div className="text-end small text-muted">
                      <div>Reported by {issue.reportedBy}</div>
                      <div>{new Date(issue.reportedAt).toLocaleDateString()}</div>
                    </div>
                  </Card.Body>
                </Card>)}
            </div>
          </Tab.Pane>
          {/* ── Media Tab ─────────────────────────────────────────────── */}
          <Tab.Pane eventKey="media">
            {mediaLoading ? (
              <div className="text-center py-5 text-muted">
                <div className="spinner-border text-primary mb-2" />
                <p>Loading media...</p>
              </div>
            ) : (
              <>
                {/* Header row with sub-tabs + refresh */}
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div className="d-flex gap-2">
                  <AppButton
                    className={`btn btn-sm rounded-3 px-4 d-flex align-items-center gap-2 ${mediaSubTab === "site" ? "btn-primary" : "btn-light"}`}
                    onClick={() => setMediaSubTab("site")}
                  >
                    <FaCamera size={13} /> Site Photos
                    <Badge bg={mediaSubTab === "site" ? "light" : "secondary"} text="dark" pill className="ms-1">
                      {siteLogs.length}
                    </Badge>
                  </AppButton>
                  <AppButton
                    className={`btn btn-sm rounded-3 px-4 d-flex align-items-center gap-2 ${mediaSubTab === "vendor" ? "btn-primary" : "btn-light"}`}
                    onClick={() => setMediaSubTab("vendor")}
                  >
                    <FaFileAlt size={13} /> Vendor Documents
                    <Badge bg={mediaSubTab === "vendor" ? "light" : "secondary"} text="dark" pill className="ms-1">
                      {vendorDocs.length}
                    </Badge>
                  </AppButton>
                </div>
                  <AppButton
                    variant="outline-secondary"
                    size="sm"
                    className="rounded-3 d-flex align-items-center gap-2"
                    onClick={() => { setMediaLoaded(false); }}
                    title="Refresh media"
                  >
                    <FaSyncAlt size={12} /> Refresh
                  </AppButton>
                </div>

                {/* ── Site Photos ─────────────────────────────────────── */}
                {mediaSubTab === "site" && (
                  siteLogs.length === 0 ? (
                    <div className="text-center py-5 bg-white rounded-4 shadow-sm">
                      <FaCamera size={40} className="text-muted mb-3 opacity-25" />
                      <h6 className="text-muted">No site photos uploaded for this project</h6>
                    </div>
                  ) : (
                    <Row className="g-3">
                      {siteLogs.map((log) => {
                        const logId   = log.logId || log.id;
                        const logDate = log.logDate || log.createdAt || log.date || "—";
                        const notes   = log.notes || log.description || log.remarks || "";
                        const reporter = log.engineerName || log.reportedBy || log.submittedBy || "Site Engineer";
                        const isLoading = photoLoading === logId;
                        return (
                          <Col xs={12} md={6} lg={4} key={logId}>
                            <Card className="border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                              {/* Photo placeholder header */}
                              <div
                                className="bg-dark bg-opacity-75 d-flex align-items-center justify-content-center"
                                style={{ height: "140px", cursor: "pointer", background: "linear-gradient(135deg,#1e3a5f,#2d6a4f)" }}
                                onClick={() => !isLoading && handleViewPhoto(log)}
                              >
                                {isLoading
                                  ? <div className="spinner-border text-light" />
                                  : <FaImage size={40} className="text-white opacity-50" />
                                }
                              </div>
                              <Card.Body className="p-3">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div>
                                    <div className="fw-bold small font-monospace text-primary">{logId}</div>
                                    <div className="small text-muted"><FaCalendarAlt className="me-1" />{logDate}</div>
                                  </div>
                                  <Badge bg="info" className="rounded-pill">Site Log</Badge>
                                </div>
                                {notes && <p className="small text-muted mb-2 text-truncate" title={notes}>{notes}</p>}
                                <div className="small text-muted mb-3">👷 {reporter}</div>
                                <AppButton
                                  variant="primary"
                                  size="sm"
                                  className="rounded-3 w-100 d-flex align-items-center justify-content-center gap-2"
                                  onClick={() => handleViewPhoto(log)}
                                  disabled={isLoading}
                                >
                                  {isLoading
                                    ? <><span className="spinner-border spinner-border-sm" /> Loading...</>
                                    : <><FaImage size={12} /> View Photo</>}
                                </AppButton>
                              </Card.Body>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  )
                )}

                {/* ── Vendor Documents ────────────────────────────────── */}
                {mediaSubTab === "vendor" && (
                  vendorDocs.length === 0 ? (
                    <div className="text-center py-5 bg-white rounded-4 shadow-sm">
                      <FaFileAlt size={40} className="text-muted mb-3 opacity-25" />
                      <h6 className="text-muted">No vendor documents uploaded for this project</h6>
                    </div>
                  ) : (
                    <Row className="g-3">
                      {vendorDocs.map((doc) => {
                        const docId   = doc.documentId || doc.id;
                        const docName = doc.documentName || doc.fileName || `Document ${docId}`;
                        const docType = (doc.documentType || "").replace(/_/g, " ");
                        const sizeKb  = doc.fileSize ? (doc.fileSize / 1024).toFixed(0) + " KB" : "—";
                        const date    = doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "—";
                        const isDownloading = docDownloading === docId;
                        return (
                          <Col xs={12} md={6} lg={4} key={docId}>
                            <Card className="border-0 shadow-sm rounded-4 h-100">
                              <Card.Body className="p-4">
                                <div className="mb-3">
                                  <div className="bg-light p-3 rounded-4 d-inline-block">
                                    <FaFileAlt size={22} className="text-primary" />
                                  </div>
                                </div>
                                <h6 className="fw-bold text-truncate mb-1" title={docName}>{docName}</h6>
                                <div className="small text-muted mb-3">
                                  {docType && <div className="text-uppercase fw-bold" style={{ fontSize: "0.65rem" }}>{docType}</div>}
                                  <div>{sizeKb} · {date}</div>
                                </div>
                                <AppButton
                                  variant="light"
                                  size="sm"
                                  className="rounded-3 w-100 d-flex align-items-center justify-content-center gap-2"
                                  onClick={() => handleDocDownload(doc)}
                                  disabled={isDownloading}
                                >
                                  {isDownloading
                                    ? <><span className="spinner-border spinner-border-sm" /> Downloading...</>
                                    : <><FaDownload size={12} /> Download</>}
                                </AppButton>
                              </Card.Body>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  )
                )}
              </>
            )}
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      {/* ── Photo Lightbox Modal ─────────────────────────────────────────── */}
      {lightboxSrc && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
          onClick={() => { URL.revokeObjectURL(lightboxSrc); setLightboxSrc(null); }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 bg-transparent shadow-none">
              <div className="text-end mb-2">
                <AppButton
                  variant="light"
                  size="sm"
                  className="rounded-circle px-2"
                  onClick={() => { URL.revokeObjectURL(lightboxSrc); setLightboxSrc(null); }}
                >✕</AppButton>
              </div>
              <img
                src={lightboxSrc}
                alt="Site log photo"
                className="img-fluid rounded-4 shadow-lg"
                style={{ maxHeight: "80vh", objectFit: "contain", width: "100%" }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}

      {
    /* Create Task Modal */
  }
      {showTaskModal && <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Assign New Task</h5>
                <AppButton type="button" className="btn-close" onClick={() => setShowTaskModal(false)} />
              </div>
              <form onSubmit={handleCreateTask}>
                <div className="modal-body">
                  {taskError && <div className="alert alert-danger rounded-3 small py-2 d-flex align-items-center gap-2 mb-3">
                      <FaExclamationTriangle /> {taskError}
                    </div>}
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Task Description</label>
                    <input
    type="text"
    className="form-control rounded-3"
    required
    value={newTask.description}
    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
    placeholder="Enter task details..."
  />
                  </div>
                  <Row className="g-3 mb-3">
                    <Col xs={12} md={6}>
                      <label className="form-label small fw-bold">Department</label>
                      <select
    className="form-select rounded-3"
    value={newTask.assignedDepartment}
    onChange={(e) => setNewTask({ ...newTask, assignedDepartment: e.target.value })}
  >
                        <option value="SITE_ENGINEER">Site Operations</option>
                        <option value="SAFETY_OFFICER">Safety</option>
                        <option value="VENDOR">Vendor</option>
                        <option value="FINANCE_OFFICER">Finance</option>
                      </select>
                    </Col>
                    <Col xs={12} md={6}>
                      <label className="form-label small fw-bold">Assign To (User)</label>
                      <select
    className="form-select rounded-3"
    required
    value={newTask.assignedTo}
    onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
    disabled={loadingUsers}
  >
                        <option value="">{loadingUsers ? "Loading users..." : "Select user..."}</option>
                        {deptUsers.map((u) => (
                          <option key={u.userId} value={u.userId}>
                            {u.userId} — {u.fullName || u.username || u.name || u.email}
                          </option>
                        ))}
                      </select>
                      {!loadingUsers && deptUsers.length === 0 && (
                        <div className="small text-warning mt-1">No users found for this department.</div>
                      )}
                    </Col>
                  </Row>
                  <Row className="g-3">
                    <Col xs={12} md={6}>
                      <label className="form-label small fw-bold">Start Date</label>
                      <input
    type="date"
    className="form-control rounded-3"
    required
    value={newTask.plannedStart}
    onChange={(e) => setNewTask({ ...newTask, plannedStart: e.target.value })}
  />
                    </Col>
                    <Col xs={12} md={6}>
                      <label className="form-label small fw-bold">End Date</label>
                      <input
    type="date"
    className="form-control rounded-3"
    required
    value={newTask.plannedEnd}
    onChange={(e) => setNewTask({ ...newTask, plannedEnd: e.target.value })}
  />
                    </Col>
                  </Row>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <AppButton variant="light" className="rounded-3" onClick={() => setShowTaskModal(false)} disabled={taskSubmitting}>Cancel</AppButton>
                  <AppButton type="submit" variant="primary" className="rounded-3 px-4" disabled={taskSubmitting}>
                    {taskSubmitting ? "Assigning..." : "Assign Task"}
                  </AppButton>
                </div>
              </form>
            </div>
          </div>
        </div>}
    </div>;
};
export {
  ProjectDetailPage
};
