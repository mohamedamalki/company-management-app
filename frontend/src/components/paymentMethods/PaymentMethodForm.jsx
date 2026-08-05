import { CreditCard, FileText, Save } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const initialForm = {
  name: "",
  code: "",
  requires_reference: false,
  status: "active",
};

function PaymentMethodForm({
  initialData = initialForm,
  onSubmit,
  saving = false,
  error = "",
  submitText = "Save payment method",
}) {
  const [formData, setFormData] = useState({
    ...initialForm,
    ...initialData,
    requires_reference: Boolean(initialData.requires_reference),
  });

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((currentForm) => ({
      ...currentForm,
      [name]:
        type === "checkbox"
          ? checked
          : name === "code"
            ? value.toUpperCase()
            : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData);
  };

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-2.5 text-white shadow-sm shadow-blue-600/20">
            <CreditCard size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              Payment method information
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Configure how customers can pay for their sales.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Name <span className="text-red-500">*</span>
            </label>

            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Example: Bank transfer"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label
              htmlFor="code"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Code <span className="text-red-500">*</span>
            </label>

            <input
              id="code"
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Example: BANK_TRANSFER"
              className={`${inputClass} font-mono uppercase`}
              required
            />

            <p className="mt-1.5 text-xs text-slate-500">
              Use letters, numbers, dashes, or underscores.
            </p>
          </div>

          <div>
            <label
              htmlFor="status"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Status <span className="text-red-500">*</span>
            </label>

            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <p className="mt-1.5 text-xs text-slate-500">
              Inactive methods cannot be used in new payments.
            </p>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Payment reference
            </span>

            <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 transition hover:border-blue-300 hover:bg-blue-50/40">
              <input
                type="checkbox"
                name="requires_reference"
                checked={formData.requires_reference}
                onChange={handleChange}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />

              <span>
                <span className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                  <FileText size={15} />
                  Require a reference
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  Ask for a cheque number, transfer reference, or transaction
                  reference.
                </span>
              </span>
            </label>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
          <Link
            to="/admin/payment-methods"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-w-44 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={17} />
            {saving ? "Saving..." : submitText}
          </button>
        </div>
      </div>
    </form>
  );
}

export default PaymentMethodForm;
