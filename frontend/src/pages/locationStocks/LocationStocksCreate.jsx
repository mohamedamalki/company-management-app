import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import LocationStockForm from "../../components/locationStocks/LocationStockForm";

function getErrorMessage(error) {
  const errors = error.response?.data?.errors;

  if (errors) {
    return Object.values(errors).flat()[0];
  }

  return (
    error.response?.data?.message ?? "Unable to initialize location stock."
  );
}

function LocationStocksCreate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (formData) => {
    try {
      setSaving(true);
      setError("");

      await api.post("/location-stocks", formData);

      navigate("/app/location-stocks", {
        replace: true,
        state: {
          message: "Location stock initialized successfully.",
        },
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Initialize stock
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Add a product to one of the locations you can manage.
        </p>
      </div>

      <LocationStockForm
        onSubmit={handleCreate}
        saving={saving}
        error={error}
      />
    </div>
  );
}

export default LocationStocksCreate;
