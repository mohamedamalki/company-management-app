import {
    useEffect,
    useState,
} from "react";
import {
    Link,
    useLocation,
} from "react-router-dom";
import {
    BadgeCheck,
    Eye,
    FilePenLine,
    PackageCheck,
    Plus,
    Trash2,
} from "lucide-react";
import api from "../../api/axios";
import useAuth from "../../context/useAuth";

function getStatusClass(status) {
    const classes = {
        draft:
            "bg-amber-100 text-amber-700",
        validated:
            "bg-green-100 text-green-700",
        cancelled:
            "bg-red-100 text-red-700",
    };

    return (
        classes[status] ??
        "bg-slate-100 text-slate-600"
    );
}

function formatDate(value) {
    if (!value) {
        return "-";
    }

    return new Intl.DateTimeFormat(
        "en-GB",
        {
            dateStyle: "medium",
            timeStyle: "short",
        }
    ).format(new Date(value));
}

function PurchaseReceiptsPage() {
    const location = useLocation();

    const { hasPermission } = useAuth();

    const canManage = hasPermission(
        "purchase-receipts.manage"
    );

    const canValidate = hasPermission(
        "purchase-receipts.validate"
    );

    const [receipts, setReceipts] =
        useState([]);

    const [meta, setMeta] =
        useState(null);

    const [page, setPage] = useState(1);

    const [status, setStatus] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [changingId, setChangingId] =
        useState(null);

    const [error, setError] =
        useState("");

    const [message, setMessage] =
        useState(
            location.state?.message ?? ""
        );

    useEffect(() => {
        let cancelled = false;

        const loadReceipts = async () => {
            try {
                const response = await api.get(
                    "/purchase-receipts",
                    {
                        params: {
                            page,
                            status:
                                status || undefined,
                        },
                    }
                );

                if (!cancelled) {
                    setReceipts(
                        Array.isArray(
                            response.data.data
                        )
                            ? response.data.data
                            : []
                    );

                    setMeta(response.data);
                    setError("");
                }
            } catch (requestError) {
                console.error(requestError);

                if (!cancelled) {
                    setError(
                        requestError.response
                            ?.data?.message ??
                            "Unable to load purchase receipts."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadReceipts();

        return () => {
            cancelled = true;
        };
    }, [page, status]);

    useEffect(() => {
        if (!message) {
            return undefined;
        }

        const timer = window.setTimeout(
            () => setMessage(""),
            3000
        );

        return () =>
            window.clearTimeout(timer);
    }, [message]);

    const handleStatusFilter = (
        event
    ) => {
        setLoading(true);
        setPage(1);
        setStatus(event.target.value);
    };

    const handlePage = (newPage) => {
        setLoading(true);
        setPage(newPage);
    };

    const handleValidate = async (
        receipt
    ) => {
        const confirmed = window.confirm(
            `Validate receipt ${receipt.receipt_number}? Accepted quantities will be added to stock.`
        );

        if (!confirmed) {
            return;
        }

        try {
            setChangingId(receipt.id);
            setError("");

            const response = await api.patch(
                `/purchase-receipts/${receipt.id}/validate`
            );

            const updatedReceipt =
                response.data.data;

            setReceipts((current) =>
                current.map((item) =>
                    item.id === receipt.id
                        ? updatedReceipt
                        : item
                )
            );

            setMessage(
                "Receipt validated and stock updated successfully."
            );
        } catch (requestError) {
            const errors =
                requestError.response?.data
                    ?.errors;

            setError(
                errors
                    ? Object.values(errors)
                          .flat()
                          .at(0)
                    : requestError.response
                          ?.data?.message ??
                          "Unable to validate receipt."
            );
        } finally {
            setChangingId(null);
        }
    };

    const handleDelete = async (
        receipt
    ) => {
        const confirmed = window.confirm(
            `Delete draft receipt ${receipt.receipt_number}?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setChangingId(receipt.id);
            setError("");

            await api.delete(
                `/purchase-receipts/${receipt.id}`
            );

            setReceipts((current) =>
                current.filter(
                    (item) =>
                        item.id !== receipt.id
                )
            );

            setMessage(
                "Purchase receipt deleted successfully."
            );
        } catch (requestError) {
            setError(
                requestError.response?.data
                    ?.message ??
                    "Unable to delete receipt."
            );
        } finally {
            setChangingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                        <PackageCheck size={23} />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Purchase receipts
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Receive products from
                            confirmed purchase orders.
                        </p>
                    </div>
                </div>

                {canManage && (
                    <Link
                        to="/app/purchase-receipts/create"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                        <Plus size={18} />
                        Create receipt
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
                    onChange={
                        handleStatusFilter
                    }
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600"
                >
                    <option value="">
                        All statuses
                    </option>

                    <option value="draft">
                        Draft
                    </option>

                    <option value="validated">
                        Validated
                    </option>

                    <option value="cancelled">
                        Cancelled
                    </option>
                </select>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1050px] text-left">
                        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-5 py-4">
                                    Receipt
                                </th>

                                <th className="px-5 py-4">
                                    Purchase order
                                </th>

                                <th className="px-5 py-4">
                                    Supplier
                                </th>

                                <th className="px-5 py-4">
                                    Location
                                </th>

                                <th className="px-5 py-4">
                                    Received
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
                                        receipts...
                                    </td>
                                </tr>
                            ) : receipts.length ===
                              0 ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="px-5 py-12 text-center text-slate-500"
                                    >
                                        No purchase
                                        receipts found.
                                    </td>
                                </tr>
                            ) : (
                                receipts.map(
                                    (receipt) => (
                                        <tr
                                            key={
                                                receipt.id
                                            }
                                            className="hover:bg-slate-50/70"
                                        >
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-slate-900">
                                                    {
                                                        receipt.receipt_number
                                                    }
                                                </p>

                                                <p className="mt-0.5 text-xs text-slate-400">
                                                    {receipt
                                                        .items
                                                        ?.length ??
                                                        0}{" "}
                                                    products
                                                </p>
                                            </td>

                                            <td className="px-5 py-4 text-sm text-slate-600">
                                                {receipt
                                                    .purchase_order
                                                    ?.order_number ??
                                                    `#${receipt.purchase_order_id}`}
                                            </td>

                                            <td className="px-5 py-4 text-sm text-slate-600">
                                                {receipt
                                                    .purchase_order
                                                    ?.supplier
                                                    ?.name ??
                                                    "-"}
                                            </td>

                                            <td className="px-5 py-4 text-sm text-slate-600">
                                                {receipt
                                                    .location
                                                    ?.name ??
                                                    "-"}
                                            </td>

                                            <td className="px-5 py-4 text-sm text-slate-600">
                                                {formatDate(
                                                    receipt.received_at
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getStatusClass(
                                                        receipt.status
                                                    )}`}
                                                >
                                                    {
                                                        receipt.status
                                                    }
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        to={`/app/purchase-receipts/${receipt.id}`}
                                                        title="View receipt"
                                                        className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
                                                    >
                                                        <Eye
                                                            size={
                                                                17
                                                            }
                                                        />
                                                    </Link>

                                                    {canManage &&
                                                        receipt.status ===
                                                            "draft" && (
                                                            <Link
                                                                to={`/app/purchase-receipts/${receipt.id}/edit`}
                                                                title="Edit receipt"
                                                                className="rounded-lg bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"
                                                            >
                                                                <FilePenLine
                                                                    size={
                                                                        17
                                                                    }
                                                                />
                                                            </Link>
                                                        )}

                                                    {canValidate &&
                                                        receipt.status ===
                                                            "draft" && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleValidate(
                                                                        receipt
                                                                    )
                                                                }
                                                                disabled={
                                                                    changingId ===
                                                                    receipt.id
                                                                }
                                                                title="Validate receipt"
                                                                className="rounded-lg bg-green-50 p-2 text-green-700 hover:bg-green-100 disabled:opacity-50"
                                                            >
                                                                <BadgeCheck
                                                                    size={
                                                                        17
                                                                    }
                                                                />
                                                            </button>
                                                        )}

                                                    {canManage &&
                                                        receipt.status ===
                                                            "draft" && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        receipt
                                                                    )
                                                                }
                                                                disabled={
                                                                    changingId ===
                                                                    receipt.id
                                                                }
                                                                title="Delete receipt"
                                                                className="rounded-lg bg-red-50 p-2 text-red-700 hover:bg-red-100 disabled:opacity-50"
                                                            >
                                                                <Trash2
                                                                    size={
                                                                        17
                                                                    }
                                                                />
                                                            </button>
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
                    <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm">
                        <span className="text-slate-500">
                            {meta.total ??
                                receipts.length}{" "}
                            receipts
                        </span>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                disabled={
                                    !meta.prev_page_url
                                }
                                onClick={() =>
                                    handlePage(
                                        page - 1
                                    )
                                }
                                className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
                            >
                                Previous
                            </button>

                            <span>
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
                                    !meta.next_page_url
                                }
                                onClick={() =>
                                    handlePage(
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

export default PurchaseReceiptsPage;
