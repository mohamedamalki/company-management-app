import { useEffect, useState } from "react";
import {
    useNavigate,
    useParams,
} from "react-router-dom";
import api from "../../api/axios";
import LocationForm from "../../components/locations/LocationForm";

function LocationsUpdate() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [location, setLocation] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    useEffect(() => {
        let cancelled = false;

        const loadLocation = async () => {
            try {
                const response = await api.get(
                    `/locations/${id}`
                );

                const data =
                    response.data.data ??
                    response.data.location ??
                    response.data;

                if (!cancelled) {
                    setLocation(data);
                }
            } catch (error) {
                console.error(
                    "Unable to load location:",
                    error
                );

                if (!cancelled) {
                    setError(
                        error.response?.data
                            ?.message ??
                            "Unable to load location."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadLocation();

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
                `/locations/${id}`,
                formData
            );

            navigate("/admin/locations", {
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
                    : error.response?.data?.message ??
                          "Unable to update location."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[300px] items-center justify-center p-6">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />

                    Loading location...
                </div>
            </div>
        );
    }

    if (!location) {
        return (
            <div className="p-6">
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error || "Location not found."}
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-5xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Update location
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Update the location information
                        and type.
                    </p>
                </div>

                <LocationForm
                    initialData={location}
                    onSubmit={handleUpdate}
                    saving={saving}
                    error={error}
                    submitText="Update location"
                />
            </div>
        </main>
    );
}

export default LocationsUpdate;
