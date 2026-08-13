import {
    useEffect,
    useState,
} from "react";
import {
    Link,
    useLocation,
    useParams,
} from "react-router-dom";
import {
    ArrowLeft,
    BadgeCheck,
    FilePenLine,
    PackageCheck,
} from "lucide-react";
import api from "../../api/axios";
import useAuth from "../../context/useAuth";

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

function PurchaseReceiptDetails() {
    const { id } = useParams();
    const location = useLocation();

    const { hasPermission } = useAuth();

    const canManage = hasPermission(
        "purchase-receipts.manage"
    );

    const canValidate = hasPermission(
        "purchase-receipts.validate"
    );

    const [receipt, setReceipt] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [validating, setValidating] =
        useState(false);

    const [error, setError] =
        useState("");

    const [message, setMessage] =
        useState(
            location.state?.message ?? ""
        );

    useEffect(() => {
        let cancelled = false;

        const loadReceipt = async () => {
            try {
                const response = await api.get(
                    `/purchase-receipts/${id}`
                );

                if (!cancelled) {
                    setReceipt(
                        response.data.data
                    );
                }
            } catch (requestError) {
                if (!cancelled) {
                    setError(
                        requestError.response
                            ?.data?.message ??
                            "Unable to load purchase receipt."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadReceipt();

        return () => {
            cancelled = true;
        };
    }, [id]);

    const handleValidate = async () => {
        const confirmed = window.confirm(
            "Validate this receipt and add accepted quantities to stock?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setValidating(true);
            setError("");

            const response = await api.patch(
                `/purchase-receipts/${id}/validate`
            );

            setReceipt(response.data.data);

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
            setValidating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-72 items-center justify-center">
                <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
            </div>
        );
    }

    if (!receipt) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
                {error ||
                    "Purchase receipt not found."}
            </div>
        );
    }

    const totalReceived =
        receipt.items?.reduce(
            (total, item) =>
                total +
                Number(
                    item.received_quantity
                ),
            0
        ) ?? 0;

    const totalAccepted =
        receipt.items?.reduce(
            (total, item) =>
                total +
                Number(
                    item.accepted_quantity
                ),
            0
        ) ?? 0;

    const totalRejected =
        receipt.items?.reduce(
            (total, item) =>
                total +
                Number(
                    item.rejected_quantity
                ),
            0
        ) ?? 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                        <PackageCheck size={23} />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            {receipt.receipt_number}
                        </h1>

                        <p className="mt-1 text-sm capitalize text-slate-500">
                            {receipt.status}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Link
                        to="/app/purchase-receipts"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
                    >
                        <ArrowLeft size={17} />
                        Back
                    </Link>

                    {canManage &&
                        receipt.status ===
                            "draft" && (
                            <Link
                                to={`/app/purchase-receipts/${receipt.id}/edit`}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700"
                            >
                                <FilePenLine
                                    size={17}
                                />
                                Edit
                            </Link>
                        )}

                    {canValidate &&
                        receipt.status ===
                            "draft" && (
                            <button
                                type="button"
                                onClick={
                                    handleValidate
                                }
                                disabled={
                                    validating
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                            >
                                <BadgeCheck
                                    size={17}
                                />

                                {validating
                                    ? "Validating..."
                                    : "Validate"}
                            </button>
                        )}
                </div>
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

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-bold uppercase text-slate-400">
                        Received
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                        {totalReceived}
                    </p>
                </div>

                <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                    <p className="text-xs font-bold uppercase text-green-600">
                        Accepted
                    </p>

                    <p className="mt-2 text-2xl font-bold text-green-700">
                        {totalAccepted}
                    </p>
                </div>

                <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                    <p className="text-xs font-bold uppercase text-red-600">
                        Rejected
                    </p>

                    <p className="mt-2 text-2xl font-bold text-red-700">
                        {totalRejected}
                    </p>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <p className="text-xs font-bold uppercase text-slate-400">
                            Purchase order
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                            {receipt
                                .purchase_order
                                ?.order_number ??
                                `#${receipt.purchase_order_id}`}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-bold uppercase text-slate-400">
                            Supplier
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                            {receipt
                                .purchase_order
                                ?.supplier
                                ?.name ?? "-"}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-bold uppercase text-slate-400">
                            Location
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                            {receipt.location
                                ?.name ?? "-"}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-bold uppercase text-slate-400">
                            Reception date
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                            {formatDate(
                                receipt.received_at
                            )}
                        </p>
                    </div>
                </div>

                {receipt.notes && (
                    <div className="mt-6 border-t border-slate-100 pt-5">
                        <p className="text-xs font-bold uppercase text-slate-400">
                            Notes
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                            {receipt.notes}
                        </p>
                    </div>
                )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="font-bold text-slate-900">
                        Received products
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-5 py-4">
                                    Product
                                </th>

                                <th className="px-5 py-4">
                                    Received
                                </th>

                                <th className="px-5 py-4">
                                    Accepted
                                </th>

                                <th className="px-5 py-4">
                                    Rejected
                                </th>

                                <th className="px-5 py-4">
                                    Notes
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {receipt.items?.map(
                                (item) => (
                                    <tr
                                        key={item.id}
                                    >
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-slate-900">
                                                {item
                                                    .product
                                                    ?.name ??
                                                    "Product"}
                                            </p>

                                            <p className="text-xs text-slate-400">
                                                {item
                                                    .product
                                                    ?.reference ??
                                                    "-"}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4 font-semibold">
                                            {
                                                item.received_quantity
                                            }
                                        </td>

                                        <td className="px-5 py-4 font-semibold text-green-700">
                                            {
                                                item.accepted_quantity
                                            }
                                        </td>

                                        <td className="px-5 py-4 font-semibold text-red-700">
                                            {
                                                item.rejected_quantity
                                            }
                                        </td>

                                        <td className="px-5 py-4 text-sm text-slate-500">
                                            {item.notes ??
                                                "-"}
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default PurchaseReceiptDetails;
