import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import ProductPriceForm from "../../components/productPrices/ProductPriceForm";

const getErrorMessage = (error, fallback) => {
  const validationErrors = error.response?.data?.errors;

  return validationErrors
    ? Object.values(validationErrors).flat()[0]
    : (error.response?.data?.message ?? fallback);
};

function ProductPricesUpdate() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [productPrice, setProductPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProductPrice = async () => {
      try {
        const response = await api.get(`/product-prices/${id}`);

        const data =
          response.data.data ?? response.data.product_price ?? response.data;

        if (!cancelled) {
          setProductPrice(data);
        }
      } catch (requestError) {
        console.error("Unable to load product price:", requestError);

        if (!cancelled) {
          setError(
            getErrorMessage(requestError, "Unable to load product price."),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProductPrice();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleUpdate = async (formData) => {
    try {
      setSaving(true);
      setError("");

      await api.patch(`/product-prices/${id}`, formData);

      navigate("/app/product-prices", {
        replace: true,
        state: {
          success: "Product price updated successfully.",
        },
      });
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, "Unable to update product price."),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center gap-3 p-6">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
        <span className="text-sm text-slate-500">Loading product price...</span>
      </div>
    );
  }

  if (!productPrice) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "Product price not found."}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Correct product price
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Use this page only to correct an input mistake. Create a new price
            for a real price change.
          </p>
        </div>

        <ProductPriceForm
          initialData={productPrice}
          onSubmit={handleUpdate}
          saving={saving}
          error={error}
          submitText="Update price"
        />
      </div>
    </main>
  );
}

export default ProductPricesUpdate;
