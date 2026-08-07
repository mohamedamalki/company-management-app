import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../context/useAuth";

const dashboardByRole = {
    admin: "/admin/dashboard",
    responsable: "/responsable/dashboard",
    fournisseur: "/fournisseur/dashboard",
};

function ProtectedRoute({ allowedRoles = [] }) {
    const {
        user,
        loading,
        isAuthenticated,
    } = useAuth();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <span className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                    <p className="text-sm font-medium text-slate-500">
                        Checking authentication...
                    </p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    const role = user.role
        ?.trim()
        .toLowerCase();

    if (!role) {
        return <Navigate to="/login" replace />;
    }

    const normalizedAllowedRoles = allowedRoles.map(
        (allowedRole) =>
            allowedRole.trim().toLowerCase()
    );

    if (
        normalizedAllowedRoles.length > 0 &&
        !normalizedAllowedRoles.includes(role)
    ) {
        return (
            <Navigate
                to={dashboardByRole[role] ?? "/login"}
                replace
            />
        );
    }

    return <Outlet />;
}

export default ProtectedRoute;
