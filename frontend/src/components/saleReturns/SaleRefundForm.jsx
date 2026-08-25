
import { Banknote, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

function apiError(error, fallback) {
  const errors = error.response?.data?.errors;

  return errors
    ? Object.values(errors).flat().at(0)
    : (error.response?.data?.message ?? fallback);
}

function amount(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value) {
  return amount(value).toLocaleString("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function SaleRefundForm({ saleReturn, onSaved }) {
  const [methods, setMethods] = useState([]);
  const [formData, setFormData] = useState({
    payment_method_id: "",
    amount: "",
    reference: "",
    notes: "",
  });
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    api
      .get("/payment-methods/active")
      .then((response) => {
        if (!cancelled) {
          const data = response.data.data ?? response.data;
          setMethods(Array.isArray(data) ? data : []);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            apiError(
              requestError,
              "Unable to load payment methods.",
            ),
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingMethods(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const maximumRefund = useMemo(() => {
    const returnRemaining = Math.max(
      amount(saleReturn.total_ttc) -
        amount(saleReturn.refunded_amount),
      0,
    );

    const sale = saleReturn.sale ?? {};

    const netTotal = Math.max(
      amount(sale.total_ttc) -
        amount(sale.returned_amount),
      0,
    );

    const netPaid = Math.max(
      amount(sale.paid_amount) -
        amount(sale.refunded_amount),
      0,
    );

    return Math.min(
      returnRemaining,
      amount(sale.refundable_amount) ||
        Math.max(netPaid - netTotal, 0),
    );
  }, [saleReturn]);

  const selectedMethod = methods.find(
    (method) =>
      String(method.id) ===
      formData.payment_method_id,
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const response = await api.post(
        `/sale-returns/${saleReturn.id}/refunds`,
        {
          payment_method_id: Number(
            formData.payment_method_id,
          ),
          amount: amount(formData.amount),
          reference:
            formData.reference.trim() || null,
          notes:
            formData.notes.trim() || null,
        },
      );

      setFormData({
        payment_method_id: "",
        amount: "",
        reference: "",
        notes: "",
      });

      onSaved(response.data);
    } catch (requestError) {
      setError(
        apiError(
          requestError,
          "Unable to record the refund.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  if (maximumRefund <= 0.009) {
    return null;
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 disabled:bg-slate-100";

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start gap-4 border-b border-slate-200 bg-slate-50 px-6 py-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
          <Banknote size={21} />
        </span>

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Record customer refund
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Maximum refundable:{" "}
            <span className="font-semibold text-blue-600">
              {formatMoney(maximumRefund)} MAD
            </span>
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6 p-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          {/* Payment method */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Payment method{" "}
              <span className="text-red-500">*</span>
            </label>

            <select
              value={formData.payment_method_id}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  payment_method_id:
                    event.target.value,
                }))
              }
              disabled={
                loadingMethods || saving
              }
              className={inputClass}
              required
            >
              <option value="">
                {loadingMethods
                  ? "Loading..."
                  : "Select a method"}
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
          </div>

          {/* Amount */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Refund amount{" "}
              <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <input
                type="number"
                min="0.01"
                max={maximumRefund}
                step="0.01"
                value={formData.amount}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
                className={`${inputClass} pr-16`}
                disabled={saving}
                required
              />

              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                MAD
              </span>
            </div>
          </div>

          {/* Reference */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Reference{" "}
              {selectedMethod?.requires_reference && (
                <span className="text-red-500">*</span>
              )}
            </label>

            <input
              type="text"
              value={formData.reference}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  reference:
                    event.target.value,
                }))
              }
              placeholder="Payment reference"
              className={inputClass}
              disabled={saving}
              required={Boolean(
                selectedMethod?.requires_reference,
              )}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Notes
            </label>

            <input
              type="text"
              value={formData.notes}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              placeholder="Optional notes"
              className={inputClass}
              disabled={saving}
            />
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <span className="text-sm font-semibold text-slate-600">
            Maximum refundable
          </span>

          <span className="font-bold text-slate-900">
            {formatMoney(maximumRefund)} MAD
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
        <button
          type="submit"
          disabled={
            saving || loadingMethods
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && (
            <Loader2
              size={17}
              className="animate-spin"
            />
          )}

          {saving
            ? "Recording..."
            : "Record refund"}
        </button>
      </div>
    </form>
  );
}

export default SaleRefundForm;

