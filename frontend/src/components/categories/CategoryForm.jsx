import { useState } from "react";
import { Link } from "react-router-dom";

const initialForm = {
    name: "",
    description: "",
};

function CategoryForm({
    initialData = initialForm,
    onSubmit,
    saving,
    error,
    submitText,
}) {
    const [formData, setFormData] = useState({
        ...initialForm,
        ...initialData,
        description: initialData.description ?? "",
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
            name: formData.name.trim(),
            description:
                formData.description.trim() || null,
        });
    };

    const inputClass =
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-100";

    const labelClass =
        "mb-1.5 block text-sm font-medium text-slate-700";

    return (
        <form
            onSubmit={handleSubmit}
            autoComplete="off"
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
            <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50/80 px-6 py-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">
                    {initialData.id ? "✎" : "+"}
                </div>

                <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                        {initialData.id
                            ? "Update category"
                            : "New category"}
                    </h2>

                    <p className="mt-0.5 text-sm text-slate-500">
                        Enter the category information.
                    </p>
                </div>
            </div>

            <div className="space-y-5 p-6">
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div>
                    <label
                        htmlFor="name"
                        className={labelClass}
                    >
                        Category name
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
                        placeholder="Example: Drinks"
                        className={inputClass}
                        disabled={saving}
                        required
                    />
                </div>

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
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Enter a short description"
                        rows={4}
                        className={`${inputClass} resize-none`}
                        disabled={saving}
                    />
                </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4 sm:flex-row sm:justify-end">
                <Link
                    to="/admin/categories"
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

export default CategoryForm;
