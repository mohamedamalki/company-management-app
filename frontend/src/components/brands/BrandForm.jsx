import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Loader2 } from "lucide-react";

const initialForm = {
    name: "",
    description: "",
};

function BrandForm({
    initialData = initialForm,
    onSubmit,
    saving = false,
    error = "",
    submitText = "Save brand",
}) {
    const isEditing = Boolean(initialData?.id);

    const [formData, setFormData] = useState(() => ({
        ...initialForm,
        ...initialData,
        description:
            initialData.description ?? "",
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

        onSubmit({
            name: formData.name.trim(),
            description:
                formData.description.trim(),
        });
    };

    const inputClass =
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-100";

    const labelClass =
        "mb-1.5 block text-sm font-medium text-slate-700";

    return (
        <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
            {/* Header */}
            <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50/80 px-6 py-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                    <Badge size={20} />
                </div>

                <div>
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                        {isEditing
                            ? "Update brand information"
                            : "New brand information"}
                    </h2>

                    <p className="mt-0.5 text-sm text-slate-500">
                        Enter the brand name and optional
                        description.
                    </p>
                </div>
            </div>

            <div className="p-6">
                {error && (
                    <div
                        role="alert"
                        className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                        {error}
                    </div>
                )}

                <div className="space-y-5">
                    {/* Name */}
                    <div>
                        <label
                            htmlFor="name"
                            className={labelClass}
                        >
                            Brand name
                            <span className="ml-1 text-red-500">
                                *
                            </span>
                        </label>

                        <input
                            id="name"
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Example: Samsung"
                            className={inputClass}
                            disabled={saving}
                            autoComplete="off"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label
                            htmlFor="description"
                            className={labelClass}
                        >
                            Description
                        </label>

                        <textarea
                            id="description"
                            name="description"
                            value={
                                formData.description
                            }
                            onChange={handleChange}
                            placeholder="Enter an optional brand description"
                            rows={5}
                            maxLength={2000}
                            className={`${inputClass} resize-y`}
                            disabled={saving}
                        />

                        <p className="mt-1.5 text-right text-xs text-slate-400">
                            {
                                formData.description
                                    .length
                            }
                            /2000
                        </p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4 sm:flex-row sm:justify-end">
                <Link
                    to="/admin/brands"
                    className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                    Cancel
                </Link>

                <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
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

export default BrandForm;
