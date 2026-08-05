import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const requestUsers = async () => {
    const response = await api.get("/users");

    const data =
        response.data.data ??
        response.data.users ??
        response.data;

    return Array.isArray(data) ? data : [];
};

const initials = (name = "") =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");

const roleStyles = {
    admin: "bg-violet-50 text-violet-700 ring-violet-600/20",
    responsable: "bg-blue-50 text-blue-700 ring-blue-600/20",
    fournisseur: "bg-amber-50 text-amber-700 ring-amber-600/20",
};

const avatarPalette = [
    "bg-blue-100 text-blue-700",
    "bg-violet-100 text-violet-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
];

const avatarColor = (seed = "") =>
    avatarPalette[
        seed
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0) %
            avatarPalette.length
    ];

function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [pendingId, setPendingId] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const loadUsers = async () => {
            try {
                const data = await requestUsers();

                if (!cancelled) {
                    setUsers(data);
                }
            } catch (error) {
                console.error(error);

                if (!cancelled) {
                    setError("Unable to load users.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadUsers();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleStatus = async (user) => {
        if (user.role === "admin") {
        setError("The admin account cannot be disabled.");
        return;
        }
    const newStatus =
        user.status === "active"
            ? "inactive"
            : "active";

    try {
        setError("");

        await api.patch(`/users/${user.id}`, {
            status: newStatus,
        });

        setUsers((currentUsers) =>
            currentUsers.map((currentUser) =>
                currentUser.id === user.id
                    ? {
                        ...currentUser,
                        status: newStatus,
                    }
                    : currentUser
            )
        );
    } catch (error) {
        setError(
            error.response?.data?.message ??
                "Unable to change user status."
        );
    } finally {
            setPendingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
            <div className="mx-auto max-w-6xl space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                            Users
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Manage responsables and fournisseurs across your organization.
                        </p>
                    </div>

                    <Link
                        to="/admin/users/create"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                    >
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4.5v15m7.5-7.5h-15"
                            />
                        </svg>
                        Create user
                    </Link>
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <svg
                            className="mt-0.5 h-4 w-4 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                            />
                        </svg>
                        <span>{error}</span>
                        <button
                            type="button"
                            onClick={() => setError("")}
                            className="ml-auto text-red-400 hover:text-red-600"
                            aria-label="Dismiss"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18 18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Table card */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/80">
                                    <th className="px-5 py-3 font-medium text-slate-500">
                                        Name
                                    </th>
                                    <th className="px-5 py-3 font-medium text-slate-500">
                                        Role
                                    </th>
                                    <th className="px-5 py-3 font-medium text-slate-500">
                                        Status
                                    </th>
                                    <th className="px-5 py-3 text-right font-medium text-slate-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            <td className="px-5 py-4" colSpan={5}>
                                                <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                                            </td>
                                        </tr>
                                    ))
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-16 text-center">
                                            <div className="mx-auto flex max-w-xs flex-col items-center gap-2">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                                                    <svg
                                                        className="h-5 w-5 text-slate-400"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        strokeWidth={1.5}
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                                                        />
                                                    </svg>
                                                </div>
                                                <p className="font-medium text-slate-700">
                                                    No users yet
                                                </p>
                                                <p className="text-slate-400">
                                                    Create your first user to get started.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="transition-colors hover:bg-slate-50"
                                        >
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarColor(
                                                            user.name || user.email
                                                        )}`}
                                                    >
                                                        {initials(user.name) || "?"}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate font-medium text-slate-800">
                                                            {user.name}
                                                        </p>
                                                        <p className="truncate text-xs text-slate-500">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${
                                                        roleStyles[user.role] ??
                                                        "bg-slate-100 text-slate-600 ring-slate-500/10"
                                                    }`}
                                                >
                                                    {user.role}
                                                </span>
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                                                        user.status === "active"
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : "bg-slate-100 text-slate-500"
                                                    }`}
                                                >
                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full ${
                                                            user.status === "active"
                                                                ? "bg-emerald-500"
                                                                : "bg-slate-400"
                                                        }`}
                                                    />
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        to={`/admin/users/${user.id}/edit`}
                                                        className="rounded-md px-2.5 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                                                    >
                                                        Edit
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        disabled={pendingId === user.id}
                                                        onClick={() => handleStatus(user)}
                                                        className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                                            user.status === "active"
                                                                ? "text-red-600 hover:bg-red-50"
                                                                : "text-emerald-600 hover:bg-emerald-50"
                                                        }`}
                                                    >
                                                        {pendingId === user.id
                                                            ? "Saving…"
                                                            : user.status === "active"
                                                            ? "Disable"
                                                            : "Activate"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UsersPage;
