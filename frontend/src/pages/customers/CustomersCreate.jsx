import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import CustomerForm from "../../components/customers/CustomerForm";

function getError(error) {
    const errors =
        error.response?.data?.errors;

    return errors
        ? Object.values(errors)
              .flat()
              .at(0)
        : error.response?.data?.message ??
              "Unable to create customer.";
}

function CustomersCreate() {
    const navigate = useNavigate();

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const handleCreate = async (
        formData
    ) => {
        try {
            setSaving(true);
            setError("");

            await api.post(
                "/customers",
                formData
            );

            navigate("/app/customers", {
                state: {
                    message:
                        "Customer created successfully.",
                },
            });
        } catch (requestError) {
            setError(
                getError(requestError)
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <CustomerForm
            onSubmit={handleCreate}
            saving={saving}
            error={error}
            submitText="Create customer"
        />
    );
}

export default CustomersCreate;
