import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import FournisseurForm from "../../components/fournisseurs/FournisseurForm";

function FournisseursCreate() {
    const navigate = useNavigate();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleCreate = async (data) => {
        try {
            setSaving(true);
            setError("");

            const response = await api.post(
                "/fournisseurs",
                data
            );

            navigate(
                `/app/fournisseurs/${response.data.data.id}`,
                {
                    state: {
                        message:
                            "Fournisseur created successfully.",
                    },
                }
            );
        } catch (requestError) {
            const errors =
                requestError.response?.data?.errors;

            setError(
                errors
                    ? Object.values(errors)
                          .flat()
                          .at(0)
                    : requestError.response?.data
                          ?.message ??
                          "Unable to create fournisseur."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <FournisseurForm
            onSubmit={handleCreate}
            saving={saving}
            error={error}
            submitText="Create fournisseur"
        />
    );
}

export default FournisseursCreate;
