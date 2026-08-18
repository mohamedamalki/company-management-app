import {
  Building2,
  CalendarDays,
  FileText,
  Loader2,
  ReceiptText,
  UploadCloud,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import {
  extractApiError,
  formatMoney,
  toDateInput,
} from "./expenseHelpers";

const today = new Date().toISOString().slice(0, 10);

const emptyExpense = {
  expense_category_id: "",
  location_id: "",
  supplier_id: "",
  salary_id: "",
  tax_rate_id: "",
  title: "",
  bill_reference: "",
  issue_date: today,
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
    salary_id: initialData?.salary_id ?? "",
    tax_rate_id: initialData?.tax_rate_id ?? "",

    title: initialData?.title ?? "",
    bill_reference: initialData?.bill_reference ?? "",

    issue_date: toDateInput(initialData?.issue_date) || today,

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
    salaries: [],
    tax_rates: [],
  });

  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");

  /*
   * Load expense options.
   *
   * This effect is appropriate because it synchronizes
   * the component with an external API.
   */
  useEffect(() => {
    const controller = new AbortController();

    api
      .get("/expenses/options", {
        signal: controller.signal,
      })
      .then((response) => {
        const data = response.data.data ?? {};

        setOptions({
          locations: Array.isArray(data.locations)
            ? data.locations
            : [],

          categories: Array.isArray(data.categories)
            ? data.categories
            : [],

          suppliers: Array.isArray(data.suppliers)
            ? data.suppliers
            : [],

          salaries: Array.isArray(data.salaries)
            ? data.salaries
            : [],

          tax_rates: Array.isArray(data.tax_rates)
            ? data.tax_rates
            : [],
        });

        setOptionsError("");
      })
      .catch((requestError) => {
        if (requestError.code !== "ERR_CANCELED") {
          setOptionsError(
            extractApiError(
              requestError,
              "Unable to load expense options.",
            ),
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setOptionsLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  /*
   * Selected expense category.
   */
  const selectedCategory = useMemo(
    () =>
      options.categories.find(
        (category) =>
          String(category.id) ===
          String(formData.expense_category_id),
      ),
    [formData.expense_category_id, options.categories],
  );

  /*
   * Salary category is identified by its code.
   */
  const isSalaryExpense =
    String(selectedCategory?.code ?? "").toUpperCase() ===
    "SALARIES";

  /*
   * Selected salary.
   */
  const selectedSalary = useMemo(
    () =>
      options.salaries.find(
        (salary) =>
          String(salary.id) === String(formData.salary_id),
      ),
    [formData.salary_id, options.salaries],
  );

  /*
   * Selected TVA rate.
   */
  const selectedTaxRate = useMemo(
    () =>
      options.tax_rates.find(
        (rate) =>
          String(rate.id) === String(formData.tax_rate_id),
      ),
    [formData.tax_rate_id, options.tax_rates],
  );

  /*
   * Financial totals.
   */
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

  /*
   * Handle form changes.
   *
   * Category changes:
   * - Salary category -> remove supplier.
   * - Non-salary category -> remove salary.
   *
   * Salary changes:
   * - Automatically fill amount_ht with net salary.
   * - Remove TVA because salary expense has no TVA.
   */
  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
      files,
    } = event.target;

    /*
     * Category changed.
     */
    if (name === "expense_category_id") {
      const selectedCategoryFromOptions =
        options.categories.find(
          (category) =>
            String(category.id) === String(value),
        );

      const salaryCategory =
        String(
          selectedCategoryFromOptions?.code ?? "",
        ).toUpperCase() === "SALARIES";

      setFormData((current) => ({
        ...current,

        expense_category_id: value,

        /*
         * Salary expense cannot have a supplier.
         */
        supplier_id: salaryCategory
          ? ""
          : current.supplier_id,

        /*
         * Non-salary expense cannot have a salary.
         */
        salary_id: salaryCategory
          ? current.salary_id
          : "",

        /*
         * If switching away from salary,
         * allow the user to select TVA again.
         */
        tax_rate_id: salaryCategory
          ? ""
          : current.tax_rate_id,
      }));

      return;
    }

    /*
     * Salary changed.
     */
    if (name === "salary_id") {
      const salary = options.salaries.find(
        (item) => String(item.id) === String(value),
      );

      if (!salary) {
        setFormData((current) => ({
          ...current,
          salary_id: value,
        }));

        return;
      }

      const netAmount =
        salary.net_salary ??
        salary.amount ??
        salary.net_amount ??
        0;

      setFormData((current) => ({
        ...current,
        salary_id: value,
        amount_ht: String(netAmount),
        tax_rate_id: "",
        supplier_id: "",
      }));

      return;
    }

    /*
     * File input.
     */
    if (type === "file") {
      setFormData((current) => ({
        ...current,
        [name]: files?.[0] ?? null,

        /*
         * If the user chooses a new document,
         * there is no reason to remove the old one.
         */
        ...(name === "document" && files?.[0]
          ? { remove_document: false }
          : {}),
      }));

      return;
    }

    /*
     * Checkbox.
     */
    if (type === "checkbox") {
      setFormData((current) => ({
        ...current,
        [name]: checked,
      }));

      return;
    }

    /*
     * Normal input/select/textarea.
     */
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /*
   * Submit form.
   */
  const handleSubmit = (event) => {
    event.preventDefault();

    /*
     * Salary expense must have a salary.
     */
    if (isSalaryExpense && !formData.salary_id) {
      setOptionsError(
        "Please select the salary associated with this expense.",
      );
      return;
    }

    setOptionsError("");

    onSubmit({
      ...formData,

      title: formData.title.trim(),

      bill_reference:
        formData.bill_reference.trim(),

      notes: formData.notes.trim(),

      /*
       * Don't send salary_id for non-salary expenses.
       */
      salary_id: isSalaryExpense
        ? formData.salary_id
        : "",

      /*
       * Don't send supplier_id for salary expenses.
       */
      supplier_id: isSalaryExpense
        ? ""
        : formData.supplier_id,
    });
  };

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:bg-slate-100";

  const labelClass =
    "mb-1.5 block text-sm font-semibold text-slate-700";

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-6 py-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
          <ReceiptText size={22} />
        </span>

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {isEditing
              ? "Update expense"
              : "Record a new expense"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Record a bill, its period, TVA, supplier,
            and supporting document.
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

        {/* Assignment */}
        <section>
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Building2 size={16} />
            Assignment
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {/* Category */}
            <div>
              <label
                htmlFor="expense_category_id"
                className={labelClass}
              >
                Category{" "}
                <span className="text-red-500">*</span>
              </label>

              <select
                id="expense_category_id"
                name="expense_category_id"
                value={formData.expense_category_id}
                onChange={handleChange}
                disabled={
                  saving || optionsLoading
                }
                className={inputClass}
                required
              >
                <option value="">
                  Select category
                </option>

                {options.categories.map(
                  (category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                      {category.code
                        ? ` — ${category.code}`
                        : ""}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="location_id"
                className={labelClass}
              >
                Location
              </label>

              <select
                id="location_id"
                name="location_id"
                value={formData.location_id}
                onChange={handleChange}
                disabled={
                  saving || optionsLoading
                }
                className={inputClass}
              >
                <option value="">
                  Company-wide expense
                </option>

                {options.locations.map(
                  (location) => (
                    <option
                      key={location.id}
                      value={location.id}
                    >
                      {location.name}
                      {location.code
                        ? ` — ${location.code}`
                        : ""}
                    </option>
                  ),
                )}
              </select>

              <p className="mt-1 text-xs text-slate-400">
                Company-wide is available to
                administrators only.
              </p>
            </div>

            {/* Supplier */}
            {!isSalaryExpense && (
              <div>
                <label
                  htmlFor="supplier_id"
                  className={labelClass}
                >
                  Supplier
                </label>

                <select
                  id="supplier_id"
                  name="supplier_id"
                  value={formData.supplier_id}
                  onChange={handleChange}
                  disabled={
                    saving || optionsLoading
                  }
                  className={inputClass}
                >
                  <option value="">
                    No supplier
                  </option>

                  {options.suppliers.map(
                    (supplier) => (
                      <option
                        key={supplier.id}
                        value={supplier.id}
                      >
                        {supplier.name}
                      </option>
                    ),
                  )}
                </select>
              </div>
            )}
          </div>

          {/* Salary assignment */}
          {isSalaryExpense && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <UserRound size={18} />
                </span>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Salary assignment
                  </h3>

                  <p className="text-xs text-slate-500">
                    Select the salary record this expense
                    represents. The amount and TVA are
                    filled in automatically from that
                    record.
                  </p>
                </div>
              </div>

              <label
                htmlFor="salary_id"
                className={labelClass}
              >
                Salary{" "}
                <span className="text-red-500">*</span>
              </label>

              <select
                id="salary_id"
                name="salary_id"
                value={formData.salary_id}
                onChange={handleChange}
                disabled={
                  saving || optionsLoading
                }
                className={inputClass}
                required
              >
                <option value="">
                  Select salary
                </option>

                {options.salaries.map(
                  (salary) => {
                    const employee =
                      salary.employee;

                    const employeeName = [
                      employee?.first_name,
                      employee?.last_name,
                    ]
                      .filter(Boolean)
                      .join(" ") || "Employee";

                    return (
                      <option
                        key={salary.id}
                        value={salary.id}
                      >
                        {employeeName}
                        {" — "}
                        {formatMoney(
                          salary.net_salary ??
                            salary.amount ??
                            salary.net_amount ??
                            0,
                        )}{" "}
                        MAD
                        {salary.period
                          ? ` — ${salary.period}`
                          : ""}
                      </option>
                    );
                  },
                )}
              </select>

              {selectedSalary && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-white px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Selected salary
                  </p>

                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-slate-400">
                        Employee
                      </p>

                      <p className="font-semibold text-slate-900">
                        {selectedSalary.employee
                          ? [
                              selectedSalary.employee
                                .first_name,
                              selectedSalary.employee
                                .last_name,
                            ]
                              .filter(Boolean)
                              .join(" ")
                          : "Employee"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Salary
                      </p>

                      <p className="font-semibold text-slate-900">
                        {formatMoney(
                          selectedSalary.net_salary ??
                            selectedSalary.amount ??
                            selectedSalary.net_amount ??
                            0,
                        )}{" "}
                        MAD
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Period
                      </p>

                      <p className="font-semibold text-slate-900">
                        {selectedSalary.period ??
                          selectedSalary.month ??
                          "-"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Bill information */}
        <section>
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <FileText size={16} />
            Bill information
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="title"
                className={labelClass}
              >
                Expense title{" "}
                <span className="text-red-500">*</span>
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
              <label
                htmlFor="bill_reference"
                className={labelClass}
              >
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

        {/* Dates */}
        <section>
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <CalendarDays size={16} />
            Dates and billing period
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <label
                htmlFor="issue_date"
                className={labelClass}
              >
                Issue date{" "}
                <span className="text-red-500">*</span>
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
          </div>
        </section>

        {/* Financial */}
        <section className="grid gap-5 lg:grid-cols-[1fr_1fr_1.25fr]">
          {/* Amount */}
          <div>
            <label
              htmlFor="amount_ht"
              className={labelClass}
            >
              Amount HT{" "}
              <span className="text-red-500">*</span>
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
                disabled={
                  saving || isSalaryExpense
                }
                className={`${inputClass} pr-14`}
                required
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                MAD
              </span>
            </div>

            {isSalaryExpense && (
              <p className="mt-1 text-xs text-slate-400">
                Filled automatically from the selected
                salary&apos;s net amount.
              </p>
            )}
          </div>

          {/* TVA */}
          <div>
            <label
              htmlFor="tax_rate_id"
              className={labelClass}
            >
              TVA rate
            </label>

            <select
              id="tax_rate_id"
              name="tax_rate_id"
              value={formData.tax_rate_id}
              onChange={handleChange}
              disabled={
                saving ||
                optionsLoading ||
                isSalaryExpense
              }
              className={inputClass}
            >
              <option value="">
                No TVA (0%)
              </option>

              {options.tax_rates.map(
                (rate) => (
                  <option
                    key={rate.id}
                    value={rate.id}
                  >
                    {rate.name} —{" "}
                    {Number(rate.rate)}%
                  </option>
                ),
              )}
            </select>
          </div>

          {/* Totals */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-blue-500">
                  HT
                </p>

                <p className="mt-1 font-bold text-slate-900">
                  {formatMoney(
                    totals.amountHt,
                  )}{" "}
                  MAD
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-blue-500">
                  TVA ({totals.taxRate}%)
                </p>

                <p className="mt-1 font-bold text-slate-900">
                  {formatMoney(
                    totals.taxAmount,
                  )}{" "}
                  MAD
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-blue-500">
                  TTC
                </p>

                <p className="mt-1 text-lg font-extrabold text-blue-700">
                  {formatMoney(
                    totals.totalTtc,
                  )}{" "}
                  MAD
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Notes + document */}
        <section className="grid gap-5 lg:grid-cols-2">
          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className={labelClass}
            >
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

          {/* Document */}
          <div>
            <label
              htmlFor="document"
              className={labelClass}
            >
              Supporting document
            </label>

            <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 text-center hover:border-blue-400 hover:bg-blue-50/50">
              <UploadCloud
                size={23}
                className="text-slate-400"
              />

              <span className="mt-2 text-sm font-semibold text-slate-700">
                {formData.document?.name ??
                  "Choose PDF or image"}
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

            {isEditing &&
              initialData?.document_path && (
                <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    name="remove_document"
                    checked={
                      formData.remove_document
                    }
                    onChange={handleChange}
                    disabled={
                      saving ||
                      Boolean(formData.document)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />

                  Remove the current document
                </label>
              )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
        <Link
          to={
            isEditing
              ? `/app/expenses/${initialData.id}`
              : "/app/expenses"
          }
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={
            saving || optionsLoading
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving && (
            <Loader2
              size={17}
              className="animate-spin"
            />
          )}

          {saving
            ? "Saving..."
            : submitText}
        </button>
      </div>
    </form>
  );
}

export default ExpenseForm;
