import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import CategoryForm from "../../components/categories/CategoryForm";

function CategoriesCreate() {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleCreate = async (formData) => {
        try {
            setSaving(true);
            setError("");

            await api.post("/categories", formData);

            navigate("/app/categories");
        } catch (error) {
            const errors = error.response?.data?.errors;

            setError(
                errors
                    ? Object.values(errors).flat()[0]
                    : error.response?.data?.message ??
                          "Unable to create category."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
            <div className="mx-auto max-w-4xl">
                <CategoryForm
                    key="create-category"
                    onSubmit={handleCreate}
                    saving={saving}
                    error={error}
                    submitText="Create category"
                />
            </div>
        </div>
    );
}

export default CategoriesCreate;
