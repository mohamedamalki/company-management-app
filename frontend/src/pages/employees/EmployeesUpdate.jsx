import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import EmployeeForm from "../../components/employees/EmployeeForm";

function EmployeesUpdate() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadEmployee = async () => {
            try {
                const response = await api.get(
                    `/employees/${id}`
                );

                const data =
                    response.data.data ??
                    response.data.employee ??
                    response.data;

                if (!cancelled) {
                    setEmployee(data);
                }
            } catch (error) {
                console.error(error);

                if (!cancelled) {
                    setError(
                        "Unable to load employee."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadEmployee();

        return () => {
            cancelled = true;
        };
    }, [id]);

    const handleUpdate = async (formData) => {
        try {
            setSaving(true);
            setError("");

            await api.patch(
                `/employees/${id}`,
                formData
            );

            navigate("/app/employees");
        } catch (error) {
            const errors = error.response?.data?.errors;

            setError(
                errors
                    ? Object.values(errors).flat()[0]
                    : error.response?.data?.message ??
                          "Unable to update employee."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <p className="p-8">
                Loading employee...
            </p>
        );
    }

    if (!employee) {
        return (
            <p className="p-8 text-red-600">
                Employee not found.
            </p>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
            <div className="mx-auto max-w-4xl">
                <EmployeeForm
                    key={`update-employee-${employee.id}`}
                    initialData={employee}
                    onSubmit={handleUpdate}
                    saving={saving}
                    error={error}
                    submitText="Update employee"
                />
            </div>
        </div>
    );
}

export default EmployeesUpdate;
