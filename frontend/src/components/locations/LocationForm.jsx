import { useState } from "react";
import { Link } from "react-router-dom";

const initialForm = {
    name: "",
    code: "",
    type: "depot",
    address: "",
    phone: "",
    status: "active",
};

function LocationForm({
    initialData = initialForm,
    onSubmit,
    saving = false,
    error = "",
    submitText = "Save location",
}) {
    const isEditing = Boolean(initialData?.id);

    const [formData, setFormData] = useState(() => ({
        ...initialForm,
        ...initialData,
        type: initialData.type ?? "depot",
        address: initialData.address ?? "",
        phone: initialData.phone ?? "",
        status: initialData.status ?? "active",
    }));

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((currentForm) => ({
            ...currentForm,

            [name]:
                name === "code"
                    ? value.toUpperCase()
                    : value,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        onSubmit({
            ...formData,
            name: formData.name.trim(),
            code: formData.code
                .trim()
                .toUpperCase(),
            address: formData.address.trim(),
            phone: formData.phone.trim(),
        });
    };

    const inputClass =
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

    const selectClass = `${inputClass} appearance-none`;

    const labelClass =
        "mb-1.5 block text-sm font-medium text-slate-700";

    const requiredMark = (
        <span className="ml-1 text-red-500">
            *
        </span>
    );

    return (
        <form
            onSubmit={handleSubmit}
            autoComplete="off"
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
            {/* Header */}
            <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50/80 px-6 py-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                    <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        {isEditing ? (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L8.09 19.198l-4.243.53.53-4.243L16.862 4.487Z"
                            />
                        ) : (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4.5v15m7.5-7.5h-15"
                            />
                        )}
                    </svg>
                </div>

                <div>
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                        {isEditing
                            ? "Update location information"
                            : "New location information"}
                    </h2>

                    <p className="mt-0.5 text-sm text-slate-500">
                        Enter the location identification,
                        type and contact information.
                    </p>
                </div>
            </div>

            <div className="p-6">
                {/* Error */}
                {error && (
                    <div
                        role="alert"
                        className="mb-6 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                        <svg
                            className="mt-0.5 h-4 w-4 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                            />
                        </svg>

                        <span>{error}</span>
                    </div>
                )}

                {/* Identification */}
                <section className="mb-7">
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Location identification
                    </h3>

                    <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
                        {/* Name */}
                        <div>
                            <label
                                htmlFor="name"
                                className={labelClass}
                            >
                                Name
                                {requiredMark}
                            </label>

                            <input
                                id="name"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter the location name"
                                className={inputClass}
                                disabled={saving}
                                required
                            />
                        </div>

                        {/* Code */}
                        <div>
                            <label
                                htmlFor="code"
                                className={labelClass}
                            >
                                Code
                                {requiredMark}
                            </label>

                            <input
                                id="code"
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                placeholder="Example: LOC-01"
                                className={`${inputClass} uppercase`}
                                disabled={saving}
                                required
                            />

                            <p className="mt-1.5 text-xs text-slate-500">
                                The code is automatically
                                converted to uppercase.
                            </p>
                        </div>

                        {/* Location type */}
                        <div>
                            <label
                                htmlFor="type"
                                className={labelClass}
                            >
                                Location type
                                {requiredMark}
                            </label>

                            <select
                                id="type"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className={selectClass}
                                disabled={saving}
                                required
                            >
                                <option value="depot">
                                    Depot
                                </option>

                                <option value="magasin">
                                    Magasin
                                </option>
                            </select>

                            <p className="mt-1.5 text-xs text-slate-500">
                                Select how this location is
                                used by the company.
                            </p>
                        </div>

                        {/* Status */}
                        <div>
                            <label
                                htmlFor="status"
                                className={labelClass}
                            >
                                Status
                                {requiredMark}
                            </label>

                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className={selectClass}
                                disabled={saving}
                                required
                            >
                                <option value="active">
                                    Active
                                </option>

                                <option value="inactive">
                                    Inactive
                                </option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Contact information */}
                <section>
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Contact information
                    </h3>

                    <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
                        {/* Address */}
                        <div>
                            <label
                                htmlFor="address"
                                className={labelClass}
                            >
                                Address
                            </label>

                            <input
                                id="address"
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Enter the location address"
                                className={inputClass}
                                autoComplete="street-address"
                                disabled={saving}
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label
                                htmlFor="phone"
                                className={labelClass}
                            >
                                Phone
                            </label>

                            <input
                                id="phone"
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Example: 0567804321"
                                className={inputClass}
                                autoComplete="tel"
                                inputMode="tel"
                                disabled={saving}
                            />
                        </div>
                    </div>
                </section>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4 sm:flex-row sm:justify-end">
                <Link
                    to="/admin/locations"
                    className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                    Cancel
                </Link>

                <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {saving && (
                        <svg
                            className="h-4 w-4 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />

                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
                            />
                        </svg>
                    )}

                    {saving
                        ? "Saving..."
                        : submitText}
                </button>
            </div>
        </form>
    );
}

export default LocationForm;
