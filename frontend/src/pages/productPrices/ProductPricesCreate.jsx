import { useState } from "react";
import {
    useNavigate,
    useSearchParams,
} from "react-router-dom";
import api from "../../api/axios";
import ProductPriceForm from "../../components/productPrices/ProductPriceForm";

function ProductPricesCreate() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const selectedProductId =
        searchParams.get("product_id") ?? "";

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleCreate = async (formData) => {
        try {
            setSaving(true);
            setError("");

            await api.post(
                "/product-prices",
                formData
            );

            navigate("/app/product-prices", {
                replace: true,
                state: {
                    success:
                        "Product price created successfully.",
                },
            });
        } catch (requestError) {
            const errors =
                requestError.response?.data?.errors;

            setError(
                errors
                    ? Object.values(errors).flat()[0]
                    : requestError.response?.data
                          ?.message ??
                          "Unable to create product price."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 p-6">
            <div className="mx-auto max-w-5xl">
                <ProductPriceForm
                    initialData={{
                        product_id:
                            selectedProductId,
                    }}
                    onSubmit={handleCreate}
                    saving={saving}
                    error={error}
                    submitText="Create price"
                />
            </div>
        </main>
    );
}

export default ProductPricesCreate;
