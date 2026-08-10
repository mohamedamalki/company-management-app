import { BadgePercent, Loader2, Pencil, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";

const initialPagination = {
  currentPage: 1,
  lastPage: 1,
  total: 0,
};

function extractPagination(payload) {
  const paginator = Array.isArray(payload?.data)
    ? payload
    : (payload?.data ?? payload);

  const items = Array.isArray(paginator?.data)
    ? paginator.data
    : Array.isArray(paginator)
      ? paginator
      : [];

  return {
    items,
    pagination: {
      currentPage: paginator?.current_page ?? 1,
      lastPage: paginator?.last_page ?? 1,
      total: paginator?.total ?? items.length,
    },
  };
}

function getErrorMessage(error, fallback) {
  const validationErrors = error.response?.data?.errors;

  if (validationErrors) {
    return Object.values(validationErrors).flat()[0];
  }

  return error.response?.data?.message ?? fallback;
}

function formatRate(rate) {
  const number = Number(rate);

  return Number.isFinite(number) ? `${number.toFixed(2)}%` : "-";
}

function TaxRatesPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [taxRates, setTaxRates] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(location.state?.success ?? "");

  useEffect(() => {
    if (!location.state?.success) {
      return;
    }

    navigate(location.pathname, {
      replace: true,
      state: {},
    });
  }, [location.pathname, location.state?.success, navigate]);

  useEffect(() => {
    if (!success) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setSuccess("");
    }, 3000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [success]);

  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      try {
        const response = await api.get("/tax-rates");
        const result = extractPagination(response.data);

        if (!cancelled) {
          setTaxRates(result.items);
          setPagination(result.pagination);
        }
      } catch (error) {
        if (!cancelled) {
          setError(getErrorMessage(error, "Unable to load TVA rates."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadTaxRates = async (page = 1) => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/tax-rates", {
        params: { page },
      });

      const result = extractPagination(response.data);

      setTaxRates(result.items);
      setPagination(result.pagination);
    } catch (error) {
      setError(getErrorMessage(error, "Unable to load TVA rates."));
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (taxRate) => {
    const newStatus = taxRate.status === "active" ? "inactive" : "active";

    try {
      setUpdatingId(taxRate.id);
      setError("");
      setSuccess("");

      const response = await api.patch(`/tax-rates/${taxRate.id}`, {
        status: newStatus,
      });

      setTaxRates((currentRates) =>
        currentRates.map((currentRate) =>
          currentRate.id === taxRate.id
            ? {
                ...currentRate,
                status: newStatus,
              }
            : currentRate,
        ),
      );

      setSuccess(
        response.data?.message ?? "TVA rate status updated successfully.",
      );
    } catch (error) {
      setError(getErrorMessage(error, "Unable to update the TVA rate status."));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
              <BadgePercent size={16} />
              Financial settings
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              TVA rates
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage the tax rates that can be assigned to products.
            </p>
          </div>

          <Link
            to="/app/tax-rates/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Create TVA rate
          </Link>
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <h2 className="font-semibold text-slate-900">Available rates</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {pagination.total} TVA rate{pagination.total === 1 ? "" : "s"}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Code</th>
                  <th className="px-6 py-3 font-semibold">Rate</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-14 text-center">
                      <Loader2
                        size={25}
                        className="mx-auto animate-spin text-blue-600"
                      />
                      <p className="mt-2 text-slate-500">
                        Loading TVA rates...
                      </p>
                    </td>
                  </tr>
                ) : taxRates.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-14 text-center">
                      <BadgePercent
                        size={32}
                        className="mx-auto text-slate-300"
                      />
                      <p className="mt-3 font-medium text-slate-700">
                        No TVA rates found
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Create the first rate confirmed for the company.
                      </p>
                    </td>
                  </tr>
                ) : (
                  taxRates.map((taxRate) => (
                    <tr
                      key={taxRate.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                            <BadgePercent size={17} />
                          </div>
                          <span className="font-semibold text-slate-900">
                            {taxRate.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
                          {taxRate.code}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-base font-bold text-slate-900">
                          {formatRate(taxRate.rate)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${
                            taxRate.status === "active"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                              : "bg-red-50 text-red-700 ring-red-600/20"
                          }`}
                        >
                          {taxRate.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/app/tax-rates/${taxRate.id}/edit`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                          >
                            <Pencil size={14} />
                            Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleStatus(taxRate)}
                            disabled={updatingId === taxRate.id}
                            className="inline-flex min-w-24 items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {updatingId === taxRate.id && (
                              <Loader2 size={14} className="animate-spin" />
                            )}

                            {taxRate.status === "active"
                              ? "Disable"
                              : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && pagination.lastPage > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 sm:px-6">
              <p className="text-sm text-slate-500">
                Page {pagination.currentPage} of {pagination.lastPage}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => loadTaxRates(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => loadTaxRates(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.lastPage}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default TaxRatesPage;
