import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
        "Unable to create purchase receipt."
    );
}

function PurchaseReceiptsCreate() {
    const navigate = useNavigate();

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const handleCreate = async (
        formData
    ) => {
        try {
            setSaving(true);
            setError("");

            await api.post(
                "/purchase-receipts",
                formData
            );

            navigate(
                "/app/purchase-receipts",
                {
                    replace: true,

                    state: {
                        message:
                            "Purchase receipt created successfully.",
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    Create purchase receipt
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                    Record products delivered by a
                    supplier.
                </p>
            </div>

            <PurchaseReceiptForm
                onSubmit={handleCreate}
                saving={saving}
                error={error}
                submitText="Create receipt"
            />
        </div>
    );
}

export default PurchaseReceiptsCreate;
