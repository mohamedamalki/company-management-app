import { useState } from "react";
import { Link } from "react-router-dom";

const initialForm = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    position: "",
};

function EmployeeForm({
    initialData = initialForm,
    onSubmit,
    saving,
    error,
    submitText,
}) {
    const [formData, setFormData] = useState({
        ...initialForm,
        ...initialData,
        first_name: initialData.first_name ?? "",
        last_name: initialData.last_name ?? "",
        email: initialData.email ?? "",
        phone: initialData.phone ?? "",
        position: initialData.position ?? "",
    });

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((currentForm) => ({
            ...currentForm,
            [name]: value,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        onSubmit({
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            position: formData.position.trim(),
        });
    };

    const inputClass =
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-100";

    const labelClass =
        "mb-1.5 block text-sm font-medium text-slate-700";

    const isUpdate = Boolean(initialData.id);

    return (
        <form
            onSubmit={handleSubmit}
            autoComplete="off"
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
            <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50/80 px-6 py-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">
                    {isUpdate ? "✎" : "+"}
                </div>

                <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                        {isUpdate
                            ? "Update employee"
                            : "New employee"}
                    </h2>

                    <p className="mt-0.5 text-sm text-slate-500">
                        Enter the employee information.
                    </p>
                </div>
            </div>

            <div className="space-y-5 p-6">
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                        <label
                            htmlFor="first_name"
                            className={labelClass}
                        >
                            First name
                            <span className="ml-1 text-red-500">
                                *
                            </span>
                        </label>

                        <input
                            id="first_name"
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            placeholder="Example: John"
                            className={inputClass}
                            disabled={saving}
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="last_name"
                            className={labelClass}
                        >
                            Last name
                            <span className="ml-1 text-red-500">
                                *
                            </span>
                        </label>

                        <input
                            id="last_name"
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            placeholder="Example: Doe"
                            className={inputClass}
                            disabled={saving}
                            required
                        />
                    </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                        <label
                            htmlFor="email"
                            className={labelClass}
                        >
                            Email
                            <span className="ml-1 text-red-500">
                                *
                            </span>
                        </label>

                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Example: john@example.com"
                            className={inputClass}
                            disabled={saving}
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="phone"
                            className={labelClass}
                        >
                            Phone
                            <span className="ml-1 text-red-500">
                                *
                            </span>
                        </label>

                        <input
                            id="phone"
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Example: +212 600 000 000"
                            className={inputClass}
                            disabled={saving}
                            required
                        />
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="position"
                        className={labelClass}
                    >
                        Position
                        <span className="ml-1 text-red-500">
                            *
                        </span>
                    </label>

                    <input
                        id="position"
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        placeholder="Example: Software Developer"
                        className={inputClass}
                        disabled={saving}
                        required
                    />
                </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4 sm:flex-row sm:justify-end">
                <Link
                    to="/app/employees"
                    className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                    Cancel
                </Link>

                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                    {saving ? "Saving..." : submitText}
                </button>
            </div>
        </form>
    );
}

export default EmployeeForm;
