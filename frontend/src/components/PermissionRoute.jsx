import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import useAuth from "../context/useAuth";

function PermissionRoute({ permission }) {
  const location = useLocation();

  const {
    user,
    loading,
    isAuthenticated,
    hasPermission,
  } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  const role = user.role
    ?.trim()
    .toLowerCase();

  const isAdmin = role === "admin";

  // Admin can access every feature.
  // Other users need the requested permission.
  if (
    !isAdmin &&
    !hasPermission(permission)
  ) {
    return (
      <Navigate
        to="/app/dashboard"
        replace
      />
    );
  }

  return <Outlet />;
}

export default PermissionRoute;
