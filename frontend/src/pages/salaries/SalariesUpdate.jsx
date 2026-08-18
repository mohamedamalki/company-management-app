import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import SalaryForm from "../../components/salaries/SalaryForm";

function SalariesUpdate() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [salary, setSalary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadSalary = async () => {
            try {
                const response = await api.get(
                    `/salaries/${id}`
                );

                const data =
                    response.data.data ??
                    response.data.salary ??
                    response.data;

                if (!cancelled) {
                    setSalary(data);
                }
            } catch (error) {
                console.error(error);

                if (!cancelled) {
                    setError(
                        error.response?.data?.message ??
                            "Unable to load salary."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadSalary();

        return () => {
            cancelled = true;
        };
    }, [id]);

    const handleUpdate = async (formData) => {
        try {
            setSaving(true);
            setError("");

            await api.patch(
                `/salaries/${id}`,
                formData
            );

            navigate("/app/salaries");
        } catch (error) {
            const errors = error.response?.data?.errors;

            setError(
                errors
                    ? Object.values(errors).flat()[0]
                    : error.response?.data?.message ??
                          "Unable to update salary."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <p className="p-8">
                Loading salary...
            </p>
        );
    }

    if (!salary) {
        return (
            <p className="p-8 text-red-600">
                Salary not found.
            </p>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
            <div className="mx-auto max-w-4xl">
                <SalaryForm
                    key={`update-salary-${salary.id}`}
                    initialData={salary}
                    onSubmit={handleUpdate}
                    saving={saving}
                    error={error}
                    submitText="Update salary"
                />
            </div>
        </div>
    );
}

export default SalariesUpdate;
