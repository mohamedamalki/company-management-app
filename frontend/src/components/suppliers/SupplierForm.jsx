import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Save } from "lucide-react";

const emptySupplier = {
  name: "",
  code: "",
  contact_name: "",
  email: "",
  phone: "",
  address: "",
  ice: "",
  is_active: true,
};

function SupplierForm({
  initialData = emptySupplier,
  onSubmit,
  saving = false,
  error = "",
  submitText = "Save supplier",
}) {
  const [formData, setFormData] = useState({
    ...emptySupplier,
    ...initialData,
    is_active: initialData?.is_active ?? true,
  });

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
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

    onSubmit({
      ...formData,
      email: formData.email || null,
      phone: formData.phone || null,
      contact_name: formData.contact_name || null,
      address: formData.address || null,
      ice: formData.ice || null,
    });
  };

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex items-center gap-4 border-b border-slate-200 bg-slate-50 px-6 py-5">
        <div className="rounded-xl bg-slate-900 p-3 text-white">
          <Building2 size={22} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Supplier information
          </h2>
          <p className="text-sm text-slate-500">
            Enter the company and contact information.
          </p>
        </div>
      </div>

      <div className="space-y-7 p-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section>
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
            Company
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>
                Name <span className="text-red-500">*</span>
              </span>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={inputClass}
                placeholder="Supplier name"
                required
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>
                Code <span className="text-red-500">*</span>
              </span>
              <input
                name="code"
                value={formData.code}
                onChange={handleChange}
                className={inputClass}
                placeholder="SUP-001"
                required
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>ICE</span>
              <input
                name="ice"
                value={formData.ice ?? ""}
                onChange={handleChange}
                className={inputClass}
                placeholder="Company ICE"
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Contact person</span>
              <input
                name="contact_name"
                value={formData.contact_name ?? ""}
                onChange={handleChange}
                className={inputClass}
                placeholder="Contact name"
              />
            </label>
          </div>
        </section>

        <section>
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
            Contact
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={formData.email ?? ""}
                onChange={handleChange}
                className={inputClass}
                placeholder="contact@supplier.com"
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Phone</span>
              <input
                type="tel"
                name="phone"
                value={formData.phone ?? ""}
                onChange={handleChange}
                className={inputClass}
                placeholder="+212 ..."
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700 md:col-span-2">
              <span>Address</span>
              <textarea
                name="address"
                value={formData.address ?? ""}
                onChange={handleChange}
                rows="3"
                className={inputClass}
                placeholder="Supplier address"
              />
            </label>
          </div>
        </section>

        <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <span>
            <span className="block text-sm font-semibold text-slate-800">
              Active supplier
            </span>
            <span className="text-xs text-slate-500">
              Active suppliers can be selected in purchase orders.
            </span>
          </span>

          <input
            type="checkbox"
            name="is_active"
            checked={Boolean(formData.is_active)}
            onChange={handleChange}
            className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
        </label>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5">
        <Link
          to="/admin/suppliers"
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={17} />
          {saving ? "Saving..." : submitText}
        </button>
      </div>
    </form>
  );
}

export default SupplierForm;
