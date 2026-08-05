import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Loader2, Package } from "lucide-react";
import api from "../../api/axios";

const initialForm = {
    category_id: "",
    brand_id: "",
    name: "",
    sku: "",
    barcode: "",
    description: "",
    purchase_price: "",
    sale_price: "",
    unit: "piece",
};

const getItems = (response) => {
    const body = response.data;

    if (Array.isArray(body?.data)) {
        return body.data;
    }

    if (Array.isArray(body?.data?.data)) {
        return body.data.data;
    }

    if (Array.isArray(body)) {
        return body;
    }

    return [];
};

function ProductForm({
    initialData = initialForm,
    onSubmit,
    saving = false,
    error = "",
    submitText = "Save product",
}) {
    const isEditing = Boolean(initialData?.id);

    const [formData, setFormData] = useState(() => ({
        ...initialForm,
        ...initialData,
        category_id: initialData.category_id ?? "",
        brand_id: initialData.brand_id ?? "",
        barcode: initialData.barcode ?? "",
        description: initialData.description ?? "",
        purchase_price: initialData.purchase_price ?? "",
        sale_price: initialData.sale_price ?? "",
        unit: initialData.unit ?? "piece",
    }));

    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [optionsError, setOptionsError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadOptions = async () => {
            try {
                const [categoriesResponse, brandsResponse] =
                    await Promise.all([
                        api.get("/categories", {
                            params: { per_page: 100 },
                        }),
                        api.get("/brands", {
                            params: { per_page: 100 },
                        }),
                    ]);

                if (!cancelled) {
                    setCategories(getItems(categoriesResponse));
                    setBrands(getItems(brandsResponse));
                }
            } catch (requestError) {
                console.error(
                    "Unable to load product options:",
                    requestError
                );

                if (!cancelled) {
                    setOptionsError(
                        requestError.response?.data?.message ??
                            "Unable to load categories and brands."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingOptions(false);
                }
            }
        };

        loadOptions();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((currentForm) => ({
            ...currentForm,
            [name]: name === "sku" ? value.toUpperCase() : value,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        onSubmit({
            ...formData,
            category_id: Number(formData.category_id),
            brand_id: formData.brand_id
                ? Number(formData.brand_id)
                : null,
            name: formData.name.trim(),
            sku: formData.sku.trim().toUpperCase(),
            barcode: formData.barcode.trim() || null,
            description: formData.description.trim() || null,
            purchase_price: Number(formData.purchase_price),
            sale_price: Number(formData.sale_price),
        });
    };

    const inputClass =
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

    const selectClass = `${inputClass} appearance-none`;
    const labelClass =
        "mb-1.5 block text-sm font-medium text-slate-700";

    const requiredMark = (
        <span className="ml-1 text-red-500">*</span>
    );

    const displayedError = error || optionsError;

    return (
        <form
            onSubmit={handleSubmit}
            autoComplete="off"
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
            <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50/80 px-6 py-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                    <Package size={20} />
                </div>

                <div>
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                        {isEditing
                            ? "Update product information"
                            : "New product information"}
                    </h2>

                    <p className="mt-0.5 text-sm text-slate-500">
                        Enter the product identification, classification and
                        pricing information.
                    </p>
                </div>
            </div>

            <div className="space-y-7 p-6">
                {displayedError && (
                    <div
                        role="alert"
                        className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                        <AlertTriangle
                            size={17}
                            className="mt-0.5 shrink-0"
                        />

                        <span>{displayedError}</span>
                    </div>
                )}

                <section>
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Product identification
                    </h3>

                    <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
                        <div>
                            <label htmlFor="name" className={labelClass}>
                                Product name
                                {requiredMark}
                            </label>

                            <input
                                id="name"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter the product name"
                                className={inputClass}
                                disabled={saving}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="sku" className={labelClass}>
                                SKU
                                {requiredMark}
                            </label>

                            <input
                                id="sku"
                                type="text"
                                name="sku"
                                value={formData.sku}
                                onChange={handleChange}
                                placeholder="Example: PROD-001"
                                className={`${inputClass} uppercase`}
                                disabled={saving}
                                required
                            />

                            <p className="mt-1.5 text-xs text-slate-500">
                                The SKU is automatically converted to uppercase.
                            </p>
                        </div>

                        <div>
                            <label htmlFor="barcode" className={labelClass}>
                                Barcode
                            </label>

                            <input
                                id="barcode"
                                type="text"
                                name="barcode"
                                value={formData.barcode}
                                onChange={handleChange}
                                placeholder="Enter an optional barcode"
                                className={inputClass}
                                disabled={saving}
                            />
                        </div>

                        <div>
                            <label htmlFor="unit" className={labelClass}>
                                Unit
                                {requiredMark}
                            </label>

                            <select
                                id="unit"
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                className={selectClass}
                                disabled={saving}
                                required
                            >
                                <option value="piece">Piece</option>
                                <option value="kilogram">Kilogram</option>
                                <option value="gram">Gram</option>
                                <option value="liter">Liter</option>
                                <option value="meter">Meter</option>
                                <option value="box">Box</option>
                                <option value="pack">Pack</option>
                            </select>
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Classification
                    </h3>

                    <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
                        <div>
                            <label
                                htmlFor="category_id"
                                className={labelClass}
                            >
                                Category
                                {requiredMark}
                            </label>

                            <select
                                id="category_id"
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleChange}
                                className={selectClass}
                                disabled={saving || loadingOptions}
                                required
                            >
                                <option value="">
                                    {loadingOptions
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

                            {!loadingOptions && categories.length === 0 && (
                                <p className="mt-1.5 text-xs text-amber-600">
                                    Create a category before creating a product.
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="brand_id" className={labelClass}>
                                Brand
                            </label>

                            <select
                                id="brand_id"
                                name="brand_id"
                                value={formData.brand_id}
                                onChange={handleChange}
                                className={selectClass}
                                disabled={saving || loadingOptions}
                            >
                                <option value="">
                                    {loadingOptions
                                        ? "Loading brands..."
                                        : "No brand"}
                                </option>

                                {brands.map((brand) => (
                                    <option key={brand.id} value={brand.id}>
                                        {brand.name}
                                    </option>
                                ))}
                            </select>

                            {!loadingOptions && brands.length === 0 && (
                                <p className="mt-1.5 text-xs text-slate-500">
                                    No brands are available. Brand is optional.
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Pricing
                    </h3>

                    <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
                        <div>
                            <label
                                htmlFor="purchase_price"
                                className={labelClass}
                            >
                                Purchase price
                                {requiredMark}
                            </label>

                            <div className="relative">
                                <input
                                    id="purchase_price"
                                    type="number"
                                    name="purchase_price"
                                    value={formData.purchase_price}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className={`${inputClass} pr-14`}
                                    disabled={saving}
                                    required
                                />

                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                                    MAD
                                </span>
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="sale_price"
                                className={labelClass}
                            >
                                Sale price
                                {requiredMark}
                            </label>

                            <div className="relative">
                                <input
                                    id="sale_price"
                                    type="number"
                                    name="sale_price"
                                    value={formData.sale_price}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className={`${inputClass} pr-14`}
                                    disabled={saving}
                                    required
                                />

                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                                    MAD
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <label htmlFor="description" className={labelClass}>
                        Description
                    </label>

                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Enter an optional product description"
                        rows={4}
                        className={`${inputClass} resize-y`}
                        disabled={saving}
                    />
                </section>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4 sm:flex-row sm:justify-end">
                <Link
                    to="/admin/products"
                    className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                    Cancel
                </Link>

                <button
                    type="submit"
                    disabled={
                        saving ||
                        loadingOptions ||
                        categories.length === 0
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {saving && (
                        <Loader2 size={17} className="animate-spin" />
                    )}

                    {saving ? "Saving..." : submitText}
                </button>
            </div>
        </form>
    );
}

export default ProductForm;
