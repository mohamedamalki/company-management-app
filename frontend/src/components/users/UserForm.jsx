import { useState } from "react";
import { Link } from "react-router-dom";

const initialForm = {
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "responsable",
    status: "active",
};

function UserForm({
    initialData = initialForm,
    onSubmit,
    saving = false,
    error = "",
    submitText = "Save user",
}) {
    const isEditing = Boolean(initialData?.id);

    const [formData, setFormData] = useState(() => ({
        ...initialForm,
        ...initialData,
        password: "",
        password_confirmation: "",
    }));

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((currentForm) => ({
            ...currentForm,
            [name]: value,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        onSubmit(formData);
    };

    const inputClass =
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

    const selectClass = `${inputClass} appearance-none`;

    const labelClass =
        "mb-1.5 block text-sm font-medium text-slate-700";

    const requiredMark = (
        <span className="ml-1 text-red-500">*</span>
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
                                d="M18 7.5v6m3-3h-6m-1.5-3.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                            />
                        )}
                    </svg>
                </div>

                <div>
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                        {isEditing
                            ? "Update user information"
                            : "New user information"}
                    </h2>

                    <p className="mt-0.5 text-sm text-slate-500">
                        Enter the user account and access
                        information.
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

                {/* Account credentials */}
                <section className="mb-7">
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Account credentials
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
                                placeholder="Enter the user name"
                                className={inputClass}
                                disabled={saving}
                                autoComplete="off"
                                required
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label
                                htmlFor="email"
                                className={labelClass}
                            >
                                Email
                                {requiredMark}
                            </label>

                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="example@email.com"
                                className={inputClass}
                                disabled={saving}
                                autoComplete="off"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="password"
                                className={labelClass}
                            >
                                Password
                                {!isEditing && requiredMark}
                            </label>

                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder={
                                    isEditing
                                        ? "Leave empty to keep password"
                                        : "Minimum 8 characters"
                                }
                                className={inputClass}
                                disabled={saving}
                                autoComplete="new-password"
                                minLength={8}
                                required={!isEditing}
                            />

                            {isEditing && (
                                <p className="mt-1.5 text-xs text-slate-500">
                                    Leave empty to keep the current
                                    password.
                                </p>
                            )}
                        </div>

                        {/* Password confirmation */}
                        <div>
                            <label
                                htmlFor="password_confirmation"
                                className={labelClass}
                            >
                                Confirm password
                                {!isEditing && requiredMark}
                            </label>

                            <input
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                value={
                                    formData.password_confirmation
                                }
                                onChange={handleChange}
                                placeholder="Repeat the password"
                                className={inputClass}
                                disabled={saving}
                                autoComplete="new-password"
                                minLength={8}
                                required={!isEditing}
                            />
                        </div>
                    </div>
                </section>

                {/* Access settings */}
                <section>
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Access settings
                    </h3>

                    <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
                        {/* Role */}
                        <div>
                            <label
                                htmlFor="role"
                                className={labelClass}
                            >
                                Role
                                {requiredMark}
                            </label>

                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className={selectClass}
                                disabled={saving}
                                required
                            >
                                <option value="admin">
                                    Admin
                                </option>

                                <option value="responsable">
                                    Responsable
                                </option>

                                <option value="fournisseur">
                                    Fournisseur
                                </option>
                            </select>
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
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4 sm:flex-row sm:justify-end">
                <Link
                    to="/admin/users"
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

                    {saving ? "Saving..." : submitText}
                </button>
            </div>
        </form>
    );
}

export default UserForm;
