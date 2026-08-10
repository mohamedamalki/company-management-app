import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import BrandForm from "../../components/brands/BrandForm";

function BrandsCreate() {
    const navigate = useNavigate();

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const handleCreate = async (
        formData
    ) => {
        try {
            setSaving(true);
            setError("");

            await api.post(
                "/brands",
                formData
            );

            navigate("/app/brands", {
                replace: true,
            });
        } catch (error) {
            const validationErrors =
                error.response?.data?.errors;

            setError(
                validationErrors
                    ? Object.values(
                          validationErrors
                      ).flat()[0]
                    : error.response?.data
                          ?.message ??
                          "Unable to create brand."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-4xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Create brand
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Add a new product brand.
                    </p>
                </div>

                <BrandForm
                    onSubmit={handleCreate}
                    saving={saving}
                    error={error}
                    submitText="Create brand"
                />
            </div>
        </main>
    );
}

export default BrandsCreate;
