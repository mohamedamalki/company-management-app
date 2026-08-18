import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const initialForm = {
    employee_id: "",
    salary_month: "",
    base_salary: "",
    bonuses: "",
    deductions: "",
    payment_date: "",
    status: "pending",
};

function SalaryForm({
    initialData = initialForm,
    onSubmit,
    saving,
    error,
    submitText,
}) {
    const [formData, setFormData] = useState({
        ...initialForm,
        ...initialData,
        employee_id: initialData.employee_id ?? "",
        salary_month: initialData.salary_month
            ? initialData.salary_month.substring(0, 10)
            : "",
        base_salary: initialData.base_salary ?? "",
        bonuses: initialData.bonuses ?? "",
        deductions: initialData.deductions ?? "",
        payment_date: initialData.payment_date
            ? initialData.payment_date.substring(0, 10)
            : "",
        status: initialData.status ?? "pending",
    });

    const [employees, setEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] =
        useState(true);

    useEffect(() => {
        let cancelled = false;

        const loadEmployees = async () => {
            try {
                const response =
                    await api.get("/employees");

                const body = response.data;

                const data = Array.isArray(body.data)
                    ? body.data
                    : Array.isArray(body.data?.data)
                      ? body.data.data
                      : Array.isArray(body.employees)
                        ? body.employees
                        : Array.isArray(body)
                          ? body
                          : [];

                if (!cancelled) {
                    setEmployees(data);
                }
            } catch (error) {
                console.error(
                    "Unable to load employees:",
                    error
                );
            } finally {
                if (!cancelled) {
                    setLoadingEmployees(false);
                }
            }
        };

        loadEmployees();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((currentForm) => ({
            ...currentForm,
            [name]: value,
        }));
    };

    const baseSalary =
        Number(formData.base_salary) || 0;

    const bonuses =
        Number(formData.bonuses) || 0;

    const deductions =
        Number(formData.deductions) || 0;

    const netSalary = Math.max(
        0,
        baseSalary + bonuses - deductions
    );

    const handleSubmit = (event) => {
        event.preventDefault();

        onSubmit({
            employee_id: Number(formData.employee_id),
            salary_month: formData.salary_month,
            base_salary: baseSalary,
            bonuses:
                formData.bonuses === ""
                    ? null
                    : bonuses,
            deductions:
                formData.deductions === ""
                    ? null
                    : deductions,
            net_salary: netSalary,
            payment_date:
                formData.payment_date || null,
            status: formData.status,
        });
    };

    const inputClass =
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-100";

    const labelClass =
        "mb-1.5 block text-sm font-medium text-slate-700";

    const isUpdate = Boolean(initialData.id);

    return (
        <form
            onSubmit={handleSubmit}
            autoComplete="off"
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
            {/* Header */}
            <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50/80 px-6 py-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">
                    {isUpdate ? "✎" : "+"}
                </div>

                <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                        {isUpdate
                            ? "Update salary"
                            : "New salary"}
                    </h2>

                    <p className="mt-0.5 text-sm text-slate-500">
                        Enter the salary information.
                    </p>
                </div>
            </div>

            {/* Form body */}
            <div className="space-y-5 p-6">
                {/* Error */}
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Employee */}
                <div>
                    <label
                        htmlFor="employee_id"
                        className={labelClass}
                    >
                        Employee
                        <span className="ml-1 text-red-500">
                            *
                        </span>
                    </label>

                    <select
                        id="employee_id"
                        name="employee_id"
                        value={formData.employee_id}
                        onChange={handleChange}
                        className={inputClass}
                        disabled={
                            saving ||
                            loadingEmployees
                        }
                        required
                    >
                        <option value="">
                            {loadingEmployees
                                ? "Loading employees..."
                                : "Select an employee"}
                        </option>

                        {employees.map((employee) => (
                            <option
                                key={employee.id}
                                value={employee.id}
                            >
                                {employee.first_name}{" "}
                                {employee.last_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Salary month */}
                <div>
                    <label
                        htmlFor="salary_month"
                        className={labelClass}
                    >
                        Salary month
                        <span className="ml-1 text-red-500">
                            *
                        </span>
                    </label>

                    <input
                        id="salary_month"
                        type="date"
                        name="salary_month"
                        value={formData.salary_month}
                        onChange={handleChange}
                        className={inputClass}
                        disabled={saving}
                        required
                    />
                </div>

                {/* Salary amounts */}
                <div className="grid gap-5 sm:grid-cols-3">
                    {/* Base salary */}
                    <div>
                        <label
                            htmlFor="base_salary"
                            className={labelClass}
                        >
                            Base salary
                            <span className="ml-1 text-red-500">
                                *
                            </span>
                        </label>

                        <input
                            id="base_salary"
                            type="number"
                            name="base_salary"
                            value={formData.base_salary}
                            onChange={handleChange}
                            placeholder="5000"
                            min="0"
                            step="0.01"
                            className={inputClass}
                            disabled={saving}
                            required
                        />
                    </div>

                    {/* Bonuses */}
                    <div>
                        <label
                            htmlFor="bonuses"
                            className={labelClass}
                        >
                            Bonuses
                        </label>

                        <input
                            id="bonuses"
                            type="number"
                            name="bonuses"
                            value={formData.bonuses}
                            onChange={handleChange}
                            placeholder="500"
                            min="0"
                            step="0.01"
                            className={inputClass}
                            disabled={saving}
                        />
                    </div>

                    {/* Deductions */}
                    <div>
                        <label
                            htmlFor="deductions"
                            className={labelClass}
                        >
                            Deductions
                        </label>

                        <input
                            id="deductions"
                            type="number"
                            name="deductions"
                            value={formData.deductions}
                            onChange={handleChange}
                            placeholder="200"
                            min="0"
                            step="0.01"
                            className={inputClass}
                            disabled={saving}
                        />
                    </div>
                </div>

                {/* Net salary */}
                <div>
                    <label
                        htmlFor="net_salary"
                        className={labelClass}
                    >
                        Net salary
                    </label>

                    <input
                        id="net_salary"
                        type="number"
                        name="net_salary"
                        value={netSalary.toFixed(2)}
                        readOnly
                        className={`${inputClass} bg-slate-50 font-semibold`}
                    />

                    <p className="mt-1 text-xs text-slate-400">
                        Base salary + bonuses - deductions
                    </p>
                </div>

                {/* Payment date + status */}
                <div className="grid gap-5 sm:grid-cols-2">
                    {/* Payment date */}
                    <div>
                        <label
                            htmlFor="payment_date"
                            className={labelClass}
                        >
                            Payment date
                        </label>

                        <input
                            id="payment_date"
                            type="date"
                            name="payment_date"
                            value={formData.payment_date}
                            onChange={handleChange}
                            className={inputClass}
                            disabled={saving}
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label
                            htmlFor="status"
                            className={labelClass}
                        >
                            Status
                            <span className="ml-1 text-red-500">
                                *
                            </span>
                        </label>

                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className={inputClass}
                            disabled={saving}
                            required
                        >
                            <option value="pending">
                                Pending
                            </option>

                            <option value="paid">
                                Paid
                            </option>

                            <option value="cancelled">
                                Cancelled
                            </option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4 sm:flex-row sm:justify-end">
                <Link
                    to="/app/salaries"
                    className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                    Cancel
                </Link>

                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                    {saving
                        ? "Saving..."
                        : submitText}
                </button>
            </div>
        </form>
    );
}

export default SalaryForm;
