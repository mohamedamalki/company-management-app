import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import UserForm from "../../components/users/UserForm";

function UsersCreate() {
    const navigate = useNavigate();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleCreate = async (formData) => {
        try {
            setSaving(true);
            setError("");

            await api.post("/users", formData);

            navigate("/admin/users");
        } catch (error) {
            const validationErrors =
                error.response?.data?.errors;

            if (validationErrors) {
                setError(
                    Object.values(validationErrors).flat()[0]
                );
            } else {
                setError(
                    error.response?.data?.message ??
                        "Unable to create user."
                );
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">
                    Create user
                </h1>

                <p className="text-sm text-slate-500">
                    Add a responsable or fournisseur.
                </p>
            </div>

            <UserForm
                onSubmit={handleCreate}
                saving={saving}
                error={error}
                submitText="Create user"
            />
        </div>
    );
}

export default UsersCreate;
