import {
    CreditCard,
    Loader2,
} from "lucide-react";
import {
    useEffect,
    useState,
} from "react";
import api from "../../api/axios";

function SalePaymentForm({
    sale,
    onSaved,
}) {
    const remaining = Math.max(
        Number(sale.total_ttc) -
            Number(sale.paid_amount),
        0
    );

    const [methods, setMethods] =
        useState([]);

    const [formData, setFormData] =
        useState({
            payment_method_id: "",
            amount:
                remaining.toFixed(2),
            reference: "",
            paid_at: "",
            notes: "",
        });

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    useEffect(() => {
        let cancelled = false;

        api.get(
            "/payment-methods/active"
        ).then((response) => {
            if (!cancelled) {
                setMethods(
                    response.data.data ?? []
                );
            }
        });

        return () => {
            cancelled = true;
        };
    }, []);

    const selectedMethod =
        methods.find(
            (method) =>
                String(method.id) ===
                String(
                    formData.payment_method_id
                )
        );

    const handleSubmit = async (
        event
    ) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");

            await api.post(
                `/sales/${sale.id}/payments`,
                {
                    payment_method_id:
                        Number(
                            formData.payment_method_id
                        ),

                    amount: Number(
                        formData.amount
                    ),

                    reference:
                        formData.reference.trim() ||
                        null,

                    paid_at:
                        formData.paid_at ||
                        null,

                    notes:
                        formData.notes.trim() ||
                        null,
                }
            );

            onSaved();
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
                          "Unable to record payment."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm"
        >
            <div className="flex items-center gap-3">
                <CreditCard size={20} />

                <h2 className="font-bold">
                    Record payment
                </h2>
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                <select
                    value={
                        formData.payment_method_id
                    }
                    onChange={(event) =>
                        setFormData(
                            (current) => ({
                                ...current,
                                payment_method_id:
                                    event.target
                                        .value,
                            })
                        )
                    }
                    className="rounded-xl border px-3 py-2.5"
                    required
                >
                    <option value="">
                        Select payment method
                    </option>

                    {methods.map((method) => (
                        <option
                            key={method.id}
                            value={method.id}
                        >
                            {method.name}
                        </option>
                    ))}
                </select>

                <input
                    type="number"
                    min="0.01"
                    max={remaining}
                    step="0.01"
                    value={formData.amount}
                    onChange={(event) =>
                        setFormData(
                            (current) => ({
                                ...current,
                                amount:
                                    event.target
                                        .value,
                            })
                        )
                    }
                    className="rounded-xl border px-3 py-2.5"
                    required
                />

                {selectedMethod
                    ?.requires_reference && (
                    <input
                        value={
                            formData.reference
                        }
                        onChange={(event) =>
                            setFormData(
                                (current) => ({
                                    ...current,
                                    reference:
                                        event.target
                                            .value,
                                })
                            )
                        }
                        placeholder="Payment reference"
                        className="rounded-xl border px-3 py-2.5"
                        required
                    />
                )}

                <input
                    type="datetime-local"
                    value={formData.paid_at}
                    onChange={(event) =>
                        setFormData(
                            (current) => ({
                                ...current,
                                paid_at:
                                    event.target
                                        .value,
                            })
                        )
                    }
                    className="rounded-xl border px-3 py-2.5"
                />
            </div>

            <button
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
                {saving && (
                    <Loader2
                        size={16}
                        className="animate-spin"
                    />
                )}

                Record payment
            </button>
        </form>
    );
}

export default SalePaymentForm;
