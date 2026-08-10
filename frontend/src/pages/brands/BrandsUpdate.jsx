import {
    useEffect,
    useState,
} from "react";
import {
    useNavigate,
    useParams,
} from "react-router-dom";
import api from "../../api/axios";
import BrandForm from "../../components/brands/BrandForm";

function BrandsUpdate() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [brand, setBrand] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    useEffect(() => {
        let cancelled = false;

        const loadBrand = async () => {
            try {
                const response =
                    await api.get(
                        `/brands/${id}`
                    );

                const data =
                    response.data.data ??
                    response.data.brand ??
                    response.data;

                if (!cancelled) {
                    setBrand(data);
                }
            } catch (error) {
                console.error(
                    "Unable to load brand:",
                    error
                );

                if (!cancelled) {
                    setError(
                        error.response?.data
                            ?.message ??
                            "Unable to load brand."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadBrand();

        return () => {
            cancelled = true;
        };
    }, [id]);

    const handleUpdate = async (
        formData
    ) => {
        try {
            setSaving(true);
            setError("");

            await api.put(
                `/brands/${id}`,
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
                          "Unable to update brand."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-72 items-center justify-center">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />

                <span className="ml-3 text-sm text-slate-500">
                    Loading brand...
                </span>
            </div>
        );
    }

    if (!brand) {
        return (
            <div className="p-6">
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                    {error ||
                        "Brand not found."}
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-4xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Update brand
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Update the brand information.
                    </p>
                </div>

                <BrandForm
                    initialData={brand}
                    onSubmit={handleUpdate}
                    saving={saving}
                    error={error}
                    submitText="Update brand"
                />
            </div>
        </main>
    );
}

export default BrandsUpdate;
