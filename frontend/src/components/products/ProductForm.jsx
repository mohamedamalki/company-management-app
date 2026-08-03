import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const initialForm = {
    category_id: "",
    name: "",
    sku: "",
    barcode: "",
    description: "",
    purchase_price: "",
    sale_price: "",
    unit: "piece",
};

function ProductForm({
    initialData = initialForm,
    onSubmit,
    saving,
    error,
    submitText,
}) {
    const [formData, setFormData] = useState({
        ...initialForm,
        ...initialData,
        category_id: initialData.category_id ?? "",
        barcode: initialData.barcode ?? "",
        description: initialData.description ?? "",
    });

    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] =
        useState(true);

    useEffect(() => {
        let cancelled = false;

        const loadCategories = async () => {
            try {
                const response =
                    await api.get("/categories");

                const body = response.data;

                let data = Array.isArray(body.data)
                    ? body.data
                    : Array.isArray(body.data?.data)
                      ? body.data.data
                      : Array.isArray(body.categories)
                        ? body.categories
                        : Array.isArray(body)
                          ? body
                          : [];

                if (
                    initialData.category &&
                    !data.some(
                        (category) =>
                            category.id ===
                            initialData.category.id
                    )
                ) {
                    data = [
                        ...data,
                        initialData.category,
                    ];
                }

                if (!cancelled) {
                    setCategories(data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                if (!cancelled) {
                    setLoadingCategories(false);
                }
            }
        };

        loadCategories();

        return () => {
            cancelled = true;
        };
    }, [initialData.category]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((currentForm) => ({
            ...currentForm,
            [name]:
                name === "sku"
                    ? value.toUpperCase()
                    : value,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        onSubmit({
            ...formData,
            category_id: Number(formData.category_id),
            purchase_price: Number(
                formData.purchase_price
            ),
            sale_price: Number(formData.sale_price),
            barcode: formData.barcode.trim() || null,
            description:
                formData.description.trim() || null,
        });
    };

    const inputClass =
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-100";

    const labelClass =
        "mb-1.5 block text-sm font-medium text-slate-700";

    return (
        <form
            onSubmit={handleSubmit}
            autoComplete="off"
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                <h2 className="text-lg font-semibold text-slate-900">
                    {initialData.id
                        ? "Update product"
                        : "New product"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Enter product, pricing and category
                    information.
                </p>
            </div>

            <div className="space-y-6 p-6">
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div>
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Product information
                    </h3>

                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label className={labelClass}>
                                Product name *
                            </label>

                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="Product name"
                                disabled={saving}
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                Category *
                            </label>

                            <select
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleChange}
                                className={inputClass}
                                disabled={
                                    saving ||
                                    loadingCategories
                                }
                                required
                            >
                                <option value="">
                                    {loadingCategories
                                        ? "Loading categories..."
                                        : "Select a category"}
                                </option>

                                {categories.map((category) => (
                                    <option
                                        key={category.id}
                                        value={category.id}
                                    >
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>
                                SKU *
                            </label>

                            <input
                                type="text"
                                name="sku"
                                value={formData.sku}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="PRODUCT-001"
                                disabled={saving}
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                Barcode
                            </label>

                            <input
                                type="text"
                                name="barcode"
                                value={formData.barcode}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="Manufacturer barcode"
                                disabled={saving}
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Pricing &amp; measurement
                    </h3>

                    <div className="grid gap-5 md:grid-cols-3">
                        <div>
                            <label className={labelClass}>
                                Purchase price *
                            </label>

                            <input
                                type="number"
                                name="purchase_price"
                                value={formData.purchase_price}
                                onChange={handleChange}
                                className={inputClass}
                                min="0"
                                step="0.01"
                                disabled={saving}
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                Sale price *
                            </label>

                            <input
                                type="number"
                                name="sale_price"
                                value={formData.sale_price}
                                onChange={handleChange}
                                className={inputClass}
                                min="0"
                                step="0.01"
                                disabled={saving}
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                Unit *
                            </label>

                            <select
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                className={inputClass}
                                disabled={saving}
                                required
                            >
                                <option value="piece">
                                    Piece
                                </option>
                                <option value="kg">Kg</option>
                                <option value="liter">
                                    Liter
                                </option>
                                <option value="box">
                                    Box
                                </option>
                                <option value="pack">
                                    Pack
                                </option>
                                <option value="meter">
                                    Meter
                                </option>
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <label className={labelClass}>
                        Description
                    </label>

                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        className={`${inputClass} resize-none`}
                        placeholder="Product description"
                        disabled={saving}
                    />
                </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <Link
                    to="/admin/products"
                    className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                    Cancel
                </Link>

                <button
                    type="submit"
                    disabled={
                        saving ||
                        categories.length === 0
                    }
                    className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                    {saving ? "Saving..." : submitText}
                </button>
            </div>
        </form>
    );
}

export default ProductForm;
