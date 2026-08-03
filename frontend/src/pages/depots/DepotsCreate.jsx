import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import DepotForm from "../../components/depots/DepotForm";

function DepotsCreate() {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleCreate = async (formData) => {
        try {
            setSaving(true);
            setError("");

            await api.post("/depots", formData);

            navigate("/admin/depots");
        } catch (error) {
            const errors = error.response?.data?.errors;

            setError(
                errors
                    ? Object.values(errors).flat()[0]
                    : error.response?.data?.message ??
                          "Unable to create depot."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 p-6">
            <h1 className="text-2xl font-bold">
                Create depot
            </h1>

            <DepotForm
                onSubmit={handleCreate}
                saving={saving}
                error={error}
                submitText="Create depot"
            />
        </div>
    );
}

export default DepotsCreate;
