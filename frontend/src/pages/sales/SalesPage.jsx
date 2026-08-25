import {
  Ban,
  CalendarDays,
  CheckCircle2,
  Eye,
  FileDown,
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
    ? Object.values(errors).flat().at(0)
    : error.response?.data?.message ??
        fallback;
}

function formatMoney(value) {
  return Number(value ?? 0).toLocaleString(
    "fr-MA",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function formatLabel(value) {
  return String(value ?? "")
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) => letter.toUpperCase(),
    );
}

function saleStatusClass(status) {
  const classes = {
    draft: "bg-amber-100 text-amber-700",
    confirmed:
      "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    classes[status] ??
    "bg-slate-100 text-slate-700"
  );
}

function paymentStatusClass(status) {
  const classes = {
    unpaid: "bg-red-100 text-red-700",
    partially_paid:
      "bg-amber-100 text-amber-700",
    paid: "bg-green-100 text-green-700",
  };

  return (
    classes[status] ??
    "bg-slate-100 text-slate-700"
  );
}

function defaultPeriodValue(type) {
  const currentDate = new Date();

  const year = String(
    currentDate.getFullYear(),
  );

  const month = String(
    currentDate.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    currentDate.getDate(),
  ).padStart(2, "0");

  if (type === "day") {
    return `${year}-${month}-${day}`;
  }

  if (type === "month") {
    return `${year}-${month}`;
  }

  if (type === "year") {
    return year;
  }

  return "";
}

function getPeriodRange(
  periodType,
  periodValue,
) {
  if (
    periodType === "all" ||
    !periodValue
  ) {
    return {};
  }

  if (periodType === "day") {
    return {
      date_from: periodValue,
      date_to: periodValue,
    };
  }

  if (periodType === "month") {
    const [year, month] = periodValue
      .split("-")
      .map(Number);

    if (!year || !month) {
      return {};
    }

    const lastDay = new Date(
      year,
      month,
      0,
    ).getDate();

    return {
      date_from: `${periodValue}-01`,
      date_to: `${periodValue}-${String(
        lastDay,
      ).padStart(2, "0")}`,
    };
  }

  if (periodType === "year") {
    return {
      date_from: `${periodValue}-01-01`,
      date_to: `${periodValue}-12-31`,
    };
  }

  return {};
}

function getPeriodInputType(periodType) {
  if (periodType === "day") {
    return "date";
  }

  if (periodType === "month") {
    return "month";
  }

  return "number";
}

function getDownloadFilename(
  response,
  fallback,
) {
  const contentDisposition =
    response.headers?.[
      "content-disposition"
    ] ?? "";

  const match = contentDisposition.match(
    /filename="?([^";]+)"?/i,
  );

  return match?.[1] ?? fallback;
}

