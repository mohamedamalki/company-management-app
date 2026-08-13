import {
  useEffect,
  useState,
} from "react";
import {
  Link,
  useLocation,
} from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  Minus,
  PackageOpen,
  Search,
} from "lucide-react";
import api from "../../api/axios";
import useAuth from "../../context/useAuth";

const movementTypes = {
  opening_stock: {
    label: "Opening stock",
    direction: "in",
  },

  purchase_receipt: {
    label: "Purchase receipt",
    direction: "in",
  },

  // Keep this if you have older database records.
  purchase_entry: {
    label: "Purchase entry",
    direction: "in",
  },

  adjustment_in: {
    label: "Adjustment in",
    direction: "in",
  },

  adjustment_out: {
    label: "Adjustment out",
    direction: "out",
  },

  return_in: {
    label: "Return in",
    direction: "in",
  },

  sale_out: {
    label: "Sale",
    direction: "out",
  },

  // Keep this if you have older database records.
  sale_exit: {
    label: "Sale exit",
    direction: "out",
  },

  transfer_in: {
    label: "Transfer in",
    direction: "in",
  },

  transfer_out: {
    label: "Transfer out",
    direction: "out",
  },
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

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(value));
}

/**
 * Determine the real movement direction
 * using the stock balance.
 */
function getMovementDirection(movement) {
  const quantityBefore = Number(
    movement.quantity_before ?? 0,
  );

  const quantityAfter = Number(
    movement.quantity_after ?? 0,
  );

  if (quantityAfter > quantityBefore) {
    return "in";
  }

  if (quantityAfter < quantityBefore) {
    return "out";
  }

  return (
    movementTypes[movement.type]
      ?.direction ?? "neutral"
  );
}

/**
 * Use the balance difference as the displayed
 * quantity. Fall back to movement.quantity.
 */
function getMovementQuantity(movement) {
  const quantityBefore = Number(
    movement.quantity_before ?? 0,
  );

  const quantityAfter = Number(
    movement.quantity_after ?? 0,
  );

  const difference = Math.abs(
    quantityAfter - quantityBefore,
  );

  if (difference > 0) {
    return difference;
  }

  return Math.abs(
    Number(movement.quantity ?? 0),
  );
}

function getMovementAppearance(direction) {
  if (direction === "in") {
    return {
      Icon: ArrowDownToLine,
      sign: "+",
      badgeClass:
        "bg-emerald-100 text-emerald-700",
      quantityClass:
        "text-emerald-700",
    };
  }

  if (direction === "out") {
    return {
      Icon: ArrowUpFromLine,
      sign: "−",
      badgeClass:
        "bg-red-100 text-red-700",
      quantityClass:
        "text-red-700",
    };
  }

  return {
    Icon: Minus,
    sign: "",
    badgeClass:
      "bg-slate-100 text-slate-700",
    quantityClass:
      "text-slate-700",
  };
}

