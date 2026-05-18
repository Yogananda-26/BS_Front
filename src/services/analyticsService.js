import client from "../api/client";
import { getRandomProjectImage } from "../utils/projectImages";
const analyticsService = {
  // 1. Dashboard Overview
  getDashboardSummary: async (projectId) => {
    const res = await client.get(`/api/reports/dashboard-summary${projectId ? `?projectId=${projectId}` : ""}`);
    const data = res.data?.data || res.data;

    return data;
  },
  getProjectProgressTrends: async (projectId) => {
    const res = await client.get(`/api/reports/project/summary`);
    const data = res.data?.data || res.data;
    const rawList = Array.isArray(data) ? data : data?.content || [];
    const filtered = projectId ? rawList.filter((p) => p.projectId === projectId) : rawList;
    return filtered.map((p) => ({
      month: p.projectName,
      progress: p.progressPercent || 0
    }));
  },
  getProjectHealth: async (projectId) => {
    const res = await client.get(`/api/reports/project/${projectId}/health`);
    const data = res.data?.data || res.data;
    return data;
  },
  getAllProjectHealth: async () => {
    const res = await client.get(`/api/reports/project/summary`);
    const data = res.data?.data || res.data;
    const rawList = Array.isArray(data) ? data : data?.content || [];
    return rawList.map((p) => ({
      ...p,
      budgetVariance: p.budgetVariancePercent || 0
    }));
  },
  getSafetyComplianceBreakdown: async (projectId) => {
    try {
      const res = await client.get(`/api/reports/safety/compliance-breakdown`);
      const data = res.data?.data || res.data;
      const list = Array.isArray(data) ? data : data?.content || [];
      if (list.length > 0) {
        return list;
      }
      return [
        { category: "Fire Safety", value: 85, color: "#FF4D4F" },
        { category: "PPE Compliance", value: 92, color: "#52C41A" },
        { category: "Site Access", value: 78, color: "#1890FF" },
        { category: "Equipment Safety", value: 88, color: "#722ED1" }
      ];
    } catch (error) {
      console.warn("Safety compliance breakdown failed, using mock data", error);
      return [
        { category: "Fire Safety", value: 85, color: "#FF4D4F" },
        { category: "PPE Compliance", value: 92, color: "#52C41A" },
        { category: "Site Access", value: 78, color: "#1890FF" },
        { category: "Equipment Safety", value: 88, color: "#722ED1" }
      ];
    }
  },
  // 2. Report Generation & History
  generateReport: async (scope, targetId) => {
    const payload = targetId ? { scope, targetId } : { scope };
    const res = await client.post("/api/reports/generate", payload, { _skipRedirect: true });
    return res.data?.data ?? res.data;
  },
  getReportById: async (id) => {
    try {
      const res = await client.get(`/api/reports/${id}`, { _skipRedirect: true });
      return res.data?.data ?? res.data;
    } catch {
      return null;
    }
  },
  getReportHistory: async (scope) => {
    try {
      const res = await client.get(`/api/reports/history/${scope}`, { _skipRedirect: true });
      const data = res.data?.data || res.data;
      return Array.isArray(data) ? data : data?.content || [];
    } catch {
      return [];
    }
  },
  // 3. Project Analytics
  getProjectSummaries: async () => {
    const res = await client.get("/api/reports/project/summary");
    const data = res.data?.data !== void 0 ? res.data.data : res.data;
    const projects = Array.isArray(data) ? data : data?.content || [];
    return projects.map((p, index) => ({
      ...p,
      imageUrl: p.imageUrl || getRandomProjectImage()
    }));
  },
  getProjectBudgetAlerts: async (projectId) => {
    const res = await client.get(`/api/reports/finance/budget-variance/${projectId}`);
    return res.data?.data || res.data;
  },
  getProjectCashFlow: async (projectId) => {
    const res = await client.get(`/api/reports/finance/cash-flow?projectId=${projectId}`);
    return res.data?.data || res.data;
  },
  // 4. Vendor Analytics
  getVendorPerformance: async (vendorId) => {
    const url = vendorId ? `/api/reports/vendor/performance/${vendorId}` : "/api/reports/vendor/performance";
    const res = await client.get(url);
    return res.data?.data || res.data;
  },
  getVendorCompliance: async () => {
    const res = await client.get("/api/reports/vendor/compliance");
    return res.data?.data || res.data;
  },
  getVendorActiveContracts: async () => {
    try {
      const res = await client.get("/api/reports/vendor/analytics/active-contracts", { _skipRedirect: true });
      return res.data?.data ?? res.data;
    } catch { return null; }
  },
  getVendorPendingDocuments: async () => {
    try {
      const res = await client.get("/api/reports/vendor/analytics/pending-documents", { _skipRedirect: true });
      return res.data?.data ?? res.data;
    } catch { return null; }
  },
  getVendorSubmittedInvoices: async () => {
    try {
      const res = await client.get("/api/reports/vendor/analytics/submitted-invoices", { _skipRedirect: true });
      return res.data?.data ?? res.data;
    } catch { return null; }
  },
  getVendorAssignedTasks: async () => {
    try {
      const res = await client.get("/api/reports/vendor/analytics/assigned-tasks", { _skipRedirect: true });
      return res.data?.data ?? res.data;
    } catch { return null; }
  },
  // 5. Site Engineer Analytics
  getSiteEngineerPerformance: async (engineerId) => {
    const url = engineerId ? `/api/reports/site-engineer/performance/${engineerId}` : "/api/reports/site-engineer/performance";
    const res = await client.get(url);
    return res.data?.data || res.data;
  },
  getSiteProgressSummary: async () => {
    const res = await client.get("/api/reports/site-engineer/summary");
    return res.data?.data || res.data;
  },
  getSiteEngineerDailyLogs: async (engineerId) => {
    const url = engineerId ? `/api/reports/site-engineer/daily-logs/${engineerId}` : "/api/reports/site-engineer/daily-logs";
    const res = await client.get(url);
    return res.data?.data || res.data;
  },
  // 6. Safety Analytics
  getSafetyTrends: async (projectId) => {
    const url = projectId ? `/api/reports/safety/trends?projectId=${projectId}` : `/api/reports/safety/trends`;
    const res = await client.get(url);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  getSafetyInspectionSummary: async (projectId) => {
    const url = projectId ? `/api/reports/safety/inspections-summary?projectId=${projectId}` : `/api/reports/safety/inspections-summary`;
    const res = await client.get(url);
    const data = res.data?.data || res.data;
    return data;
  },
  // 7. Resource Analytics
  getResourceUtilization: async (projectId) => {
    const url = projectId ? `/api/reports/resources/utilization?projectId=${projectId}` : `/api/reports/resources/utilization`;
    const res = await client.get(url);
    return res.data?.data || res.data;
  },
  getLaborAllocation: async (projectId) => {
    const url = projectId ? `/api/reports/resources/labor-allocation?projectId=${projectId}` : `/api/reports/resources/labor-allocation`;
    const res = await client.get(url);
    return res.data?.data || res.data;
  },
  // 8. User Analytics
  getUserAnalyticsSummary: async () => {
    try {
      const res = await client.get("/api/reports/users/analytics", { _skipRedirect: true });
      return res.data?.data || res.data;
    } catch (error) {
      console.warn("User analytics summary failed", error);
      return { totalUsers: 0, activeUsers: 0, inactiveUsers: 0, suspendedUsers: 0, usersByRole: {} };
    }
  },
  getAllUsersList: async (role) => {
    try {
      const url = role === "ADMIN" ? "/admin/users" : "/users/all";
      const res = await client.get(url, { _skipRedirect: true });
      const rawData = res.data?.data !== void 0 ? res.data.data : res.data;
      if (Array.isArray(rawData)) return rawData;
      if (rawData?.content && Array.isArray(rawData.content)) return rawData.content;
      return [];
    } catch (error) {
      console.error("Error fetching users list:", error);
      return [];
    }
  }
};
var stdin_default = analyticsService;
export {
  stdin_default as default
};