function SalesPage() {
  const routeLocation = useLocation();

  const { hasPermission } = useAuth();

  const canManage =
    hasPermission("sales.manage");

  const canConfirm =
    hasPermission("sales.confirm");

  const canCancel =
    hasPermission("sales.cancel");

  const [sales, setSales] = useState([]);
  const [meta, setMeta] = useState(null);

  const [page, setPage] = useState(1);

  const [status, setStatus] =
    useState("");

  const [
    paymentStatus,
    setPaymentStatus,
  ] = useState("");

  const [periodType, setPeriodType] =
    useState("all");

  const [
    periodValue,
    setPeriodValue,
  ] = useState("");

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [
    downloadingReport,
    setDownloadingReport,
  ] = useState(false);

  const [actionId, setActionId] =
    useState("");

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState(
      routeLocation.state?.message ?? "",
    );

  useEffect(() => {
    let cancelled = false;

    const loadSales = async () => {
      try {
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

              ...getPeriodRange(
                periodType,
                periodValue,
              ),
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
        setError("");
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
    periodType,
    periodValue,
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
    setSales((currentSales) =>
      currentSales.map((sale) =>
        sale.id === saleId
          ? {
              ...sale,
              ...updatedSale,
            }
          : sale,
      ),
    );
  };

  const handleConfirm = async (sale) => {
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

  const handleCancel = async (sale) => {
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

  const handlePeriodType = (event) => {
    const nextPeriodType =
      event.target.value;

    setLoading(true);
    setPage(1);
    setPeriodType(nextPeriodType);

    setPeriodValue(
      defaultPeriodValue(
        nextPeriodType,
      ),
    );
  };

  const handlePeriodValue = (
    event,
  ) => {
    setLoading(true);
    setPage(1);

    setPeriodValue(
      event.target.value,
    );
  };

  const handleResetFilters = () => {
    setLoading(true);
    setPage(1);

    setStatus("");
    setPaymentStatus("");
    setPeriodType("all");
    setPeriodValue("");
    setSearchInput("");
    setSearch("");
  };

  const handleDownloadReport =
    async () => {
      try {
        setDownloadingReport(true);
        setError("");

        const response = await api.get(
          "/sales/report/pdf",
          {
            params: {
              status:
                status || undefined,

              payment_status:
                paymentStatus ||
                undefined,

              search:
                search || undefined,

              ...getPeriodRange(
                periodType,
                periodValue,
              ),
            },

            responseType: "blob",
          },
        );

        const pdfBlob = new Blob(
          [response.data],
          {
            type: "application/pdf",
          },
        );

        const fileUrl =
          window.URL.createObjectURL(
            pdfBlob,
          );

        const filename =
          getDownloadFilename(
            response,
            "sales-report.pdf",
          );

        const link =
          document.createElement("a");

        link.href = fileUrl;
        link.download = filename;

        document.body.appendChild(link);

        link.click();
        link.remove();

        window.URL.revokeObjectURL(
          fileUrl,
        );
      } catch (requestError) {
        console.error(requestError);

        setError(
          "Unable to download the sales report.",
        );
      } finally {
        setDownloadingReport(false);
      }
    };

  const changePage = (newPage) => {
    const lastPage =
      meta?.last_page ?? 1;

    if (
      newPage < 1 ||
      newPage > lastPage
    ) {
      return;
    }

    setLoading(true);
    setPage(newPage);
  };

  const hasActiveFilters =
    Boolean(status) ||
    Boolean(paymentStatus) ||
    periodType !== "all" ||
    Boolean(search);

  const periodIsInvalid =
    periodType !== "all" &&
    !periodValue;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <ShoppingCart size={23} />
          </span>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Sales
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage walk-in, registered
              and fournisseur sales.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={
              handleDownloadReport
            }
            disabled={
              downloadingReport ||
              periodIsInvalid
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {downloadingReport ? (
              <Loader2
                size={18}
                className="animate-spin"
              />
            ) : (
              <FileDown size={18} />
            )}

            {downloadingReport
              ? "Generating..."
              : "Download PDF"}
          </button>

          {canManage && (
            <Link
              to="/app/sales/create"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Plus size={18} />
              New sale
            </Link>
          )}
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-3">
            <select
              value={status}
              onChange={handleStatus}
              aria-label="Sale status"
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
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
              aria-label="Payment status"
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
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

            <select
              value={periodType}
              onChange={handlePeriodType}
              aria-label="Report period"
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
            >
              <option value="all">
                All time
              </option>

              <option value="day">
                By day
              </option>

              <option value="month">
                By month
              </option>

              <option value="year">
                By year
              </option>
            </select>

            {periodType !== "all" && (
              <div className="relative">
                <CalendarDays
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type={getPeriodInputType(
                    periodType,
                  )}
                  value={periodValue}
                  onChange={
                    handlePeriodValue
                  }
                  min={
                    periodType === "year"
                      ? "2000"
                      : undefined
                  }
                  max={
                    periodType === "year"
                      ? String(
                          new Date().getFullYear(),
                        )
                      : undefined
                  }
                  aria-label="Period value"
                  className="rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <form
              onSubmit={handleSearch}
              className="flex gap-2"
            >
              <div className="relative w-full sm:w-80">
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
                  placeholder="Sale number or customer"
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Search
              </button>
            </form>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={
                  handleResetFilters
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {periodType !== "all" &&
          periodValue && (
            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-sm text-slate-500">
              <CalendarDays
                size={16}
                className="text-blue-600"
              />

              <span>
                Showing sales for{" "}
                <strong className="font-semibold text-slate-700">
                  {periodType === "day"
                    ? "day"
                    : periodType ===
                        "month"
                      ? "month"
                      : "year"}
                  : {periodValue}
                </strong>
              </span>
            </div>
          )}
      </div>

      {/* Sales table */}
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
                    className="px-5 py-14 text-center"
                  >
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                      <Loader2
                        size={25}
                        className="animate-spin text-blue-600"
                      />

                      <span>
                        Loading sales...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-14 text-center text-slate-500"
                  >
                    No sales found for
                    the selected filters.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {
                          sale.sale_number
                        }
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        {sale.items_count ??
                          0}{" "}
                        {(sale.items_count ??
                          0) === 1
                          ? "product"
                          : "products"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-700">
                        {sale.customer
                          ?.name ??
                          "Walk-in customer"}
                      </p>

                      {sale.customer && (
                        <p className="mt-0.5 text-xs capitalize text-slate-400">
                          {
                            sale.customer
                              .category
                          }
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-600">
                        {sale.location
                          ?.name ?? "-"}
                      </p>

                      {sale.location
                        ?.code && (
                        <p className="mt-0.5 text-xs text-slate-400">
                          {
                            sale.location
                              .code
                          }
                        </p>
                      )}
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

                      <p className="mt-0.5 text-xs text-slate-400">
                        Paid:{" "}
                        {formatMoney(
                          sale.paid_amount,
                        )}{" "}
                        MAD
                      </p>

                      {Number(
                        sale.remaining_amount ??
                          0,
                      ) > 0 && (
                        <p className="mt-0.5 text-xs font-medium text-red-500">
                          Remaining:{" "}
                          {formatMoney(
                            sale.remaining_amount,
                          )}{" "}
                          MAD
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${paymentStatusClass(
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
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${saleStatusClass(
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
                          aria-label={`View ${sale.sale_number}`}
                          className="rounded-lg bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200"
                        >
                          <Eye size={17} />
                        </Link>

                        {canManage &&
                          sale.status ===
                            "draft" && (
                            <Link
                              to={`/app/sales/${sale.id}/edit`}
                              title="Edit sale"
                              aria-label={`Edit ${sale.sale_number}`}
                              className="rounded-lg bg-blue-50 p-2 text-blue-700 transition hover:bg-blue-100"
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
                              aria-label={`Confirm ${sale.sale_number}`}
                              className="rounded-lg bg-green-50 p-2 text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
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
                              aria-label={`Cancel ${sale.sale_number}`}
                              className="rounded-lg bg-red-50 p-2 text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {actionId ===
                              `cancel-${sale.id}` ? (
                                <Loader2
                                  size={
                                    17
                                  }
                                  className="animate-spin"
                                />
                              ) : (
                                <Ban
                                  size={
                                    17
                                  }
                                />
                              )}
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

        {/* Pagination */}
        {meta && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-slate-500">
              {meta.total ??
                sales.length}{" "}
              {(meta.total ??
                sales.length) === 1
                ? "sale"
                : "sales"}
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={
                  loading ||
                  !meta.prev_page_url
                }
                onClick={() =>
                  changePage(page - 1)
                }
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="whitespace-nowrap text-slate-600">
                Page{" "}
                {meta.current_page ??
                  page}{" "}
                of{" "}
                {meta.last_page ?? 1}
              </span>

              <button
                type="button"
                disabled={
                  loading ||
                  !meta.next_page_url
                }
                onClick={() =>
                  changePage(page + 1)
                }
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
