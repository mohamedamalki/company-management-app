import {
  ArrowLeft,
  Ban,
  Banknote,
  CheckCircle2,
  FilePenLine,
  Loader2,
  PackageCheck,
  RotateCcw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import api from "../../api/axios";
import SaleRefundForm from "../../components/saleReturns/SaleRefundForm";
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

function formatQuantity(value) {
  return Number(value ?? 0).toLocaleString("fr-MA", {
    maximumFractionDigits: 3,
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

function SaleReturnDetails() {
  const { id } = useParams();
  const routeLocation = useLocation();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("sale-returns.manage");

  const [saleReturn, setSaleReturn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(routeLocation.state?.message ?? "");

  useEffect(() => {
    let cancelled = false;

    api
      .get(`/sale-returns/${id}`)
      .then((response) => {
        if (!cancelled) {
          setSaleReturn(response.data.data);
          setError("");
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(apiError(requestError, "Unable to load the sale return."));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, refreshKey]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => setMessage(""), 3000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const handleValidate = async () => {
    if (
      !window.confirm(
        "Validate this return? Sellable quantities will be added to stock.",
      )
    ) {
      return;
    }

    try {
      setAction("validate");
      setError("");
      const response = await api.patch(
        `/sale-returns/${saleReturn.id}/validate`,
      );
      setSaleReturn(response.data.data);
      setMessage(response.data.message ?? "Sale return validated.");
    } catch (requestError) {
      setError(apiError(requestError, "Unable to validate the return."));
    } finally {
      setAction("");
    }
  };

  const handleCancel = async () => {
    const reason = window.prompt("Enter the cancellation reason:");
    if (reason === null) return;
    if (!reason.trim()) {
      setError("Cancellation reason is required.");
      return;
    }

    try {
      setAction("cancel");
      setError("");
      const response = await api.patch(
        `/sale-returns/${saleReturn.id}/cancel`,
        { cancellation_reason: reason.trim() },
      );
      setSaleReturn(response.data.data);
      setMessage(response.data.message ?? "Sale return cancelled.");
    } catch (requestError) {
      setError(apiError(requestError, "Unable to cancel the return."));
    } finally {
      setAction("");
    }
  };

  const handleRefundSaved = (response) => {
    setMessage(response.message ?? "Refund recorded successfully.");
    setRefreshKey((current) => current + 1);
  };

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!saleReturn) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
        {error || "Sale return not found."}
      </div>
    );
  }

  const sale = saleReturn.sale ?? {};
  const refundableAmount = Number(sale.refundable_amount ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <RotateCcw size={24} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {saleReturn.return_number}
              </h1>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(saleReturn.status)}`}
              >
                {label(saleReturn.status)}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(saleReturn.refund_status)}`}
              >
                {label(saleReturn.refund_status)}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Created by {saleReturn.creator?.name ?? "System"} on{" "}
              {formatDate(saleReturn.created_at)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/app/sale-returns"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold"
          >
            <ArrowLeft size={17} /> Back
          </Link>
          {canManage && saleReturn.status === "draft" && (
            <>
              <Link
                to={`/app/sale-returns/${saleReturn.id}/edit`}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700"
              >
                <FilePenLine size={17} /> Edit
              </Link>
              <button
                type="button"
                onClick={handleValidate}
                disabled={Boolean(action)}
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {action === "validate" ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={17} />
                )}
                Validate
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={Boolean(action)}
                className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-50"
              >
                <Ban size={17} /> Cancel
              </button>
            </>
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
          <p className="text-xs font-bold uppercase text-slate-400">
            Original sale
          </p>
          <Link
            to={`/app/sales/${saleReturn.sale_id}`}
            className="mt-2 block font-bold text-blue-700"
          >
            {sale.sale_number}
          </Link>
          <p className="mt-1 text-sm text-slate-500">
            {sale.customer?.name ?? "Walk-in customer"}
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-400">Location</p>
          <p className="mt-2 font-bold">{saleReturn.location?.name ?? "-"}</p>
          <p className="mt-1 text-sm text-slate-500">
            {saleReturn.location?.code}
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-400">
            Return total
          </p>
          <p className="mt-2 text-xl font-bold text-blue-700">
            {formatMoney(saleReturn.total_ttc)} MAD
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Refunded: {formatMoney(saleReturn.refunded_amount)} MAD
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b bg-slate-50 px-5 py-4">
          <PackageCheck size={19} />
          <h2 className="font-bold">Returned products</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Returned</th>
                <th className="px-5 py-4">Restocked</th>
                <th className="px-5 py-4">Damaged</th>
                <th className="px-5 py-4">Price HT</th>
                <th className="px-5 py-4">TVA</th>
                <th className="px-5 py-4">Total TTC</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {saleReturn.items?.map((item) => (
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
                  <td className="px-5 py-4 font-semibold text-green-700">
                    {formatQuantity(item.restock_quantity)}
                  </td>
                  <td className="px-5 py-4 font-semibold text-red-700">
                    {formatQuantity(item.damaged_quantity)}
                  </td>
                  <td className="px-5 py-4">
                    {formatMoney(item.unit_price_ht)} MAD
                  </td>
                  <td className="px-5 py-4">{Number(item.tax_rate)}%</td>
                  <td className="px-5 py-4 font-bold">
                    {formatMoney(item.total_ttc)} MAD
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="font-bold">Return information</h2>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="font-semibold text-slate-500">Reason</p>
              <p className="mt-1 text-slate-800">{saleReturn.reason}</p>
            </div>
            {saleReturn.notes && (
              <div>
                <p className="font-semibold text-slate-500">Notes</p>
                <p className="mt-1 text-slate-800">{saleReturn.notes}</p>
              </div>
            )}
            {saleReturn.validated_at && (
              <p className="text-slate-500">
                Validated by {saleReturn.validator?.name ?? "System"} on{" "}
                {formatDate(saleReturn.validated_at)}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Banknote size={19} />
            <h2 className="font-bold">Refund history</h2>
          </div>
          <div className="mt-4 space-y-3">
            {saleReturn.refunds?.length ? (
              saleReturn.refunds.map((refund) => (
                <div
                  key={refund.id}
                  className="flex justify-between rounded-xl bg-slate-50 p-3 text-sm"
                >
                  <div>
                    <p className="font-semibold">{refund.refund_number}</p>
                    <p className="text-xs text-slate-400">
                      {refund.payment_method?.name} ·{" "}
                      {formatDate(refund.refunded_at)}
                    </p>
                  </div>
                  <strong>{formatMoney(refund.amount)} MAD</strong>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No refunds recorded.</p>
            )}
          </div>
        </div>
      </div>

      {canManage &&
        saleReturn.status === "validated" &&
        refundableAmount > 0.009 && (
          <SaleRefundForm saleReturn={saleReturn} onSaved={handleRefundSaved} />
        )}

      {saleReturn.status === "cancelled" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="font-bold">Cancellation reason</p>
          <p className="mt-2 text-sm">{saleReturn.cancellation_reason}</p>
        </div>
      )}
    </div>
  );
}

export default SaleReturnDetails;
