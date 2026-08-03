import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadCategories = async () => {
            try {
                const response =
                    await api.get("/categories");

                const body = response.data;

                const data = Array.isArray(body.data)
                    ? body.data
                    : Array.isArray(body.data?.data)
                      ? body.data.data
                      : Array.isArray(body.categories)
                        ? body.categories
                        : Array.isArray(body)
                          ? body
                          : [];

                if (!cancelled) {
                    setCategories(data);
                }
            } catch (error) {
                console.error(error);

                if (!cancelled) {
                    setError(
                        "Unable to load categories."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadCategories();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Categories
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Organize products into categories.
                        </p>
                    </div>

                    <Link
                        to="/admin/categories/create"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                    >
                        <span className="text-lg">+</span>
                        Create category
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
                                        Category
                                    </th>

                                    <th className="px-5 py-3 font-medium text-slate-500">
                                        Products
                                    </th>

                                    <th className="px-5 py-3 text-right font-medium text-slate-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    Array.from({
                                        length: 4,
                                    }).map((_, index) => (
                                        <tr key={index}>
                                            <td
                                                colSpan={3}
                                                className="px-5 py-4"
                                            >
                                                <div className="h-4 animate-pulse rounded bg-slate-100" />
                                            </td>
                                        </tr>
                                    ))
                                ) : categories.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="px-5 py-16 text-center"
                                        >
                                            <p className="font-medium text-slate-700">
                                                No categories yet
                                            </p>

                                            <p className="mt-1 text-sm text-slate-400">
                                                Create your first
                                                category.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    categories.map((category) => (
                                        <tr
                                            key={category.id}
                                            className="hover:bg-slate-50"
                                        >
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 font-semibold text-violet-700">
                                                        {category.name
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div>
                                                        <p className="font-medium text-slate-800">
                                                            {
                                                                category.name
                                                            }
                                                        </p>

                                                        <p className="max-w-md truncate text-xs text-slate-500">
                                                            {category.description ||
                                                                "No description"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                                    {category.products_count ??
                                                        0}{" "}
                                                    products
                                                </span>
                                            </td>

                                            <td className="px-5 py-3.5 text-right">
                                                <Link
                                                    to={`/admin/categories/${category.id}/edit`}
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

export default CategoriesPage;
