import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import StockMovementForm from "../../components/stockMovements/StockMovementForm";

function getErrorMessage(error) {
  const errors = error.response?.data?.errors;

  if (errors) {
    return Object.values(errors).flat()[0];
  }

  return error.response?.data?.message ?? "Unable to record stock movement.";
}

function StockMovementsCreate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (formData) => {
    try {
      setSaving(true);
      setError("");

      await api.post("/stock-movements", formData);

      navigate("/app/stock-movements", {
        replace: true,
        state: {
          message: "Stock movement recorded successfully.",
        },
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Record stock movement
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter an opening quantity or correct the physical stock balance.
        </p>
      </div>

      <StockMovementForm
        onSubmit={handleCreate}
        saving={saving}
        error={error}
      />
    </div>
  );
}

export default StockMovementsCreate;
