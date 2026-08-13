import {
    useEffect,
    useState,
} from "react";
import {
    Link,
    useLocation,
} from "react-router-dom";
import {
    Eye,
    Handshake,
    Pencil,
    Plus,
    Power,
    Search,
} from "lucide-react";
import api from "../../api/axios";
import useAuth from "../../context/useAuth";

const formatMoney = (amount) =>
    new Intl.NumberFormat("fr-MA", {
        style: "currency",
        currency: "MAD",
        minimumFractionDigits: 2,
    }).format(Number(amount ?? 0));

function FournisseursPage() {
    const location = useLocation();
    const { hasPermission } = useAuth();

    const canManage = hasPermission(
        "fournisseurs.manage"
    );

    const [fournisseurs, setFournisseurs] =
        useState([]);

    const [meta, setMeta] = useState(null);
    const [page, setPage] = useState(1);

    const [search, setSearch] = useState("");
    const [appliedSearch, setAppliedSearch] =
        useState("");

    const [status, setStatus] = useState("");

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [message, setMessage] =
        useState(
            location.state?.message ?? ""
        );

    const [changingId, setChangingId] =
        useState(null);

    useEffect(() => {
        let cancelled = false;

        const loadFournisseurs =
            async () => {
                try {
                    const response =
                        await api.get(
                            "/fournisseurs",
                            {
                                params: {
                                    page,
                                    search:
                                        appliedSearch ||
                                        undefined,
                                    status:
                                        status ||
                                        undefined,
                                },
                            }
                        );

                    if (!cancelled) {
                        const body =
                            response.data;

                        setFournisseurs(
                            Array.isArray(
                                body.data
                            )
                                ? body.data
                                : []
                        );

                        setMeta(body);
                        setError("");
                    }
                } catch (
                    requestError
                ) {
                    console.error(
                        requestError
                    );

                    if (!cancelled) {
                        setError(
                            requestError
                                .response?.data
                                ?.message ??
                                "Unable to load fournisseurs."
                        );
                    }
                } finally {
                    if (!cancelled) {
                        setLoading(false);
                    }
                }
            };

        loadFournisseurs();

        return () => {
            cancelled = true;
        };
    }, [
        page,
        appliedSearch,
        status,
    ]);

    useEffect(() => {
        if (!message) {
            return undefined;
        }

        const timer =
            window.setTimeout(
                () => {
                    setMessage("");
                },
                3000
            );

        return () => {
            window.clearTimeout(timer);
        };
    }, [message]);

    const handleSearch = (
        event
    ) => {
        event.preventDefault();

        setLoading(true);
        setPage(1);
        setAppliedSearch(
            search.trim()
        );
    };

    const handleStatusFilter = (
        event
    ) => {
        setLoading(true);
        setPage(1);
        setStatus(event.target.value);
    };

    const handlePageChange = (
        newPage
    ) => {
        if (
            newPage < 1 ||
            newPage >
                (meta?.last_page ?? 1)
        ) {
            return;
        }

        setLoading(true);
        setPage(newPage);
    };

    const handleStatus =
        async (fournisseur) => {
            const newStatus =
                fournisseur.status ===
                "active"
                    ? "inactive"
                    : "active";

            try {
                setChangingId(
                    fournisseur.id
                );

                setError("");

                await api.put(
                    `/fournisseurs/${fournisseur.id}`,
                    {
                        status:
                            newStatus,
                    }
                );

                setFournisseurs(
                    (current) =>
                        current.map(
                            (item) =>
                                item.id ===
                                fournisseur.id
                                    ? {
                                          ...item,
                                          status:
                                              newStatus,
                                      }
                                    : item
                        )
                );

                setMessage(
                    `Fournisseur ${
                        newStatus ===
                        "active"
                            ? "activated"
                            : "disabled"
                    } successfully.`
                );
            } catch (
                requestError
            ) {
                setError(
                    requestError
                        .response?.data
                        ?.message ??
                        "Unable to change fournisseur status."
                );
            } finally {
                setChangingId(null);
            }
        };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                        <Handshake
                            size={26}
                        />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                            Fournisseurs
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Manage
                            fournisseur
                            accounts, sales,
                            credit and
                            payments.
                        </p>
                    </div>
                </div>

                {canManage && (
                    <Link
                        to="/app/fournisseurs/create"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                    >
                        <Plus
                            size={18}
                        />
                        Create
                        fournisseur
                    </Link>
                )}
            </div>

            {message && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                    {message}
                </div>
            )}

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row">
                    <form
                        onSubmit={
                            handleSearch
                        }
                        className="flex flex-1 gap-2"
                    >
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                            <input
                                type="search"
                                value={search}
                                onChange={(
                                    event
                                ) =>
                                    setSearch(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Search name, code, email, phone or ICE"
                                className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                            />
                        </div>

                        <button
                            type="submit"
                            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            Search
                        </button>
                    </form>

                    <select
                        value={status}
                        onChange={
                            handleStatusFilter
                        }
                        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-600"
                    >
                        <option value="">
                            All statuses
                        </option>

                        <option value="active">
                            Active
                        </option>

                        <option value="inactive">
                            Inactive
                        </option>
                    </select>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-5 py-4">
                                    Fournisseur
                                </th>

                                <th className="px-5 py-4">
                                    Contact
                                </th>

                                <th className="px-5 py-4">
                                    Account
                                </th>

                                <th className="px-5 py-4">
                                    Sales
                                </th>

                                <th className="px-5 py-4">
                                    Paid
                                </th>

                                <th className="px-5 py-4">
                                    Remaining
                                </th>

                                <th className="px-5 py-4">
                                    Status
                                </th>

                                <th className="px-5 py-4 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="8"
                                        className="px-5 py-14 text-center text-sm text-slate-500"
                                    >
                                        Loading
                                        fournisseurs...
                                    </td>
                                </tr>
                            ) : fournisseurs.length ===
                              0 ? (
                                <tr>
                                    <td
                                        colSpan="8"
                                        className="px-5 py-14 text-center text-sm text-slate-500"
                                    >
                                        No
                                        fournisseurs
                                        found.
                                    </td>
                                </tr>
                            ) : (
                                fournisseurs.map(
                                    (
                                        fournisseur
                                    ) => (
                                        <tr
                                            key={
                                                fournisseur.id
                                            }
                                            className="transition hover:bg-slate-50/70"
                                        >
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-slate-900">
                                                    {
                                                        fournisseur.name
                                                    }
                                                </p>

                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {
                                                        fournisseur.code
                                                    }
                                                    {" · "}
                                                    {
                                                        fournisseur.entity_type
                                                    }
                                                </p>
                                            </td>

                                            <td className="px-5 py-4 text-sm text-slate-600">
                                                <p>
                                                    {fournisseur.phone ||
                                                        "-"}
                                                </p>

                                                <p className="mt-0.5 text-xs text-slate-400">
                                                    {fournisseur.email ||
                                                        ""}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                {fournisseur.user ? (
                                                    <>
                                                        <p className="text-sm font-medium text-slate-700">
                                                            {
                                                                fournisseur
                                                                    .user
                                                                    .name
                                                            }
                                                        </p>

                                                        <p className="text-xs text-slate-400">
                                                            {
                                                                fournisseur
                                                                    .user
                                                                    .email
                                                            }
                                                        </p>
                                                    </>
                                                ) : (
                                                    <span className="text-sm text-slate-400">
                                                        No
                                                        user
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {formatMoney(
                                                        fournisseur.total_sales
                                                    )}
                                                </p>

                                                <p className="text-xs text-slate-400">
                                                    {fournisseur.sales_count ??
                                                        0}{" "}
                                                    orders
                                                </p>
                                            </td>

                                            <td className="px-5 py-4 text-sm font-semibold text-green-700">
                                                {formatMoney(
                                                    fournisseur.total_paid
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`text-sm font-bold ${
                                                        Number(
                                                            fournisseur.remaining_amount
                                                        ) >
                                                        0
                                                            ? "text-red-600"
                                                            : "text-slate-500"
                                                    }`}
                                                >
                                                    {formatMoney(
                                                        fournisseur.remaining_amount
                                                    )}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                        fournisseur.status ===
                                                        "active"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-slate-100 text-slate-600"
                                                    }`}
                                                >
                                                    {
                                                        fournisseur.status
                                                    }
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        to={`/app/fournisseurs/${fournisseur.id}`}
                                                        title="View details"
                                                        className="rounded-lg bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200"
                                                    >
                                                        <Eye
                                                            size={
                                                                17
                                                            }
                                                        />
                                                    </Link>

                                                    {canManage && (
                                                        <>
                                                            <Link
                                                                to={`/app/fournisseurs/${fournisseur.id}/edit`}
                                                                title="Edit fournisseur"
                                                                className="rounded-lg bg-blue-50 p-2 text-blue-700 transition hover:bg-blue-100"
                                                            >
                                                                <Pencil
                                                                    size={
                                                                        17
                                                                    }
                                                                />
                                                            </Link>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleStatus(
                                                                        fournisseur
                                                                    )
                                                                }
                                                                disabled={
                                                                    changingId ===
                                                                    fournisseur.id
                                                                }
                                                                title={
                                                                    fournisseur.status ===
                                                                    "active"
                                                                        ? "Disable fournisseur"
                                                                        : "Activate fournisseur"
                                                                }
                                                                className="rounded-lg bg-amber-50 p-2 text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                                                            >
                                                                <Power
                                                                    size={
                                                                        17
                                                                    }
                                                                />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                )
                            )}
                        </tbody>
                    </table>
                </div>

                {meta && (
                    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-slate-500">
                            {meta.total ??
                                fournisseurs.length}{" "}
                            fournisseurs
                        </span>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                disabled={
                                    !meta.prev_page_url ||
                                    loading
                                }
                                onClick={() =>
                                    handlePageChange(
                                        page - 1
                                    )
                                }
                                className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
                            >
                                Previous
                            </button>

                            <span className="text-slate-600">
                                Page{" "}
                                {meta.current_page ??
                                    1}{" "}
                                of{" "}
                                {meta.last_page ??
                                    1}
                            </span>

                            <button
                                type="button"
                                disabled={
                                    !meta.next_page_url ||
                                    loading
                                }
                                onClick={() =>
                                    handlePageChange(
                                        page + 1
                                    )
                                }
                                className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default FournisseursPage;
