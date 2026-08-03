import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import CategoryForm from "../../components/categories/CategoryForm";

function CategoriesUpdate() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadCategory = async () => {
            try {
                const response = await api.get(
                    `/categories/${id}`
                );

                const data =
                    response.data.data ??
                    response.data.category ??
                    response.data;

                if (!cancelled) {
                    setCategory(data);
                }
            } catch (error) {
                console.error(error);

                if (!cancelled) {
                    setError(
                        "Unable to load category."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadCategory();

        return () => {
            cancelled = true;
        };
    }, [id]);

    const handleUpdate = async (formData) => {
        try {
            setSaving(true);
            setError("");

            await api.patch(
                `/categories/${id}`,
                formData
            );

            navigate("/admin/categories");
        } catch (error) {
            const errors = error.response?.data?.errors;

            setError(
                errors
                    ? Object.values(errors).flat()[0]
                    : error.response?.data?.message ??
                          "Unable to update category."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <p className="p-8">Loading category...</p>;
    }

    if (!category) {
        return (
            <p className="p-8 text-red-600">
                Category not found.
            </p>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
            <div className="mx-auto max-w-4xl">
                <CategoryForm
                    key={`update-category-${category.id}`}
                    initialData={category}
                    onSubmit={handleUpdate}
                    saving={saving}
                    error={error}
                    submitText="Update category"
                />
            </div>
        </div>
    );
}

export default CategoriesUpdate;
