import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

function EmployeesPage() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadEmployees = async () => {
            try {
                const response = await api.get("/employees");

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
                console.error(error);

                if (!cancelled) {
                    setError(
                        error.response?.data?.message ??
                            "Unable to load employees."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadEmployees();

        return () => {
            cancelled = true;
        };
    }, []);

    const getLatestSalary = (employee) => {
        if (
            !Array.isArray(employee.salaries) ||
            employee.salaries.length === 0
        ) {
            return null;
        }

        return [...employee.salaries].sort(
            (a, b) =>
                new Date(b.created_at) -
                new Date(a.created_at)
        )[0];
    };

    const formatSalary = (salary) => {
        if (!salary) {
            return "No salary";
        }

        const amount =
            salary.amount ??
            salary.salary ??
            salary.basic_salary;

        if (
            amount === null ||
            amount === undefined
        ) {
            return "Salary set";
        }

        return `${Number(amount).toLocaleString()} MAD`;
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Employees
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Manage your employees and
                            their information.
                        </p>
                    </div>

                    <Link
                        to="/app/employees/create"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                    >
                        <span className="text-lg">
                            +
                        </span>

                        Create employee
                    </Link>
                </div>

                {/* Error */}
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="px-5 py-3 font-medium text-slate-500">
                                        Employee
                                    </th>

                                    <th className="px-5 py-3 font-medium text-slate-500">
                                        Position
                                    </th>

                                    <th className="px-5 py-3 font-medium text-slate-500">
                                        Location
                                    </th>

                                    <th className="px-5 py-3 font-medium text-slate-500">
                                        Email
                                    </th>

                                    <th className="px-5 py-3 font-medium text-slate-500">
                                        Phone
                                    </th>

                                    <th className="px-5 py-3 font-medium text-slate-500">
                                        Salary
                                    </th>

                                    <th className="px-5 py-3 text-right font-medium text-slate-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {/* Loading */}
                                {loading ? (
                                    Array.from({
                                        length: 5,
                                    }).map((_, index) => (
                                        <tr key={index}>
                                            <td
                                                colSpan={7}
                                                className="px-5 py-4"
                                            >
                                                <div className="h-4 animate-pulse rounded bg-slate-100" />
                                            </td>
                                        </tr>
                                    ))
                                ) : employees.length === 0 ? (
                                    /* Empty */
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-5 py-16 text-center"
                                        >
                                            <p className="font-medium text-slate-700">
                                                No employees
                                                yet
                                            </p>

                                            <p className="mt-1 text-sm text-slate-400">
                                                Create your
                                                first
                                                employee.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    /* Employees */
                                    employees.map(
                                        (employee) => {
                                            const latestSalary =
                                                getLatestSalary(
                                                    employee
                                                );

                                            const fullName =
                                                `${employee.first_name} ${employee.last_name}`;

                                            return (
                                                <tr
                                                    key={
                                                        employee.id
                                                    }
                                                    className="hover:bg-slate-50"
                                                >
                                                    {/* Employee */}
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 font-semibold text-violet-700">
                                                                {employee.first_name
                                                                    ?.charAt(
                                                                        0
                                                                    )
                                                                    .toUpperCase()}

                                                                {employee.last_name
                                                                    ?.charAt(
                                                                        0
                                                                    )
                                                                    .toUpperCase()}
                                                            </div>

                                                            <div>
                                                                <p className="font-medium text-slate-800">
                                                                    {
                                                                        fullName
                                                                    }
                                                                </p>

                                                                <p className="text-xs text-slate-500">
                                                                    Employee
                                                                    #
                                                                    {
                                                                        employee.id
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Position */}
                                                    <td className="px-5 py-3.5">
                                                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                                            {
                                                                employee.position
                                                            }
                                                        </span>
                                                    </td>

                                                    {/* Location */}
                                                    <td className="px-5 py-3.5">
                                                        {employee.location ? (
                                                            <div>
                                                                <p className="font-medium text-slate-700">
                                                                    {
                                                                        employee
                                                                            .location
                                                                            .name
                                                                    }
                                                                </p>

                                                                {employee
                                                                    .location
                                                                    .code && (
                                                                    <p className="mt-0.5 text-xs text-slate-400">
                                                                        {
                                                                            employee
                                                                                .location
                                                                                .code
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                                                                No location
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Email */}
                                                    <td className="px-5 py-3.5 text-slate-600">
                                                        {
                                                            employee.email
                                                        }
                                                    </td>

                                                    {/* Phone */}
                                                    <td className="px-5 py-3.5 text-slate-600">
                                                        {employee.phone ||
                                                            "—"}
                                                    </td>

                                                    {/* Salary */}
                                                    <td className="px-5 py-3.5">
                                                        <span
                                                            className={
                                                                latestSalary
                                                                    ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                                                                    : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
                                                            }
                                                        >
                                                            {formatSalary(
                                                                latestSalary
                                                            )}
                                                        </span>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-5 py-3.5 text-right">
                                                        <Link
                                                            to={`/app/employees/${employee.id}/edit`}
                                                            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                                                        >
                                                            Edit
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EmployeesPage;
