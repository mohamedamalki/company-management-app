import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import EmployeeForm from "../../components/employees/EmployeeForm";

function EmployeesCreate() {
    const navigate = useNavigate();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleCreate = async (formData) => {
        try {
            setSaving(true);
            setError("");

            await api.post("/employees", formData);

            navigate("/app/employees");
        } catch (error) {
            const errors = error.response?.data?.errors;

            setError(
                errors
                    ? Object.values(errors).flat()[0]
                    : error.response?.data?.message ??
                          "Unable to create employee."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
            <div className="mx-auto max-w-4xl">
                <EmployeeForm
                    key="create-employee"
                    onSubmit={handleCreate}
                    saving={saving}
                    error={error}
                    submitText="Create employee"
                />
            </div>
        </div>
    );
}

export default EmployeesCreate;
