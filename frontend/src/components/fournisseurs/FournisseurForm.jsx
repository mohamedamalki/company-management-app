import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Handshake, Loader2 } from "lucide-react";
import api from "../../api/axios";

const emptyForm = {
    user_id: "",
    code: "",
    name: "",
    entity_type: "company",
    phone: "",
    email: "",
    ice: "",
    address: "",
    city: "",
    status: "active",
    credit_limit: "0",
    payment_terms_days: "0",
    notes: "",
};

function FournisseurForm({
    initialData = emptyForm,
    onSubmit,
    saving = false,
    error = "",
    submitText = "Save fournisseur",
}) {
    const isEditing = Boolean(initialData?.id);

    const [formData, setFormData] = useState(() => ({
        ...emptyForm,
        ...initialData,
        user_id: initialData?.user_id
            ? String(initialData.user_id)
            : "",
        phone: initialData?.phone ?? "",
        email: initialData?.email ?? "",
        ice: initialData?.ice ?? "",
        address: initialData?.address ?? "",
        city: initialData?.city ?? "",
        notes: initialData?.notes ?? "",
        credit_limit:
            initialData?.credit_limit ?? "0",
        payment_terms_days:
            initialData?.payment_terms_days ?? "0",
    }));

    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] =
        useState(true);
    const [usersError, setUsersError] =
        useState("");

    useEffect(() => {
        let cancelled = false;

        const loadUsers = async () => {
            try {
                const response = await api.get(
                    "/users",
                    {
                        params: {
                            role: "fournisseur",
                            per_page: 100,
                        },
                    }
                );

                if (!cancelled) {
                    setUsers(
                        Array.isArray(response.data.data)
                            ? response.data.data
                            : []
                    );
                }
            } catch (requestError) {
                console.error(requestError);

                if (!cancelled) {
                    setUsersError(
                        "Unable to load fournisseur users."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingUsers(false);
                }
            }
        };

        loadUsers();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((current) => ({
            ...current,
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
            user_id: Number(formData.user_id),
            credit_limit: Number(
                formData.credit_limit || 0
            ),
            payment_terms_days: Number(
                formData.payment_terms_days || 0
            ),
            phone: formData.phone.trim() || null,
            email: formData.email.trim() || null,
            ice: formData.ice.trim() || null,
            address:
                formData.address.trim() || null,
            city: formData.city.trim() || null,
            notes: formData.notes.trim() || null,
        });
    };

    const inputClass =
        "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:bg-slate-100";

    const labelClass =
        "mb-1.5 block text-sm font-semibold text-slate-700";

    return (
        <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
            <div className="flex items-center gap-4 border-b border-slate-200 bg-slate-50 px-6 py-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                    <Handshake size={22} />
                </div>

                <div>
                    <h2 className="text-lg font-bold text-slate-900">
                        {isEditing
                            ? "Update fournisseur"
                            : "New fournisseur"}
                    </h2>

                    <p className="text-sm text-slate-500">
                        Configure the account, contact and
                        credit information.
                    </p>
                </div>
            </div>

            <div className="space-y-7 p-6">
                {(error || usersError) && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error || usersError}
                    </div>
                )}

                <section>
                    <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Account
                    </h3>

                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label
                                htmlFor="user_id"
                                className={labelClass}
                            >
                                Fournisseur user *
                            </label>

                            <select
                                id="user_id"
                                name="user_id"
                                value={formData.user_id}
                                onChange={handleChange}
                                className={inputClass}
                                disabled={
                                    saving || loadingUsers
                                }
                                required
                            >
                                <option value="">
                                    {loadingUsers
                                        ? "Loading users..."
                                        : "Select a user"}
                                </option>

                                {users.map((user) => (
                                    <option
                                        key={user.id}
                                        value={user.id}
                                    >
                                        {user.name} —{" "}
                                        {user.email}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="code"
                                className={labelClass}
                            >
                                Code *
                            </label>

                            <input
                                id="code"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                placeholder="FR-001"
                                className={inputClass}
                                disabled={saving}
                                required
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="name"
                                className={labelClass}
                            >
                                Name *
                            </label>

                            <input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Atlas Distribution"
                                className={inputClass}
                                disabled={saving}
                                required
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="entity_type"
                                className={labelClass}
                            >
                                Entity type *
                            </label>

                            <select
                                id="entity_type"
                                name="entity_type"
                                value={formData.entity_type}
                                onChange={handleChange}
                                className={inputClass}
                                disabled={saving}
                            >
                                <option value="company">
                                    Company
                                </option>

                                <option value="individual">
                                    Individual
                                </option>
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="status"
                                className={labelClass}
                            >
                                Status *
                            </label>

                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className={inputClass}
                                disabled={saving}
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

                <section>
                    <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Contact information
                    </h3>

                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label
                                htmlFor="phone"
                                className={labelClass}
                            >
                                Phone
                            </label>

                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleChange}
                                className={inputClass}
                                disabled={saving}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="email"
                                className={labelClass}
                            >
                                Email
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={inputClass}
                                disabled={saving}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="ice"
                                className={labelClass}
                            >
                                ICE
                            </label>

                            <input
                                id="ice"
                                name="ice"
                                value={formData.ice}
                                onChange={handleChange}
                                className={inputClass}
                                disabled={saving}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="city"
                                className={labelClass}
                            >
                                City
                            </label>

                            <input
                                id="city"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className={inputClass}
                                disabled={saving}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label
                                htmlFor="address"
                                className={labelClass}
                            >
                                Address
                            </label>

                            <input
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className={inputClass}
                                disabled={saving}
                            />
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Credit conditions
                    </h3>

                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label
                                htmlFor="credit_limit"
                                className={labelClass}
                            >
                                Credit limit
                            </label>

                            <input
                                id="credit_limit"
                                name="credit_limit"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.credit_limit}
                                onChange={handleChange}
                                className={inputClass}
                                disabled={saving}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="payment_terms_days"
                                className={labelClass}
                            >
                                Payment terms
                            </label>

                            <div className="relative">
                                <input
                                    id="payment_terms_days"
                                    name="payment_terms_days"
                                    type="number"
                                    min="0"
                                    max="365"
                                    value={
                                        formData.payment_terms_days
                                    }
                                    onChange={handleChange}
                                    className={`${inputClass} pr-16`}
                                    disabled={saving}
                                />

                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                    days
                                </span>
                            </div>
                        </div>

                        <div className="md:col-span-2">
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
                                rows={4}
                                className={`${inputClass} resize-y`}
                                disabled={saving}
                            />
                        </div>
                    </div>
                </section>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <Link
                    to="/app/fournisseurs"
                    className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                    Cancel
                </Link>

                <button
                    type="submit"
                    disabled={saving || loadingUsers}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
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

export default FournisseurForm;
