import {
    useEffect,
    useState,
} from "react";
import { Link } from "react-router-dom";
import {
    Badge,
    Pencil,
    Plus,
    Search,
} from "lucide-react";
import api from "../../api/axios";

function BrandsPage() {
    const [brands, setBrands] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [appliedSearch, setAppliedSearch] =
        useState("");

    const [page, setPage] =
        useState(1);

    const [requestKey, setRequestKey] =
        useState(0);

    const [pagination, setPagination] =
        useState({
            currentPage: 1,
            lastPage: 1,
            total: 0,
        });

    useEffect(() => {
        let cancelled = false;

        const loadBrands = async () => {
            try {
                const response =
                    await api.get(
                        "/brands",
                        {
                            params: {
                                page,
                                ...(appliedSearch && {
                                    search:
                                        appliedSearch,
                                }),
                            },
                        }
                    );

                const data =
                    response.data;

                if (!cancelled) {
                    setBrands(
                        Array.isArray(data.data)
                            ? data.data
                            : []
                    );

                    setPagination({
                        currentPage:
                            data.current_page ??
                            1,

                        lastPage:
                            data.last_page ??
                            1,

                        total:
                            data.total ?? 0,
                    });
                }
            } catch (error) {
                console.error(
                    "Unable to load brands:",
                    error
                );

                if (!cancelled) {
                    setError(
                        error.response?.data
                            ?.message ??
                            "Unable to load brands."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadBrands();

        return () => {
            cancelled = true;
        };
    }, [
        page,
        appliedSearch,
        requestKey,
    ]);

    const handleSearch = (event) => {
        event.preventDefault();

        setError("");
        setLoading(true);
        setPage(1);
        setAppliedSearch(search.trim());

        setRequestKey(
            (currentKey) =>
                currentKey + 1
        );
    };

    const handleReset = () => {
        setSearch("");
        setAppliedSearch("");
        setError("");
        setLoading(true);
        setPage(1);

        setRequestKey(
            (currentKey) =>
                currentKey + 1
        );
    };

    const handlePageChange = (
        newPage
    ) => {
        if (
            newPage < 1 ||
            newPage >
                pagination.lastPage ||
            newPage === page
        ) {
            return;
        }

        setLoading(true);
        setError("");
        setPage(newPage);
    };

    return (
        <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                            <Badge size={21} />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                Brands
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Manage product brands.
                            </p>
                        </div>
                    </div>

                    <Link
                        to="/admin/brands/create"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                        <Plus size={17} />
                        Create brand
                    </Link>
                </div>

                {/* Search */}
                <form
                    onSubmit={handleSearch}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                            <Search
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Search brands..."
                                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                            />
                        </div>

                        <button
                            type="submit"
                            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                        >
                            Search
                        </button>

                        <button
                            type="button"
                            onClick={handleReset}
                            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                            Reset
                        </button>
                    </div>
                </form>

                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-slate-200 bg-slate-50">
                                <tr className="text-xs uppercase tracking-wide text-slate-500">
                                    <th className="px-5 py-3.5 font-semibold">
                                        Brand
                                    </th>

                                    <th className="px-5 py-3.5 font-semibold">
                                        Description
                                    </th>

                                    <th className="px-5 py-3.5 font-semibold">
                                        Products
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
                                            colSpan="4"
                                            className="px-5 py-12 text-center"
                                        >
                                            <span className="mx-auto block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />

                                            <p className="mt-3 text-sm text-slate-500">
                                                Loading brands...
                                            </p>
                                        </td>
                                    </tr>
                                ) : brands.length ===
                                  0 ? (
                                    <tr>
                                        <td
                                            colSpan="4"
                                            className="px-5 py-12 text-center"
                                        >
                                            <Badge
                                                size={32}
                                                className="mx-auto text-slate-300"
                                            />

                                            <p className="mt-3 font-medium text-slate-700">
                                                No brands found
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    brands.map(
                                        (brand) => (
                                            <tr
                                                key={
                                                    brand.id
                                                }
                                                className="transition hover:bg-slate-50"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                                                            <Badge
                                                                size={
                                                                    18
                                                                }
                                                            />
                                                        </div>

                                                        <span className="font-medium text-slate-900">
                                                            {
                                                                brand.name
                                                            }
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="max-w-md px-5 py-4 text-sm text-slate-600">
                                                    <p className="line-clamp-2">
                                                        {brand.description ||
                                                            "-"}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                                        {brand.products_count ??
                                                            0}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4 text-right">
                                                    <Link
                                                        to={`/admin/brands/${brand.id}/edit`}
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                                                    >
                                                        <Pencil
                                                            size={
                                                                14
                                                            }
                                                        />
                                                        Edit
                                                    </Link>
                                                </td>
                                            </tr>
                                        )
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!loading &&
                        pagination.total > 0 && (
                            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-slate-500">
                                    {pagination.total} brand
                                    {pagination.total !==
                                    1
                                        ? "s"
                                        : ""}
                                </p>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handlePageChange(
                                                page - 1
                                            )
                                        }
                                        disabled={
                                            page <= 1
                                        }
                                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
                                    >
                                        Previous
                                    </button>

                                    <span className="text-sm text-slate-600">
                                        Page{" "}
                                        {
                                            pagination.currentPage
                                        }{" "}
                                        of{" "}
                                        {
                                            pagination.lastPage
                                        }
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handlePageChange(
                                                page + 1
                                            )
                                        }
                                        disabled={
                                            page >=
                                            pagination.lastPage
                                        }
                                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
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

export default BrandsPage;
