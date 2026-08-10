import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import SupplierForm from "../../components/suppliers/SupplierForm";

function firstApiError(error, fallback) {
  const errors = error.response?.data?.errors;
  return errors
    ? Object.values(errors).flat()[0]
    : (error.response?.data?.message ?? fallback);
}

function SuppliersCreate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (formData) => {
    try {
      setSaving(true);
      setError("");

      await api.post("/suppliers", formData);
      navigate("/app/suppliers", {
        replace: true,
        state: { message: "Supplier created successfully." },
      });
    } catch (requestError) {
      setError(firstApiError(requestError, "Unable to create supplier."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create supplier</h1>
        <p className="mt-1 text-sm text-slate-500">
          Add a company from which products can be purchased.
        </p>
      </div>

      <SupplierForm
        onSubmit={handleCreate}
        saving={saving}
        error={error}
        submitText="Create supplier"
      />
    </div>
  );
}

export default SuppliersCreate;
