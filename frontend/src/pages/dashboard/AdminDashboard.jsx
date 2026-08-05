import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowUpRight,
    LayoutDashboard,
    Package,
    Plus,
    RefreshCw,
    Tags,
    Users,
    Warehouse,
} from "lucide-react";

import api from "../../api/axios";

const initialOverview = {
    users: 0,
    depots: 0,
    products: 0,
    categories: 0,
    recentProducts: [],
};

const getCollection = (response) => {
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

const getTotal = (response) => {
    const body = response.data;

    if (typeof body?.total === "number") {
        return body.total;
    }

    if (typeof body?.data?.total === "number") {
        return body.data.total;
    }

    return getCollection(response).length;
};

const priceFormatter = new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    minimumFractionDigits: 2,
});

function StatCard({
    title,
    value,
    description,
    icon: Icon,
    iconStyle,
    path,
}) {
    return (
        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconStyle}`}
                >
                    <Icon size={21} />
                </div>

                <Link
                    to={path}
                    aria-label={`Open ${title}`}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                >
                    <ArrowUpRight size={18} />
                </Link>
            </div>

            <div className="mt-5">
                <p className="text-sm font-medium text-slate-500">
                    {title}
                </p>

                <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                    {value}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                    {description}
                </p>
            </div>
        </div>
    );
}

function StatSkeleton() {
    return (
        <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
            <div className="h-11 w-11 rounded-xl bg-slate-200" />

            <div className="mt-5 h-4 w-24 rounded bg-slate-200" />
            <div className="mt-3 h-8 w-16 rounded bg-slate-200" />
            <div className="mt-3 h-3 w-36 rounded bg-slate-100" />
        </div>
    );
}

function QuickAction({ path, icon: Icon, title, description }) {
    return (
        <Link
            to={path}
            className="group flex items-center gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
                <Icon size={18} />
            </div>

            <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">
                    {title}
                </p>

                <p className="mt-0.5 text-sm text-slate-500">
                    {description}
                </p>
            </div>

            <Plus
                size={18}
                className="text-slate-400 transition group-hover:text-slate-900"
            />
        </Link>
    );
}

function AdminDashboard() {
    const [overview, setOverview] = useState(initialOverview);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        let cancelled = false;

        const loadOverview = async () => {
            try {
                const [
                    usersResponse,
                    depotsResponse,
                    productsResponse,
                    categoriesResponse,
                ] = await Promise.all([
                    api.get("/users"),
                    api.get("/locations"),
                    api.get("/products"),
                    api.get("/categories"),
                ]);

                if (cancelled) {
                    return;
                }

                setOverview({
                    users: getTotal(usersResponse),
                    depots: getTotal(depotsResponse),
                    products: getTotal(productsResponse),
                    categories: getTotal(categoriesResponse),
                    recentProducts:
                        getCollection(productsResponse).slice(0, 5),
                });
            } catch (error) {
                console.error(error);

                if (!cancelled) {
                    setError(
                        error.response?.data?.message ??
                            "Unable to load dashboard information."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadOverview();

        return () => {
            cancelled = true;
        };
    }, [refreshKey]);

    const handleRefresh = () => {
        setError("");
        setLoading(true);
        setRefreshKey((currentKey) => currentKey + 1);
    };

    const currentDate = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date());

    return (
        <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <section className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-7 text-white shadow-lg sm:px-8">
                    <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
                    <div className="absolute bottom-0 right-36 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl" />

                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                                <LayoutDashboard size={24} />
                            </div>

                            <div>
                                <p className="text-sm font-medium text-slate-400">
                                    {currentDate}
                                </p>

                                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                                    Company overview
                                </h1>

                                <p className="mt-2 max-w-2xl text-sm text-slate-300">
                                    Monitor your team, depots and product
                                    catalogue from one place.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 sm:self-auto"
                        >
                            <RefreshCw
                                size={17}
                                className={loading ? "animate-spin" : ""}
                            />
                            Refresh
                        </button>
                    </div>
                </section>

                {error && (
                    <div
                        role="alert"
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                        {error}
                    </div>
                )}

                {/* Statistics */}
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {loading ? (
                        <>
                            <StatSkeleton />
                            <StatSkeleton />
                            <StatSkeleton />
                            <StatSkeleton />
                        </>
                    ) : (
                        <>
                            <StatCard
                                title="Users"
                                value={overview.users}
                                description="Admin, responsables and fournisseurs"
                                icon={Users}
                                iconStyle="bg-blue-50 text-blue-700"
                                path="/admin/users"
                            />

                            <StatCard
                                title="Depots"
                                value={overview.depots}
                                description="Registered storage locations"
                                icon={Warehouse}
                                iconStyle="bg-violet-50 text-violet-700"
                                path="/admin/locations"
                            />

                            <StatCard
                                title="Products"
                                value={overview.products}
                                description="Products available in the catalogue"
                                icon={Package}
                                iconStyle="bg-emerald-50 text-emerald-700"
                                path="/admin/products"
                            />

                            <StatCard
                                title="Categories"
                                value={overview.categories}
                                description="Product classification groups"
                                icon={Tags}
                                iconStyle="bg-amber-50 text-amber-700"
                                path="/admin/categories"
                            />
                        </>
                    )}
                </section>

                <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                    {/* Recent products */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
                            <div>
                                <h2 className="font-bold text-slate-900">
                                    Recent products
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Latest products added to the catalogue.
                                </p>
                            </div>

                            <Link
                                to="/admin/products"
                                className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                            >
                                View all
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold sm:px-6">
                                            Product
                                        </th>
                                        <th className="px-5 py-3 font-semibold">
                                            Category
                                        </th>
                                        <th className="px-5 py-3 font-semibold">
                                            Unit
                                        </th>
                                        <th className="px-5 py-3 text-right font-semibold sm:px-6">
                                            Sale price
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td
                                                colSpan="4"
                                                className="px-6 py-10 text-center text-sm text-slate-500"
                                            >
                                                Loading products...
                                            </td>
                                        </tr>
                                    ) : overview.recentProducts.length ===
                                      0 ? (
                                        <tr>
                                            <td
                                                colSpan="4"
                                                className="px-6 py-10 text-center"
                                            >
                                                <Package
                                                    size={30}
                                                    className="mx-auto text-slate-300"
                                                />

                                                <p className="mt-3 font-medium text-slate-700">
                                                    No products yet
                                                </p>

                                                <Link
                                                    to="/admin/products/create"
                                                    className="mt-2 inline-block text-sm font-semibold text-blue-700"
                                                >
                                                    Create your first product
                                                </Link>
                                            </td>
                                        </tr>
                                    ) : (
                                        overview.recentProducts.map(
                                            (product) => (
                                                <tr
                                                    key={product.id}
                                                    className="transition hover:bg-slate-50"
                                                >
                                                    <td className="px-5 py-4 sm:px-6">
                                                        <p className="font-semibold text-slate-900">
                                                            {product.name}
                                                        </p>

                                                        <p className="mt-0.5 text-xs text-slate-500">
                                                            SKU: {product.sku}
                                                        </p>
                                                    </td>

                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {product.category
                                                            ?.name ??
                                                            "No category"}
                                                    </td>

                                                    <td className="px-5 py-4 text-sm capitalize text-slate-600">
                                                        {product.unit}
                                                    </td>

                                                    <td className="px-5 py-4 text-right text-sm font-semibold text-slate-900 sm:px-6">
                                                        {priceFormatter.format(
                                                            Number(
                                                                product.sale_price ??
                                                                    0
                                                            )
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Quick actions */}
                    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div>
                            <h2 className="font-bold text-slate-900">
                                Quick actions
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Create and manage company information.
                            </p>
                        </div>

                        <div className="mt-5 space-y-3">
                            <QuickAction
                                path="/admin/users/create"
                                icon={Users}
                                title="Create user"
                                description="Add a responsable or fournisseur"
                            />

                            <QuickAction
                                path="/admin/locations/create"
                                icon={Warehouse}
                                title="Create depot"
                                description="Register a new storage location"
                            />

                            <QuickAction
                                path="/admin/products/create"
                                icon={Package}
                                title="Create product"
                                description="Add a product to the catalogue"
                            />

                            <QuickAction
                                path="/admin/categories/create"
                                icon={Tags}
                                title="Create category"
                                description="Organize products into a category"
                            />
                        </div>
                    </aside>
                </section>
            </div>
        </main>
    );
}

export default AdminDashboard;
