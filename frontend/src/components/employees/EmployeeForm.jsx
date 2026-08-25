import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const initialForm = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    position: "",
    location_id: "",
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
        location_id: initialData.location_id ?? "",
    });

    const [locations, setLocations] = useState([]);
    const [locationsLoading, setLocationsLoading] = useState(true);
    const [locationsError, setLocationsError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadLocations = async () => {
            try {
                setLocationsLoading(true);
                setLocationsError("");

                const response = await api.get("/locations");

                const body = response.data;

                const data = Array.isArray(body.data)
                    ? body.data
                    : Array.isArray(body.data?.data)
                      ? body.data.data
                      : Array.isArray(body.locations)
                        ? body.locations
                        : Array.isArray(body)
                          ? body
                          : [];

                if (!cancelled) {
                    setLocations(data);
                }
            } catch (error) {
                console.error(error);

                if (!cancelled) {
                    setLocationsError(
                        error.response?.data?.message ??
                            "Unable to load locations."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLocationsLoading(false);
                }
            }
        };

        loadLocations();

        return () => {
            cancelled = true;
        };
    }, []);

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
            location_id: formData.location_id
                ? Number(formData.location_id)
                : "",
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
            {/* Header */}
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

            {/* Form body */}
            <div className="space-y-5 p-6">
                {/* General error */}
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Location loading/error */}
                {locationsError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {locationsError}
                    </div>
                )}

                {/* First name + Last name */}
                <div className="grid gap-5 sm:grid-cols-2">
                    {/* First name */}
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

                    {/* Last name */}
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

                {/* Email + Phone */}
                <div className="grid gap-5 sm:grid-cols-2">
                    {/* Email */}
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

                    {/* Phone */}
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

                {/* Position + Location */}
                <div className="grid gap-5 sm:grid-cols-2">
                    {/* Position */}
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

                    {/* Location */}
                    <div>
                        <label
                            htmlFor="location_id"
                            className={labelClass}
                        >
                            Location
                            <span className="ml-1 text-red-500">
                                *
                            </span>
                        </label>

                        <select
                            id="location_id"
                            name="location_id"
                            value={formData.location_id}
                            onChange={handleChange}
                            className={inputClass}
                            disabled={
                                saving ||
                                locationsLoading ||
                                locations.length === 0
                            }
                            required
                        >
                            <option value="">
                                {locationsLoading
                                    ? "Loading locations..."
                                    : "Select a location"}
                            </option>

                            {locations.map((location) => (
                                <option
                                    key={location.id}
                                    value={location.id}
                                >
                                    {location.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4 sm:flex-row sm:justify-end">
                <Link
                    to="/app/employees"
                    className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                    Cancel
                </Link>

                <button
                    type="submit"
                    disabled={
                        saving ||
                        locationsLoading ||
                        locations.length === 0
                    }
                    className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                    {saving ? "Saving..." : submitText}
                </button>
            </div>
        </form>
    );
}

export default EmployeeForm;
