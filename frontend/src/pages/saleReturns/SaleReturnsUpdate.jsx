import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import SaleReturnForm from "../../components/saleReturns/SaleReturnForm";

function apiError(error, fallback) {
  const errors = error.response?.data?.errors;

  return errors
    ? Object.values(errors).flat().at(0)
    : (error.response?.data?.message ?? fallback);
}

function SaleReturnsUpdate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [saleReturn, setSaleReturn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    api
      .get(`/sale-returns/${id}`)
      .then((response) => {
        if (!cancelled) {
          setSaleReturn(response.data.data);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(apiError(requestError, "Unable to load the sale return."));
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
  }, [id]);

  const handleUpdate = async (data) => {
    try {
      setSaving(true);
      setError("");

      const response = await api.put(`/sale-returns/${id}`, data);

      navigate(`/app/sale-returns/${id}`, {
        state: {
          message: response.data.message ?? "Sale return updated successfully.",
        },
      });
    } catch (requestError) {
      setError(apiError(requestError, "Unable to update the sale return."));
    } finally {
      setSaving(false);
    }
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

  if (saleReturn.status !== "draft") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-700">
        Only draft sale returns can be updated.
      </div>
    );
  }

  return (
    <SaleReturnForm
      key={saleReturn.id}
      initialData={saleReturn}
      onSubmit={handleUpdate}
      saving={saving}
      error={error}
      submitText="Update return"
    />
  );
}

export default SaleReturnsUpdate;
