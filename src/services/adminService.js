import client from "../api/client";
const adminService = {
  /**
   * GET /admin/pending-users
   */
  getPendingUsers: () => client.get("/admin/pending-users").then((r) => r.data?.data || r.data),
  /**
   * POST /admin/approve-user/{userId}
   */
  approveUser: (userId) => client.post(`/admin/approve-user/${userId}`).then((r) => r.data?.data || r.data),
  /**
   * POST /admin/reject-user/{userId}
   */
  rejectUser: (userId) => client.post(`/admin/reject-user/${userId}`),
  /**
   * GET /admin/users?page=0&size=10&sortBy=createdAt&sortDir=desc
   */
  getAllUsers: (page = 0, size = 10, sortBy = "createdAt", sortDir = "desc") => client.get(`/admin/users?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`).then((r) => {
    const data = r.data?.data || r.data;
    if (Array.isArray(data)) {
      return { content: data, totalElements: data.length };
    }
    return data;
  }),
  /**
   * GET /admin/users/{userId}
   */
  getUserById: (userId) => client.get(`/admin/users/${userId}`).then((r) => r.data?.data || r.data),
  /**
   * PUT /admin/users/{userId}
   */
  updateUser: (userId, data) => client.put(`/admin/users/${userId}`, data).then((r) => r.data?.data || r.data),
  /**
   * DELETE /admin/users/{userId}
   */
  deleteUser: (userId) => client.delete(`/admin/users/${userId}`),
  /**
   * GET /admin/users/role/{role}
   */
  getUsersByRole: (role) => client.get(`/admin/users/role/${role}`).then((r) => r.data?.data || r.data),
  /**
   * GET /admin/audit-logs?page=0&size=20
   */
  getAuditLogs: (page = 0, size = 20) => client.get(`/admin/audit-logs?page=${page}&size=${size}`).then((r) => r.data?.data || r.data),
  /**
   * GET /admin/audit-logs/user/{userId}
   */
  getAuditLogsByUser: (userId) => client.get(`/admin/audit-logs/user/${userId}`).then((r) => r.data?.data || r.data)
};
export {
  adminService
};
