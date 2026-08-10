import {
  CreditCard,
  FileCheck2,
  FileX2,
  Loader2,
  Pencil,
  Plus,
} from "lucide-react";
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

function PaymentMethodsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);

  const [statusFilter, setStatusFilter] = useState("");

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
        const response = await api.get("/payment-methods");
        const result = extractPagination(response.data);

        if (!cancelled) {
          setPaymentMethods(result.items);
          setPagination(result.pagination);
        }
      } catch (error) {
        if (!cancelled) {
          setError(getErrorMessage(error, "Unable to load payment methods."));
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

  const loadPaymentMethods = async (page = 1, status = statusFilter) => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/payment-methods", {
        params: {
          page,
          ...(status ? { status } : {}),
        },
      });

      const result = extractPagination(response.data);

      setPaymentMethods(result.items);
      setPagination(result.pagination);
    } catch (error) {
      setError(getErrorMessage(error, "Unable to load payment methods."));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilter = async (event) => {
    const status = event.target.value;

    setStatusFilter(status);
    await loadPaymentMethods(1, status);
  };

  const handleClearFilter = async () => {
    setStatusFilter("");

    await loadPaymentMethods(1, "");
  };

  const handleStatus = async (paymentMethod) => {
    const newStatus = paymentMethod.status === "active" ? "inactive" : "active";

    try {
      setUpdatingId(paymentMethod.id);
      setError("");
      setSuccess("");

      const response = await api.patch(`/payment-methods/${paymentMethod.id}`, {
        status: newStatus,
      });

      setPaymentMethods((currentMethods) =>
        currentMethods.map((currentMethod) =>
          currentMethod.id === paymentMethod.id
            ? {
                ...currentMethod,
                status: newStatus,
              }
            : currentMethod,
        ),
      );

      setSuccess(
        response.data?.message ?? "Payment method status updated successfully.",
      );
    } catch (error) {
      setError(
        getErrorMessage(error, "Unable to update the payment method status."),
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const filterIsActive = Boolean(statusFilter);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
              <CreditCard size={16} />
              Financial settings
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Payment methods
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage the payment options available during sales.
            </p>
          </div>

          <Link
            to="/app/payment-methods/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Create payment method
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
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="font-semibold text-slate-900">
                Available methods
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {pagination.total} payment method
                {pagination.total === 1 ? "" : "s"}
              </p>
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={handleStatusFilter}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              {filterIsActive && (
                <button
                  type="button"
                  onClick={handleClearFilter}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Method</th>
                  <th className="px-6 py-3 font-semibold">Code</th>
                  <th className="px-6 py-3 font-semibold">Reference</th>
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
                        Loading payment methods...
                      </p>
                    </td>
                  </tr>
                ) : paymentMethods.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-14 text-center">
                      <CreditCard
                        size={32}
                        className="mx-auto text-slate-300"
                      />
                      <p className="mt-3 font-medium text-slate-700">
                        No payment methods found
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Create your first payment method or change the filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paymentMethods.map((paymentMethod) => (
                    <tr
                      key={paymentMethod.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                            <CreditCard size={17} />
                          </div>
                          <span className="font-semibold text-slate-900">
                            {paymentMethod.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
                          {paymentMethod.code}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {paymentMethod.requires_reference ? (
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700">
                            <FileCheck2 size={16} />
                            Required
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                            <FileX2 size={16} />
                            Not required
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${
                            paymentMethod.status === "active"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                              : "bg-red-50 text-red-700 ring-red-600/20"
                          }`}
                        >
                          {paymentMethod.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/app/payment-methods/${paymentMethod.id}/edit`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                          >
                            <Pencil size={14} />
                            Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleStatus(paymentMethod)}
                            disabled={updatingId === paymentMethod.id}
                            className="inline-flex min-w-24 items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {updatingId === paymentMethod.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : null}

                            {paymentMethod.status === "active"
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
                  onClick={() => loadPaymentMethods(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => loadPaymentMethods(pagination.currentPage + 1)}
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
    </div>
  );
}

export default PaymentMethodsPage;
