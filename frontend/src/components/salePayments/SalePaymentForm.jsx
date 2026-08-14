import { CreditCard, Loader2, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";

function formatMoney(value) {
  return Number(value ?? 0).toLocaleString("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function SalePaymentForm({
  sale,
  paymentMethods = [],
  onSubmit,
  saving = false,
  error = "",
}) {
  const remainingAmount = Number(sale?.remaining_amount ?? 0);

  const [formData, setFormData] = useState({
    amount: "",
    payment_method_id: "",
    reference: "",
  });

  const selectedPaymentMethod = useMemo(
    () =>
      paymentMethods.find(
        (method) => String(method.id) === String(formData.payment_method_id),
      ),
    [formData.payment_method_id, paymentMethods],
  );

  const requiresReference =
    selectedPaymentMethod?.requires_reference === true ||
    Number(selectedPaymentMethod?.requires_reference) === 1;

  const amount = Math.max(Number(formData.amount) || 0, 0);
  const amountIsTooHigh = amount > remainingAmount;
  const balanceAfterPayment = Math.max(remainingAmount - amount, 0);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === "payment_method_id" ? { reference: "" } : {}),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (amount <= 0 || amountIsTooHigh) {
      return;
    }

    onSubmit({
      amount: Number(amount.toFixed(2)),
      payment_method_id: Number(formData.payment_method_id),
      reference: formData.reference.trim() || null,
    });
  };

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:bg-slate-100";

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
          <CreditCard size={19} />
        </span>

        <div>
          <h2 className="font-bold text-slate-900">Record payment</h2>

          <p className="mt-0.5 text-sm text-slate-500">
            Add a payment to this sale&apos;s remaining balance.
          </p>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-slate-500">Current remaining</p>
            <p className="mt-1 text-lg font-bold text-amber-700">
              {formatMoney(remainingAmount)} MAD
            </p>
          </div>

          <div>
            <p className="text-slate-500">After this payment</p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {formatMoney(balanceAfterPayment)} MAD
            </p>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label htmlFor="amount" className="text-sm font-semibold">
              Amount
              <span className="ml-1 text-red-500">*</span>
            </label>

            <button
              type="button"
              onClick={() =>
                setFormData((current) => ({
                  ...current,
                  amount: remainingAmount.toFixed(2),
                }))
              }
              disabled={saving || remainingAmount <= 0}
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 disabled:opacity-40"
            >
              Pay full remaining
            </button>
          </div>

          <div className="relative">
            <input
              id="amount"
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              min="0.01"
              max={remainingAmount}
              step="0.01"
              placeholder="0.00"
              className={`${inputClass} pr-14`}
              disabled={saving || remainingAmount <= 0}
              required
            />

            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
              MAD
            </span>
          </div>

          {amountIsTooHigh && (
            <p className="mt-1.5 text-xs font-medium text-red-600">
              The payment cannot exceed the remaining amount.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="payment_method_id"
            className="mb-1.5 block text-sm font-semibold"
          >
            Payment method
            <span className="ml-1 text-red-500">*</span>
          </label>

          <div className="relative">
            <WalletCards
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
              id="payment_method_id"
              name="payment_method_id"
              value={formData.payment_method_id}
              onChange={handleChange}
              className={`${inputClass} pl-10`}
              disabled={saving || remainingAmount <= 0}
              required
            >
              <option value="">Select payment method</option>

              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {requiresReference && (
          <div>
            <label
              htmlFor="reference"
              className="mb-1.5 block text-sm font-semibold"
            >
              Payment reference
              <span className="ml-1 text-red-500">*</span>
            </label>

            <input
              id="reference"
              type="text"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              maxLength={255}
              placeholder="Transaction or cheque reference"
              className={inputClass}
              disabled={saving}
              required
            />
          </div>
        )}
      </div>

      <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-4">
        <button
          type="submit"
          disabled={
            saving || remainingAmount <= 0 || amount <= 0 || amountIsTooHigh
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && <Loader2 size={17} className="animate-spin" />}
          {saving ? "Recording..." : "Record payment"}
        </button>
      </div>
    </form>
  );
}

export default SalePaymentForm;
