import {
  Eye,
  FilePenLine,
  Loader2,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
} from "react-router-dom";
import api from "../../api/axios";
import useAuth from "../../context/useAuth";
import DownloadPdfButton from "../../components/saleReturns/DownloadPdfButton";

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

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatLabel(value) {
  return String(value ?? "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function saleReturnStatusClass(status) {
  const classes = {
    draft:
      "bg-amber-100 text-amber-700",
    validated:
      "bg-green-100 text-green-700",
    cancelled:
      "bg-red-100 text-red-700",
  };

  return (
    classes[status] ??
    "bg-slate-100 text-slate-700"
  );
}

function refundStatusClass(status) {
  const classes = {
    not_required:
      "bg-slate-100 text-slate-600",
    pending:
      "bg-amber-100 text-amber-700",
    partially_refunded:
      "bg-blue-100 text-blue-700",
    refunded:
      "bg-green-100 text-green-700",
  };

  return (
    classes[status] ??
    "bg-slate-100 text-slate-700"
  );
}

function SaleReturnsPage() {
  const routeLocation = useLocation();
  const { hasPermission } = useAuth();

  const canManage = hasPermission(
    "sale-returns.manage",
  );

  const [returns, setReturns] = useState(
    [],
  );

  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);

  const [status, setStatus] =
    useState("");

  const [
    refundStatus,
    setRefundStatus,
  ] = useState("");

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

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

    const loadSaleReturns = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/sale-returns",
          {
            params: {
              page,
              status:
                status || undefined,
              refund_status:
                refundStatus || undefined,
              search:
                search || undefined,
            },
          },
        );

        if (cancelled) {
          return;
        }

        const body = response.data;

        setReturns(
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
              "Unable to load sale returns.",
            ),
          );

          setReturns([]);
          setMeta(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSaleReturns();

    return () => {
      cancelled = true;
    };
  }, [
    page,
    status,
    refundStatus,
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

  const handleSearch = (event) => {
    event.preventDefault();

    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleStatus = (event) => {
    setPage(1);
    setStatus(event.target.value);
  };

  const handleRefundStatus = (
    event,
  ) => {
    setPage(1);
    setRefundStatus(event.target.value);
  };

  const changePage = (newPage) => {
    const lastPage =
      meta?.last_page ?? 1;

    if (
      newPage < 1 ||
      newPage > lastPage ||
      loading
    ) {
      return;
    }

    setPage(newPage);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <RotateCcw size={23} />
          </span>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Sale returns
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Track returned products,
              stock restoration, and
              refunds.
            </p>
          </div>
        </div>

        {canManage && (
          <Link
            to="/app/sale-returns/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            <Plus size={18} />

            New return
          </Link>
        )}
      </div>

      {/* Success message */}
      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
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
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Return status */}
            <select
              value={status}
              onChange={handleStatus}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-600"
            >
              <option value="">
                All return statuses
              </option>

              <option value="draft">
                Draft
              </option>

              <option value="validated">
                Validated
              </option>

              <option value="cancelled">
                Cancelled
              </option>
            </select>

            {/* Refund status */}
            <select
              value={refundStatus}
              onChange={
                handleRefundStatus
              }
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-600"
            >
              <option value="">
                All refund statuses
              </option>

              <option value="not_required">
                Not required
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="partially_refunded">
                Partially refunded
              </option>

              <option value="refunded">
                Refunded
              </option>
            </select>
          </div>

          {/* Search */}
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
                placeholder="Return number, sale or customer"
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">
                  Return
                </th>

                <th className="px-5 py-4">
                  Original sale
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
                  Status
                </th>

                <th className="px-5 py-4">
                  Refund
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
                    colSpan={9}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    <Loader2 className="mx-auto animate-spin text-blue-600" />
                  </td>
                </tr>
              ) : returns.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    No sale returns
                    found.
                  </td>
                </tr>
              ) : (
                returns.map(
                  (saleReturn) => (
                    <tr
                      key={
                        saleReturn.id
                      }
                      className="hover:bg-slate-50/70"
                    >
                      {/* Return */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {
                            saleReturn.return_number
                          }
                        </p>

                        <p className="text-xs text-slate-400">
                          {saleReturn.items_count ??
                            0}{" "}
                          products
                        </p>
                      </td>

                      {/* Original sale */}
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-700">
                          {saleReturn.sale
                            ?.sale_number ??
                            "-"}
                        </p>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-700">
                          {saleReturn.sale
                            ?.customer
                            ?.name ??
                            "Walk-in customer"}
                        </p>

                        {saleReturn.sale
                          ?.customer && (
                          <p className="text-xs capitalize text-slate-400">
                            {
                              saleReturn
                                .sale
                                .customer
                                .category
                            }
                          </p>
                        )}
                      </td>

                      {/* Location */}
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {saleReturn
                          .location
                          ?.name ?? "-"}
                      </td>

                      {/* Date */}
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {formatDate(
                          saleReturn.created_at,
                        )}
                      </td>

                      {/* Total */}
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900">
                          {formatMoney(
                            saleReturn.total_ttc,
                          )}{" "}
                          MAD
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${saleReturnStatusClass(
                            saleReturn.status,
                          )}`}
                        >
                          {formatLabel(
                            saleReturn.status,
                          )}
                        </span>
                      </td>

                      {/* Refund */}
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${refundStatusClass(
                            saleReturn.refund_status,
                          )}`}
                        >
                          {formatLabel(
                            saleReturn.refund_status,
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {/* View */}
                          <Link
                            to={`/app/sale-returns/${saleReturn.id}`}
                            title="View return"
                            className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
                          >
                            <Eye
                              size={
                                17
                              }
                            />
                          </Link>

                          {/* Download PDF */}
                          <DownloadPdfButton
                            saleReturnId={
                              saleReturn.id
                            }
                            returnNumber={
                              saleReturn.return_number
                            }
                          />

                          {/* Edit */}
                          {canManage &&
                            saleReturn.status ===
                              "draft" && (
                              <Link
                                to={`/app/sale-returns/${saleReturn.id}/edit`}
                                title="Edit return"
                                className="rounded-lg bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"
                              >
                                <FilePenLine
                                  size={
                                    17
                                  }
                                />
                              </Link>
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
                returns.length}{" "}
              sale returns
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
                className="rounded-lg border border-slate-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
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
                className="rounded-lg border border-slate-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
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

export default SaleReturnsPage;
