import {
    useEffect,
    useState,
} from "react";
import { Link } from "react-router-dom";
import {
    MapPin,
    Plus,
    Search,
    Store,
    Warehouse,
} from "lucide-react";
import api from "../../api/axios";

const initialFilters = {
    search: "",
    type: "",
    status: "",
};

const getPaginator = (response) => {
    const body = response.data;

    if (Array.isArray(body?.data)) {
        return body;
    }

    if (Array.isArray(body?.data?.data)) {
        return body.data;
    }

    if (Array.isArray(body)) {
        return {
            data: body,
            current_page: 1,
            last_page: 1,
            total: body.length,
        };
    }

    return {
        data: [],
        current_page: 1,
        last_page: 1,
        total: 0,
    };
};

function LocationsPage() {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [changingId, setChangingId] =
        useState(null);

    const [filters, setFilters] =
        useState(initialFilters);

    const [appliedFilters, setAppliedFilters] =
        useState(initialFilters);

    const [page, setPage] = useState(1);
    const [requestKey, setRequestKey] =
        useState(0);

    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
    });

    useEffect(() => {
        let cancelled = false;

        const loadLocations = async () => {
            try {
                const response = await api.get(
                    "/locations",
                    {
                        params: {
                            page,
                            per_page: 15,

                            ...(appliedFilters.search && {
                                search:
                                    appliedFilters.search,
                            }),

                            ...(appliedFilters.type && {
                                type: appliedFilters.type,
                            }),

                            ...(appliedFilters.status && {
                                status:
                                    appliedFilters.status,
                            }),
                        },
                    }
                );

                const paginator =
                    getPaginator(response);

                if (!cancelled) {
                    setLocations(paginator.data);

                    setPagination({
                        currentPage:
                            paginator.current_page ?? 1,
                        lastPage:
                            paginator.last_page ?? 1,
                        total: paginator.total ?? 0,
                    });
                }
            } catch (error) {
                console.error(
                    "Unable to load locations:",
                    error
                );

                if (!cancelled) {
                    setError(
                        error.response?.data?.message ??
                            "Unable to load locations."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadLocations();

        return () => {
            cancelled = true;
        };
    }, [
        page,
        appliedFilters,
        requestKey,
    ]);

    const handleFilterChange = (event) => {
        const { name, value } = event.target;

        setFilters((currentFilters) => ({
            ...currentFilters,
            [name]: value,
        }));
    };

    const handleSearch = (event) => {
        event.preventDefault();

        setError("");
        setLoading(true);
        setPage(1);
        setAppliedFilters(filters);

        setRequestKey(
            (currentKey) => currentKey + 1
        );
    };

    const handleReset = () => {
        setFilters(initialFilters);
        setAppliedFilters(initialFilters);
        setError("");
        setLoading(true);
        setPage(1);

        setRequestKey(
            (currentKey) => currentKey + 1
        );
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

    const handleStatus = async (location) => {
        const newStatus =
            location.status === "active"
                ? "inactive"
                : "active";

        try {
            setChangingId(location.id);
            setError("");

            await api.patch(
                `/locations/${location.id}`,
                {
                    status: newStatus,
                }
            );

            setLocations((currentLocations) =>
                currentLocations.map(
                    (currentLocation) =>
                        currentLocation.id ===
                        location.id
                            ? {
                                  ...currentLocation,
                                  status: newStatus,
                              }
                            : currentLocation
                )
            );
        } catch (error) {
            const validationErrors =
                error.response?.data?.errors;

            setError(
                validationErrors
                    ? Object.values(
                          validationErrors
                      ).flat()[0]
                    : error.response?.data?.message ??
                          "Unable to change location status."
            );
        } finally {
            setChangingId(null);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                                <MapPin size={21} />
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                    Locations
                                </h1>

                                <p className="mt-1 text-sm text-slate-500">
                                    Manage depots and magasins.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Link
                        to="/admin/locations/create"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                    >
                        <Plus size={17} />
                        Create location
                    </Link>
                </div>

                {/* Filters */}
                <form
                    onSubmit={handleSearch}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                    <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
                        <div className="relative">
                            <Search
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="search"
                                name="search"
                                value={filters.search}
                                onChange={
                                    handleFilterChange
                                }
                                placeholder="Search name, code, address or phone..."
                                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                            />
                        </div>

                        <select
                            name="type"
                            value={filters.type}
                            onChange={handleFilterChange}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                        >
                            <option value="">
                                All types
                            </option>

                            <option value="depot">
                                Depot
                            </option>

                            <option value="magasin">
                                Magasin
                            </option>
                        </select>

                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                        >
                            <option value="">
                                All statuses
                            </option>

                            <option value="active">
                                Active
                            </option>

                            <option value="inactive">
                                Inactive
                            </option>
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

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-slate-200 bg-slate-50">
                                <tr className="text-xs uppercase tracking-wide text-slate-500">
                                    <th className="px-5 py-3.5 font-semibold">
                                        Location
                                    </th>

                                    <th className="px-5 py-3.5 font-semibold">
                                        Code
                                    </th>

                                    <th className="px-5 py-3.5 font-semibold">
                                        Type
                                    </th>

                                    <th className="px-5 py-3.5 font-semibold">
                                        Address
                                    </th>

                                    <th className="px-5 py-3.5 font-semibold">
                                        Phone
                                    </th>

                                    <th className="px-5 py-3.5 font-semibold">
                                        Status
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
                                                Loading locations...
                                            </p>
                                        </td>
                                    </tr>
                                ) : locations.length ===
                                  0 ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="px-5 py-12 text-center"
                                        >
                                            <MapPin
                                                size={32}
                                                className="mx-auto text-slate-300"
                                            />

                                            <p className="mt-3 font-medium text-slate-700">
                                                No locations found
                                            </p>

                                            <p className="mt-1 text-sm text-slate-500">
                                                Create a location or
                                                change your filters.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    locations.map(
                                        (location) => (
                                            <tr
                                                key={
                                                    location.id
                                                }
                                                className="transition hover:bg-slate-50"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                                            {location.type ===
                                                            "magasin" ? (
                                                                <Store
                                                                    size={
                                                                        18
                                                                    }
                                                                />
                                                            ) : (
                                                                <Warehouse
                                                                    size={
                                                                        18
                                                                    }
                                                                />
                                                            )}
                                                        </div>

                                                        <div>
                                                            <p className="font-medium text-slate-900">
                                                                {
                                                                    location.name
                                                                }
                                                            </p>

                                                            <p className="mt-0.5 text-xs capitalize text-slate-500">
                                                                {
                                                                    location.type
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-medium text-slate-700">
                                                        {
                                                            location.code
                                                        }
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                                                            location.type ===
                                                            "magasin"
                                                                ? "bg-violet-50 text-violet-700"
                                                                : "bg-blue-50 text-blue-700"
                                                        }`}
                                                    >
                                                        {
                                                            location.type
                                                        }
                                                    </span>
                                                </td>

                                                <td className="max-w-56 truncate px-5 py-4 text-sm text-slate-600">
                                                    {location.address ||
                                                        "-"}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                                    {location.phone ||
                                                        "-"}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                                                            location.status ===
                                                            "active"
                                                                ? "bg-emerald-50 text-emerald-700"
                                                                : "bg-red-50 text-red-700"
                                                        }`}
                                                    >
                                                        {
                                                            location.status
                                                        }
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <Link
                                                            to={`/admin/locations/${location.id}/edit`}
                                                            className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                                                        >
                                                            Edit
                                                        </Link>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleStatus(
                                                                    location
                                                                )
                                                            }
                                                            disabled={
                                                                changingId ===
                                                                location.id
                                                            }
                                                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            {changingId ===
                                                            location.id
                                                                ? "Saving..."
                                                                : location.status ===
                                                                    "active"
                                                                  ? "Disable"
                                                                  : "Activate"}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading &&
                        pagination.total > 0 && (
                            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-slate-500">
                                    {pagination.total} location
                                    {pagination.total !== 1
                                        ? "s"
                                        : ""}{" "}
                                    found
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
                                            page <= 1 ||
                                            loading
                                        }
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Previous
                                    </button>

                                    <span className="px-2 text-sm text-slate-600">
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
                                                pagination.lastPage ||
                                            loading
                                        }
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

export default LocationsPage;
