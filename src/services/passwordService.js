import client from "../api/client";
const passwordService = {
  forgotPassword: (email) => client.post("/api/auth/forgot-password", { email }),
  resetPassword: (data) => client.post("/api/auth/reset-password", data),
  validateToken: (token) => client.get(`/api/auth/validate-reset-token/${token}`)
};
export {
  passwordService
};
