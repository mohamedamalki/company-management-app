import {
    useEffect,
    useState,
} from "react";
import {
    useNavigate,
    useParams,
} from "react-router-dom";
import api from "../../api/axios";
import PurchaseReceiptForm from "../../components/purchaseReceipts/PurchaseReceiptForm";

function getErrorMessage(error) {
    const errors =
        error.response?.data?.errors;

    if (errors) {
        return Object.values(errors)
            .flat()
            .at(0);
    }

    return (
        error.response?.data?.message ??
        "Unable to update purchase receipt."
    );
}

function PurchaseReceiptsUpdate() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [receipt, setReceipt] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

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
                console.error(requestError);

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

    const handleUpdate = async (
        formData
    ) => {
        try {
            setSaving(true);
            setError("");

            await api.put(
                `/purchase-receipts/${id}`,
                formData
            );

            navigate(
                `/app/purchase-receipts/${id}`,
                {
                    replace: true,

                    state: {
                        message:
                            "Purchase receipt updated successfully.",
                    },
                }
            );
        } catch (requestError) {
            setError(
                getErrorMessage(requestError)
            );
        } finally {
            setSaving(false);
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

    if (receipt.status !== "draft") {
        return (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-700">
                Only draft purchase receipts can
                be updated.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    Update purchase receipt
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                    {receipt.receipt_number}
                </p>
            </div>

            <PurchaseReceiptForm
                key={receipt.id}
                initialData={receipt}
                onSubmit={handleUpdate}
                saving={saving}
                error={error}
                submitText="Update receipt"
            />
        </div>
    );
}

export default PurchaseReceiptsUpdate;
