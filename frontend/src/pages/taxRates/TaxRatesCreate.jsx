import { ArrowLeft, BadgePercent } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import TaxRateForm from "../../components/taxRates/TaxRateForm";

function getErrorMessage(error) {
  const validationErrors = error.response?.data?.errors;

  if (validationErrors) {
    return Object.values(validationErrors).flat()[0];
  }

  return error.response?.data?.message ?? "Unable to create the TVA rate.";
}

function TaxRatesCreate() {
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (formData) => {
    try {
      setSaving(true);
      setError("");

      const response = await api.post("/tax-rates", formData);

      navigate("/admin/tax-rates", {
        replace: true,
        state: {
          success: response.data?.message ?? "TVA rate created successfully.",
        },
      });
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

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
                Create TVA rate
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Add a tax rate that can be assigned to products.
              </p>
            </div>
          </div>
        </div>

        <TaxRateForm
          onSubmit={handleCreate}
          saving={saving}
          error={error}
          submitText="Create TVA rate"
        />
      </div>
    </main>
  );
}

export default TaxRatesCreate;
