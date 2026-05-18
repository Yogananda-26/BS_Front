import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLE_ROUTES } from "../utils/constants";
const ProtectedRoute = ({ allowedRoles, modulePath }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user.status !== "ACTIVE") {
    return <Navigate to="/pending-verification" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  if (modulePath) {
    const userAllowedRoutes = ROLE_ROUTES[user.role];
    const isAllowed = userAllowedRoutes.some((route) => modulePath.startsWith(route));
    if (!isAllowed) {
      return <Navigate to="/unauthorized" replace />;
    }
  }
  return <Outlet />;
};
export {
  ProtectedRoute
};
