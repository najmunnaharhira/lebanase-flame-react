import { Navigate, Outlet } from "react-router-dom";
import { hasAdminSession, hasAnyRole } from "@/lib/adminAuth";

interface ProtectedAdminRouteProps {
  roles?: Array<"admin" | "moderator" | "editor" | "user">;
}

const ProtectedAdminRoute = ({ roles }: ProtectedAdminRouteProps) => {
  if (!hasAdminSession()) {
    return <Navigate to="/admin/login" replace />;
  }

  if (roles && roles.length > 0 && !hasAnyRole(roles)) {
    return <Navigate to="/admin/orders" replace />;
  }

  return <Outlet />;
};

export default ProtectedAdminRoute;
