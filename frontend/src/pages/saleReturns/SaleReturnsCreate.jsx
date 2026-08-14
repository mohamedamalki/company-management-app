import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import SaleReturnForm from "../../components/saleReturns/SaleReturnForm";

function apiError(error, fallback) {
  const errors = error.response?.data?.errors;

  return errors
    ? Object.values(errors).flat().at(0)
    : (error.response?.data?.message ?? fallback);
}

function SaleReturnsCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const saleId = searchParams.get("sale_id") ?? "";

  const handleCreate = async (data) => {
    try {
      setSaving(true);
      setError("");

      const response = await api.post("/sale-returns", data);
      const saleReturn = response.data.data;

      navigate(`/app/sale-returns/${saleReturn.id}`, {
        state: {
          message: response.data.message ?? "Sale return created successfully.",
        },
      });
    } catch (requestError) {
      setError(apiError(requestError, "Unable to create the sale return."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SaleReturnForm
      key={saleId || "new-return"}
      initialData={saleId ? { sale_id: saleId } : null}
      onSubmit={handleCreate}
      saving={saving}
      error={error}
      submitText="Create return"
    />
  );
}

export default SaleReturnsCreate;
