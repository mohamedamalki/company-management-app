import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Download,
  FilePenLine,
  MapPin,
  UserRound,
  XCircle,
} from "lucide-react";
import api from "../../api/axios";

const formatMoney = (value) =>
  new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));

const statusClasses = {
  draft: "bg-slate-100 text-slate-700",
  ordered: "bg-blue-100 text-blue-700",
  partially_received: "bg-amber-100 text-amber-700",
  received: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function PurchaseOrderDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(location.state?.message ?? "");

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/purchase-orders/${id}`);
      setOrder(response.data.data ?? response.data);
    } catch (requestError) {
      console.error(requestError);
      setError("Unable to load purchase order.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const requestOrder = async () => {
      try {
        const response = await api.get(`/purchase-orders/${id}`);
        if (!cancelled) setOrder(response.data.data ?? response.data);
      } catch (requestError) {
        console.error(requestError);
        if (!cancelled) setError("Unable to load purchase order.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    requestOrder();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => setMessage(""), 3000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const downloadPdf = async () => {
    try {
      setWorking(true);
      const response = await api.get(`/purchase-orders/${id}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `purchase-order-${order.order_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (requestError) {
      console.error(requestError);
      setError("Unable to download the PDF.");
    } finally {
      setWorking(false);
    }
  };

  const cancelOrder = async () => {
    if (!window.confirm(`Cancel ${order.order_number}?`)) return;

    try {
      setWorking(true);
      await api.patch(`/purchase-orders/${id}/cancel`);
      setMessage("Purchase order cancelled successfully.");
      await loadOrder();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          "Unable to cancel purchase order.",
      );
    } finally {
      setWorking(false);
    }
  };

  if (loading)
    return <p className="p-6 text-slate-500">Loading purchase order...</p>;

  if (!order) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-red-600">{error || "Purchase order not found."}</p>
        <button onClick={() => navigate(-1)} className="text-blue-600">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            to="/admin/purchase-orders"
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft size={17} /> Purchase orders
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              {order.order_number}
            </h1>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClasses[order.status] ?? statusClasses.draft}`}
            >
              {order.status?.replaceAll("_", " ")}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {order.status === "draft" && (
            <Link
              to={`/admin/purchase-orders/${order.id}/edit`}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              <FilePenLine size={17} /> Edit
            </Link>
          )}

          <button
            type="button"
            onClick={downloadPdf}
            disabled={working}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <Download size={17} /> Download PDF
          </button>

          {["draft", "ordered"].includes(order.status) && (
            <button
              type="button"
              onClick={cancelOrder}
              disabled={working}
              className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              <XCircle size={17} /> Cancel
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          icon={Building2}
          label="Supplier"
          value={order.supplier?.name ?? "-"}
          detail={order.supplier?.code}
        />
        <InfoCard
          icon={MapPin}
          label="Destination"
          value={order.location?.name ?? "-"}
          detail={order.location?.code}
        />
        <InfoCard
          icon={CalendarDays}
          label="Order date"
          value={order.order_date}
          detail={
            order.expected_date
              ? `Expected: ${order.expected_date}`
              : "No expected date"
          }
        />
        <InfoCard
          icon={UserRound}
          label="Created by"
          value={order.created_by?.name ?? order.createdBy?.name ?? "-"}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="font-bold text-slate-900">Ordered products</h2>
          <p className="text-sm text-slate-500">
            {order.items?.length ?? 0} product lines
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Quantity</th>
                <th className="px-5 py-4">Unit price HT</th>
                <th className="px-5 py-4">TVA</th>
                <th className="px-5 py-4 text-right">Total TTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items?.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">
                      {item.product?.name ?? "Deleted product"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.product?.reference ?? ""}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {Number(item.quantity)} {item.product?.unit ?? ""}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {formatMoney(item.unit_price_ht)}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {Number(item.tax_rate)}%
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-slate-900">
                    {formatMoney(item.line_total_ttc)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-5">
          <div className="w-full max-w-sm space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal HT</span>
              <strong className="text-slate-900">
                {formatMoney(order.subtotal_ht)}
              </strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>TVA</span>
              <strong className="text-slate-900">
                {formatMoney(order.tax_amount)}
              </strong>
            </div>
            <div className="flex justify-between border-t border-slate-300 pt-3 text-lg font-bold text-blue-700">
              <span>Total TTC</span>
              <span>{formatMoney(order.total_ttc)}</span>
            </div>
          </div>
        </div>
      </div>

      {order.notes && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 font-bold text-slate-900">Notes</h2>
          <p className="whitespace-pre-wrap text-sm text-slate-600">
            {order.notes}
          </p>
        </div>
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-slate-400">
        <Icon size={18} />
        <span className="text-xs font-bold uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="font-semibold text-slate-900">{value}</p>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </div>
  );
}

export default PurchaseOrderDetails;
