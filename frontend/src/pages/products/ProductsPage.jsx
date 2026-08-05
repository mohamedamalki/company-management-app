import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Badge,
    Package,
    Pencil,
    Plus,
    Search,
    Tags,
} from "lucide-react";
import api from "../../api/axios";

const initialFilters = {
    search: "",
    category_id: "",
    brand_id: "",
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

    if (Array.isArray(body)) {
        return body;
    }

    return [];
};

function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [filters, setFilters] = useState(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState(initialFilters);
    const [page, setPage] = useState(1);
    const [requestKey, setRequestKey] = useState(0);

    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
    });

    useEffect(() => {
        let cancelled = false;

        const loadFilterOptions = async () => {
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
                    "Unable to load product filters:",
                    requestError
                );
            }
        };

        loadFilterOptions();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        const loadProducts = async () => {
            try {
                const response = await api.get("/products", {
                    params: {
                        page,
                        ...(appliedFilters.search && {
                            search: appliedFilters.search,
                        }),
                        ...(appliedFilters.category_id && {
                            category_id: appliedFilters.category_id,
                        }),
                        ...(appliedFilters.brand_id && {
                            brand_id: appliedFilters.brand_id,
                        }),
                    },
                });

                const data = response.data;

                if (!cancelled) {
                    setProducts(Array.isArray(data.data) ? data.data : []);
                    setPagination({
                        currentPage: data.current_page ?? 1,
                        lastPage: data.last_page ?? 1,
                        total: data.total ?? 0,
                    });
                }
            } catch (requestError) {
                console.error("Unable to load products:", requestError);

                if (!cancelled) {
                    setError(
                        requestError.response?.data?.message ??
                            "Unable to load products."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadProducts();

        return () => {
            cancelled = true;
        };
    }, [page, appliedFilters, requestKey]);

    const handleFilterChange = (event) => {
        const { name, value } = event.target;

        setFilters((currentFilters) => ({
            ...currentFilters,
            [name]: value,
        }));
    };

    const handleFilter = (event) => {
        event.preventDefault();

        setError("");
        setLoading(true);
        setPage(1);
        setAppliedFilters({
            ...filters,
            search: filters.search.trim(),
        });
        setRequestKey((currentKey) => currentKey + 1);
    };

    const handleReset = () => {
        setFilters(initialFilters);
        setAppliedFilters(initialFilters);
        setError("");
        setLoading(true);
        setPage(1);
        setRequestKey((currentKey) => currentKey + 1);
    };

    const handlePageChange = (newPage) => {
        if (
            newPage < 1 ||
            newPage > pagination.lastPage ||
            newPage === page
        ) {
            return;
        }

        setError("");
        setLoading(true);
        setPage(newPage);
    };

    return (
        <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                            <Package size={21} />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                Products
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Manage the company product catalogue.
                            </p>
                        </div>
                    </div>

                    <Link
                        to="/admin/products/create"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                    >
                        <Plus size={17} />
                        Create product
                    </Link>
                </div>

                <form
                    onSubmit={handleFilter}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_180px_180px_auto]">
                        <div className="relative">
                            <Search
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="search"
                                name="search"
                                value={filters.search}
                                onChange={handleFilterChange}
                                placeholder="Search name, SKU or barcode..."
                                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                            />
                        </div>

                        <select
                            name="category_id"
                            value={filters.category_id}
                            onChange={handleFilterChange}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                        >
                            <option value="">All categories</option>
                            {categories.map((category) => (
                                <option
                                    key={category.id}
                                    value={category.id}
                                >
                                    {category.name}
                                </option>
                            ))}
                        </select>

                        <select
                            name="brand_id"
                            value={filters.brand_id}
                            onChange={handleFilterChange}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                        >
                            <option value="">All brands</option>
                            {brands.map((brand) => (
                                <option key={brand.id} value={brand.id}>
                                    {brand.name}
                                </option>
                            ))}
                        </select>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                            >
                                Filter
                            </button>

                            <button
                                type="button"
                                onClick={handleReset}
                                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </form>

                {error && (
                    <div
                        role="alert"
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                        {error}
                    </div>
                )}

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-slate-200 bg-slate-50">
                                <tr className="text-xs uppercase tracking-wide text-slate-500">
                                    <th className="px-5 py-3.5 font-semibold">
                                        Product
                                    </th>
                                    <th className="px-5 py-3.5 font-semibold">
                                        Category
                                    </th>
                                    <th className="px-5 py-3.5 font-semibold">
                                        Brand
                                    </th>
                                    <th className="px-5 py-3.5 font-semibold">
                                        Purchase price
                                    </th>
                                    <th className="px-5 py-3.5 font-semibold">
                                        Sale price
                                    </th>
                                    <th className="px-5 py-3.5 font-semibold">
                                        Unit
                                    </th>
                                    <th className="px-5 py-3.5 text-right font-semibold">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="px-5 py-12 text-center"
                                        >
                                            <span className="mx-auto block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
                                            <p className="mt-3 text-sm text-slate-500">
                                                Loading products...
                                            </p>
                                        </td>
                                    </tr>
                                ) : products.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="px-5 py-12 text-center"
                                        >
                                            <Package
                                                size={32}
                                                className="mx-auto text-slate-300"
                                            />
                                            <p className="mt-3 font-medium text-slate-700">
                                                No products found
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Create a product or change your
                                                filters.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((product) => (
                                        <tr
                                            key={product.id}
                                            className="transition hover:bg-slate-50"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                                        <Package size={18} />
                                                    </div>

                                                    <div>
                                                        <p className="font-medium text-slate-900">
                                                            {product.name}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-slate-500">
                                                            SKU: {product.sku}
                                                            {product.barcode
                                                                ? ` · ${product.barcode}`
                                                                : ""}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                                                    <Tags
                                                        size={15}
                                                        className="text-slate-400"
                                                    />
                                                    {product.category?.name ??
                                                        "-"}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                                                    <Badge
                                                        size={15}
                                                        className="text-slate-400"
                                                    />
                                                    {product.brand?.name ?? "-"}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                                {moneyFormatter.format(
                                                    Number(
                                                        product.purchase_price ??
                                                            0
                                                    )
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-900">
                                                {moneyFormatter.format(
                                                    Number(
                                                        product.sale_price ?? 0
                                                    )
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-sm capitalize text-slate-600">
                                                {product.unit}
                                            </td>

                                            <td className="px-5 py-4 text-right">
                                                <Link
                                                    to={`/admin/products/${product.id}/edit`}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                                                >
                                                    <Pencil size={14} />
                                                    Edit
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!loading && pagination.total > 0 && (
                        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-slate-500">
                                {pagination.total} product
                                {pagination.total !== 1 ? "s" : ""} found
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        handlePageChange(page - 1)
                                    }
                                    disabled={page <= 1}
                                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Previous
                                </button>

                                <span className="px-2 text-sm text-slate-600">
                                    Page {pagination.currentPage} of{" "}
                                    {pagination.lastPage}
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handlePageChange(page + 1)
                                    }
                                    disabled={page >= pagination.lastPage}
                                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

export default ProductsPage;
