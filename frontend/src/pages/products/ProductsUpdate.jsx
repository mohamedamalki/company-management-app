import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import ProductForm from "../../components/products/ProductForm";

const getErrorMessage = (error, fallback) => {
  const validationErrors = error.response?.data?.errors;

  return validationErrors
    ? Object.values(validationErrors).flat()[0]
    : (error.response?.data?.message ?? fallback);
};

function ProductsUpdate() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);

        const data =
          response.data.data ?? response.data.product ?? response.data;

        if (!cancelled) {
          setProduct(data);
        }
      } catch (requestError) {
        console.error("Unable to load product:", requestError);

        if (!cancelled) {
          setError(getErrorMessage(requestError, "Unable to load product."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleUpdate = async (formData) => {
    try {
      setSaving(true);
      setError("");

      await api.put(`/products/${id}`, formData);

      navigate("/app/products", {
        replace: true,
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to update product."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center gap-3 p-6">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
        <span className="text-sm text-slate-500">Loading product...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "Product not found."}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Update product
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Update the product identification, category and brand information.
          </p>
        </div>

        <ProductForm
          initialData={product}
          onSubmit={handleUpdate}
          saving={saving}
          error={error}
          submitText="Update product"
        />
      </div>
    </main>
  );
}

export default ProductsUpdate;
