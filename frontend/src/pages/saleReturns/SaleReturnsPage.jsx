import {
  Eye,
  FilePenLine,
  Loader2,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../../api/axios";
import useAuth from "../../context/useAuth";

function apiError(error, fallback) {
  const errors = error.response?.data?.errors;

  return errors
    ? Object.values(errors).flat().at(0)
    : (error.response?.data?.message ?? fallback);
}

function formatMoney(value) {
  return Number(value ?? 0).toLocaleString("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function label(value) {
  return String(value ?? "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status) {
  return (
    {
      draft: "bg-amber-100 text-amber-700",
      validated: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
      not_required: "bg-slate-100 text-slate-600",
      pending: "bg-amber-100 text-amber-700",
      partially_refunded: "bg-blue-100 text-blue-700",
      refunded: "bg-green-100 text-green-700",
    }[status] ?? "bg-slate-100 text-slate-600"
  );
}

function SaleReturnsPage() {
  const routeLocation = useLocation();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("sale-returns.manage");

  const [returns, setReturns] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [refundStatus, setRefundStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(routeLocation.state?.message ?? "");

  useEffect(() => {
    let cancelled = false;

    api
      .get("/sale-returns", {
        params: {
          page,
          status: status || undefined,
          refund_status: refundStatus || undefined,
          search: search || undefined,
        },
      })
      .then((response) => {
        if (!cancelled) {
          setReturns(
            Array.isArray(response.data.data) ? response.data.data : [],
          );
          setMeta(response.data);
          setError("");
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(apiError(requestError, "Unable to load sale returns."));
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
  }, [page, status, refundStatus, search]);

  useEffect(() => {
    if (!message) return undefined;

    const timer = window.setTimeout(() => setMessage(""), 3000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const handleSearch = (event) => {
    event.preventDefault();
    setLoading(true);
    setPage(1);
    setSearch(searchInput.trim());
  };

  const changeFilter = (setter, value) => {
    setLoading(true);
    setPage(1);
    setter(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <RotateCcw size={24} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Sale returns</h1>
            <p className="mt-1 text-sm text-slate-500">
              Track returned products, stock restoration, and refunds.
            </p>
          </div>
        </div>

        {canManage && (
          <Link
            to="/app/sale-returns/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Plus size={18} /> New return
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

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row">
        <select
          value={status}
          onChange={(event) => changeFilter(setStatus, event.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="validated">Validated</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={refundStatus}
          onChange={(event) =>
            changeFilter(setRefundStatus, event.target.value)
          }
          className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
        >
          <option value="">All refund statuses</option>
          <option value="not_required">Not required</option>
          <option value="pending">Pending</option>
          <option value="partially_refunded">Partially refunded</option>
          <option value="refunded">Refunded</option>
        </select>

        <form onSubmit={handleSearch} className="flex flex-1 gap-2 lg:ml-auto">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Return, sale, or customer"
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm"
            />
          </div>
          <button className="rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white">
            Search
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Return</th>
                <th className="px-5 py-4">Original sale</th>
                <th className="px-5 py-4">Location</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Refund</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center">
                    <Loader2 className="mx-auto animate-spin text-blue-600" />
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    No sale returns found.
                  </td>
                </tr>
              ) : (
                returns.map((saleReturn) => (
                  <tr key={saleReturn.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {saleReturn.return_number}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDate(saleReturn.created_at)} ·{" "}
                        {saleReturn.items_count} items
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium">
                        {saleReturn.sale?.sale_number}
                      </p>
                      <p className="text-xs text-slate-400">
                        {saleReturn.sale?.customer?.name ?? "Walk-in customer"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {saleReturn.location?.name ?? "-"}
                    </td>
                    <td className="px-5 py-4 font-semibold">
                      {formatMoney(saleReturn.total_ttc)} MAD
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(saleReturn.status)}`}
                      >
                        {label(saleReturn.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(saleReturn.refund_status)}`}
                      >
                        {label(saleReturn.refund_status)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/app/sale-returns/${saleReturn.id}`}
                          title="View return"
                          className="rounded-lg bg-slate-100 p-2 text-slate-700"
                        >
                          <Eye size={17} />
                        </Link>
                        {canManage && saleReturn.status === "draft" && (
                          <Link
                            to={`/app/sale-returns/${saleReturn.id}/edit`}
                            title="Edit return"
                            className="rounded-lg bg-blue-50 p-2 text-blue-700"
                          >
                            <FilePenLine size={17} />
                          </Link>
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
          <div className="flex flex-col gap-3 border-t px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-slate-500">
              {meta.total ?? returns.length} return records
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={!meta.prev_page_url || loading}
                onClick={() => {
                  setLoading(true);
                  setPage((current) => current - 1);
                }}
                className="rounded-lg border px-3 py-2 disabled:opacity-40"
              >
                Previous
              </button>
              <span>
                Page {meta.current_page ?? page} of {meta.last_page ?? 1}
              </span>
              <button
                type="button"
                disabled={!meta.next_page_url || loading}
                onClick={() => {
                  setLoading(true);
                  setPage((current) => current + 1);
                }}
                className="rounded-lg border px-3 py-2 disabled:opacity-40"
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
