import {
  ArrowRight,
  CircleDollarSign,
  Search,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

function formatMoney(value) {
  return Number(value ?? 0).toLocaleString("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

function statusClass(status) {
  return status === "unpaid"
    ? "bg-red-100 text-red-700"
    : "bg-amber-100 text-amber-700";
}

function SaleBalancesPage() {
  const [sales, setSales] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadBalances = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/sale-balances", {
          params: {
            page,
            payment_status: paymentStatus || undefined,
            search: search || undefined,
          },
          signal: controller.signal,
        });

        const body = response.data;

        setSales(Array.isArray(body.data) ? body.data : []);
        setMeta(body);
      } catch (requestError) {
        if (requestError.code !== "ERR_CANCELED") {
          console.error(requestError);

          setError(
            requestError.response?.data?.message ??
              "Unable to load outstanding balances.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadBalances();

    return () => controller.abort();
  }, [page, paymentStatus, search]);

  const visibleBalance = useMemo(
    () =>
      sales.reduce(
        (total, sale) => total + Number(sale.remaining_amount ?? 0),
        0,
      ),
    [sales],
  );

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <CircleDollarSign size={25} />
          </span>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Sale balances
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Follow unpaid and partially paid sales.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Balance on this page
          </p>

          <p className="mt-1 text-xl font-bold text-amber-900">
            {formatMoney(visibleBalance)} MAD
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row"
      >
        <select
          value={paymentStatus}
          onChange={(event) => {
            setPage(1);
            setPaymentStatus(event.target.value);
          }}
          className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
        >
          <option value="">All outstanding statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="partially_paid">Partially paid</option>
        </select>

        <div className="relative min-w-0 flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search sale number or customer"
            className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
          />
        </div>

        <button
          type="submit"
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Search
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Sale</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Location</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Paid</th>
                <th className="px-5 py-4">Remaining</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-14 text-center text-sm text-slate-500"
                  >
                    Loading outstanding balances...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-14 text-center">
                    <WalletCards size={28} className="mx-auto text-slate-300" />

                    <p className="mt-2 font-semibold text-slate-700">
                      No outstanding balances found.
                    </p>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">
                        {sale.sale_number}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        {formatDate(sale.sale_date)}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {sale.customer?.name ?? "Walk-in customer"}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">
                      <p>{sale.location?.name ?? "-"}</p>
                      <p className="text-xs text-slate-400">
                        {sale.location?.code ?? ""}
                      </p>
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {formatMoney(sale.total_ttc)} MAD
                    </td>

                    <td className="px-5 py-4 font-semibold text-green-700">
                      {formatMoney(sale.paid_amount)} MAD
                    </td>

                    <td className="px-5 py-4 font-bold text-amber-700">
                      {formatMoney(sale.remaining_amount)} MAD
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                          sale.payment_status,
                        )}`}
                      >
                        {sale.payment_status === "partially_paid"
                          ? "Partially paid"
                          : "Unpaid"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/app/sales/${sale.id}/payments`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        Payments
                        <ArrowRight size={15} />
                      </Link>
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
              {meta.total ?? sales.length} outstanding sales
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={!meta.prev_page_url || loading}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
              >
                Previous
              </button>

              <span>
                Page {meta.current_page ?? 1} of {meta.last_page ?? 1}
              </span>

              <button
                type="button"
                disabled={!meta.next_page_url || loading}
                onClick={() => setPage((current) => current + 1)}
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

export default SaleBalancesPage;
