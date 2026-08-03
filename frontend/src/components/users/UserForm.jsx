import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const initialForm = {
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "responsable",
    status: "active",
    depot_id: "",
};

function UserForm({
    initialData = initialForm,
    onSubmit,
    saving,
    error,
    submitText,
}) {
    const [formData, setFormData] = useState({
        ...initialForm,
        ...initialData,
        depot_id: initialData.depot_id ?? "",
        password: "",
        password_confirmation: "",
    });

    const [depots, setDepots] = useState([]);
    const [loadingDepots, setLoadingDepots] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const loadDepots = async () => {
            try {
                const response = await api.get("/depots");

                const data =
                    response.data.data ??
                    response.data.depots ??
                    response.data;

                if (!cancelled) {
                    const activeDepots = Array.isArray(data)
                        ? data.filter(
                            (depot) =>
                                depot.status === "active"
                        )
                        : [];

                    setDepots(activeDepots);
                }
            } catch (error) {
                console.error(
                    "Unable to load depots:",
                    error
                );
            } finally {
                if (!cancelled) {
                    setLoadingDepots(false);
                }
            }
        };

        loadDepots();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((currentForm) => ({
            ...currentForm,
            [name]: value,

            // Remove depot when role becomes fournisseur
            ...(name === "role" &&
            value !== "responsable"
                ? { depot_id: "" }
                : {}),
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit(formData);
    };

    const inputClass =
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

    const selectClass = `${inputClass} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22none%22 stroke=%22%2394a3b8%22 stroke-width=%221.5%22><path stroke-linecap=%22round%22 stroke-linejoin=%22round%22 d=%22M6 8l4 4 4-4%22/></svg>')] bg-[right_0.75rem_center] bg-no-repeat pr-9`;

    const labelClass =
        "mb-1.5 block text-sm font-medium text-slate-700";

    const requiredMark = (
        <span className="ml-1 text-red-500">*</span>
    );

    return (
        <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
            {/* Form header */}
            <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50/80 px-6 py-5">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                    <svg
                        className="h-4.5 w-4.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        {initialData.id ? (
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
                        {initialData.id
                            ? "Update user information"
                            : "New user information"}
                    </h2>

                    <p className="mt-0.5 text-sm text-slate-500">
                        Enter the user account and assignment
                        information.
                    </p>
                </div>
            </div>

            <div className="p-6">
                {error && (
                    <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <svg
                            className="mt-0.5 h-4 w-4 flex-shrink-0"
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

                {/* Section: account credentials */}
                <div className="mb-6">
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Account credentials
                    </h3>

                    <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className={labelClass}>
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
                                required
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className={labelClass}>
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
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className={labelClass}>
                                Password
                                {!initialData.id && requiredMark}
                            </label>

                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder={
                                    initialData.id
                                        ? "Leave empty to keep password"
                                        : "Minimum 8 characters"
                                }
                                className={inputClass}
                                disabled={saving}
                                minLength={8}
                                required={!initialData.id}
                            />

                            {initialData.id && (
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
                                {!initialData.id && requiredMark}
                            </label>

                            <input
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                value={formData.password_confirmation}
                                onChange={handleChange}
                                placeholder="Repeat the password"
                                className={inputClass}
                                disabled={saving}
                                minLength={8}
                                required={!initialData.id}
                            />
                        </div>
                    </div>
                </div>

                {/* Section: access & assignment */}
                <div>
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Access &amp; assignment
                    </h3>

                    <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
                        {/* Role */}
                        <div>
                            <label htmlFor="role" className={labelClass}>
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
                            <label htmlFor="status" className={labelClass}>
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
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        {/* Depot */}
                        {formData.role === "responsable" && (
                            <div className="md:col-span-2">
                                <label
                                    htmlFor="depot_id"
                                    className={labelClass}
                                >
                                    Assigned depot
                                    {requiredMark}
                                </label>

                                <select
                                    id="depot_id"
                                    name="depot_id"
                                    value={formData.depot_id ?? ""}
                                    onChange={handleChange}
                                    className={selectClass}
                                    disabled={saving || loadingDepots}
                                    required
                                >
                                    <option value="">
                                        {loadingDepots
                                            ? "Loading depots..."
                                            : "Select a depot"}
                                    </option>

                                    {depots.map((depot) => (
                                        <option
                                            key={depot.id}
                                            value={depot.id}
                                        >
                                            {depot.name} — {depot.code}
                                        </option>
                                    ))}
                                </select>

                                {!loadingDepots && depots.length === 0 && (
                                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600">
                                        <svg
                                            className="h-3.5 w-3.5 flex-shrink-0"
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
                                        No active depots are available.
                                        Create or activate a depot first.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Form actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4 sm:flex-row sm:justify-end">
                <Link
                    to="/admin/users"
                    className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                    Cancel
                </Link>

                <button
                    type="submit"
                    disabled={
                        saving ||
                        (formData.role === "responsable" &&
                            depots.length === 0)
                    }
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
