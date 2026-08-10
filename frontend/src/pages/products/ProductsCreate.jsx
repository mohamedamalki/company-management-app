import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import ProductForm from "../../components/products/ProductForm";

const getErrorMessage = (error, fallback) => {
  const validationErrors = error.response?.data?.errors;

  return validationErrors
    ? Object.values(validationErrors).flat()[0]
    : (error.response?.data?.message ?? fallback);
};

function ProductsCreate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (formData) => {
    try {
      setSaving(true);
      setError("");

      await api.post("/products", formData);

      navigate("/app/products", {
        replace: true,
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to create product."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create product
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Add a product and assign its category and brand. Pricing is managed
            separately.
          </p>
        </div>

        <ProductForm
          onSubmit={handleCreate}
          saving={saving}
          error={error}
          submitText="Create product"
        />
      </div>
    </main>
  );
}

export default ProductsCreate;
