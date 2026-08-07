import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    AlertTriangle,
    BadgeDollarSign,
    Loader2,
    Package,
    Plus,
    Trash2,
} from "lucide-react";
import api from "../../api/axios";

const defaultTiers = [
    {
        min_quantity: 10,
        unit_price_ht: "",
    },
    {
        min_quantity: 50,
        unit_price_ht: "",
    },
];

const initialForm = {
    product_id: "",
    tax_rate_id: "",
    sale_price_ht: "",
    tiers: defaultTiers,
};

const moneyFormatter = new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    minimumFractionDigits: 2,
});

const getItems = (response) => {
    const body = response.data;

    if (Array.isArray(body?.data)) {
        return body.data;
    }

    if (Array.isArray(body?.data?.data)) {
        return body.data.data;
    }

    return Array.isArray(body) ? body : [];
};

function ProductPriceForm({
    initialData = initialForm,
    onSubmit,
    saving = false,
    error = "",
    submitText = "Save price",
}) {
    const isEditing = Boolean(initialData?.id);

    const [formData, setFormData] = useState(() => {
        const receivedTiers =
            initialData.tiers ??
            initialData.product_price_tiers ??
            initialData.productPriceTiers ??
            [];

        return {
            ...initialForm,
            ...initialData,

            product_id:
                initialData.product_id ?? "",

            tax_rate_id:
                initialData.tax_rate_id ?? "",

            sale_price_ht:
                initialData.sale_price_ht ?? "",

            tiers:
                Array.isArray(receivedTiers) &&
                receivedTiers.length > 0
                    ? receivedTiers.map((tier) => ({
                          min_quantity:
                              tier.min_quantity ?? "",

                          unit_price_ht:
                              tier.unit_price_ht ?? "",
                      }))
                    : defaultTiers.map((tier) => ({
                          ...tier,
                      })),
        };
    });

    const [products, setProducts] = useState([]);
    const [taxRates, setTaxRates] = useState([]);

    const [loadingOptions, setLoadingOptions] =
        useState(true);

    const [optionsError, setOptionsError] =
        useState("");

    useEffect(() => {
        let cancelled = false;

        const loadOptions = async () => {
            try {
                const [
                    productsResponse,
                    taxRatesResponse,
                ] = await Promise.all([
                    api.get("/products", {
                        params: {
                            per_page: 100,
                        },
                    }),

                    api.get("/tax-rates/active"),
                ]);

                if (!cancelled) {
                    const loadedProducts =
                        getItems(productsResponse);

                    const currentProduct =
                        initialData.product;

                    setProducts(
                        currentProduct &&
                            !loadedProducts.some(
                                (product) =>
                                    product.id ===
                                    currentProduct.id
                            )
                            ? [
                                  currentProduct,
                                  ...loadedProducts,
                              ]
                            : loadedProducts
                    );

                    const activeTaxRates =
                        getItems(taxRatesResponse);

                    const currentTaxRate =
                        initialData.tax_rate ??
                        initialData.taxRate;

                    if (
                        currentTaxRate &&
                        !activeTaxRates.some(
                            (taxRate) =>
                                taxRate.id ===
                                currentTaxRate.id
                        )
                    ) {
                        setTaxRates([
                            currentTaxRate,
                            ...activeTaxRates,
                        ]);
                    } else {
                        setTaxRates(
                            activeTaxRates
                        );
                    }
                }
            } catch (requestError) {
                console.error(
                    "Unable to load price options:",
                    requestError
                );

                if (!cancelled) {
                    setOptionsError(
                        requestError.response
                            ?.data?.message ??
                            "Unable to load products and TVA rates."
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
    }, [
        initialData.product,
        initialData.taxRate,
        initialData.tax_rate,
    ]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((currentForm) => ({
            ...currentForm,
            [name]: value,
        }));
    };

    const handleTierChange = (
        index,
        field,
        value
    ) => {
        setFormData((currentForm) => ({
            ...currentForm,

            tiers: currentForm.tiers.map(
                (tier, tierIndex) =>
                    tierIndex === index
                        ? {
                              ...tier,
                              [field]: value,
                          }
                        : tier
            ),
        }));
    };

    const addTier = () => {
        setFormData((currentForm) => {
            const lastTier =
                currentForm.tiers.at(-1);

            const nextQuantity = Math.max(
                2,
                (Number(
                    lastTier?.min_quantity
                ) || 0) + 10
            );

            return {
                ...currentForm,

                tiers: [
                    ...currentForm.tiers,

                    {
                        min_quantity:
                            nextQuantity,

                        unit_price_ht: "",
                    },
                ],
            };
        });
    };

    const removeTier = (index) => {
        setFormData((currentForm) => ({
            ...currentForm,

            tiers: currentForm.tiers.filter(
                (_, tierIndex) =>
                    tierIndex !== index
            ),
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const payload = {
            tax_rate_id: Number(
                formData.tax_rate_id
            ),

            sale_price_ht: Number(
                formData.sale_price_ht
            ),

            tiers: formData.tiers
                .map((tier) => ({
                    min_quantity: Number(
                        tier.min_quantity
                    ),

                    unit_price_ht: Number(
                        tier.unit_price_ht
                    ),
                }))
                .sort(
                    (firstTier, secondTier) =>
                        firstTier.min_quantity -
                        secondTier.min_quantity
                ),
        };

        if (!isEditing) {
            payload.product_id = Number(
                formData.product_id
            );

            payload.location_id = null;
        }

        onSubmit(payload);
    };

    const selectedTaxRate = taxRates.find(
        (taxRate) =>
            String(taxRate.id) ===
            String(formData.tax_rate_id)
    );

    const selectedProduct = products.find(
        (product) =>
            String(product.id) ===
            String(formData.product_id)
    );

    /*
     * Lock the product when:
     * 1. Editing an existing price.
     * 2. product_id came from the URL through
     *    initialData.
     */
    const productIsLocked =
        isEditing ||
        Boolean(initialData?.product_id);

    const lockedProductMissing =
        productIsLocked &&
        !loadingOptions &&
        !selectedProduct;

    const salePriceHt =
        Number(formData.sale_price_ht) || 0;

    const taxPercentage =
        Number(selectedTaxRate?.rate) || 0;

    const taxAmount =
        salePriceHt *
        (taxPercentage / 100);

    const salePriceTtc =
        salePriceHt + taxAmount;

    const inputClass =
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

    const selectClass =
        `${inputClass} appearance-none`;

    const labelClass =
        "mb-1.5 block text-sm font-medium text-slate-700";

    const requiredMark = (
        <span className="ml-1 text-red-500">
            *
        </span>
    );

    const displayedError =
        error || optionsError;

    return (
        <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
            <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50/80 px-6 py-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                    <BadgeDollarSign size={20} />
                </div>

                <div>
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                        {isEditing
                            ? "Correct price information"
                            : "New product price"}
                    </h2>

                    <p className="mt-0.5 text-sm text-slate-500">
                        {isEditing
                            ? "Correct the current price or TVA information."
                            : "A new price automatically closes the previous active price."}
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

                        <span>
                            {displayedError}
                        </span>
                    </div>
                )}

                <section>
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Product assignment
                    </h3>

                    <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <label
                                htmlFor="product_id"
                                className={
                                    labelClass
                                }
                            >
                                Product
                                {requiredMark}
                            </label>

                            {productIsLocked ? (
                                <div
                                    className={`flex min-h-16 items-center gap-3 rounded-xl border px-4 py-3 ${
                                        lockedProductMissing
                                            ? "border-red-200 bg-red-50"
                                            : "border-slate-200 bg-slate-50"
                                    }`}
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm ring-1 ring-slate-200">
                                        <Package
                                            size={
                                                19
                                            }
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            Selected
                                            product
                                        </p>

                                        <p
                                            className={`mt-0.5 truncate font-semibold ${
                                                lockedProductMissing
                                                    ? "text-red-700"
                                                    : "text-slate-900"
                                            }`}
                                        >
                                            {loadingOptions
                                                ? "Loading product..."
                                                : selectedProduct?.name ??
                                                  "Product not found"}
                                        </p>

                                        {!loadingOptions &&
                                            selectedProduct?.reference && (
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    Reference:{" "}
                                                    {
                                                        selectedProduct.reference
                                                    }
                                                </p>
                                            )}
                                    </div>
                                </div>
                            ) : (
                                <select
                                    id="product_id"
                                    name="product_id"
                                    value={
                                        formData.product_id
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className={
                                        selectClass
                                    }
                                    disabled={
                                        saving ||
                                        loadingOptions
                                    }
                                    required
                                >
                                    <option value="">
                                        {loadingOptions
                                            ? "Loading products..."
                                            : "Select a product"}
                                    </option>

                                    {products.map(
                                        (
                                            product
                                        ) => (
                                            <option
                                                key={
                                                    product.id
                                                }
                                                value={
                                                    product.id
                                                }
                                            >
                                                {
                                                    product.name
                                                }

                                                {product.reference
                                                    ? ` — ${product.reference}`
                                                    : ""}
                                            </option>
                                        )
                                    )}
                                </select>
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
                                htmlFor="sale_price_ht"
                                className={
                                    labelClass
                                }
                            >
                                Sale price HT
                                {requiredMark}
                            </label>

                            <div className="relative">
                                <input
                                    id="sale_price_ht"
                                    type="number"
                                    name="sale_price_ht"
                                    value={
                                        formData.sale_price_ht
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    className={`${inputClass} pr-14`}
                                    disabled={
                                        saving
                                    }
                                    required
                                />

                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                                    MAD
                                </span>
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="tax_rate_id"
                                className={
                                    labelClass
                                }
                            >
                                TVA rate
                                {requiredMark}
                            </label>

                            <select
                                id="tax_rate_id"
                                name="tax_rate_id"
                                value={
                                    formData.tax_rate_id
                                }
                                onChange={
                                    handleChange
                                }
                                className={
                                    selectClass
                                }
                                disabled={
                                    saving ||
                                    loadingOptions
                                }
                                required
                            >
                                <option value="">
                                    {loadingOptions
                                        ? "Loading TVA rates..."
                                        : "Select a TVA rate"}
                                </option>

                                {taxRates.map(
                                    (taxRate) => (
                                        <option
                                            key={
                                                taxRate.id
                                            }
                                            value={
                                                taxRate.id
                                            }
                                        >
                                            {
                                                taxRate.name
                                            }{" "}
                                            —{" "}
                                            {
                                                taxRate.rate
                                            }
                                            %
                                        </option>
                                    )
                                )}
                            </select>
                        </div>
                    </div>

                    <div className="mt-7 border-t border-slate-200 pt-6">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900">
                                    Bulk quantity
                                    prices
                                </h4>

                                <p className="mt-1 text-xs text-slate-500">
                                    Define the unit
                                    price applied when
                                    the minimum
                                    quantity is
                                    reached.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={addTier}
                                disabled={saving}
                                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                            >
                                <Plus size={16} />
                                Add tier
                            </button>
                        </div>

                        <div className="space-y-3">
                            {formData.tiers
                                .length === 0 ? (
                                <div className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                                    No bulk prices.
                                    The base price
                                    will apply to
                                    every quantity.
                                </div>
                            ) : (
                                formData.tiers.map(
                                    (
                                        tier,
                                        index
                                    ) => (
                                        <div
                                            key={
                                                index
                                            }
                                            className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
                                        >
                                            <div>
                                                <label
                                                    htmlFor={`tier-quantity-${index}`}
                                                    className={
                                                        labelClass
                                                    }
                                                >
                                                    Minimum
                                                    quantity
                                                    {
                                                        requiredMark
                                                    }
                                                </label>

                                                <input
                                                    id={`tier-quantity-${index}`}
                                                    type="number"
                                                    min="2"
                                                    step="1"
                                                    value={
                                                        tier.min_quantity
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        handleTierChange(
                                                            index,
                                                            "min_quantity",
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    className={
                                                        inputClass
                                                    }
                                                    disabled={
                                                        saving
                                                    }
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor={`tier-price-${index}`}
                                                    className={
                                                        labelClass
                                                    }
                                                >
                                                    Unit
                                                    price
                                                    HT
                                                    {
                                                        requiredMark
                                                    }
                                                </label>

                                                <div className="relative">
                                                    <input
                                                        id={`tier-price-${index}`}
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={
                                                            tier.unit_price_ht
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            handleTierChange(
                                                                index,
                                                                "unit_price_ht",
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        placeholder="0.00"
                                                        className={`${inputClass} pr-14`}
                                                        disabled={
                                                            saving
                                                        }
                                                        required
                                                    />

                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                                                        MAD
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeTier(
                                                        index
                                                    )
                                                }
                                                disabled={
                                                    saving
                                                }
                                                aria-label={`Remove tier ${index + 1}`}
                                                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                                            >
                                                <Trash2
                                                    size={
                                                        16
                                                    }
                                                />

                                                <span className="md:hidden">
                                                    Remove
                                                </span>
                                            </button>
                                        </div>
                                    )
                                )
                            )}
                        </div>

                        {formData.tiers.length >
                            0 && (
                            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3">
                                                Quantity
                                                from
                                            </th>

                                            <th className="px-4 py-3">
                                                Unit price
                                                HT
                                            </th>

                                            <th className="px-4 py-3">
                                                Example
                                                total HT
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {formData.tiers
                                            .slice()
                                            .sort(
                                                (
                                                    firstTier,
                                                    secondTier
                                                ) =>
                                                    Number(
                                                        firstTier.min_quantity
                                                    ) -
                                                    Number(
                                                        secondTier.min_quantity
                                                    )
                                            )
                                            .map(
                                                (
                                                    tier,
                                                    index
                                                ) => {
                                                    const quantity =
                                                        Number(
                                                            tier.min_quantity
                                                        ) ||
                                                        0;

                                                    const unitPrice =
                                                        Number(
                                                            tier.unit_price_ht
                                                        ) ||
                                                        0;

                                                    return (
                                                        <tr
                                                            key={`${quantity}-${index}`}
                                                        >
                                                            <td className="px-4 py-3 font-medium text-slate-700">
                                                                {
                                                                    quantity
                                                                }
                                                                +
                                                                pieces
                                                            </td>

                                                            <td className="px-4 py-3 text-slate-600">
                                                                {moneyFormatter.format(
                                                                    unitPrice
                                                                )}
                                                            </td>

                                                            <td className="px-4 py-3 font-semibold text-slate-900">
                                                                {moneyFormatter.format(
                                                                    quantity *
                                                                        unitPrice
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                            )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="mt-5 grid gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 sm:grid-cols-3">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-blue-500">
                                Price HT
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                                {moneyFormatter.format(
                                    salePriceHt
                                )}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-blue-500">
                                TVA (
                                {taxPercentage}%)
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                                {moneyFormatter.format(
                                    taxAmount
                                )}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-blue-500">
                                Price TTC
                            </p>

                            <p className="mt-1 text-lg font-bold text-blue-700">
                                {moneyFormatter.format(
                                    salePriceTtc
                                )}
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4 sm:flex-row sm:justify-end">
                <Link
                    to="/admin/product-prices"
                    className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                    Cancel
                </Link>

                <button
                    type="submit"
                    disabled={
                        saving ||
                        loadingOptions ||
                        lockedProductMissing ||
                        taxRates.length === 0 ||
                        (!isEditing &&
                            products.length === 0)
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
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

export default ProductPriceForm;
