import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  FilePenLine,
  Loader2,
  ReceiptText,
  ShoppingCart,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import api from "../../api/axios";
import SalePaymentForm from "../../components/salePayments/SalePaymentForm";
import useAuth from "../../context/useAuth";

function formatMoney(value) {
  return Number(value ?? 0).toLocaleString("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatQuantity(value) {
  return Number(value ?? 0).toLocaleString("fr-MA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
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

function formatLabel(value) {
  return String(value ?? "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status) {
  const classes = {
    draft: "bg-amber-100 text-amber-700",
    confirmed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    unpaid: "bg-red-100 text-red-700",
    partially_paid: "bg-amber-100 text-amber-700",
    paid: "bg-green-100 text-green-700",
  };

  return classes[status] ?? "bg-slate-100 text-slate-700";
}

function getError(error, fallback) {
  const errors = error.response?.data?.errors;

  return errors
    ? Object.values(errors).flat().at(0)
    : (error.response?.data?.message ?? fallback);
}

function SaleDetails() {
  const { id } = useParams();
  const routeLocation = useLocation();

  const { hasPermission } = useAuth();

  const canManage = hasPermission("sales.manage");

  const canConfirm = hasPermission("sales.confirm");

  const canCancel = hasPermission("sales.cancel");

  const canViewPayments = hasPermission("sale-payments.view");

  const canManagePayments = hasPermission("sale-payments.manage");

  const [sale, setSale] = useState(null);

  const [loading, setLoading] = useState(true);

  const [action, setAction] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  const [error, setError] = useState("");

  const [message, setMessage] = useState(routeLocation.state?.message ?? "");

  useEffect(() => {
    let cancelled = false;

    api
      .get(`/sales/${id}`)
      .then((response) => {
        if (!cancelled) {
          setSale(response.data.data);

          setError("");
        }
      })
      .catch((requestError) => {
        console.error(requestError);

        if (!cancelled) {
          setError(getError(requestError, "Unable to load sale."));
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
  }, [id, refreshKey]);

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setMessage("");
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [message]);

  const handleConfirm = async () => {
    if (
      !window.confirm(
        `Confirm sale ${sale.sale_number}? Stock will be subtracted.`,
      )
    ) {
      return;
    }

    try {
      setAction("confirm");
      setError("");

      const response = await api.patch(`/sales/${sale.id}/confirm`);

      setSale(response.data.data);

      setMessage(response.data.message ?? "Sale confirmed successfully.");
    } catch (requestError) {
      setError(getError(requestError, "Unable to confirm sale."));
    } finally {
      setAction("");
    }
  };

  const handleCancel = async () => {
    const reason = window.prompt("Enter the cancellation reason:");

    if (reason === null) {
      return;
    }

    if (!reason.trim()) {
      setError("Cancellation reason is required.");

      return;
    }

    try {
      setAction("cancel");
      setError("");

      const response = await api.patch(`/sales/${sale.id}/cancel`, {
        cancellation_reason: reason.trim(),
      });

      setSale(response.data.data);

      setMessage(response.data.message ?? "Sale cancelled successfully.");
    } catch (requestError) {
      setError(getError(requestError, "Unable to cancel sale."));
    } finally {
      setAction("");
    }
  };

  const handlePaymentSaved = () => {
    setMessage("Payment recorded successfully.");

    setRefreshKey((current) => current + 1);
  };

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
        Sale not found.
      </div>
    );
  }

  const remaining = Math.max(
    Number(sale.total_ttc) - Number(sale.paid_amount),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <ShoppingCart size={23} />
          </span>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {sale.sale_number}
              </h1>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                  sale.status,
                )}`}
              >
                {formatLabel(sale.status)}
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Created by {sale.creator?.name ?? "System"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/app/sales"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold"
          >
            <ArrowLeft size={17} />
            Back
          </Link>

          {canManage && sale.status === "draft" && (
            <Link
              to={`/app/sales/${sale.id}/edit`}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700"
            >
              <FilePenLine size={17} />
              Edit
            </Link>
          )}

          {canConfirm && sale.status === "draft" && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={action === "confirm"}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {action === "confirm" ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <CheckCircle2 size={17} />
              )}
              Confirm sale
            </button>
          )}

          {canCancel && sale.status === "draft" && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={action === "cancel"}
              className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-50"
            >
              <Ban size={17} />
              Cancel
            </button>
          )}
        </div>
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

      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-400">Customer</p>

          <p className="mt-2 font-bold text-slate-900">
            {sale.customer?.name ?? "customer"}
          </p>

          {sale.customer && (
            <p className="mt-1 text-sm capitalize text-slate-500">
              {sale.customer.category}
            </p>
          )}
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-400">Location</p>

          <p className="mt-2 font-bold text-slate-900">
            {sale.location?.name ?? "-"}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {sale.location?.code ?? ""}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-400">
            Sale date
          </p>

          <p className="mt-2 font-bold text-slate-900">
            {formatDate(sale.sale_date)}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b bg-slate-50 px-5 py-4">
          <ReceiptText size={19} />

          <h2 className="font-bold">Sale products</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Quantity</th>
                <th className="px-5 py-4">Price HT</th>
                <th className="px-5 py-4">Discount</th>
                <th className="px-5 py-4">TVA</th>
                <th className="px-5 py-4">Total HT</th>
                <th className="px-5 py-4">Total TTC</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {sale.items?.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold">{item.product_name}</p>

                    <p className="text-xs text-slate-400">
                      {item.product_reference ?? "-"}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    {formatQuantity(item.quantity)} {item.unit}
                  </td>

                  <td className="px-5 py-4">
                    {formatMoney(item.unit_price_ht)} MAD
                  </td>

                  <td className="px-5 py-4">
                    {formatMoney(item.discount_amount)} MAD
                  </td>

                  <td className="px-5 py-4">{item.tax_rate}%</td>

                  <td className="px-5 py-4">
                    {formatMoney(item.total_ht)} MAD
                  </td>

                  <td className="px-5 py-4 font-bold">
                    {formatMoney(item.total_ttc)} MAD
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ml-auto grid max-w-md grid-cols-2 gap-3 border-t p-5 text-sm">
          <span>Subtotal HT</span>
          <strong className="text-right">
            {formatMoney(sale.subtotal_ht)} MAD
          </strong>

          <span>Discount</span>
          <strong className="text-right">
            −{formatMoney(sale.discount_total)} MAD
          </strong>

          <span>TVA</span>
          <strong className="text-right">
            {formatMoney(sale.tax_total)} MAD
          </strong>

          <span className="text-base font-bold">Total TTC</span>
          <strong className="text-right text-lg text-blue-700">
            {formatMoney(sale.total_ttc)} MAD
          </strong>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Payment summary</h2>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                sale.payment_status,
              )}`}
            >
              {formatLabel(sale.payment_status)}
            </span>
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Total TTC</span>
              <strong>{formatMoney(sale.total_ttc)} MAD</strong>
            </div>

            <div className="flex justify-between">
              <span>Paid</span>
              <strong className="text-green-700">
                {formatMoney(sale.paid_amount)} MAD
              </strong>
            </div>

            <div className="flex justify-between border-t pt-3">
              <span className="font-bold">Remaining</span>
              <strong className="text-red-700">
                {formatMoney(remaining)} MAD
              </strong>
            </div>
          </div>

          {canViewPayments && (
            <div className="mt-6 space-y-3 border-t pt-5">
              <h3 className="text-sm font-bold">Payment history</h3>

              {sale.payments?.length ? (
                sale.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex justify-between rounded-xl bg-slate-50 p-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold">
                        {payment.payment_method?.name ?? "Payment"}
                      </p>

                      <p className="text-xs text-slate-400">
                        {formatDate(payment.paid_at)}
                      </p>
                    </div>

                    <strong>{formatMoney(payment.amount)} MAD</strong>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No payments recorded.</p>
              )}
            </div>
          )}
        </div>

        {sale.status === "confirmed" && remaining > 0 && canManagePayments && (
          <SalePaymentForm
            key={`${sale.id}-${sale.paid_amount}`}
            sale={sale}
            onSaved={handlePaymentSaved}
          />
        )}

        {sale.status === "confirmed" && remaining <= 0 && (
          <div className="flex items-center justify-center rounded-2xl border border-green-200 bg-green-50 p-6 text-green-700">
            <CheckCircle2 className="mr-2" />
            Sale paid completely.
          </div>
        )}
      </div>

      {sale.status === "cancelled" && sale.cancellation_reason && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-bold text-red-700">Cancellation reason</p>

          <p className="mt-2 text-sm text-red-600">
            {sale.cancellation_reason}
          </p>
        </div>
      )}
    </div>
  );
}

export default SaleDetails;
