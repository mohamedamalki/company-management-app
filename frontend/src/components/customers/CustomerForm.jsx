import {
    Building2,
    Loader2,
    UserRound,
} from "lucide-react";
import {
    useEffect,
    useState,
} from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const emptyCustomer = {
    category: "registered",
    entity_type: "individual",
    user_id: "",
    name: "",
    phone: "",
    email: "",
    ice: "",
    address: "",
    city: "",
    status: "active",
    notes: "",
};

function CustomerForm({
    initialData = emptyCustomer,
    onSubmit,
    saving = false,
    error = "",
    submitText = "Save customer",
}) {
    const isEditing = Boolean(
        initialData?.id
    );

    const [formData, setFormData] =
        useState(() => ({
            ...emptyCustomer,
            ...initialData,

            user_id:
                initialData.user_id ?? "",

            phone:
                initialData.phone ?? "",

            email:
                initialData.email ?? "",

            ice:
                initialData.ice ?? "",

            address:
                initialData.address ?? "",

            city:
                initialData.city ?? "",

            notes:
                initialData.notes ?? "",
        }));

    const [fournisseurs, setFournisseurs] =
        useState([]);

    const [loadingOptions, setLoadingOptions] =
        useState(true);

    useEffect(() => {
        let cancelled = false;

        api.get("/customers/options", {
            params: {
                customer_id:
                    initialData?.id ??
                    undefined,
            },
        })
            .then((response) => {
                if (cancelled) {
                    return;
                }

                setFournisseurs(
                    response.data.data
                        ?.fournisseurs ?? []
                );
            })
            .catch((requestError) => {
                console.error(requestError);
            })
            .finally(() => {
                if (!cancelled) {
                    setLoadingOptions(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [initialData?.id]);

    const handleChange = (event) => {
        const { name, value } =
            event.target;

        setFormData((current) => {
            const updated = {
                ...current,
                [name]: value,
            };

            if (
                name === "category" &&
                value !== "fournisseur"
            ) {
                updated.user_id = "";
            }

            return updated;
        });
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        onSubmit({
            ...formData,

            user_id:
                formData.category ===
                    "fournisseur" &&
                formData.user_id
                    ? Number(
                          formData.user_id
                      )
                    : null,

            name: formData.name.trim(),

            phone:
                formData.phone.trim() ||
                null,

            email:
                formData.email.trim() ||
                null,

            ice:
                formData.ice.trim() ||
                null,

            address:
                formData.address.trim() ||
                null,

            city:
                formData.city.trim() ||
                null,

            notes:
                formData.notes.trim() ||
                null,
        });
    };

    const inputClass =
        "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:bg-slate-100";

    const labelClass =
        "mb-1.5 block text-sm font-semibold text-slate-700";

    return (
        <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
            <div className="flex items-start gap-4 border-b border-slate-200 bg-slate-50 px-6 py-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                    {formData.entity_type ===
                    "company" ? (
                        <Building2 size={21} />
                    ) : (
                        <UserRound size={21} />
                    )}
                </span>

                <div>
                    <h2 className="text-lg font-bold text-slate-900">
                        {isEditing
                            ? "Update customer"
                            : "New registered customer"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Walk-in supermarket
                        customers do not need an
                        account.
                    </p>
                </div>
            </div>

            <div className="space-y-6 p-6">
                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="grid gap-5 md:grid-cols-2">
                    <div>
                        <label
                            htmlFor="category"
                            className={labelClass}
                        >
                            Customer category
                        </label>

                        <select
                            id="category"
                            name="category"
                            value={
                                formData.category
                            }
                            onChange={
                                handleChange
                            }
                            className={inputClass}
                            disabled={saving}
                        >
                            <option value="registered">
                                Registered customer
                            </option>

                            <option value="fournisseur">
                                Fournisseur / reseller
                            </option>
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="entity_type"
                            className={labelClass}
                        >
                            Entity type
                        </label>

                        <select
                            id="entity_type"
                            name="entity_type"
                            value={
                                formData.entity_type
                            }
                            onChange={
                                handleChange
                            }
                            className={inputClass}
                            disabled={saving}
                        >
                            <option value="individual">
                                Individual
                            </option>

                            <option value="company">
                                Company
                            </option>
                        </select>
                    </div>

                    {formData.category ===
                        "fournisseur" && (
                        <div className="md:col-span-2">
                            <label
                                htmlFor="user_id"
                                className={
                                    labelClass
                                }
                            >
                                Fournisseur account
                            </label>

                            <select
                                id="user_id"
                                name="user_id"
                                value={
                                    formData.user_id
                                }
                                onChange={
                                    handleChange
                                }
                                className={
                                    inputClass
                                }
                                disabled={
                                    saving ||
                                    loadingOptions
                                }
                                required
                            >
                                <option value="">
                                    {loadingOptions
                                        ? "Loading accounts..."
                                        : "Select a fournisseur account"}
                                </option>

                                {fournisseurs.map(
                                    (user) => (
                                        <option
                                            key={
                                                user.id
                                            }
                                            value={
                                                user.id
                                            }
                                        >
                                            {
                                                user.name
                                            }{" "}
                                            —{" "}
                                            {
                                                user.email
                                            }
                                        </option>
                                    )
                                )}
                            </select>
                        </div>
                    )}

                    <div>
                        <label
                            htmlFor="name"
                            className={labelClass}
                        >
                            Name
                        </label>

                        <input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={
                                handleChange
                            }
                            className={inputClass}
                            required
                            disabled={saving}
                        />
                    </div>

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
                            value={
                                formData.phone
                            }
                            onChange={
                                handleChange
                            }
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
                            type="email"
                            name="email"
                            value={
                                formData.email
                            }
                            onChange={
                                handleChange
                            }
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
                            onChange={
                                handleChange
                            }
                            maxLength={15}
                            placeholder="15 digits"
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
                            onChange={
                                handleChange
                            }
                            className={inputClass}
                            disabled={saving}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="status"
                            className={labelClass}
                        >
                            Status
                        </label>

                        <select
                            id="status"
                            name="status"
                            value={
                                formData.status
                            }
                            onChange={
                                handleChange
                            }
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
                            value={
                                formData.address
                            }
                            onChange={
                                handleChange
                            }
                            className={inputClass}
                            disabled={saving}
                        />
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
                            value={
                                formData.notes
                            }
                            onChange={
                                handleChange
                            }
                            rows={3}
                            className={`${inputClass} resize-y`}
                            disabled={saving}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <Link
                    to="/app/customers"
                    className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                    Cancel
                </Link>

                <button
                    type="submit"
                    disabled={saving}
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

export default CustomerForm;
