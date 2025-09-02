"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { validatePassword, isValidEmail, getPasswordStrength } from "@/utils/passwordValidation";

const RegisterPage = () => {
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [passwordStrength, setPasswordStrength] = useState(null);
    const router = useRouter();
    const { status: sessionStatus } = useSession();

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            router.replace("/");
        }
    }, [sessionStatus, router]);

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        if (newPassword) {
            setPasswordStrength(getPasswordStrength(newPassword));
        } else {
            setPasswordStrength(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        
        const formData = new FormData(e.target);
        const name = formData.get("name");
        const email = formData.get("email");
        const password = formData.get("password");
        const confirmPassword = formData.get("confirmPassword");

        if (!name?.trim()) {
            setError("Name is required");
            toast.error("Name is required");
            setIsLoading(false);
            return;
        }

        if (!isValidEmail(email)) {
            setError("Email is invalid");
            toast.error("Email is invalid");
            setIsLoading(false);
            return;
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            setError(passwordValidation.errors[0]);
            toast.error(passwordValidation.errors[0]);
            setIsLoading(false);
            return;
        }

        if (confirmPassword !== password) {
            setError("Passwords do not match");
            toast.error("Passwords do not match");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                    name: name.trim()
                }),
            });
            
            const data = await res.json().catch(() => ({}));
            
            if (res.status === 400) {
                const errorMsg = data.error || "Registration failed";
                toast.error(errorMsg);
                setError(errorMsg);
            } else if (res.status === 429) {
                toast.error("Too many attempts. Please try again later.");
                setError("Too many attempts. Please try again later.");
            } else if (res.status === 200) {
                setError("");
                toast.success("Registration successful");
                router.push("/login");
            } else {
                toast.error("Registration failed. Please try again.");
                setError("Registration failed. Please try again.");
            }
        } catch (error) {
            toast.error("Network error. Please try again.");
            setError("Network error. Please try again.");
            console.error("Registration error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (sessionStatus === "loading") {
        return <h1>Loading...</h1>;
    }
    return (
        sessionStatus !== "authenticated" && (
            <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="flex justify-center flex-col items-center">
                    <h2 className="mt-6 text-center text-2xl leading-9 tracking-tight text-gray-900">
                        Sign up on our website
                    </h2>
                </div>

                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
                    <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium leading-6 text-gray-900"
                                >
                                    Name
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="name"
                                        name="name"
                                        type="name"
                                        autoComplete="name"
                                        required
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-sky-700 sm:text-sm sm:leading-6 px-2 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium leading-6 text-gray-900"
                                >
                                    Email address
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-sky-700 sm:text-sm sm:leading-6 px-2 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium leading-6 text-gray-900"
                                >
                                    Password
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        value={password}
                                        onChange={handlePasswordChange}
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-sky-700 sm:text-sm sm:leading-6 focus:outline-none px-2"
                                        placeholder="Enter a strong password"
                                    />
                                </div>
                                {passwordStrength && password && (
                                    <div className="mt-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span>Password strength:</span>
                                            <span style={{ color: passwordStrength.color }} className="font-medium">
                                                {passwordStrength.label}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                            <div
                                                className="h-2 rounded-full transition-all duration-300"
                                                style={{
                                                    backgroundColor: passwordStrength.color,
                                                    width: `${(passwordStrength.score / 7) * 100}%`
                                                }}
                                            ></div>
                                        </div>
                                        <div className="mt-1 text-xs text-gray-600">
                                            <p>Password must contain:</p>
                                            <ul className="list-disc list-inside text-xs mt-1 space-y-0.5">
                                                <li>At least 8 characters</li>
                                                <li>Uppercase and lowercase letters</li>
                                                <li>At least one number</li>
                                                <li>At least one special character</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="confirmPassword"
                                    className="block text-sm font-medium leading-6 text-gray-900"
                                >
                                    Confirm password
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-sky-700 sm:text-sm sm:leading-6 px-2 focus:outline-none"
                                        placeholder="Confirm your password"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                                    />
                                    <label
                                        htmlFor="remember-me"
                                        className="ml-3 block text-sm leading-6 text-gray-900"
                                    >
                                        Accept our terms and privacy policy
                                    </label>
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex w-full border border-black justify-center rounded-md bg-black px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-white transition-colors hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? "Creating account..." : "Sign up"}
                                </button>
                                <p className="text-red-600 text-center text-[16px] my-4">
                                    {error && error}
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )
    );
};

export default RegisterPage;
