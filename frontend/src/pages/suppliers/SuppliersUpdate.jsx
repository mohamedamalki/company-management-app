import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import SupplierForm from "../../components/suppliers/SupplierForm";

function SuppliersUpdate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadSupplier = async () => {
      try {
        const response = await api.get(`/suppliers/${id}`);
        if (!cancelled) {
          setSupplier(response.data.data ?? response.data);
        }
      } catch (requestError) {
        console.error(requestError);
        if (!cancelled) setError("Unable to load supplier.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadSupplier();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleUpdate = async (formData) => {
    try {
      setSaving(true);
      setError("");

      await api.put(`/suppliers/${id}`, formData);
      navigate("/admin/suppliers", {
        replace: true,
        state: { message: "Supplier updated successfully." },
      });
    } catch (requestError) {
      const errors = requestError.response?.data?.errors;
      setError(
        errors
          ? Object.values(errors).flat()[0]
          : (requestError.response?.data?.message ??
              "Unable to update supplier."),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-6 text-slate-500">Loading supplier...</p>;

  if (!supplier) {
    return <p className="p-6 text-red-600">Supplier not found.</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Update supplier</h1>
        <p className="mt-1 text-sm text-slate-500">
          Modify the supplier company and contact information.
        </p>
      </div>

      <SupplierForm
        key={supplier.id}
        initialData={supplier}
        onSubmit={handleUpdate}
        saving={saving}
        error={error}
        submitText="Update supplier"
      />
    </div>
  );
}

export default SuppliersUpdate;
