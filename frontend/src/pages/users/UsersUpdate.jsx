import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import UserForm from "../../components/users/UserForm";

function UsersUpdate() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadUser = async () => {
            try {
                const response = await api.get(`/users/${id}`);

                const userData =
                    response.data.data ??
                    response.data.user ??
                    response.data;

                if (!cancelled) {
                    setUser(userData);
                }
            } catch (error) {
                console.error(error);

                if (!cancelled) {
                    setError("Unable to load user.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadUser();

        return () => {
            cancelled = true;
        };
    }, [id]);

    const handleUpdate = async (formData) => {
        try {
            setSaving(true);
            setError("");

            const payload = { ...formData };

            if (!payload.password) {
                delete payload.password;
                delete payload.password_confirmation;
            }

            await api.put(`/users/${id}`, payload);

            navigate("/app/users");
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
                        "Unable to update user."
                );
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <p className="p-6">Loading user...</p>;
    }

    if (!user) {
        return (
            <p className="p-6 text-red-600">
                User not found.
            </p>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">
                    Update user
                </h1>

                <p className="text-sm text-slate-500">
                    Update {user.name}.
                </p>
            </div>

            <UserForm
                initialData={user}
                onSubmit={handleUpdate}
                saving={saving}
                error={error}
                submitText="Update user"
            />
        </div>
    );
}

export default UsersUpdate;
