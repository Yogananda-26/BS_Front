import client from "../api/client";
const authService = {
  /**
   * POST /api/auth/login
   */
  login: (credentials) => client.post("/api/auth/login", credentials),
  /**
   * POST /api/auth/signup
   */
  signup: (data) => client.post("/api/auth/signup", data),
  /**
   * POST /api/auth/logout
   */
  logout: () => client.post("/api/auth/logout"),
  /**
   * POST /api/auth/forgot-password
   */
  forgotPassword: (email) => client.post("/api/auth/forgot-password", { email }),
  /**
   * POST /api/auth/reset-password
   */
  resetPassword: (data) => client.post("/api/auth/reset-password", data),
  /**
   * GET /api/auth/validate-reset-token/{token}
   */
  validateToken: (token) => client.get(`/api/auth/validate-reset-token/${token}`)
};
export {
  authService
};
