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
          setError(apiError(requestError, "Unable to load payment methods."));
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
      amount(saleReturn.total_ttc) - amount(saleReturn.refunded_amount),
      0,
    );

    const sale = saleReturn.sale ?? {};
    const netTotal = Math.max(
      amount(sale.total_ttc) - amount(sale.returned_amount),
      0,
    );
    const netPaid = Math.max(
      amount(sale.paid_amount) - amount(sale.refunded_amount),
      0,
    );

    return Math.min(
      returnRemaining,
      amount(sale.refundable_amount) || Math.max(netPaid - netTotal, 0),
    );
  }, [saleReturn]);

  const selectedMethod = methods.find(
    (method) => String(method.id) === formData.payment_method_id,
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const response = await api.post(
        `/sale-returns/${saleReturn.id}/refunds`,
        {
          payment_method_id: Number(formData.payment_method_id),
          amount: amount(formData.amount),
          reference: formData.reference.trim() || null,
          notes: formData.notes.trim() || null,
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
      setError(apiError(requestError, "Unable to record the refund."));
    } finally {
      setSaving(false);
    }
  };

  if (maximumRefund <= 0.009) {
    return null;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
          <Banknote size={20} />
        </span>
        <div>
          <h3 className="font-bold text-slate-900">Record customer refund</h3>
          <p className="text-sm text-slate-500">
            Maximum refundable: {formatMoney(maximumRefund)} MAD
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold">
            Payment method
          </label>
          <select
            value={formData.payment_method_id}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                payment_method_id: event.target.value,
              }))
            }
            disabled={loadingMethods || saving}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
            required
          >
            <option value="">
              {loadingMethods ? "Loading..." : "Select a method"}
            </option>
            {methods.map((method) => (
              <option key={method.id} value={method.id}>
                {method.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">Amount</label>
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
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
            disabled={saving}
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">
            Reference {selectedMethod?.requires_reference ? "*" : ""}
          </label>
          <input
            type="text"
            value={formData.reference}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                reference: event.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
            disabled={saving}
            required={Boolean(selectedMethod?.requires_reference)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">Notes</label>
          <input
            type="text"
            value={formData.notes}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                notes: event.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
            disabled={saving}
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={saving || loadingMethods}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving && <Loader2 size={17} className="animate-spin" />}
          Record refund
        </button>
      </div>
    </form>
  );
}

export default SaleRefundForm;
