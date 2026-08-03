import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const requestDepots = async () => {
    const response = await api.get("/depots");
    const body = response.data;

    if (Array.isArray(body.data)) {
        return body.data;
    }

    if (Array.isArray(body.data?.data)) {
        return body.data.data;
    }

    if (Array.isArray(body.depots)) {
        return body.depots;
    }

    if (Array.isArray(body)) {
        return body;
    }

    return [];
};

function DepotsPage() {
    const [depots, setDepots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [pendingId, setPendingId] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const loadDepots = async () => {
            try {
                const data = await requestDepots();

                if (!cancelled) {
                    setDepots(data);
                }
            } catch (error) {
                console.error(error);

                if (!cancelled) {
                    setError("Unable to load depots.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadDepots();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleStatus = async (depot) => {
        const newStatus =
            depot.status === "active"
                ? "inactive"
                : "active";

        try {
            setError("");
            setPendingId(depot.id);

            await api.patch(`/depots/${depot.id}`, {
                status: newStatus,
            });

            setDepots((currentDepots) =>
                currentDepots.map((currentDepot) =>
                    currentDepot.id === depot.id
                        ? {
                              ...currentDepot,
                              status: newStatus,
                          }
                        : currentDepot
                )
            );
        } catch (error) {
            setError(
                error.response?.data?.message ??
                    "Unable to change depot status."
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
                            Depots
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Manage company depots and their
                            availability.
                        </p>
                    </div>

                    <Link
                        to="/admin/depots/create"
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

                        Create depot
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

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/80">
                                    <th className="px-5 py-3 font-medium text-slate-500">
                                        Depot
                                    </th>

                                    <th className="px-5 py-3 font-medium text-slate-500">
                                        Code
                                    </th>

                                    <th className="px-5 py-3 font-medium text-slate-500">
                                        Phone
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
                                    Array.from({
                                        length: 5,
                                    }).map((_, index) => (
                                        <tr key={index}>
                                            <td
                                                colSpan={5}
                                                className="px-5 py-4"
                                            >
                                                <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                                            </td>
                                        </tr>
                                    ))
                                ) : depots.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-5 py-16 text-center"
                                        >
                                            <div className="mx-auto flex max-w-xs flex-col items-center gap-2">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                                                    <svg
                                                        className="h-5 w-5 text-slate-400"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        strokeWidth={
                                                            1.5
                                                        }
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M3.75 21h16.5M4.5 3h15l-.75 6H5.25L4.5 3Zm1.5 6v12m12-12v12M9 13.5h6M9 17.25h6"
                                                        />
                                                    </svg>
                                                </div>

                                                <p className="font-medium text-slate-700">
                                                    No depots yet
                                                </p>

                                                <p className="text-slate-400">
                                                    Create your first
                                                    depot to get
                                                    started.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    depots.map((depot) => (
                                        <tr
                                            key={depot.id}
                                            className="transition-colors hover:bg-slate-50"
                                        >
                                            {/* Name and address */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                                        <svg
                                                            className="h-4.5 w-4.5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={
                                                                1.8
                                                            }
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M3.75 21h16.5M4.5 3h15l-.75 6H5.25L4.5 3Zm1.5 6v12m12-12v12M9 13.5h6M9 17.25h6"
                                                            />
                                                        </svg>
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="truncate font-medium text-slate-800">
                                                            {
                                                                depot.name
                                                            }
                                                        </p>

                                                        <p className="max-w-xs truncate text-xs text-slate-500">
                                                            {depot.address ||
                                                                "No address"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Code */}
                                            <td className="px-5 py-3.5">
                                                <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-medium text-slate-600">
                                                    {depot.code}
                                                </span>
                                            </td>

                                            {/* Phone */}
                                            <td className="px-5 py-3.5 text-slate-600">
                                                {depot.phone || (
                                                    <span className="text-slate-300">
                                                        —
                                                    </span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-3.5">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                                                        depot.status ===
                                                        "active"
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : "bg-slate-100 text-slate-500"
                                                    }`}
                                                >
                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full ${
                                                            depot.status ===
                                                            "active"
                                                                ? "bg-emerald-500"
                                                                : "bg-slate-400"
                                                        }`}
                                                    />

                                                    {depot.status}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        to={`/admin/depots/${depot.id}/edit`}
                                                        className="rounded-md px-2.5 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                                                    >
                                                        Edit
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        disabled={
                                                            pendingId ===
                                                            depot.id
                                                        }
                                                        onClick={() =>
                                                            handleStatus(
                                                                depot
                                                            )
                                                        }
                                                        className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                                            depot.status ===
                                                            "active"
                                                                ? "text-red-600 hover:bg-red-50"
                                                                : "text-emerald-600 hover:bg-emerald-50"
                                                        }`}
                                                    >
                                                        {pendingId ===
                                                        depot.id
                                                            ? "Saving…"
                                                            : depot.status ===
                                                                "active"
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

export default DepotsPage;
