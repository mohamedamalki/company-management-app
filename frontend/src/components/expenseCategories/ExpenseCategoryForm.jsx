import { FolderCog, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const emptyCategory = {
  name: "",
  code: "",
  due_date : "" ,
  description: "",
  is_active: true,
};

function ExpenseCategoryForm({
  initialData = null,
  onSubmit,
  saving = false,
  error = "",
  submitText = "Save category",
}) {
  const isEditing = Boolean(initialData?.id);

  const [formData, setFormData] = useState(() => ({
    ...emptyCategory,
    ...initialData,
    description: initialData?.description ?? "",
    is_active: initialData?.is_active ?? true,
  }));

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : name === "code"
            ? value.toUpperCase().replaceAll(" ", "_")
            : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      due_date: formData.due_date.trim(),
      description: formData.description.trim() || null,
      is_active: Boolean(formData.is_active),
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
          <FolderCog size={21} />
        </span>

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {isEditing ? "Update expense category" : "New expense category"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Organize electricity, rent, salaries, maintenance, and other bills.
          </p>
        </div>
      </div>

      <div className="space-y-5 p-6">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Category name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Example: Electricity"
              maxLength={255}
              disabled={saving}
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
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="ELECTRICITY"
              maxLength={50}
              pattern="[A-Z0-9_-]+"
              disabled={saving}
              className={inputClass}
              required
            />
          </div>
        </div>
        <div>
            <div>
              <label htmlFor="due_date" className={labelClass}>
                Due date
              </label>
              <input
                id="due_date"
                type="number"
                name="due_date"
                min="1"
                max="31"
                value={formData.due_date}
                onChange={handleChange}
                disabled={saving}
                className={inputClass}
                required
              />
            </div>
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Optional explanation about this expense category"
            rows={4}
            maxLength={2000}
            disabled={saving}
            className={`${inputClass} resize-y`}
          />
        </div>

        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <span>
            <span className="block text-sm font-bold text-slate-800">
              Active category
            </span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Active categories can be selected when creating an expense.
            </span>
          </span>
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            disabled={saving}
            className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
        </label>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
        <Link
          to="/app/expense-categories"
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving && <Loader2 size={17} className="animate-spin" />}
          {saving ? "Saving..." : submitText}
        </button>
      </div>
    </form>
  );
}

export default ExpenseCategoryForm;
