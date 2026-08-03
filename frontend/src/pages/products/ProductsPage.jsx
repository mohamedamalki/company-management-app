import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const priceFormatter = new Intl.NumberFormat(
    "fr-MA",
    {
        style: "currency",
        currency: "MAD",
    }
);

function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadProducts = async () => {
            try {
                const response =
                    await api.get("/products");

                const body = response.data;

                const data = Array.isArray(body.data)
                    ? body.data
                    : Array.isArray(body.data?.data)
                      ? body.data.data
                      : Array.isArray(body.products)
                        ? body.products
                        : Array.isArray(body)
                          ? body
                          : [];

                if (!cancelled) {
                    setProducts(data);
                }
            } catch (error) {
                console.error(error);

                if (!cancelled) {
                    setError(
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
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Products
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Manage the company product catalog.
                        </p>
                    </div>

                    <Link
                        to="/admin/products/create"
                        className="rounded-lg bg-slate-900 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-slate-800"
                    >
                        + Create product
                    </Link>
                </div>

                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="px-5 py-3 font-medium text-slate-500">
                                        Product
                                    </th>
                                    <th className="px-5 py-3 font-medium text-slate-500">
                                        Category
                                    </th>
                                    <th className="px-5 py-3 font-medium text-slate-500">
                                        Purchase
                                    </th>
                                    <th className="px-5 py-3 font-medium text-slate-500">
                                        Sale
                                    </th>
                                    <th className="px-5 py-3 font-medium text-slate-500">
                                        Unit
                                    </th>
                                    <th className="px-5 py-3 text-right font-medium text-slate-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    Array.from({
                                        length: 5,
                                    }).map((_, index) => (
                                        <tr key={index}>
                                            <td
                                                colSpan={6}
                                                className="px-5 py-4"
                                            >
                                                <div className="h-4 animate-pulse rounded bg-slate-100" />
                                            </td>
                                        </tr>
                                    ))
                                ) : products.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-16 text-center"
                                        >
                                            <p className="font-medium text-slate-700">
                                                No products yet
                                            </p>

                                            <p className="mt-1 text-slate-400">
                                                Create your first
                                                product.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((product) => (
                                        <tr
                                            key={product.id}
                                            className="hover:bg-slate-50"
                                        >
                                            <td className="px-5 py-3.5">
                                                <p className="font-medium text-slate-800">
                                                    {product.name}
                                                </p>

                                                <p className="font-mono text-xs text-slate-500">
                                                    {product.sku}
                                                </p>
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                                                    {product.category
                                                        ?.name ??
                                                        "No category"}
                                                </span>
                                            </td>

                                            <td className="px-5 py-3.5 text-slate-600">
                                                {priceFormatter.format(
                                                    Number(
                                                        product.purchase_price
                                                    )
                                                )}
                                            </td>

                                            <td className="px-5 py-3.5 font-medium text-slate-800">
                                                {priceFormatter.format(
                                                    Number(
                                                        product.sale_price
                                                    )
                                                )}
                                            </td>

                                            <td className="px-5 py-3.5 capitalize text-slate-600">
                                                {product.unit}
                                            </td>

                                            <td className="px-5 py-3.5 text-right">
                                                <Link
                                                    to={`/admin/products/${product.id}/edit`}
                                                    className="rounded-md px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                                                >
                                                    Edit
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductsPage;
