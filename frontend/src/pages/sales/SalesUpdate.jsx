import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import SaleForm from "../../components/sales/SaleForm";

function getApiError(error, fallback) {
  const errors = error.response?.data?.errors;

  return errors
    ? Object.values(errors).flat().at(0)
    : (error.response?.data?.message ?? fallback);
}

function SalesUpdate() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadSale = async () => {
      try {
        setError("");

        const response = await api.get(`/sales/${id}`);

        if (!cancelled) {
          setSale(response.data.data ?? null);
        }
      } catch (requestError) {
        console.error(requestError);

        if (!cancelled) {
          setError(getApiError(requestError, "Unable to load sale."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSale();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleUpdate = async (data) => {
    try {
      setSaving(true);
      setError("");

      const response = await api.put(`/sales/${id}`, data);

      navigate(`/app/sales/${id}`, {
        replace: true,
        state: {
          message: response.data.message ?? "Sale updated successfully.",
        },
      });
    } catch (requestError) {
      console.error(requestError);

      setError(getApiError(requestError, "Unable to update sale."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <Loader2 className="animate-spin text-blue-600" size={22} />
          Loading sale...
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
        {error || "Sale not found."}
      </div>
    );
  }

  if (sale.status !== "draft") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-lg font-bold text-amber-800">
          This sale cannot be edited
        </h1>

        <p className="mt-2 text-sm text-amber-700">
          Only draft sales can be updated. Confirmed sales have already changed
          the stock and must be corrected using a return or correction feature.
        </p>

        <Link
          to={`/app/sales/${sale.id}`}
          className="mt-4 inline-flex rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Return to sale
        </Link>
      </div>
    );
  }

  return (
    <SaleForm
      key={sale.id}
      initialData={sale}
      onSubmit={handleUpdate}
      saving={saving}
      error={error}
      submitText="Update sale"
    />
  );
}

export default SalesUpdate;
