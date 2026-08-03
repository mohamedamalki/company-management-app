import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import DepotForm from "../../components/depots/DepotForm";

function DepotsUpdate() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [depot, setDepot] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadDepot = async () => {
            try {
                const response = await api.get(`/depots/${id}`);

                const data =
                    response.data.data ??
                    response.data.depot ??
                    response.data;

                if (!cancelled) {
                    setDepot(data);
                }
            } catch (error) {
                console.error(error);

                if (!cancelled) {
                    setError("Unable to load depot.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadDepot();

        return () => {
            cancelled = true;
        };
    }, [id]);

    const handleUpdate = async (formData) => {
        try {
            setSaving(true);
            setError("");

            await api.put(`/depots/${id}`, formData);

            navigate("/admin/depots");
        } catch (error) {
            const errors = error.response?.data?.errors;

            setError(
                errors
                    ? Object.values(errors).flat()[0]
                    : error.response?.data?.message ??
                          "Unable to update depot."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <p className="p-6">Loading depot...</p>;
    }

    if (!depot) {
        return (
            <p className="p-6 text-red-600">
                Depot not found.
            </p>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <h1 className="text-2xl font-bold">
                Update depot
            </h1>

            <DepotForm
                initialData={depot}
                onSubmit={handleUpdate}
                saving={saving}
                error={error}
                submitText="Update depot"
            />
        </div>
    );
}

export default DepotsUpdate;
