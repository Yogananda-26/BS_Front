import client from "../api/client";
const safetyService = {
  // Inspections
  getInspections: async (filters) => {
    const params = new URLSearchParams();
    if (filters?.projectId) params.append("projectId", filters.projectId);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters?.dateTo) params.append("dateTo", filters.dateTo);
    params.append("page", (filters?.page || 0).toString());
    params.append("size", (filters?.size || 10).toString());
    console.log("Fetching Inspections from:", `/api/safety/inspections?${params.toString()}`);
    const res = await client.get(`/api/safety/inspections?${params.toString()}`, {
      // @ts-ignore
      _skipRedirect: true
    });
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) {
      return { content: data, totalElements: data.length };
    }
    return data;
  },
  getInspectionById: async (id) => {
    const res = await client.get(`/api/safety/inspections/${id}`);
    return res.data?.data || res.data;
  },
  createInspection: async (payload) => {
    console.log("Creating Inspection with payload:", JSON.stringify(payload, null, 2));
    const res = await client.post("/api/safety/inspections", payload, { _skipRedirect: true });
    return res.data?.data || res.data;
  },
  updateInspectionStatus: async (id, status) => {
    await client.patch(`/api/safety/inspections/${id}/status?status=${status}`, {}, { _skipRedirect: true });
  },
  deleteInspection: async (id) => {
    await client.delete(`/api/safety/inspections/${id}`, { _skipRedirect: true });
  },
  getInspectionTypes: async () => {
    console.log("Fetching Inspection Types...");
    const res = await client.get("/api/safety/inspections/types", {
      // @ts-ignore
      _skipRedirect: true
    });
    return res.data?.data || res.data;
  },
  // Incidents
  getIncidents: async (filters) => {
    const params = new URLSearchParams();
    if (filters?.projectId) params.append("projectId", filters.projectId);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.severity) params.append("severity", filters.severity);
    if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters?.dateTo) params.append("dateTo", filters.dateTo);
    params.append("page", (filters?.page || 0).toString());
    params.append("size", (filters?.size || 10).toString());
    console.log("Fetching Incidents from:", `/api/safety/incidents?${params.toString()}`);
    const res = await client.get(`/api/safety/incidents?${params.toString()}`, {
      // @ts-ignore
      _skipRedirect: true
    });
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) {
      return { content: data, totalElements: data.length };
    }
    return data;
  },
  getIncidentById: async (id) => {
    const res = await client.get(`/api/safety/incidents/${id}`);
    return res.data?.data || res.data;
  },
  createIncident: async (payload) => {
    console.log("Creating Incident with payload:", JSON.stringify(payload, null, 2));
    const res = await client.post("/api/safety/incidents", payload, { _skipRedirect: true });
    return res.data?.data || res.data;
  },
  updateIncidentStatus: async (id, status) => {
    await client.patch(`/api/safety/incidents/${id}/status?status=${status}`, {}, { _skipRedirect: true });
  },
  deleteIncident: async (id) => {
    await client.delete(`/api/safety/incidents/${id}`, { _skipRedirect: true });
  },
  // Safety Tasks
  getTasks: async () => {
    const res = await client.get("/api/safety/tasks", { _skipRedirect: true });
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  getTasksByProject: async (projectId) => {
    const res = await client.get(`/api/safety/tasks/project/${projectId}`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  submitTask: async (assignedTaskId, payload) => {
    console.log(`Submitting Task ${assignedTaskId} with payload:`, JSON.stringify(payload, null, 2));
    await client.post(`/api/safety/tasks/${assignedTaskId}/submit`, payload, { _skipRedirect: true });
  },
  syncTasks: async (config) => {
    await client.post("/api/safety/tasks/sync", {}, { _skipRedirect: true, ...config });
    return { message: "Tasks synchronized successfully with the project management service." };
  },
  // Safety Notifications
  getNotifications: async () => {
    const res = await client.get("/api/safety/notifications");
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  createNotification: async (payload) => {
    await client.post("/api/safety/notifications", payload);
  },
  // KPI Summary
  getKpiSummary: async () => {
    try {
      const [incidentsRes, inspectionsRes, tasksRes] = await Promise.all([
        client.get("/api/safety/incidents", { _skipRedirect: true }).catch(() => ({ data: { content: [] } })),
        client.get("/api/safety/inspections", { _skipRedirect: true }).catch(() => ({ data: { content: [] } })),
        client.get("/api/safety/tasks", { _skipRedirect: true }).catch(() => ({ data: { content: [] } }))
      ]);
      const incidents = incidentsRes.data?.data?.content || incidentsRes.data?.content || incidentsRes.data || [];
      const inspections = inspectionsRes.data?.data?.content || inspectionsRes.data?.content || inspectionsRes.data || [];
      const tasks = tasksRes.data?.data?.content || tasksRes.data?.content || tasksRes.data || [];
      return {
        openIncidents: Array.isArray(incidents) ? incidents.filter((i) => i.status === "OPEN").length : 0,
        pendingInspections: Array.isArray(inspections) ? inspections.filter((i) => i.status === "SCHEDULED" || i.status === "IN_PROGRESS").length : 0,
        assignedTasks: Array.isArray(tasks) ? tasks.length : 0,
        highSeverityIncidents: Array.isArray(incidents) ? incidents.filter((i) => i.severity === "HIGH" || i.severity === "CRITICAL").length : 0
      };
    } catch (err) {
      console.error("Failed to aggregate KPI summary:", err);
      return { openIncidents: 0, pendingInspections: 0, assignedTasks: 0, highSeverityIncidents: 0 };
    }
  },
  // Notifications Actions
  markRead: async (id) => {
    await client.patch(`/api/safety/notifications/${id}/read`);
  },
  markAllRead: async () => {
    await client.post("/api/safety/notifications/read-all");
  }
};
var stdin_default = safetyService;
export {
  stdin_default as default
};
