import client from "../api/client";
const vendorService = {
  // Contracts
  getContracts: async (page = 0, size = 10, sortBy = "contractId", sortDir = "asc") => {
    const res = await client.get(`/api/contracts?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) return { content: data, totalElements: data.length };
    return data;
  },
  getContractById: async (id) => {
    const res = await client.get(`/api/contracts/${id}`);
    return res.data?.data || res.data;
  },
  getContractsByVendor: async (vendorId) => {
    const res = await client.get(`/api/contracts/vendor/${vendorId}`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  getContractsByStatus: async (status) => {
    const res = await client.get(`/api/contracts/status/${status}`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  createContract: async (payload) => {
    const res = await client.post("/api/contracts", payload);
    return res.data?.data || res.data;
  },
  updateContract: async (id, payload) => {
    await client.put(`/api/contracts/${id}`, payload);
  },
  patchContract: async (id, payload) => {
    await client.patch(`/api/contracts/${id}`, payload);
  },
  deleteContract: async (id) => {
    await client.delete(`/api/contracts/${id}`);
  },
  // Invoices
  getInvoices: async (page = 0, size = 10, sortBy = "invoiceId", sortDir = "asc") => {
    const res = await client.get(`/api/invoices?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) return { content: data, totalElements: data.length };
    return data;
  },
  getInvoiceById: async (id) => {
    const res = await client.get(`/api/invoices/${id}`);
    return res.data?.data || res.data;
  },
  getInvoicesByContract: async (contractId) => {
    const res = await client.get(`/api/invoices/contract/${contractId}`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  getInvoicesByStatus: async (status) => {
    const res = await client.get(`/api/invoices/status/${status}`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  createInvoice: async (payload) => {
    const res = await client.post("/api/invoices", payload);
    return res.data?.data || res.data;
  },
  updateInvoice: async (id, payload) => {
    await client.put(`/api/invoices/${id}`, payload);
  },
  deleteInvoice: async (id) => {
    await client.delete(`/api/invoices/${id}`);
  },
  submitInvoice: async (id) => {
    const res = await client.post(`/api/invoices/${id}/submit`, {}, { _skipRedirect: true });
    return res.data?.data || res.data;
  },
  getInvoiceStatus: async (id) => {
    const res = await client.get(`/api/invoices/${id}/status`);
    return res.data?.data || res.data;
  },
  // Vendor Approval (PM) - PM review and approval of vendor invoices
  getPendingInvoices: async () => {
    const res = await client.get("/api/vendor/invoices/pending");
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  rejectInvoice: async (approvalId, rejectionReason) => {
    await client.post(`/api/vendor/invoices/${approvalId}/reject?rejectionReason=${rejectionReason}`);
  },
  approveInvoice: async (approvalId) => {
    await client.post(`/api/vendor/invoices/${approvalId}/approve`);
  },
  // Deliveries
  getDeliveries: async (page = 0, size = 10, sortBy = "deliveryId", sortDir = "asc") => {
    const res = await client.get(`/api/deliveries?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) return { content: data, totalElements: data.length };
    return data;
  },
  getDeliveryById: async (id) => {
    const res = await client.get(`/api/deliveries/${id}`);
    return res.data?.data || res.data;
  },
  getDeliveriesByContract: async (contractId) => {
    const res = await client.get(`/api/deliveries/contract/${contractId}`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  getDeliveriesByStatus: async (status) => {
    const res = await client.get(`/api/deliveries/status/${status}`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  createDelivery: async (payload) => {
    const res = await client.post("/api/deliveries", payload);
    return res.data?.data || res.data;
  },
  updateDelivery: async (id, payload) => {
    await client.put(`/api/deliveries/${id}`, payload);
  },
  deleteDelivery: async (id) => {
    await client.delete(`/api/deliveries/${id}`);
  },
  // Documents
  getDocuments: async (page = 0, size = 100, sortBy = "documentId", sortDir = "asc") => {
    const res = await client.get(`/api/documents?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
    const data = res.data?.data || res.data;
    // Always return a flat array so the page can use .filter / .length directly
    if (Array.isArray(data)) return data;
    if (data?.content) return Array.isArray(data.content) ? data.content : [];
    return [];
  },
  getDocumentById: async (id) => {
    const res = await client.get(`/api/documents/${id}`);
    return res.data?.data || res.data;
  },
  getDocumentsByVendor: async (vendorId) => {
    const res = await client.get(`/api/documents/vendor/${vendorId}`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  getDocumentsByType: async (type) => {
    const res = await client.get(`/api/documents/type/${type}`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  getDocumentsByStatus: async (status) => {
    const res = await client.get(`/api/documents/status/${status}`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  // file      → the actual File object (goes in multipart body)
  // params    → { documentType, description, taskId, projectId, contractId }
  //             sent as query parameters — this is what the backend expects
  uploadDocument: async (file, params) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await client.post("/api/documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      params,   // → ?documentType=...&description=...&taskId=...&projectId=...&contractId=...
    });
    return res.data?.data || res.data;
  },
  updateDocument: async (id, formData) => {
    await client.put(`/api/documents/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  },
  downloadDocument: async (id) => {
    const res = await client.get(`/api/documents/${id}/download`, { responseType: "blob" });
    return res.data;
  },
  deleteDocument: async (id) => {
    await client.delete(`/api/documents/${id}`);
  },
  submitDocument: async (id) => {
    await client.post(`/api/documents/${id}/submit`);
  },
  // Vendors
  getVendors: async () => {
    const res = await client.get("/api/vendors");
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  getVendorById: async (id) => {
    const res = await client.get(`/api/vendors/${id}`);
    return res.data?.data || res.data;
  },
  createVendor: async (payload) => {
    const res = await client.post("/api/vendors", payload);
    return res.data?.data || res.data;
  },
  updateVendor: async (id, payload) => {
    await client.put(`/api/vendors/${id}`, payload);
  },
  deleteVendor: async (id) => {
    await client.delete(`/api/vendors/${id}`);
  },
  // Vendor Tasks
  getTasks: async () => {
    const res = await client.get("/api/vendor/tasks");
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  getTasksByProject: async (projectId) => {
    const res = await client.get(`/api/vendor/tasks/project/${projectId}`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  submitTask: async (assignedTaskId, payload) => {
    await client.post(`/api/vendor/tasks/${assignedTaskId}/submit`, payload);
  },
  syncTasks: async (config) => {
    await client.post("/api/vendor/tasks/sync", {}, config);
    return { message: "Tasks synchronized successfully." };
  },
  // KPI
  getKpi: async () => {
    try {
      const res = await client.get("/api/vendor/kpi");
      return res.data?.data || res.data;
    } catch {
      return { activeContracts: 0, pendingDocuments: 0, submittedInvoices: 0, assignedTasks: 0, totalContractValue: 0 };
    }
  },
  // Vendor Notifications
  getNotifications: async () => {
    const res = await client.get("/api/vendor-notifications");
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : data?.content || [];
  },
  markRead: async (id) => {
    await client.patch(`/api/vendor-notifications/${id}/read`);
  },
  markAllRead: async () => {
    await client.post("/api/vendor-notifications/read-all");
  },
  // Vendor Integration (Internal)
  syncFromPm: async () => {
    await client.post("/api/vendor-integration/sync-from-pm");
  },
  updateApprovalStatus: async (approvalId, params) => {
    await client.put(`/api/vendor-integration/approvals/${approvalId}/status`, null, { params });
  },
  getTasksByProjectIntegration: async (projectId) => {
    const res = await client.get(`/api/vendor-integration/projects/${projectId}/tasks`);
    return res.data?.data || res.data;
  },
  notifyVendorTask: async (payload) => {
    await client.post("/api/vendor-integration/tasks/notify", null, { params: payload });
  },
  syncDeliveryFromSite: async (deliveryId) => {
    await client.post(`/api/vendor-integration/deliveries/${deliveryId}/sync-from-site`);
  },
  updateSiteDeliveryStatus: async (deliveryId, params) => {
    await client.patch(`/api/vendor-integration/deliveries/${deliveryId}/site-status`, null, { params });
  }
};
var stdin_default = vendorService;
export {
  stdin_default as default
};
