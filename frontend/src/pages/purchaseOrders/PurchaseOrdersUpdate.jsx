import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import PurchaseOrderForm from "../../components/purchaseOrders/PurchaseOrderForm";

function PurchaseOrdersUpdate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadOrder = async () => {
      try {
        const response = await api.get(`/purchase-orders/${id}`);
        const data = response.data.data ?? response.data;

        if (!cancelled) setOrder(data);
      } catch (requestError) {
        console.error(requestError);
        if (!cancelled) setError("Unable to load purchase order.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadOrder();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleUpdate = async (formData) => {
    try {
      setSaving(true);
      setError("");

      await api.put(`/purchase-orders/${id}`, formData);
      navigate(`/app/purchase-orders/${id}`, {
        replace: true,
        state: { message: "Purchase order updated successfully." },
      });
    } catch (requestError) {
      const errors = requestError.response?.data?.errors;
      setError(
        errors
          ? Object.values(errors).flat()[0]
          : (requestError.response?.data?.message ??
              "Unable to update purchase order."),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <p className="p-6 text-slate-500">Loading purchase order...</p>;

  if (!order) {
    return <p className="p-6 text-red-600">Purchase order not found.</p>;
  }

  if (order.status !== "draft") {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          Only draft purchase orders can be updated.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Update {order.order_number}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Modify this draft order before it is sent to the supplier.
        </p>
      </div>

      <PurchaseOrderForm
        key={order.id}
        initialData={order}
        onSubmit={handleUpdate}
        saving={saving}
        error={error}
        submitText="Update order"
      />
    </div>
  );
}

export default PurchaseOrdersUpdate;
