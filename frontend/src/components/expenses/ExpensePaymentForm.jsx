import { CreditCard, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatMoney, toDateTimeInput } from "./expenseHelpers";

function ExpensePaymentForm({
  expense,
  paymentMethods = [],
  onSubmit,
  saving = false,
  error = "",
}) {
  const remaining = Number(expense?.remaining_amount) || 0;
  const [formData, setFormData] = useState({
    payment_method_id: "",
    amount: remaining > 0 ? remaining.toFixed(2) : "",
    reference: "",
    paid_at: toDateTimeInput(),
    notes: "",
  });

  const selectedMethod = useMemo(
    () =>
      paymentMethods.find(
        (method) => String(method.id) === String(formData.payment_method_id),
      ),
    [formData.payment_method_id, paymentMethods],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

 const handleSubmit = (event) => {
  event.preventDefault();

  onSubmit({
    payment_method_id:
      formData.payment_method_id,

    amount: formData.amount,

    reference:
      formData.reference.trim() ||
      null,

    paid_at: formData.paid_at
      ? new Date(
          formData.paid_at,
        ).toISOString()
      : null,

    notes:
      formData.notes.trim() ||
      null,
  });
};

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:bg-slate-100";
  const labelClass = "mb-1.5 block text-sm font-semibold text-slate-700";

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-6 py-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
          <CreditCard size={21} />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Record payment</h2>
          <p className="mt-1 text-sm text-slate-500">
            Remaining balance: {formatMoney(remaining)} MAD
          </p>
        </div>
      </div>

      <div className="space-y-5 p-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="payment_method_id" className={labelClass}>
              Payment method <span className="text-red-500">*</span>
            </label>
            <select
              id="payment_method_id"
              name="payment_method_id"
              value={formData.payment_method_id}
              onChange={handleChange}
              disabled={saving}
              className={inputClass}
              required
            >
              <option value="">Select payment method</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name} — {method.code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="amount" className={labelClass}>
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="amount"
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                min="0.01"
                max={remaining || undefined}
                step="0.01"
                disabled={saving}
                className={`${inputClass} pr-14`}
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                MAD
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="paid_at" className={labelClass}>
              Payment date <span className="text-red-500">*</span>
            </label>
            <input
              id="paid_at"
              type="datetime-local"
              name="paid_at"
              value={formData.paid_at}
              onChange={handleChange}
              max={toDateTimeInput()}
              disabled={saving}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label htmlFor="reference" className={labelClass}>
              Reference
              {selectedMethod?.requires_reference && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </label>
            <input
              id="reference"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              placeholder="Cheque, transfer or transaction reference"
              maxLength={255}
              disabled={saving}
              className={inputClass}
              required={Boolean(selectedMethod?.requires_reference)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className={labelClass}>
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            maxLength={2000}
            disabled={saving}
            className={`${inputClass} resize-y`}
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
        <Link
          to={`/app/expenses/${expense.id}`}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving || remaining <= 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving && <Loader2 size={17} className="animate-spin" />}
          {saving ? "Recording..." : "Record payment"}
        </button>
      </div>
    </form>
  );
}

export default ExpensePaymentForm;
