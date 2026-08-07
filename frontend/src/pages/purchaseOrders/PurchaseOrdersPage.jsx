import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ClipboardList,
  Download,
  Eye,
  FilePenLine,
  Plus,
  XCircle,
  CheckCircle2
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

const statusLabel = (status) => status?.replaceAll("_", " ") ?? "-";

async function requestOrders(page, status) {
  const response = await api.get("/purchase-orders", {
    params: {
      page,
      ...(status ? { status } : {}),
    },
  });

  return response.data;
}

function PurchaseOrdersPage() {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(location.state?.message ?? "");
  const [workingId, setWorkingId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadOrders = async () => {
      try {
        const body = await requestOrders(page, status);

        if (!cancelled) {
          setOrders(Array.isArray(body.data) ? body.data : []);
          setMeta(body);
        }
      } catch (requestError) {
        console.error(requestError);

        if (!cancelled) {
          setError("Unable to load purchase orders.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [page, status]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => setMessage(""), 3000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const downloadPdf = async (order) => {
    try {
      setWorkingId(order.id);

      const response = await api.get(`/purchase-orders/${order.id}/pdf`, {
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
    }  catch (error) {
    console.error(error);

    let message =
        "Unable to download the purchase order PDF.";

    const responseData = error.response?.data;

    if (responseData instanceof Blob) {
        const text = await responseData.text();

        try {
            const json = JSON.parse(text);

            message =
                json.message ??
                message;

            console.error("Laravel PDF error:", json);
        } catch {
            console.error("Laravel PDF error:", text);
        }
    }

    setError(message);
} finally {
    setWorkingId(null);
}
  };

  const cancelOrder = async (order) => {
    const confirmed = window.confirm(
      `Cancel purchase order ${order.order_number}?`,
    );
    if (!confirmed) return;

    try {
      setWorkingId(order.id);
      setError("");
      await api.patch(`/purchase-orders/${order.id}/cancel`);

      const body = await requestOrders(page, status);

      setOrders(Array.isArray(body.data) ? body.data : []);
      setMeta(body);
      setMessage("Purchase order cancelled successfully.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          "Unable to cancel purchase order.",
      );
    } finally {
      setWorkingId(null);
    }
  };

    const confirmOrder = async (order) => {
    const confirmed = window.confirm(
        `Confirm purchase order ${order.order_number}?`
    );

    if (!confirmed) {
        return;
    }

    try {
        setWorkingId(order.id);
        setError("");

        await api.patch(
            `/purchase-orders/${order.id}/confirm`
        );

        setOrders((currentOrders) =>
            currentOrders.map((currentOrder) =>
                currentOrder.id === order.id
                    ? {
                          ...currentOrder,
                          status: "ordered",
                      }
                    : currentOrder
            )
        );

        setMessage(
            "Purchase order confirmed successfully."
        );
    } catch (error) {
        setError(
            error.response?.data?.message ??
                "Unable to confirm purchase order."
        );
    } finally {
        setWorkingId(null);
    }
};

  const handleStatusFilter = (event) => {
    setLoading(true);
    setError("");
    setStatus(event.target.value);
    setPage(1);
  };

  const changePage = (newPage) => {
    setLoading(true);
    setError("");
    setPage(newPage);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-slate-900 p-3 text-white">
            <ClipboardList size={25} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Purchase orders
            </h1>
            <p className="text-sm text-slate-500">
              Track every order placed with your suppliers.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={status}
            onChange={handleStatusFilter}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="ordered">Ordered</option>
            <option value="partially_received">Partially received</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <Link
            to="/admin/purchase-orders/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            <Plus size={18} /> Create order
          </Link>
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

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Order</th>
                <th className="px-5 py-4">Supplier</th>
                <th className="px-5 py-4">Destination</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Total TTC</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    Loading purchase orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    No purchase orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {order.order_number}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {order.supplier?.name ?? "-"}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {order.location?.name ?? "-"}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {order.order_date}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {formatMoney(order.total_ttc)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[order.status] ?? "bg-slate-100 text-slate-700"}`}
                      >
                        {statusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/purchase-orders/${order.id}`}
                          title="View order"
                          className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
                        >
                          <Eye size={17} />
                        </Link>

{order.status === "draft" && (
    <>
        <Link
            to={`/admin/purchase-orders/${order.id}/edit`}
            title="Edit order"
            className="rounded-lg bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"
        >
            <FilePenLine size={17} />
        </Link>

        <button
            type="button"
            onClick={() => confirmOrder(order)}
            disabled={workingId === order.id}
            title="Confirm order"
            className="rounded-lg bg-green-50 p-2 text-green-700 hover:bg-green-100 disabled:opacity-50"
        >
            <CheckCircle2 size={17} />
        </button>
    </>
)}

                        <button
                          type="button"
                          onClick={() => downloadPdf(order)}
                          disabled={workingId === order.id}
                          title="Download PDF"
                          className="rounded-lg bg-red-50 p-2 text-red-700 hover:bg-red-100 disabled:opacity-40"
                        >
                          <Download size={17} />
                        </button>

                        {["draft", "ordered"].includes(order.status) && (
                          <button
                            type="button"
                            onClick={() => cancelOrder(order)}
                            disabled={workingId === order.id}
                            title="Cancel order"
                            className="rounded-lg bg-amber-50 p-2 text-amber-700 hover:bg-amber-100 disabled:opacity-40"
                          >
                            <XCircle size={17} />
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

        {meta && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm">
            <span className="text-slate-500">
              {meta.total ?? orders.length} orders
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={!meta.prev_page_url}
                onClick={() => changePage(page - 1)}
                className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
              >
                Previous
              </button>
              <span>
                Page {meta.current_page ?? 1} of {meta.last_page ?? 1}
              </span>
              <button
                type="button"
                disabled={!meta.next_page_url}
                onClick={() => changePage(page + 1)}
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

export default PurchaseOrdersPage;
