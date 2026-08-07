import { ArrowLeft, Home, MapPinOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const dashboardByRole = {
    admin: "/admin/dashboard",
    responsable: "/responsable/dashboard",
    fournisseur: "/fournisseur/dashboard",
};

function getDashboardPath() {
    const storedUser =
        sessionStorage.getItem("user") ??
        localStorage.getItem("user");

    if (!storedUser) {
        return "/login";
    }

    try {
        const user = JSON.parse(storedUser);
        const role = user?.role?.trim().toLowerCase();

        return dashboardByRole[role] ?? "/login";
    } catch {
        return "/login";
    }
}

function NotFoundPage() {
    const navigate = useNavigate();
    const dashboardPath = getDashboardPath();

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-6 py-12">
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-100/70 blur-3xl" />

            <section className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/60 sm:p-12">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-300">
                    <MapPinOff size={38} strokeWidth={1.8} />
                </div>

                <p className="text-sm font-bold uppercase tracking-[0.28em] text-blue-600">
                    Error 404
                </p>

                <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                    Page not found
                </h1>

                <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-slate-500">
                    The page you are looking for does not exist, was moved,
                    or you do not have access to it.
                </p>

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link
                        to={dashboardPath}
                        replace
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200"
                    >
                        <Home size={18} />
                        Go to dashboard
                    </Link>

                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
                    >
                        <ArrowLeft size={18} />
                        Go back
                    </button>
                </div>
            </section>
        </main>
    );
}

export default NotFoundPage;
