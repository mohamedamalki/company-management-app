import {
    ContactRound,
    Edit3,
    Plus,
} from "lucide-react";
import {
    useEffect,
    useState,
} from "react";
import {
    Link,
    useLocation,
} from "react-router-dom";
import api from "../../api/axios";
import useAuth from "../../context/useAuth";

function CustomersPage() {
    const location = useLocation();
    const { hasPermission } = useAuth();

    const [customers, setCustomers] =
        useState([]);

    const [meta, setMeta] =
        useState(null);

    const [page, setPage] =
        useState(1);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const message = location.state?.message ?? ""

    const canManage = hasPermission(
        "customers.manage"
    );

    useEffect(() => {
        let cancelled = false;

        api.get("/customers", {
            params: { page },
        })
            .then((response) => {
                if (!cancelled) {
                    setCustomers(
                        Array.isArray(
                            response.data.data
                        )
                            ? response.data.data
                            : []
                    );

                    setMeta(response.data);
                    setError("");
                }
            })
            .catch((requestError) => {
                console.error(requestError);

                if (!cancelled) {
                    setError(
                        "Unable to load customers."
                    );
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [page]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                        <ContactRound
                            size={23}
                        />
                    </span>

                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Customers
                        </h1>

                        <p className="text-sm text-slate-500">
                            Registered customers
                            and fournisseurs.
                        </p>
                    </div>
                </div>

                {canManage && (
                    <Link
                        to="/app/customers/create"
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
                    >
                        <Plus size={18} />
                        Create customer
                    </Link>
                )}
            </div>

            {message && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {message}
                </div>
            )}

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-5 py-4">
                                    Customer
                                </th>
                                <th className="px-5 py-4">
                                    Category
                                </th>
                                <th className="px-5 py-4">
                                    Contact
                                </th>
                                <th className="px-5 py-4">
                                    ICE
                                </th>
                                <th className="px-5 py-4">
                                    Status
                                </th>
                                <th className="px-5 py-4 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="p-10 text-center"
                                    >
                                        Loading customers...
                                    </td>
                                </tr>
                            ) : customers.length ===
                              0 ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="p-10 text-center"
                                    >
                                        No registered
                                        customers.
                                    </td>
                                </tr>
                            ) : (
                                customers.map(
                                    (customer) => (
                                        <tr
                                            key={
                                                customer.id
                                            }
                                        >
                                            <td className="px-5 py-4">
                                                <p className="font-semibold">
                                                    {
                                                        customer.name
                                                    }
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {
                                                        customer.code
                                                    }
                                                </p>
                                            </td>

                                            <td className="px-5 py-4 capitalize">
                                                {
                                                    customer.category
                                                }
                                            </td>

                                            <td className="px-5 py-4 text-sm">
                                                <p>
                                                    {customer.phone ??
                                                        "-"}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {customer.email ??
                                                        ""}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                {customer.ice ??
                                                    "-"}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                        customer.status ===
                                                        "active"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-slate-100 text-slate-600"
                                                    }`}
                                                >
                                                    {
                                                        customer.status
                                                    }
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-right">
                                                {canManage && (
                                                    <Link
                                                        to={`/app/customers/${customer.id}/edit`}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
                                                    >
                                                        <Edit3
                                                            size={
                                                                15
                                                            }
                                                        />
                                                        Edit
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                )
                            )}
                        </tbody>
                    </table>
                </div>

                {meta && (
                    <div className="flex justify-between border-t px-5 py-4 text-sm">
                        <span>
                            {meta.total ??
                                customers.length}{" "}
                            customers
                        </span>

                        <div className="flex gap-3">
                            <button
                                disabled={
                                    !meta.prev_page_url
                                }
                                onClick={() => {
                                    setLoading(true);
                                    setPage(
                                        (value) =>
                                            value -
                                            1
                                    );
                                }}
                                className="rounded-lg border px-3 py-2 disabled:opacity-40"
                            >
                                Previous
                            </button>

                            <span className="py-2">
                                Page{" "}
                                {meta.current_page ??
                                    page}{" "}
                                of{" "}
                                {meta.last_page ??
                                    1}
                            </span>

                            <button
                                disabled={
                                    !meta.next_page_url
                                }
                                onClick={() => {
                                    setLoading(true);
                                    setPage(
                                        (value) =>
                                            value +
                                            1
                                    );
                                }}
                                className="rounded-lg border px-3 py-2 disabled:opacity-40"
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

export default CustomersPage;
