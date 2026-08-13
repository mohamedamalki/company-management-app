import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import SaleForm from "../../components/sales/SaleForm";

function getApiError(error, fallback) {
  const errors = error.response?.data?.errors;

  return errors
    ? Object.values(errors).flat().at(0)
    : (error.response?.data?.message ?? fallback);
}

function SalesCreate() {
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (data) => {
    try {
      setSaving(true);
      setError("");

      /*
       * Laravel now performs the complete checkout in one transaction:
       * create sale, calculate totals, subtract stock and record payment.
       */
      const response = await api.post("/sales", data);

      const createdSale = response.data.data;

      if (!createdSale?.id) {
        throw new Error("The API did not return the created sale.");
      }

      navigate(`/app/sales/${createdSale.id}`, {
        replace: true,
        state: {
          message: response.data.message ?? "Sale completed successfully.",
        },
      });
    } catch (requestError) {
      console.error(requestError);

      setError(getApiError(requestError, "Unable to complete sale."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SaleForm
      onSubmit={handleCreate}
      saving={saving}
      error={error}
      submitText="Complete sale"
    />
  );
}

export default SalesCreate;
