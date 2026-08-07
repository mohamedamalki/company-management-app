import { ArrowLeft, BadgePercent, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import TaxRateForm from "../../components/taxRates/TaxRateForm";

function getErrorMessage(error, fallback) {
  const validationErrors = error.response?.data?.errors;

  if (validationErrors) {
    return Object.values(validationErrors).flat()[0];
  }

  return error.response?.data?.message ?? fallback;
}

function TaxRatesUpdate() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [taxRate, setTaxRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadTaxRate = async () => {
      try {
        const response = await api.get(`/tax-rates/${id}`);
        const data =
          response.data.data ?? response.data.tax_rate ?? response.data;

        if (!cancelled) {
          setTaxRate(data);
        }
      } catch (error) {
        if (!cancelled) {
          setError(getErrorMessage(error, "Unable to load the TVA rate."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadTaxRate();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleUpdate = async (formData) => {
    try {
      setSaving(true);
      setError("");

      const response = await api.patch(`/tax-rates/${id}`, formData);

      navigate("/admin/tax-rates", {
        replace: true,
        state: {
          success: response.data?.message ?? "TVA rate updated successfully.",
        },
      });
    } catch (error) {
      setError(getErrorMessage(error, "Unable to update the TVA rate."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 size={28} className="mx-auto animate-spin text-blue-600" />
          <p className="mt-3 text-sm text-slate-500">Loading TVA rate...</p>
        </div>
      </div>
    );
  }

  if (!taxRate) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error || "TVA rate not found."}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <Link
            to="/admin/tax-rates"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to TVA rates
          </Link>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
              <BadgePercent size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Update TVA rate
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Change the rate information or availability.
              </p>
            </div>
          </div>
        </div>

        <TaxRateForm
          initialData={taxRate}
          onSubmit={handleUpdate}
          saving={saving}
          error={error}
          submitText="Update TVA rate"
        />
      </div>
    </main>
  );
}

export default TaxRatesUpdate;
