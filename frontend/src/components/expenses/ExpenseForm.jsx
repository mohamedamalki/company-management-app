import {
  Building2,
  CalendarDays,
  FileText,
  Loader2,
  ReceiptText,
  UploadCloud,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { extractApiError, formatMoney, toDateInput } from "./expenseHelpers";

const today = new Date().toISOString().slice(0, 10);

const emptyExpense = {
  expense_category_id: "",
  location_id: "",
  supplier_id: "",
  tax_rate_id: "",
  title: "",
  bill_reference: "",
  issue_date: today,
  due_date: "",
  period_start: "",
  period_end: "",
  amount_ht: "",
  notes: "",
  document: null,
  remove_document: false,
};

function normalizeInitialData(initialData) {
  return {
    ...emptyExpense,
    ...initialData,
    expense_category_id: initialData?.expense_category_id ?? "",
    location_id: initialData?.location_id ?? "",
    supplier_id: initialData?.supplier_id ?? "",
    tax_rate_id: initialData?.tax_rate_id ?? "",
    title: initialData?.title ?? "",
    bill_reference: initialData?.bill_reference ?? "",
    issue_date: toDateInput(initialData?.issue_date) || today,
    due_date: toDateInput(initialData?.due_date),
    period_start: toDateInput(initialData?.period_start),
    period_end: toDateInput(initialData?.period_end),
    amount_ht: initialData?.amount_ht ?? "",
    notes: initialData?.notes ?? "",
    document: null,
    remove_document: false,
  };
}

function ExpenseForm({
  initialData = null,
  onSubmit,
  saving = false,
  error = "",
  submitText = "Save expense",
}) {
  const isEditing = Boolean(initialData?.id);
  const [formData, setFormData] = useState(() =>
    normalizeInitialData(initialData),
  );
  const [options, setOptions] = useState({
    locations: [],
    categories: [],
    suppliers: [],
    tax_rates: [],
  });
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    api
      .get("/expenses/options", { signal: controller.signal })
      .then((response) => {
        const data = response.data.data ?? {};
        setOptions({
          locations: Array.isArray(data.locations) ? data.locations : [],
          categories: Array.isArray(data.categories) ? data.categories : [],
          suppliers: Array.isArray(data.suppliers) ? data.suppliers : [],
          tax_rates: Array.isArray(data.tax_rates) ? data.tax_rates : [],
        });
        setOptionsError("");
      })
      .catch((requestError) => {
        if (requestError.code !== "ERR_CANCELED") {
          setOptionsError(
            extractApiError(requestError, "Unable to load expense options."),
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setOptionsLoading(false);
      });

    return () => controller.abort();
  }, []);

  const selectedTaxRate = useMemo(
    () =>
      options.tax_rates.find(
        (rate) => String(rate.id) === String(formData.tax_rate_id),
      ),
    [formData.tax_rate_id, options.tax_rates],
  );

  const totals = useMemo(() => {
    const amountHt = Number(formData.amount_ht) || 0;
    const taxRate = Number(selectedTaxRate?.rate) || 0;
    const taxAmount = (amountHt * taxRate) / 100;

    return {
      amountHt,
      taxRate,
      taxAmount,
      totalTtc: amountHt + taxAmount,
    };
  }, [formData.amount_ht, selectedTaxRate]);

  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target;

    setFormData((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : type === "file"
            ? (files?.[0] ?? null)
            : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      ...formData,
      title: formData.title.trim(),
      bill_reference: formData.bill_reference.trim(),
      notes: formData.notes.trim(),
    });
  };

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:bg-slate-100";
  const labelClass = "mb-1.5 block text-sm font-semibold text-slate-700";

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-6 py-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
          <ReceiptText size={22} />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {isEditing ? "Update expense" : "Record a new expense"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Record a bill, its period, TVA, supplier, and supporting document.
          </p>
        </div>
      </div>

      <div className="space-y-7 p-6">
        {(error || optionsError) && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error || optionsError}
          </div>
        )}

        <section>
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Building2 size={16} /> Assignment
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label htmlFor="expense_category_id" className={labelClass}>
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="expense_category_id"
                name="expense_category_id"
                value={formData.expense_category_id}
                onChange={handleChange}
                disabled={saving || optionsLoading}
                className={inputClass}
                required
              >
                <option value="">Select category</option>
                {options.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} — {category.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="location_id" className={labelClass}>
                Location
              </label>
              <select
                id="location_id"
                name="location_id"
                value={formData.location_id}
                onChange={handleChange}
                disabled={saving || optionsLoading}
                className={inputClass}
              >
                <option value="">Company-wide expense</option>
                {options.locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} — {location.code}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">
                Company-wide is available to administrators only.
              </p>
            </div>

            <div>
              <label htmlFor="supplier_id" className={labelClass}>
                Supplier
              </label>
              <select
                id="supplier_id"
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleChange}
                disabled={saving || optionsLoading}
                className={inputClass}
              >
                <option value="">No supplier</option>
                {options.suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name} — {supplier.code}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <FileText size={16} /> Bill information
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="title" className={labelClass}>
                Expense title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Example: August electricity bill"
                maxLength={255}
                disabled={saving}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="bill_reference" className={labelClass}>
                Bill reference
              </label>
              <input
                id="bill_reference"
                name="bill_reference"
                value={formData.bill_reference}
                onChange={handleChange}
                placeholder="Invoice or contract number"
                maxLength={100}
                disabled={saving}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <CalendarDays size={16} /> Dates and billing period
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <label htmlFor="issue_date" className={labelClass}>
                Issue date <span className="text-red-500">*</span>
              </label>
              <input
                id="issue_date"
                type="date"
                name="issue_date"
                value={formData.issue_date}
                onChange={handleChange}
                disabled={saving}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="due_date" className={labelClass}>
                Due date
              </label>
              <input
                id="due_date"
                type="date"
                name="due_date"
                min={formData.issue_date || undefined}
                value={formData.due_date}
                onChange={handleChange}
                disabled={saving}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="period_start" className={labelClass}>
                Period start
              </label>
              <input
                id="period_start"
                type="date"
                name="period_start"
                value={formData.period_start}
                onChange={handleChange}
                disabled={saving}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="period_end" className={labelClass}>
                Period end
              </label>
              <input
                id="period_end"
                type="date"
                name="period_end"
                min={formData.period_start || undefined}
                value={formData.period_end}
                onChange={handleChange}
                disabled={saving}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr_1.25fr]">
          <div>
            <label htmlFor="amount_ht" className={labelClass}>
              Amount HT <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="amount_ht"
                type="number"
                name="amount_ht"
                value={formData.amount_ht}
                onChange={handleChange}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                disabled={saving}
                className={`${inputClass} pr-14`}
                required
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                MAD
              </span>
            </div>
          </div>
          <div>
            <label htmlFor="tax_rate_id" className={labelClass}>
              TVA rate
            </label>
            <select
              id="tax_rate_id"
              name="tax_rate_id"
              value={formData.tax_rate_id}
              onChange={handleChange}
              disabled={saving || optionsLoading}
              className={inputClass}
            >
              <option value="">No TVA (0%)</option>
              {options.tax_rates.map((rate) => (
                <option key={rate.id} value={rate.id}>
                  {rate.name} — {Number(rate.rate)}%
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-blue-500">HT</p>
                <p className="mt-1 font-bold text-slate-900">
                  {formatMoney(totals.amountHt)} MAD
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-blue-500">
                  TVA ({totals.taxRate}%)
                </p>
                <p className="mt-1 font-bold text-slate-900">
                  {formatMoney(totals.taxAmount)} MAD
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-blue-500">TTC</p>
                <p className="mt-1 text-lg font-extrabold text-blue-700">
                  {formatMoney(totals.totalTtc)} MAD
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div>
            <label htmlFor="notes" className={labelClass}>
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Optional internal notes"
              rows={4}
              maxLength={5000}
              disabled={saving}
              className={`${inputClass} resize-y`}
            />
          </div>

          <div>
            <label htmlFor="document" className={labelClass}>
              Supporting document
            </label>
            <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 text-center hover:border-blue-400 hover:bg-blue-50/50">
              <UploadCloud size={23} className="text-slate-400" />
              <span className="mt-2 text-sm font-semibold text-slate-700">
                {formData.document?.name ?? "Choose PDF or image"}
              </span>
              <span className="mt-1 text-xs text-slate-400">
                PDF, JPG, PNG or WEBP — maximum 5 MB
              </span>
              <input
                id="document"
                type="file"
                name="document"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleChange}
                disabled={saving}
                className="sr-only"
              />
            </label>

            {isEditing && initialData?.document_path && (
              <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  name="remove_document"
                  checked={formData.remove_document}
                  onChange={handleChange}
                  disabled={saving || Boolean(formData.document)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                Remove the current document
              </label>
            )}
          </div>
        </section>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
        <Link
          to={isEditing ? `/app/expenses/${initialData.id}` : "/app/expenses"}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving || optionsLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving && <Loader2 size={17} className="animate-spin" />}
          {saving ? "Saving..." : submitText}
        </button>
      </div>
    </form>
  );
}

export default ExpenseForm;
