import {
    Ban,
    CheckCircle2,
    ClipboardList,
    Download,
    Eye,
    FilePenLine,
    Loader2,
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

function getApiMessage(error, fallback) {
    const errors = error.response?.data?.errors;

    if (errors) {
        return Object.values(errors).flat()[0];
    }

    return (
        error.response?.data?.message ??
        fallback
    );
}

function getOrderNumber(order) {
    return (
        order.order_number ??
        order.reference ??
        `PO-${order.id}`
    );
}

function formatDate(value) {
    if (!value) {
        return "-";
    }

    return new Intl.DateTimeFormat(
        "en-GB"
    ).format(new Date(value));
}

function formatMoney(value) {
    return new Intl.NumberFormat("fr-MA", {
        style: "currency",
        currency: "MAD",
    }).format(Number(value ?? 0));
}

function statusClass(status) {
    const classes = {
        pending:
            "bg-amber-100 text-amber-700",
        confirmed:
            "bg-blue-100 text-blue-700",
        completed:
            "bg-green-100 text-green-700",
        cancelled:
            "bg-red-100 text-red-700",
    };

    return (
        classes[status] ??
        "bg-slate-100 text-slate-700"
    );
}

function normalizeResponse(body) {
    if (Array.isArray(body)) {
        return {
            orders: body,
            meta: null,
        };
    }

    if (Array.isArray(body?.data)) {
        return {
            orders: body.data,
            meta: body,
        };
    }

    if (Array.isArray(body?.data?.data)) {
        return {
            orders: body.data.data,
            meta: body.data,
        };
    }

    return {
        orders: [],
        meta: null,
    };
}

function PurchaseOrdersPage() {
    const location = useLocation();
    const { hasPermission } = useAuth();

    const [orders, setOrders] = useState([]);
    const [meta, setMeta] = useState(null);
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState(
        location.state?.message ?? ""
    );

    const canManage = hasPermission(
        "purchase-orders.manage"
    );

    const canConfirm = hasPermission(
        "purchase-orders.confirm"
    );

    const canCancel = hasPermission(
        "purchase-orders.cancel"
    );

    useEffect(() => {
        const controller =
            new AbortController();

        api.get("/purchase-orders", {
            params: {
                page,
                ...(status && { status }),
            },
            signal: controller.signal,
        })
            .then((response) => {
                const result =
                    normalizeResponse(
                        response.data
                    );

                setOrders(result.orders);
                setMeta(result.meta);
                setError("");
            })
            .catch((requestError) => {
                if (
                    requestError.code ===
                    "ERR_CANCELED"
                ) {
                    return;
                }

                console.error(requestError);

                setError(
                    getApiMessage(
                        requestError,
                        "Unable to load purchase orders."
                    )
                );
            })
            .finally(() => {
                if (
                    !controller.signal.aborted
                ) {
                    setLoading(false);
                }
            });

        return () => {
            controller.abort();
        };
    }, [page, status]);

    useEffect(() => {
        if (!message) {
            return undefined;
        }

        const timer = window.setTimeout(
            () => {
                setMessage("");
            },
            3000
        );

        return () => {
            window.clearTimeout(timer);
        };
    }, [message]);

    const handleConfirm = async (order) => {
        const accepted = window.confirm(
            `Confirm purchase order ${getOrderNumber(
                order
            )}?`
        );

        if (!accepted) {
            return;
        }

        try {
            setActionId(
                `confirm-${order.id}`
            );
            setError("");
            setMessage("");

            const response = await api.patch(
                `/purchase-orders/${order.id}/confirm`
            );

            const updatedOrder =
                response.data.data ?? {
                    ...order,
                    status: "confirmed",
                    receiving_status:
                        order.receiving_status ??
                        "pending",
                };

            setOrders((currentOrders) =>
                currentOrders.map(
                    (currentOrder) =>
                        currentOrder.id ===
                        order.id
                            ? {
                                  ...currentOrder,
                                  ...updatedOrder,
                              }
                            : currentOrder
                )
            );

            setMessage(
                response.data.message ??
                    "Purchase order confirmed successfully."
            );
        } catch (requestError) {
            console.error(requestError);

            setError(
                getApiMessage(
                    requestError,
                    "Unable to confirm the purchase order."
                )
            );
        } finally {
            setActionId("");
        }
    };

    const handleCancel = async (order) => {
        const accepted = window.confirm(
            `Cancel purchase order ${getOrderNumber(
                order
            )}?`
        );

        if (!accepted) {
            return;
        }

        try {
            setActionId(
                `cancel-${order.id}`
            );
            setError("");
            setMessage("");

            const response = await api.patch(
                `/purchase-orders/${order.id}/cancel`
            );

            const updatedOrder =
                response.data.data ?? {
                    ...order,
                    status: "cancelled",
                };

            setOrders((currentOrders) =>
                currentOrders.map(
                    (currentOrder) =>
                        currentOrder.id ===
                        order.id
                            ? {
                                  ...currentOrder,
                                  ...updatedOrder,
                              }
                            : currentOrder
                )
            );

            setMessage(
                response.data.message ??
                    "Purchase order cancelled."
            );
        } catch (requestError) {
            console.error(requestError);

            setError(
                getApiMessage(
                    requestError,
                    "Unable to cancel the purchase order."
                )
            );
        } finally {
            setActionId("");
        }
    };

    const handlePdf = async (order) => {
        try {
            setActionId(`pdf-${order.id}`);
            setError("");

            const response = await api.get(
                `/purchase-orders/${order.id}/pdf`,
                {
                    responseType: "blob",
                }
            );

            const url =
                window.URL.createObjectURL(
                    response.data
                );

            const link =
                document.createElement("a");

            link.href = url;
            link.download = `${getOrderNumber(
                order
            )}.pdf`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);
        } catch (requestError) {
            console.error(requestError);

            setError(
                "Unable to download the purchase order PDF."
            );
        } finally {
            setActionId("");
        }
    };

    const handleStatusChange = (event) => {
        setLoading(true);
        setPage(1);
        setStatus(event.target.value);
    };

    const previousPage = () => {
        if (!meta?.prev_page_url) {
            return;
        }

        setLoading(true);
        setPage((current) => current - 1);
    };

    const nextPage = () => {
        if (!meta?.next_page_url) {
            return;
        }

        setLoading(true);
        setPage((current) => current + 1);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                        <ClipboardList size={23} />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Purchase orders
                        </h1>

                        <p className="text-sm text-slate-500">
                            Manage and confirm supplier
                            purchase orders.
                        </p>
                    </div>
                </div>

                {canManage && (
                    <Link
                        to="/app/purchase-orders/create"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                        <Plus size={18} />
                        Create order
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

            <div className="flex justify-end">
                <select
                    value={status}
                    onChange={handleStatusChange}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                >
                    <option value="">
                        All statuses
                    </option>
                    <option value="pending">
                        Pending
                    </option>
                    <option value="confirmed">
                        Confirmed
                    </option>
                    <option value="completed">
                        Completed
                    </option>
                    <option value="cancelled">
                        Cancelled
                    </option>
                </select>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-5 py-4">
                                    Order
                                </th>
                                <th className="px-5 py-4">
                                    Supplier
                                </th>
                                <th className="px-5 py-4">
                                    Location
                                </th>
                                <th className="px-5 py-4">
                                    Date
                                </th>
                                <th className="px-5 py-4">
                                    Total TTC
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
                                        colSpan="7"
                                        className="px-5 py-12 text-center text-slate-500"
                                    >
                                        Loading purchase
                                        orders...
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="px-5 py-12 text-center text-slate-500"
                                    >
                                        No purchase orders
                                        found.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="hover:bg-slate-50/70"
                                    >
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-slate-900">
                                                {getOrderNumber(
                                                    order
                                                )}
                                            </p>

                                            <p className="text-xs text-slate-400">
                                                {order.items_count ??
                                                    order
                                                        .items
                                                        ?.length ??
                                                    0}{" "}
                                                products
                                            </p>
                                        </td>

                                        <td className="px-5 py-4 text-sm text-slate-600">
                                            {order.supplier
                                                ?.name ??
                                                "-"}
                                        </td>

                                        <td className="px-5 py-4 text-sm text-slate-600">
                                            {order.location
                                                ?.name ??
                                                "-"}
                                        </td>

                                        <td className="px-5 py-4 text-sm text-slate-600">
                                            {formatDate(
                                                order.order_date ??
                                                    order.created_at
                                            )}
                                        </td>

                                        <td className="px-5 py-4 font-semibold text-slate-900">
                                            {formatMoney(
                                                order.total_ttc ??
                                                    order.grand_total
                                            )}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(
                                                    order.status
                                                )}`}
                                            >
                                                {
                                                    order.status
                                                }
                                            </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    to={`/app/purchase-orders/${order.id}`}
                                                    title="View order"
                                                    className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
                                                >
                                                    <Eye
                                                        size={
                                                            17
                                                        }
                                                    />
                                                </Link>

                                                {canManage &&
                                                    order.status ===
                                                        "pending" && (
                                                        <Link
                                                            to={`/app/purchase-orders/${order.id}/edit`}
                                                            title="Edit order"
                                                            className="rounded-lg bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"
                                                        >
                                                            <FilePenLine
                                                                size={
                                                                    17
                                                                }
                                                            />
                                                        </Link>
                                                    )}

                                                {canConfirm &&
                                                    order.status ===
                                                        "pending" && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleConfirm(
                                                                    order
                                                                )
                                                            }
                                                            disabled={
                                                                actionId ===
                                                                `confirm-${order.id}`
                                                            }
                                                            title="Confirm order"
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
                                                        >
                                                            {actionId ===
                                                            `confirm-${order.id}` ? (
                                                                <Loader2
                                                                    size={
                                                                        16
                                                                    }
                                                                    className="animate-spin"
                                                                />
                                                            ) : (
                                                                <CheckCircle2
                                                                    size={
                                                                        16
                                                                    }
                                                                />
                                                            )}

                                                            Confirm
                                                        </button>
                                                    )}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handlePdf(
                                                            order
                                                        )
                                                    }
                                                    disabled={
                                                        actionId ===
                                                        `pdf-${order.id}`
                                                    }
                                                    title="Download PDF"
                                                    className="rounded-lg bg-violet-50 p-2 text-violet-700 hover:bg-violet-100 disabled:opacity-50"
                                                >
                                                    <Download
                                                        size={
                                                            17
                                                        }
                                                    />
                                                </button>

                                                {canCancel &&
                                                    [
                                                        "pending",
                                                        "confirmed",
                                                    ].includes(
                                                        order.status
                                                    ) && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleCancel(
                                                                    order
                                                                )
                                                            }
                                                            disabled={
                                                                actionId ===
                                                                `cancel-${order.id}`
                                                            }
                                                            title="Cancel order"
                                                            className="rounded-lg bg-red-50 p-2 text-red-700 hover:bg-red-100 disabled:opacity-50"
                                                        >
                                                            <Ban
                                                                size={
                                                                    17
                                                                }
                                                            />
                                                        </button>
                                                    )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {meta && (
                    <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm">
                        <span className="text-slate-500">
                            {meta.total ??
                                orders.length}{" "}
                            orders
                        </span>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={previousPage}
                                disabled={
                                    !meta.prev_page_url ||
                                    loading
                                }
                                className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
                            >
                                Previous
                            </button>

                            <span>
                                Page{" "}
                                {meta.current_page ??
                                    page}{" "}
                                of{" "}
                                {meta.last_page ??
                                    1}
                            </span>

                            <button
                                type="button"
                                onClick={nextPage}
                                disabled={
                                    !meta.next_page_url ||
                                    loading
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

export default PurchaseOrdersPage;
