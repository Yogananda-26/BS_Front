import client from "../api/client";

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const financeService = {
  // Budgets
  getBudgets: async () => {
    const res = await client.get("/api/budgets/status/APPROVED?page=0&size=100");
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  getBudgetsByStatus: async (status, page = 0, size = 100) => {
    const res = await client.get(`/api/budgets/status/${status}?page=${page}&size=${size}`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  getBudgetUtilization: async (budgetId) => {
    const res = await client.get(`/api/budgets/${budgetId}/utilization`);
    return res.data?.data || res.data;
  },
  getProjectBudgetUtilization: async (projectId) => {
    const res = await client.get(`/api/budgets/projects/${projectId}/utilization`);
    return res.data?.data || res.data;
  },
  getBudgetById: async (id) => {
    const res = await client.get(`/api/budgets/${id}`);
    return res.data?.data || res.data;
  },
  getBudgetsByProject: async (projectId, page = 0, size = 10) => {
    const res = await client.get(`/api/budgets/projects/${projectId}?page=${page}&size=${size}&sortBy=createdAt&sortOrder=DESC`);
    return res.data?.data || res.data;
  },
  createBudget: async (payload) => {
    const user   = getStoredUser();
    const userId = user?.userId || user?.email || "";
    const res = await client.post("/api/budgets", {
      ...payload,
      userId,
      createdBy: userId
    });
    return res.data?.data || res.data;
  },
  updateBudget: async (id, payload) => {
    await client.patch(`/api/budgets/${id}`, payload);
  },
  deleteBudget: async (id) => {
    await client.delete(`/api/budgets/${id}`);
  },
  submitBudget: async (id) => {
    await client.post(`/api/budgets/${id}/submit`);
  },
  approveBudget: async (id) => {
    await client.post(`/api/budgets/${id}/approval`);
  },
  getPendingBudgets: async () => {
    const res = await client.get("/api/finance/budgets/pending");
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
syncBudgetApprovals: async () => {
  const res = await client.post("/api/budgets/sync-approvals");
  return res.data?.data || res.data;
},


  rejectBudget: async (budgetId, rejectionReason) => {
    await client.post(`/api/finance/budgets/${budgetId}/reject?rejectionReason=${rejectionReason}`);
  },
  approveFinanceBudget: async (budgetId) => {
    await client.post(`/api/finance/budgets/${budgetId}/approve`);
  },
  // Payments
  getPayments: async () => {
    const res = await client.get("/api/payments/status/COMPLETED?page=0&size=100");
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  getPaymentsByStatus: async (status, page = 0, size = 100) => {
    const res = await client.get(`/api/payments/status/${status}?page=${page}&size=${size}&sortBy=createdAt&sortOrder=DESC`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  getPaymentById: async (id) => {
    const res = await client.get(`/api/payments/${id}`);
    return res.data?.data || res.data;
  },

  getPaymentsByUser: async (createdBy, page = 0, size = 100) => {
    const res = await client.get(`/api/payments/users/${createdBy}?page=${page}&size=${size}&sortBy=createdAt&sortOrder=DESC`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  createPayment: async (payload) => {
    const res = await client.post("/api/payments", payload);
    return res.data?.data || res.data;
  },
  updatePaymentStatus: async (id) => {
    await client.post(`/api/payments/${id}/status`);
  },
  updatePaymentStatusFull: async (paymentId, payload) => {
    // payload: { status, approvedBy, rejectionReason }
    const res = await client.post(`/api/payments/${paymentId}/status`, payload);
    return res.data?.data || res.data;
  },
  getPendingPayments: async (page = 0, size = 10) => {
    const res = await client.get(`/api/payments/pending?page=${page}&size=${size}&sortBy=createdAt&sortOrder=DESC`);
    return res.data?.data || res.data;
  },
  // Invoices (via payments service)
  getApprovedInvoices: async () => {
    const res = await client.get("/api/payments/invoices/approved");
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  getInvoiceById: async (invoiceId) => {
    const res = await client.get(`/api/payments/invoices/${invoiceId}`);
    return res.data?.data || res.data;
  },
  // Finance Tasks
  getTasks: async () => {
    const res = await client.get("/api/finance/tasks", { _skipRedirect: true });
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  getTasksByProject: async (projectId) => {
    const res = await client.get(`/api/finance/tasks/project/${projectId}`, { _skipRedirect: true });
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  submitTask: async (id, description = "") => {
    await client.post(`/api/finance/tasks/${id}/submit`, { description }, { _skipRedirect: true });
  },
  syncTasks: async (config) => {
    await client.post("/api/finance/tasks/sync", {}, { ...(config || {}), _skipRedirect: true });
    return { message: "Tasks synchronized successfully." };
  },
  // Internal / Helper
  getResourceBudgetStatus: async (projectId, resourceId) => {
    const res = await client.get(`/api/finance/budget/status?projectId=${projectId}&resourceId=${resourceId}`);
    return res.data?.data || res.data;
  },
  requestResourceBudget: async (payload) => {
    await client.post("/api/finance/budget/resource-request", payload);
  },
  // KPI
  getKpi: async () => {
    try {
      const res = await client.get("/api/finance/kpi");
      return res.data?.data || res.data;
    } catch {
      return { totalBudget: 0, totalExpenses: 0, budgetUtilization: 0, pendingApprovals: 0 };
    }
  },
  // Notifications
  getNotifications: async () => {
    const res = await client.get("/api/finance/notifications");
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  markRead: async (id) => {
    await client.patch(`/api/finance/notifications/${id}/read`);
  },
  markAllRead: async () => {
    await client.post("/api/finance/notifications/read-all");
  }
};
export {
  financeService
};