function StockMovementsPage() {
  const routeLocation = useLocation();

  const {
    user,
    hasPermission,
  } = useAuth();

  const isAdmin =
    user?.role
      ?.trim()
      .toLowerCase() === "admin";

  const canManage =
    isAdmin ||
    hasPermission(
      "location-stocks.manage",
    );

  const [movements, setMovements] =
    useState([]);

  const [meta, setMeta] =
    useState(null);

  const [page, setPage] =
    useState(1);

  const [type, setType] =
    useState("");

  const [searchInput, setSearchInput] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState(
      routeLocation.state?.message ?? "",
    );

  useEffect(() => {
    let cancelled = false;

    api
      .get("/stock-movements", {
        params: {
          page,
          type: type || undefined,
          search:
            search || undefined,
        },
      })
      .then((response) => {
        if (cancelled) {
          return;
        }

        const body = response.data;

        setMovements(
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
            requestError.response
              ?.data?.message ??
              "Unable to load stock movements.",
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
  }, [page, search, type]);

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

    return () => {
      window.clearTimeout(timer);
    };
  }, [message]);

  const handleSearch = (event) => {
    event.preventDefault();

    setPage(1);
    setLoading(true);
    setSearch(searchInput.trim());
  };

  const handleType = (event) => {
    setPage(1);
    setLoading(true);
    setType(event.target.value);
  };

  const changePage = (newPage) => {
    if (newPage < 1) {
      return;
    }

    setLoading(true);
    setPage(newPage);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <History size={23} />
          </span>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Stock movements
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review every stock entry,
              exit, opening balance, and
              correction.
            </p>
          </div>
        </div>

        {canManage && (
          <Link
            to="/app/stock-movements/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <PackageOpen size={18} />
            Record movement
          </Link>
        )}
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <select
            value={type}
            onChange={handleType}
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
          >
            <option value="">
              All movement types
            </option>

            {Object.entries(
              movementTypes,
            ).map(
              ([
                value,
                movementType,
              ]) => (
                <option
                  key={value}
                  value={value}
                >
                  {
                    movementType.label
                  }
                </option>
              ),
            )}
          </select>

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
                placeholder="Search product or location"
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

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">
                  Date
                </th>

                <th className="px-5 py-4">
                  Product
                </th>

                <th className="px-5 py-4">
                  Location
                </th>

                <th className="px-5 py-4">
                  Type
                </th>

                <th className="px-5 py-4">
                  Quantity
                </th>

                <th className="px-5 py-4">
                  Balance
                </th>

                <th className="px-5 py-4">
                  Recorded by
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-14 text-center text-slate-500"
                  >
                    Loading stock
                    movements...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-14 text-center"
                  >
                    <History
                      className="mx-auto text-slate-300"
                      size={36}
                    />

                    <p className="mt-3 font-semibold text-slate-700">
                      No stock movements
                      found
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Record an opening
                      stock or change the
                      current filters.
                    </p>
                  </td>
                </tr>
              ) : (
                movements.map(
                  (movement) => {
                    const direction =
                      getMovementDirection(
                        movement,
                      );

                    const quantity =
                      getMovementQuantity(
                        movement,
                      );

                    const appearance =
                      getMovementAppearance(
                        direction,
                      );

                    const MovementIcon =
                      appearance.Icon;

                    const movementLabel =
                      movementTypes[
                        movement.type
                      ]?.label ??
                      movement.type
                        ?.replaceAll(
                          "_",
                          " ",
                        ) ??
                      "Unknown";

                    return (
                      <tr
                        key={movement.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                          {formatDate(
                            movement.created_at,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {movement
                              .product
                              ?.name ?? "-"}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {movement
                              .product
                              ?.reference ??
                              "No reference"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-700">
                            {movement
                              .location
                              ?.name ?? "-"}
                          </p>

                          <p className="mt-0.5 text-xs uppercase text-slate-400">
                            {movement
                              .location
                              ?.code ?? ""}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${appearance.badgeClass}`}
                          >
                            <MovementIcon
                              size={13}
                            />

                            {movementLabel}
                          </span>
                        </td>

                        <td
                          className={`px-5 py-4 font-bold ${appearance.quantityClass}`}
                        >
                          {appearance.sign}
                          {formatQuantity(
                            quantity,
                          )}{" "}
                          <span className="text-xs font-medium text-slate-400">
                            {movement
                              .product
                              ?.unit ?? ""}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                          {formatQuantity(
                            movement.quantity_before,
                          )}

                          <span className="mx-2 text-slate-300">
                            →
                          </span>

                          <span className="font-bold text-slate-900">
                            {formatQuantity(
                              movement.quantity_after,
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          <p>
                            {movement.user
                              ?.name ??
                              "System"}
                          </p>

                          {movement.notes && (
                            <p
                              className="mt-1 max-w-56 truncate text-xs text-slate-400"
                              title={
                                movement.notes
                              }
                            >
                              {
                                movement.notes
                              }
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  },
                )
              )}
            </tbody>
          </table>
        </div>

        {meta && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-slate-500">
              {meta.total ??
                movements.length}{" "}
              movement records
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

export default StockMovementsPage;
