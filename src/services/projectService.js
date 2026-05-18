import client from "../api/client";
import { getRandomProjectImage } from "../utils/projectImages";
const projectService = {
  // Projects
  getProjects: async (config) => {
    const res = await client.get("/api/projects", config);
    const data = res.data?.data || res.data;
    const projects = Array.isArray(data) ? data : data?.content || [];
    return projects.map((p) => ({
      ...p,
      imageUrl: p.imageUrl || getRandomProjectImage()
    }));
  },
  getProject: async (projectId) => {
    const res = await client.get(`/api/projects/${projectId}`);
    const project = res.data?.data || res.data;
    return {
      ...project,
      imageUrl: project?.imageUrl || getRandomProjectImage()
    };
  },
  createProject: async (payload) => {
    const res = await client.post("/api/projects", payload);
    return res.data?.data || res.data;
  },
  // Milestones
  getMilestones: async (projectId) => {
    const res = await client.get(`/api/projects/${projectId}/milestones`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  updateMilestoneStatus: async (milestoneId, status) => {
    await client.patch(`/api/projects/milestones/${milestoneId}/status?status=${status}`);
  },
  updateMilestoneProgress: async (projectId, data) => {
    const res = await client.post(`/api/projects/${projectId}/milestones/progress`, data, { _skipRedirect: true });
    return res.data?.data || res.data;
  },
  // Tasks
  getTasks: async (projectId) => {
    const res = await client.get(`/api/projects/${projectId}/tasks`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  createTask: async (projectId, payload) => {
    const res = await client.post(`/api/projects/${projectId}/tasks`, payload);
    return res.data?.data || res.data;
  },
  updateTaskStatus: async (taskId, status) => {
    await client.patch(`/api/projects/tasks/${taskId}/status?status=${status}`);
  },
  getMyTasks: async (userId) => {
    const res = await client.get(`/api/projects/tasks/my?userId=${userId}`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  // Approvals
  getApprovals: async () => {
    const res = await client.get("/api/approvals", { _skipRedirect: true });
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  getPendingApprovals: async () => {
    const res = await client.get("/api/approvals/pending", { _skipRedirect: true });
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  getProjectApprovals: async (projectId) => {
    const res = await client.get(`/api/approvals/project/${projectId}`, { _skipRedirect: true });
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  createApproval: async (payload) => {
    const res = await client.post("/api/approvals", payload, { _skipRedirect: true });
    return res.data?.data || res.data;
  },
  approveRequest: async (approvalId) => {
    const res = await client.post(`/api/approvals/${approvalId}/approve`, {}, { _skipRedirect: true });
    return res.data?.data || res.data;
  },
  rejectRequest: async (approvalId, reason) => {
    const res = await client.post(
      `/api/approvals/${approvalId}/reject?rejectionReason=${encodeURIComponent(reason)}`,
      {},
      { _skipRedirect: true }
    );
    return res.data?.data || res.data;
  },
  getApprovalStats: async () => {
    const res = await client.get("/api/approvals/stats", { _skipRedirect: true });
    return res.data?.data || res.data;
  },
  // Issues (Project Manager View)
  getIssues: async (projectId) => {
    const res = await client.get(`/api/projects/issues${projectId ? `?projectId=${projectId}` : ""}`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  resolveIssue: async (issueId, payload) => {
    await client.post(`/api/projects/issues/${issueId}/resolve`, payload);
  },
  // Templates
  getTemplates: async () => {
    const res = await client.get("/api/templates");
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  getTemplate: async (templateId) => {
    const res = await client.get(`/api/templates/${templateId}`);
    return res.data?.data || res.data;
  },
  // Additional PM Views
  getVendorApprovals: async () => {
    const res = await client.get("/api/vendor");
    return res.data?.data || res.data;
  },
  getFinanceApprovals: async () => {
    const res = await client.get("/api/finance");
    return res.data?.data || res.data;
  },
  getPMNotifications: async () => {
    const res = await client.get("/api/notifications");
    return res.data?.data || res.data;
  },

  // ── PM Media Viewer ──────────────────────────────────────────────────────
  // Direct to PM service (port 8086) via Vite proxy rewrite — see vite.config.js
  // GET /api/pm/media/projects/{projectId}/sitelogs
  getProjectSiteLogs: async (projectId) => {
    const res = await client.get(
      `/api/pm/media/projects/${projectId}/sitelogs`,
      { _skipRedirect: true }
    );
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  // GET /api/pm/media/projects/{projectId}/sitelogs/{logId}/photo  → blob
  getSiteLogPhoto: async (projectId, logId) => {
    const res = await client.get(
      `/api/pm/media/projects/${projectId}/sitelogs/${logId}/photo`,
      { responseType: "blob", _skipRedirect: true }
    );
    return res.data;
  },
  // GET /api/pm/media/projects/{projectId}/documents
  getProjectMediaDocuments: async (projectId) => {
    const res = await client.get(
      `/api/pm/media/projects/${projectId}/documents`,
      { _skipRedirect: true }
    );
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  // GET /api/pm/media/projects/{projectId}/documents/{documentId}/download → blob
  downloadProjectMediaDocument: async (projectId, documentId) => {
    const res = await client.get(
      `/api/pm/media/projects/${projectId}/documents/${documentId}/download`,
      { responseType: "blob", _skipRedirect: true }
    );
    return res.data;
  },
};
var stdin_default = projectService;
export {
  stdin_default as default
};
