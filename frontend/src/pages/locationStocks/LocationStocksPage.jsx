import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
} from "react-router-dom";
import {
  AlertTriangle,
  Boxes,
  PackagePlus,
  PencilLine,
  Search,
  Warehouse,
} from "lucide-react";
import api from "../../api/axios";
import useAuth from "../../context/useAuth";

const statusStyles = {
  available:
    "bg-emerald-100 text-emerald-700",
  low_stock:
    "bg-amber-100 text-amber-700",
  out_of_stock:
    "bg-red-100 text-red-700",
};

const statusLabels = {
  available: "Available",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
};

function formatQuantity(value) {
  return Number(value ?? 0).toLocaleString(
    undefined,
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    },
  );
}

function LocationStocksPage() {
  const routeLocation = useLocation();

  const {
    user,
    hasPermission,
  } = useAuth();

  const isAdmin =
    user?.role?.trim().toLowerCase() ===
    "admin";

  const canManage =
    isAdmin ||
    hasPermission(
      "location-stocks.manage",
    );

  const [stocks, setStocks] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] =
    useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(
    routeLocation.state?.message ?? "",
  );

  useEffect(() => {
    let cancelled = false;

    api
      .get("/location-stocks", {
        params: {
          page,
          status:
            status || undefined,
          search:
            search || undefined,
        },
      })
      .then((response) => {
        if (cancelled) {
          return;
        }

        const body = response.data;

        setStocks(
          Array.isArray(body.data)
            ? body.data
            : [],
        );

        setMeta(body);
        setError("");
      })
      .catch((requestError) => {
        console.error(requestError);

        if (!cancelled) {
          setError(
            requestError.response?.data
              ?.message ??
              "Unable to load location stocks.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    page,
    search,
    status,
  ]);

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timer = window.setTimeout(
      () => {
        setMessage("");
      },
      3000,
    );

    return () =>
      window.clearTimeout(timer);
  }, [message]);

  const handleSearch = (event) => {
    event.preventDefault();

    setLoading(true);
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleStatus = (
    newStatus,
  ) => {
    setLoading(true);
    setPage(1);
    setStatus(newStatus);
  };

  const changePage = (newPage) => {
    setLoading(true);
    setPage(newPage);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <Boxes size={23} />
          </span>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Location stocks
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Monitor product quantities
              and low-stock thresholds by
              location.
            </p>
          </div>
        </div>

        {canManage && (
          <Link
            to="/app/location-stocks/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <PackagePlus size={18} />

            Initialize stock
          </Link>
        )}
      </div>

      {/* Success message */}
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              ["", "All"],
              [
                "available",
                "Available",
              ],
              [
                "low_stock",
                "Low stock",
              ],
              [
                "out_of_stock",
                "Out of stock",
              ],
            ].map(
              ([value, label]) => (
                <button
                  key={
                    value || "all"
                  }
                  type="button"
                  onClick={() =>
                    handleStatus(
                      value,
                    )
                  }
                  className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                    status === value
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              ),
            )}
          </div>

          <form
            onSubmit={handleSearch}
            className="flex w-full gap-2 lg:w-auto"
          >
            <div className="relative flex-1 lg:w-80">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value,
                  )
                }
                placeholder="Search product or reference"
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Stocks table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">
                  Product
                </th>

                <th className="px-5 py-4">
                  Location
                </th>

                <th className="px-5 py-4">
                  Quantity
                </th>

                <th className="px-5 py-4">
                  Minimum
                </th>

                <th className="px-5 py-4">
                  Status
                </th>

                <th className="px-5 py-4 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-14 text-center text-slate-500"
                  >
                    Loading location
                    stocks...
                  </td>
                </tr>
              ) : stocks.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-14 text-center"
                  >
                    <Warehouse
                      className="mx-auto text-slate-300"
                      size={34}
                    />

                    <p className="mt-3 font-semibold text-slate-700">
                      No location stocks
                      found
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Initialize a product
                      stock or change the
                      current filters.
                    </p>
                  </td>
                </tr>
              ) : (
                stocks.map(
                  (stock) => (
                    <tr
                      key={stock.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {stock
                            .product
                            ?.name ??
                            "-"}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {stock
                            .product
                            ?.reference ??
                            "No reference"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-700">
                          {stock
                            .location
                            ?.name ??
                            "-"}
                        </p>

                        <p className="mt-0.5 text-xs uppercase text-slate-400">
                          {stock
                            .location
                            ?.code ??
                            ""}

                          {stock
                            .location
                            ?.type
                            ? ` · ${stock.location.type}`
                            : ""}
                        </p>
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-900">
                        {formatQuantity(
                          stock.quantity,
                        )}{" "}
                        <span className="text-xs font-medium text-slate-500">
                          {stock
                            .product
                            ?.unit ??
                            ""}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatQuantity(
                          stock.minimum_quantity,
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                            statusStyles[
                              stock
                                .stock_status
                            ] ??
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {stock.stock_status !==
                            "available" && (
                            <AlertTriangle
                              size={
                                13
                              }
                            />
                          )}

                          {statusLabels[
                            stock
                              .stock_status
                          ] ??
                            "Unknown"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          {canManage ? (
                            <Link
                              to={`/app/location-stocks/${stock.id}/minimum-quantity`}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                            >
                              <PencilLine
                                size={
                                  15
                                }
                              />

                              Minimum
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-400">
                              View only
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-slate-500">
              {meta.total ??
                stocks.length}{" "}
              stock records
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={
                  !meta.prev_page_url ||
                  loading
                }
                onClick={() =>
                  changePage(page - 1)
                }
                className="rounded-lg border border-slate-300 px-3 py-2 font-medium disabled:opacity-40"
              >
                Previous
              </button>

              <span className="text-slate-600">
                Page{" "}
                {meta.current_page ??
                  page}{" "}
                of{" "}
                {meta.last_page ?? 1}
              </span>

              <button
                type="button"
                disabled={
                  !meta.next_page_url ||
                  loading
                }
                onClick={() =>
                  changePage(page + 1)
                }
                className="rounded-lg border border-slate-300 px-3 py-2 font-medium disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LocationStocksPage;
