import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import PurchaseOrderForm from "../../components/purchaseOrders/PurchaseOrderForm";

function PurchaseOrdersCreate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (formData) => {
    try {
      setSaving(true);
      setError("");

      const response = await api.post("/purchase-orders", formData);
      const order = response.data.data ?? response.data;

      navigate(`/app/purchase-orders/${order.id}`, {
        replace: true,
        state: { message: "Purchase order created successfully." },
      });
    } catch (requestError) {
      const errors = requestError.response?.data?.errors;
      setError(
        errors
          ? Object.values(errors).flat()[0]
          : (requestError.response?.data?.message ??
              "Unable to create purchase order."),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Create purchase order
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Prepare an order to purchase products from a supplier.
        </p>
      </div>

      <PurchaseOrderForm
        onSubmit={handleCreate}
        saving={saving}
        error={error}
        submitText="Create order"
      />
    </div>
  );
}

export default PurchaseOrdersCreate;
