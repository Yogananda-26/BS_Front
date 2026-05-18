import client from "../api/client";
const userService = {
  /**
   * GET /admin/users?page=0&size=10&sortBy=createdAt&sortDir=desc
   */
  getAllUsers: async (page = 0, size = 10, sortBy = "createdAt", sortDir = "desc") => {
    const res = await client.get(
      `/admin/users?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
    );
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) {
      return {
        content: data,
        totalElements: data.length,
        totalPages: 1,
        page: 0,
        size: data.length
      };
    }
    return data;
  },
  /**
   * GET /admin/pending-users
   */
  getPendingUsers: async () => {
    const res = await client.get("/admin/pending-users");
    return res.data?.data || res.data;
  },
  /**
   * POST /admin/approve-user/{userId}
   */
  approveUser: async (userId) => {
    const res = await client.post(`/admin/approve-user/${userId}`);
    return res.data?.data || res.data;
  },
  /**
   * POST /admin/reject-user/{userId}
   */
  rejectUser: async (userId) => {
    await client.post(`/admin/reject-user/${userId}`);
  },
  /**
   * GET /admin/users/{userId}
   */
  getUserByIdAdmin: async (userId) => {
    const res = await client.get(`/admin/users/${userId}`);
    return res.data?.data || res.data;
  },
  /**
   * PUT /admin/users/{userId}
   */
  updateUser: async (userId, payload) => {
    const res = await client.put(`/admin/users/${userId}`, payload);
    return res.data.data;
  },
  /**
   * DELETE /admin/users/{userId}
   */
  deleteUser: async (userId) => {
    await client.delete(`/admin/users/${userId}`);
  },
  /**
   * GET /admin/users/role/{role}
   */
  getUsersByRole: async (role) => {
    const res = await client.get(`/admin/users/role/${role}`);
    return res.data?.data || res.data;
  },
  /**
   * GET /users/profile
   */
  getProfile: async () => {
    const res = await client.get("/users/profile");
    return res.data?.data || res.data;
  },
  /**
   * PUT /users/profile
   */
  updateProfile: async (payload) => {
    const res = await client.put("/users/profile", payload);
    return res.data.data;
  },
  /**
   * GET /users/check-role/{requiredRole}
   */
  checkRole: async (requiredRole) => {
    const res = await client.get(`/users/check-role/${requiredRole}`);
    return res.data?.data || res.data;
  },
  /**
   * GET /users/{userId}
   */
  getUserById: async (userId) => {
    const res = await client.get(`/users/${userId}`);
    return res.data?.data || res.data;
  },
  /**
   * GET /users/by-email?email={email}
   */
  getUserByEmail: async (email) => {
    const res = await client.get(`/users/by-email?email=${email}`);
    return res.data?.data || res.data;
  },
  /**
   * GET /users/all
   */
  getAllUsersList: async () => {
    const res = await client.get("/users/all", { _skipRedirect: true });
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : [];
  }
};
export {
  userService
};
