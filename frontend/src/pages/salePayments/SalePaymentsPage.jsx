import { ArrowLeft, CircleCheck, History, ReceiptText } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../api/axios";
import SalePaymentForm from "../../components/salePayments/SalePaymentForm";
import useAuth from "../../context/useAuth";

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

function extractError(requestError, fallback) {
  const errors = requestError.response?.data?.errors;

  return errors
    ? Object.values(errors).flat().at(0)
    : (requestError.response?.data?.message ?? fallback);
}

function SalePaymentsPage() {
  const { id } = useParams();
  const { hasPermission } = useAuth();

  const canManagePayments = hasPermission("sale-payments.manage");

  const [sale, setSale] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadPage = async () => {
      try {
        setLoading(true);
        setError("");

        const requests = [
          api.get(`/sales/${id}/payments`, {
            params: { page },
            signal: controller.signal,
          }),
        ];

        if (canManagePayments) {
          requests.push(
            api.get("/payment-methods/active", {
              signal: controller.signal,
            }),
          );
        }

        const [paymentsResponse, methodsResponse] = await Promise.all(requests);

        const body = paymentsResponse.data;

        setSale(body.sale ?? null);
        setPayments(Array.isArray(body.data) ? body.data : []);
        setMeta(body.meta ?? null);

        if (methodsResponse) {
          setPaymentMethods(
            Array.isArray(methodsResponse.data.data)
              ? methodsResponse.data.data
              : [],
          );
        }
      } catch (requestError) {
        if (requestError.code !== "ERR_CANCELED") {
          console.error(requestError);

          setError(extractError(requestError, "Unable to load sale payments."));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadPage();

    return () => controller.abort();
  }, [canManagePayments, id, page, reloadKey]);

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timer = window.setTimeout(() => setMessage(""), 3000);

    return () => window.clearTimeout(timer);
  }, [message]);

  const handlePayment = async (data) => {
    try {
      setSaving(true);
      setFormError("");

      await api.post(`/sales/${id}/payments`, data);

      setMessage("Payment recorded successfully.");
      setPage(1);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setFormError(extractError(requestError, "Unable to record the payment."));
    } finally {
      setSaving(false);
    }
  };

  if (loading && !sale) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-sm text-slate-500">
        Loading sale payments...
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
        {error || "Sale not found."}
      </div>
    );
  }

  const remainingAmount = Number(sale.remaining_amount ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <ReceiptText size={25} />
          </span>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {sale.sale_number}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Payment history and remaining balance.
            </p>
          </div>
        </div>

        <Link
          to="/app/sale-balances"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={17} />
          Back to balances
        </Link>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CircleCheck size={18} />
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Sale total
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatMoney(sale.total_ttc)} MAD
          </p>
        </div>

        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
            Paid
          </p>
          <p className="mt-2 text-2xl font-bold text-green-800">
            {formatMoney(sale.paid_amount)} MAD
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Remaining
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-900">
            {formatMoney(remainingAmount)} MAD
          </p>
        </div>
      </div>

      <div
        className={`grid gap-6 ${
          canManagePayments && remainingAmount > 0
            ? "xl:grid-cols-[minmax(0,1fr)_400px]"
            : ""
        }`}
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 py-4">
            <History size={19} className="text-blue-600" />
            <h2 className="font-bold text-slate-900">Payment history</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left">
              <thead className="border-b border-slate-200 bg-white text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Payment</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Method</th>
                  <th className="px-5 py-4">Reference</th>
                  <th className="px-5 py-4">Received by</th>
                  <th className="px-5 py-4 text-right">Amount</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      Loading payments...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      No payment has been recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {payment.payment_number}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(payment.paid_at)}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {payment.payment_method?.name ?? "-"}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {payment.reference || "-"}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {payment.receiver?.name ?? "-"}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-green-700">
                        +{formatMoney(payment.amount)} MAD
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-4 text-sm">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
              >
                Previous
              </button>

              <span>
                Page {meta.current_page} of {meta.last_page}
              </span>

              <button
                type="button"
                disabled={page >= meta.last_page || loading}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {canManagePayments && remainingAmount > 0 && (
          <SalePaymentForm
            key={`${sale.id}-${sale.paid_amount}`}
            sale={sale}
            paymentMethods={paymentMethods}
            onSubmit={handlePayment}
            saving={saving}
            error={formError}
          />
        )}
      </div>

      {remainingAmount <= 0 && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-5 py-5 font-semibold text-green-700">
          <CircleCheck size={20} />
          This sale is fully paid.
        </div>
      )}
    </div>
  );
}

export default SalePaymentsPage;
