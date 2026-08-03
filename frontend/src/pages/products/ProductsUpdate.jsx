import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import ProductForm from "../../components/products/ProductForm";

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
                const response = await api.get(
                    `/products/${id}`
                );

                const data =
                    response.data.data ??
                    response.data.product ??
                    response.data;

                if (!cancelled) {
                    setProduct(data);
                }
            } catch (error) {
                console.error(error);

                if (!cancelled) {
                    setError(
                        "Unable to load product."
                    );
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

            await api.patch(
                `/products/${id}`,
                formData
            );

            navigate("/admin/products");
        } catch (error) {
            const errors = error.response?.data?.errors;

            setError(
                errors
                    ? Object.values(errors).flat()[0]
                    : error.response?.data?.message ??
                          "Unable to update product."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <p className="p-8">Loading product...</p>;
    }

    if (!product) {
        return (
            <p className="p-8 text-red-600">
                Product not found.
            </p>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
            <div className="mx-auto max-w-5xl">
                <ProductForm
                    key={`update-product-${product.id}`}
                    initialData={product}
                    onSubmit={handleUpdate}
                    saving={saving}
                    error={error}
                    submitText="Update product"
                />
            </div>
        </div>
    );
}

export default ProductsUpdate;
