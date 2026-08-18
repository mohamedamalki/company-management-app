import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import SalaryForm from "../../components/salaries/SalaryForm";

function SalariesCreate() {
    const navigate = useNavigate();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleCreate = async (formData) => {
        try {
            setSaving(true);
            setError("");

            await api.post("/salaries", formData);

            navigate("/app/salaries");
        } catch (error) {
            const errors = error.response?.data?.errors;

            setError(
                errors
                    ? Object.values(errors).flat()[0]
                    : error.response?.data?.message ??
                          "Unable to create salary."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
            <div className="mx-auto max-w-4xl">
                <SalaryForm
                    key="create-salary"
                    onSubmit={handleCreate}
                    saving={saving}
                    error={error}
                    submitText="Create salary"
                />
            </div>
        </div>
    );
}

export default SalariesCreate;
