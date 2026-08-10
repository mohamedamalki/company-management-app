import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowRight,
    BarChart3,
    Eye,
    EyeOff,
    LineChart,
    LockKeyhole,
    Mail,
    ShieldCheck,
} from "lucide-react";
import api from "../../api/axios";
import useAuth from "../../context/useAuth";

const initialForm = {
    email: "",
    password: "",
};

function getApiError(error) {
    const response = error.response?.data;

    if (response?.errors) {
        const firstError =
            Object.values(response.errors).flat()[0];

        if (firstError) {
            return firstError;
        }
    }

    return (
        response?.message ??
        error.message ??
        "Unable to sign in. Please try again."
    );
}

export default function Login() {
    const navigate = useNavigate();
    const { saveAuthentication } = useAuth();

    const [formData, setFormData] =
        useState(initialForm);

    const [showPassword, setShowPassword] =
        useState(false);

    const [rememberMe, setRememberMe] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((currentForm) => ({
            ...currentForm,
            [name]: value,
        }));

        if (error) {
            setError("");
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await api.post(
                "/login",
                formData
            );

            const token =
                response.data.token ??
                response.data.access_token;

            const user = response.data.user;

            if (!token) {
                throw new Error(
                    "The API response does not contain a token."
                );
            }

            if (!user) {
                throw new Error(
                    "The API response does not contain the user."
                );
            }

            const role = user.role
                ?.trim()
                .toLowerCase();

            if (!role) {
                throw new Error(
                    "The API response does not contain the user role."
                );
            }

            const authenticatedUser = {
                ...user,
                role,
                permissions: Array.isArray(
                    user.permissions
                )
                    ? user.permissions
                    : [],
            };

            saveAuthentication({
                token,
                user: authenticatedUser,
                remember: rememberMe,
            });

            navigate("/app/dashboard", {
                replace: true,
            });
        } catch (requestError) {
            setError(
                getApiError(requestError)
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[43%_57%]">
            <section className="relative hidden overflow-hidden bg-[#0b2555] px-10 py-10 text-white lg:flex lg:flex-col xl:px-16 xl:py-14">
                <div className="pointer-events-none absolute -right-32 -top-40 h-[460px] w-[460px] rounded-full bg-blue-500/15 blur-[2px]" />

                <div className="pointer-events-none absolute -bottom-48 -left-40 h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[2px]" />

                <div className="pointer-events-none absolute bottom-24 right-8 h-48 w-48 rounded-full border border-blue-300/20 bg-blue-400/5" />

                <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

                <div className="relative z-10 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center gap-1.5 rounded-2xl bg-white shadow-lg shadow-black/10">
                        <span className="h-6 w-2 rounded-full bg-blue-600" />
                        <span className="h-6 w-2 rounded-full bg-blue-400" />
                    </div>

                    <span className="text-2xl font-extrabold tracking-tight">
                        Management-App
                    </span>
                </div>

                <div className="relative z-10 my-auto max-w-lg">
                    <h1 className="text-5xl font-extrabold leading-[1.12] tracking-[-0.04em] xl:text-6xl">
                        Run your company with
                        <br />

                        <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                            M-App.
                        </span>
                    </h1>

                    <p className="mt-6 max-w-md text-lg leading-8 text-blue-100/80">
                        One secure workspace for
                        teams, inventory, suppliers,
                        sales, and daily operations.
                    </p>

                    <div className="mt-14 space-y-6">
                        <Feature
                            icon={LineChart}
                            text="Live operational overview"
                        />

                        <Feature
                            icon={ShieldCheck}
                            text="Permission-based access and control"
                        />

                        <Feature
                            icon={BarChart3}
                            text="Faster decisions with real-time data"
                        />
                    </div>
                </div>

                <p className="relative z-10 text-xs font-medium text-blue-200/50">
                    © 2026 Management-App • Privacy
                    • Security
                </p>
            </section>

            <section className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
                <div className="w-full max-w-[480px] rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:px-12 sm:py-11">
                    <div className="flex items-center gap-3 lg:hidden">
                        <div className="flex h-11 w-11 items-center justify-center gap-1.5 rounded-xl bg-blue-600">
                            <span className="h-6 w-2 rounded-full bg-white" />
                            <span className="h-6 w-2 rounded-full bg-blue-200" />
                        </div>

                        <span className="text-xl font-extrabold tracking-tight text-slate-900">
                            Management-App
                        </span>
                    </div>

                    <div className="mt-10 lg:mt-0">
                        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                            Welcome back
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Sign in to continue to
                            your company workspace.
                        </p>
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                        >
                            <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />

                            {error}
                        </div>
                    )}

                    <form
                        className="mt-8 space-y-5"
                        onSubmit={handleSubmit}
                    >
                        <FormField
                            id="email"
                            name="email"
                            type="email"
                            label="Email address"
                            placeholder="admin@company.com"
                            value={formData.email}
                            onChange={handleChange}
                            icon={Mail}
                            autoComplete="email"
                        />

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm font-bold text-slate-700"
                            >
                                Password
                            </label>

                            <div className="relative">
                                <LockKeyhole
                                    aria-hidden="true"
                                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    id="password"
                                    name="password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={
                                        formData.password
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    required
                                    className="h-14 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(
                                            (current) =>
                                                !current
                                        )
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(
                                        event
                                    ) =>
                                        setRememberMe(
                                            event.target
                                                .checked
                                        )
                                    }
                                    className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />

                                Remember me
                            </label>

                            <Link
                                to="/forgot-password"
                                className="text-sm font-bold text-blue-600 transition hover:text-blue-700 hover:underline"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex h-14 w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-65"
                        >
                            {loading ? (
                                <span className="flex items-center gap-3">
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                                    Signing in...
                                </span>
                            ) : (
                                <span className="flex w-full items-center justify-center">
                                    <span>
                                        Sign in
                                    </span>

                                    <ArrowRight className="absolute right-5 hidden h-5 w-5 transition-transform group-hover:translate-x-1 sm:block" />
                                </span>
                            )}
                        </button>
                    </form>
                </div>

                <p className="absolute bottom-6 hidden text-xs text-slate-400 sm:block lg:hidden">
                    © 2026 Management-App • Privacy
                    • Security
                </p>
            </section>
        </main>
    );
}

function Feature({
    icon: Icon,
    text,
}) {
    return (
        <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-300/10 bg-blue-400/10 text-blue-300">
                <Icon
                    className="h-[22px] w-[22px]"
                    strokeWidth={1.8}
                />
            </div>

            <p className="font-bold text-blue-50">
                {text}
            </p>
        </div>
    );
}

function FormField({
    icon: Icon,
    label,
    id,
    ...inputProps
}) {
    return (
        <div>
            <label
                htmlFor={id}
                className="mb-2 block text-sm font-bold text-slate-700"
            >
                {label}
            </label>

            <div className="relative">
                <Icon
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                />

                <input
                    id={id}
                    required
                    {...inputProps}
                    className="h-14 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
            </div>
        </div>
    );
}
