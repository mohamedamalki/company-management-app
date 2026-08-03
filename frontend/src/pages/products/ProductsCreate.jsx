import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import ProductForm from "../../components/products/ProductForm";

function ProductsCreate() {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleCreate = async (formData) => {
        try {
            setSaving(true);
            setError("");

            await api.post("/products", formData);

            navigate("/admin/products");
        } catch (error) {
            const errors = error.response?.data?.errors;

            setError(
                errors
                    ? Object.values(errors).flat()[0]
                    : error.response?.data?.message ??
                          "Unable to create product."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
            <div className="mx-auto max-w-5xl">
                <ProductForm
                    key="create-product"
                    onSubmit={handleCreate}
                    saving={saving}
                    error={error}
                    submitText="Create product"
                />
            </div>
        </div>
    );
}

export default ProductsCreate;
