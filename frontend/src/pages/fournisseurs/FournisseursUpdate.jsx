import { useEffect, useState } from "react";
import {
    useNavigate,
    useParams,
} from "react-router-dom";
import api from "../../api/axios";
import FournisseurForm from "../../components/fournisseurs/FournisseurForm";

function FournisseursUpdate() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [fournisseur, setFournisseur] =
        useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        api.get(`/fournisseurs/${id}`)
            .then((response) => {
                if (!cancelled) {
                    setFournisseur(
                        response.data.data.fournisseur
                    );
                }
            })
            .catch((requestError) => {
                console.error(requestError);

                if (!cancelled) {
                    setError(
                        "Unable to load fournisseur."
                    );
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [id]);

    const handleUpdate = async (data) => {
        try {
            setSaving(true);
            setError("");

            await api.put(
                `/fournisseurs/${id}`,
                data
            );

            navigate(`/app/fournisseurs/${id}`, {
                state: {
                    message:
                        "Fournisseur updated successfully.",
                },
            });
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
                          "Unable to update fournisseur."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <p className="p-6 text-slate-500">
                Loading fournisseur...
            </p>
        );
    }

    if (!fournisseur) {
        return (
            <p className="p-6 text-red-600">
                Fournisseur not found.
            </p>
        );
    }

    return (
        <FournisseurForm
            key={fournisseur.id}
            initialData={fournisseur}
            onSubmit={handleUpdate}
            saving={saving}
            error={error}
            submitText="Update fournisseur"
        />
    );
}

export default FournisseursUpdate;
