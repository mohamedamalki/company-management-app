import {
  Ban,
  CheckCircle2,
  Eye,
  FilePenLine,
  Loader2,
  Plus,
  Search,
  ShoppingCart,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import {
  Link,
  useLocation,
} from "react-router-dom";
import api from "../../api/axios";
import useAuth from "../../context/useAuth";

function getApiError(error, fallback) {
  const errors =
    error.response?.data?.errors;

  return errors
    ? Object.values(errors)
        .flat()
        .at(0)
    : error.response?.data?.message ??
        fallback;
}

function formatMoney(value) {
  return Number(
    value ?? 0,
  ).toLocaleString("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(value));
}

function formatLabel(value) {
  return String(value ?? "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function saleStatusClass(status) {
  const classes = {
    draft:
      "bg-amber-100 text-amber-700",

    confirmed:
      "bg-green-100 text-green-700",

    cancelled:
      "bg-red-100 text-red-700",
  };

  return (
    classes[status] ??
    "bg-slate-100 text-slate-700"
  );
}

function paymentStatusClass(status) {
  const classes = {
    unpaid:
      "bg-red-100 text-red-700",

    partially_paid:
      "bg-amber-100 text-amber-700",

    paid:
      "bg-green-100 text-green-700",
  };

  return (
    classes[status] ??
    "bg-slate-100 text-slate-700"
  );
}

function SalesPage() {
  const routeLocation =
    useLocation();

  const { hasPermission } = useAuth();

  const canManage = hasPermission(
    "sales.manage",
  );

  const canConfirm = hasPermission(
    "sales.confirm",
  );

  const canCancel = hasPermission(
    "sales.cancel",
  );

  const [sales, setSales] =
    useState([]);

  const [meta, setMeta] =
    useState(null);

  const [page, setPage] =
    useState(1);

  const [status, setStatus] =
    useState("");

  const [
    paymentStatus,
    setPaymentStatus,
  ] = useState("");

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [actionId, setActionId] =
    useState("");

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState(
      routeLocation.state?.message ??
        "",
    );

  useEffect(() => {
    let cancelled = false;

    const loadSales = async () => {
      try {
        setError("");

        const response = await api.get(
          "/sales",
          {
            params: {
              page,

              status:
                status || undefined,

              payment_status:
                paymentStatus ||
                undefined,

              search:
                search || undefined,
            },
          },
        );

        if (cancelled) {
          return;
        }

        const body = response.data;

        setSales(
          Array.isArray(body.data)
            ? body.data
            : [],
        );

        setMeta(body);
      } catch (requestError) {
        console.error(requestError);

        if (!cancelled) {
          setError(
            getApiError(
              requestError,
              "Unable to load sales.",
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSales();

    return () => {
      cancelled = true;
    };
  }, [
    page,
    status,
    paymentStatus,
    search,
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

    return () => {
      window.clearTimeout(timer);
    };
  }, [message]);

  const updateSale = (
    saleId,
    updatedSale,
  ) => {
    setSales((current) =>
      current.map((sale) =>
        sale.id === saleId
          ? {
              ...sale,
              ...updatedSale,
            }
          : sale,
      ),
    );
  };

  const handleConfirm = async (
    sale,
  ) => {
    const accepted = window.confirm(
      `Confirm sale ${sale.sale_number}? Stock will be subtracted.`,
    );

    if (!accepted) {
      return;
    }

    try {
      setActionId(
        `confirm-${sale.id}`,
      );

      setError("");
      setMessage("");

      const response = await api.patch(
        `/sales/${sale.id}/confirm`,
      );

      updateSale(
        sale.id,
        response.data.data,
      );

      setMessage(
        response.data.message ??
          "Sale confirmed successfully.",
      );
    } catch (requestError) {
      setError(
        getApiError(
          requestError,
          "Unable to confirm sale.",
        ),
      );
    } finally {
      setActionId("");
    }
  };

  const handleCancel = async (
    sale,
  ) => {
    const reason = window.prompt(
      `Why do you want to cancel ${sale.sale_number}?`,
    );

    if (reason === null) {
      return;
    }

    if (!reason.trim()) {
      setError(
        "Cancellation reason is required.",
      );

      return;
    }

    try {
      setActionId(
        `cancel-${sale.id}`,
      );

      setError("");
      setMessage("");

      const response = await api.patch(
        `/sales/${sale.id}/cancel`,
        {
          cancellation_reason:
            reason.trim(),
        },
      );

      updateSale(
        sale.id,
        response.data.data,
      );

      setMessage(
        response.data.message ??
          "Sale cancelled successfully.",
      );
    } catch (requestError) {
      setError(
        getApiError(
          requestError,
          "Unable to cancel sale.",
        ),
      );
    } finally {
      setActionId("");
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();

    setLoading(true);
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleStatus = (event) => {
    setLoading(true);
    setPage(1);
    setStatus(event.target.value);
  };

  const handlePaymentStatus = (
    event,
  ) => {
    setLoading(true);
    setPage(1);

    setPaymentStatus(
      event.target.value,
    );
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
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <ShoppingCart size={23} />
          </span>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Sales
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage walk-in,
              registered and fournisseur
              sales.
            </p>
          </div>
        </div>

        {canManage && (
          <Link
            to="/app/sales/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            <Plus size={18} />
            New sale
          </Link>
        )}
      </div>

      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
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
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={status}
              onChange={handleStatus}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none"
            >
              <option value="">
                All sale statuses
              </option>

              <option value="draft">
                Draft
              </option>

              <option value="confirmed">
                Confirmed
              </option>

              <option value="cancelled">
                Cancelled
              </option>
            </select>

            <select
              value={paymentStatus}
              onChange={
                handlePaymentStatus
              }
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none"
            >
              <option value="">
                All payment statuses
              </option>

              <option value="unpaid">
                Unpaid
              </option>

              <option value="partially_paid">
                Partially paid
              </option>

              <option value="paid">
                Paid
              </option>
            </select>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex gap-2"
          >
            <div className="relative w-full lg:w-80">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value,
                  )
                }
                placeholder="Sale number or customer"
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-600"
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
          <table className="w-full min-w-[1150px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">
                  Sale
                </th>

                <th className="px-5 py-4">
                  Customer
                </th>

                <th className="px-5 py-4">
                  Location
                </th>

                <th className="px-5 py-4">
                  Date
                </th>

                <th className="px-5 py-4">
                  Total
                </th>

                <th className="px-5 py-4">
                  Payment
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
                    colSpan="8"
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    Loading sales...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    No sales found.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {sale.sale_number}
                      </p>

                      <p className="text-xs text-slate-400">
                        {sale.items_count ??
                          0}{" "}
                        products
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-700">
                        {sale.customer
                          ?.name ??
                          "customer"}
                      </p>

                      {sale.customer && (
                        <p className="text-xs capitalize text-slate-400">
                          {
                            sale.customer
                              .category
                          }
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {sale.location?.name ??
                        "-"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                      {formatDate(
                        sale.sale_date,
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">
                        {formatMoney(
                          sale.total_ttc,
                        )}{" "}
                        MAD
                      </p>

                      <p className="text-xs text-slate-400">
                        Paid:{" "}
                        {formatMoney(
                          sale.paid_amount,
                        )}{" "}
                        MAD
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${paymentStatusClass(
                          sale.payment_status,
                        )}`}
                      >
                        {formatLabel(
                          sale.payment_status,
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${saleStatusClass(
                          sale.status,
                        )}`}
                      >
                        {formatLabel(
                          sale.status,
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/app/sales/${sale.id}`}
                          title="View sale"
                          className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
                        >
                          <Eye size={17} />
                        </Link>

                        {canManage &&
                          sale.status ===
                            "draft" && (
                            <Link
                              to={`/app/sales/${sale.id}/edit`}
                              title="Edit sale"
                              className="rounded-lg bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"
                            >
                              <FilePenLine
                                size={17}
                              />
                            </Link>
                          )}

                        {canConfirm &&
                          sale.status ===
                            "draft" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleConfirm(
                                  sale,
                                )
                              }
                              disabled={
                                actionId ===
                                `confirm-${sale.id}`
                              }
                              title="Confirm sale"
                              className="rounded-lg bg-green-50 p-2 text-green-700 hover:bg-green-100 disabled:opacity-50"
                            >
                              {actionId ===
                              `confirm-${sale.id}` ? (
                                <Loader2
                                  size={
                                    17
                                  }
                                  className="animate-spin"
                                />
                              ) : (
                                <CheckCircle2
                                  size={
                                    17
                                  }
                                />
                              )}
                            </button>
                          )}

                        {canCancel &&
                          sale.status ===
                            "draft" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCancel(
                                  sale,
                                )
                              }
                              disabled={
                                actionId ===
                                `cancel-${sale.id}`
                              }
                              title="Cancel sale"
                              className="rounded-lg bg-red-50 p-2 text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                              <Ban size={17} />
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-slate-500">
              {meta.total ??
                sales.length}{" "}
              sales
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
                className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
              >
                Previous
              </button>

              <span>
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
                className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
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

export default SalesPage;
