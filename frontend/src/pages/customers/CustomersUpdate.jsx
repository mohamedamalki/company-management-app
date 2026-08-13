import {
    useEffect,
    useState,
} from "react";
import {
    useNavigate,
    useParams,
} from "react-router-dom";
import api from "../../api/axios";
import CustomerForm from "../../components/customers/CustomerForm";

function CustomersUpdate() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [customer, setCustomer] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    useEffect(() => {
        let cancelled = false;

        api.get(`/customers/${id}`)
            .then((response) => {
                if (!cancelled) {
                    setCustomer(
                        response.data.data
                    );
                }
            })
            .catch((requestError) => {
                console.error(requestError);

                if (!cancelled) {
                    setError(
                        "Unable to load customer."
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

    const handleUpdate = async (
        formData
    ) => {
        try {
            setSaving(true);
            setError("");

            await api.put(
                `/customers/${id}`,
                formData
            );

            navigate("/app/customers", {
                state: {
                    message:
                        "Customer updated successfully.",
                },
            });
        } catch (requestError) {
            const errors =
                requestError.response?.data
                    ?.errors;

            setError(
                errors
                    ? Object.values(errors)
                          .flat()
                          .at(0)
                    : requestError.response
                          ?.data?.message ??
                          "Unable to update customer."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <p className="p-6 text-slate-500">
                Loading customer...
            </p>
        );
    }

    if (!customer) {
        return (
            <p className="p-6 text-red-600">
                Customer not found.
            </p>
        );
    }

    return (
        <CustomerForm
            key={customer.id}
            initialData={customer}
            onSubmit={handleUpdate}
            saving={saving}
            error={error}
            submitText="Update customer"
        />
    );
}

export default CustomersUpdate;
