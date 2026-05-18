import client from "../api/client";
const siteOpsService = {
  // Site Logs
  getSiteLogs: async (projectId, from, to) => {
    const res = await client.get(`/api/siteops/sitelogs?projectId=${projectId}&from=${from || ""}&to=${to || ""}`, { _skipRedirect: true });
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  getSiteLogsPaginated: async (projectId, pageNumber = 0, pageSize = 10, sortBy = "logDate", sortDirection = "DESC") => {
    const res = await client.get(`/api/siteops/sitelogs/paginated/list?projectId=${projectId}&pageNumber=${pageNumber}&pageSize=${pageSize}&sortBy=${sortBy}&sortDirection=${sortDirection}`);
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) return { content: data, totalElements: data.length };
    return data;
  },
  getSiteLogById: async (logId) => {
    const res = await client.get(`/api/siteops/sitelogs/${logId}`);
    return res.data?.data || res.data;
  },
  createSiteLog: async (payload) => {
    const res = await client.post("/api/siteops/sitelogs", payload);
    return res.data?.data || res.data;
  },
  uploadPhoto: async (logId, formData) => {
    await client.post(`/api/siteops/sitelogs/${logId}/photo-upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  },
  submitSiteLog: async (logId) => {
    await client.post(`/api/siteops/sitelogs/${logId}/submit`);
  },
  deleteSiteLog: async (logId) => {
    await client.delete(`/api/siteops/sitelogs/${logId}`);
  },
  updateSiteLogStatus: async (logId, status) => {
    await client.patch(`/api/siteops/sitelogs/${logId}`, { reviewStatus: status });
  },
  getLatestLog: async (projectId) => {
    const res = await client.get(`/api/siteops/sitelogs/latest/${projectId}`);
    return res.data?.data || res.data;
  },
  getInstanceInfo: async () => {
    const res = await client.get("/api/siteops/sitelogs/instance-info");
    return res.data?.data || res.data;
  },
  getSiteLogsByDate: async (date) => {
    const res = await client.get(`/api/siteops/sitelogs/by-date?date=${date}`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  // Issues
  getIssues: async (filters) => {
    const params = new URLSearchParams();
    if (filters?.projectId) params.append("projectId", filters.projectId);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.severity) params.append("severity", filters.severity);
    if (filters?.reportedBy) params.append("reportedBy", filters.reportedBy);
    const res = await client.get(`/api/issues?${params.toString()}`, { _skipRedirect: true });
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  getIssuesPaginated: async (pageNumber = 0, pageSize = 10, sortBy = "reportedAt", sortDirection = "DESC") => {
    const res = await client.get(`/api/issues/paginated/list?pageNumber=${pageNumber}&pageSize=${pageSize}&sortBy=${sortBy}&sortDirection=${sortDirection}`, { _skipRedirect: true });
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) return { content: data, totalElements: data.length };
    return data;
  },
  getIssuesByStatus: async (status, pageNumber = 0, pageSize = 10) => {
    const res = await client.get(`/api/issues/paginated/by-status?status=${status}&pageNumber=${pageNumber}&pageSize=${pageSize}`, { _skipRedirect: true });
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) return { content: data, totalElements: data.length };
    return data;
  },
  getIssuesBySeverity: async (severity, pageNumber = 0, pageSize = 10) => {
    const res = await client.get(`/api/issues/paginated/by-severity?severity=${severity}&pageNumber=${pageNumber}&pageSize=${pageSize}`, { _skipRedirect: true });
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) return { content: data, totalElements: data.length };
    return data;
  },
  getIssuesByReporter: async (reportedBy, pageNumber = 0, pageSize = 10) => {
    const res = await client.get(`/api/issues/paginated/by-reporter?reportedBy=${reportedBy}&pageNumber=${pageNumber}&pageSize=${pageSize}`, { _skipRedirect: true });
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) return { content: data, totalElements: data.length };
    return data;
  },
  getIssueById: async (issueId) => {
    const res = await client.get(`/api/issues/${issueId}`, { _skipRedirect: true });
    return res.data?.data || res.data;
  },
  reportIssue: async (payload) => {
    const res = await client.post("/api/issues", payload, { _skipRedirect: true });
    return res.data?.data || res.data;
  },
  updateIssue: async (issueId, payload) => {
    await client.patch(`/api/issues/${issueId}`, payload, { _skipRedirect: true });
  },
  deleteIssue: async (issueId) => {
    await client.delete(`/api/issues/${issueId}`, { _skipRedirect: true });
  },
  getIssuesByLog: async (logId) => {
    const res = await client.get(`/api/issues/by-log/${logId}`, { _skipRedirect: true });
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  // SiteOps Tasks
  getTasks: async () => {
    const res = await client.get("/api/siteops/tasks", { _skipRedirect: true });
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  getTasksByProject: async (projectId) => {
    const res = await client.get(`/api/siteops/tasks/project/${projectId}`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  submitTask: async (assignedTaskId, payload) => {
    await client.post(`/api/siteops/tasks/${assignedTaskId}/submit`, payload);
  },
  syncTasks: async (config) => {
    await client.post("/api/siteops/tasks/sync", {}, config);
    return { message: "Tasks synchronized successfully." };
  },
  handleApprovalResult: async (payload) => {
    await client.post("/internal/approval-result", payload);
  },
  // Notifications
  getNotifications: async () => {
    const res = await client.get("/api/siteops-notifications");
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  markRead: async (id) => {
    await client.patch(`/api/siteops-notifications/${id}/read`);
  },
  markAllRead: async () => {
    await client.post("/api/siteops-notifications/read-all");
  },
  // KPI & Analytics
  getKpi: async (userId) => {
    try {
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const res = await client.get("/api/reports/site-engineer/summary", { _skipRedirect: true }).catch(() => ({ data: {} }));
      const summary = res.data?.data || res.data;
      const [logs, issues] = await Promise.all([
        siteOpsService.getSiteLogs("CHEBS26002", today, today).catch(() => []),
        siteOpsService.getIssues({ projectId: "CHEBS26002", status: "OPEN" }).catch(() => [])
      ]);
      return {
        todaysLogs: Math.max(logs.length, summary?.todaysLogsCount || summary?.todaysLogs || 0),
        openIssues: Math.max(issues.length, summary?.openIssuesCount || summary?.openIssues || 0),
        pendingTasks: summary?.pendingTasksCount || summary?.pendingTasks || 0,
        pendingDeliveries: 0
      };
    } catch (e) {
      console.error("Failed to fetch SiteOps KPIs", e);
      return { todaysLogs: 0, openIssues: 0, pendingTasks: 0, pendingDeliveries: 0 };
    }
  },
  getPerformanceReport: async () => {
    const url = "/api/reports/site-engineer/performance";
    const res = await client.get(url, { _skipRedirect: true });
    return res.data?.data || res.data;
  },
  getDailyLogsReport: async () => {
    const url = "/api/reports/site-engineer/daily-logs";
    const res = await client.get(url, { _skipRedirect: true });
    return res.data?.data || res.data;
  },
  // Deliveries
  getInboundDeliveries: async () => {
    const res = await client.get("/api/siteops/deliveries");
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  createDelivery: async (payload) => {
    const res = await client.post("/internal/deliveries", payload);
    return res.data?.data || res.data;
  },
  getPendingDeliveries: async () => {
    const res = await client.get("/api/siteops/deliveries/pending");
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  getDeliverySiteStatus: async (deliveryId) => {
    const res = await client.get(`/internal/deliveries/${deliveryId}/site-status`);
    return res.data?.data || res.data;
  },
  confirmDelivery: async (deliveryId, status) => {
    await client.patch(
      `/api/siteops/deliveries/${deliveryId}/confirm`,
      null,
      { params: { status }, _skipRedirect: true }
    );
  }
};
export {
  siteOpsService
};
