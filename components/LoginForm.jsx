"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { isValidEmail } from "@/utils/passwordValidation";

const LoginForm = () => {
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        
        const formData = new FormData(e.target);
        const email = formData.get("email");
        const password = formData.get("password");

        if (!isValidEmail(email)) {
            setError("Email is invalid");
            toast.error("Email is invalid");
            setIsLoading(false);
            return;
        }

        if (!password || password.length < 8) {
            setError("Password is invalid");
            toast.error("Password is invalid");
            setIsLoading(false);
            return;
        }
        
        try {
            const res = await signIn("credentials", {
                redirect: false,
                email,
                password,
                rememberMe,
            });
            
            if (res?.error) {
                setError("Invalid email or password");
                toast.error("Invalid email or password");
            } else {
                setError("");
                toast.success("Successful login");
                // Force session update
                await getSession();
                router.push("/");
                router.refresh();
            }
        } catch (error) {
            setError("Login failed. Please try again.");
            toast.error("Login failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="flex justify-center flex-col items-center">
                <h2 className="mt-6 text-center text-2xl leading-9 tracking-tight text-gray-900">
                    Sign in to your account
                </h2>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
                <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
                    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
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
                                    aria-describedby="email-error"
                                    aria-invalid={error && error.includes("email") ? "true" : "false"}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-sky-700 sm:text-sm sm:leading-6 px-2 focus:outline-none focus-visible:outline-2"
                                    placeholder="Enter your email address"
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
                                    autoComplete="current-password"
                                    required
                                    aria-describedby="password-error"
                                    aria-invalid={error && error.includes("password") ? "true" : "false"}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-sky-700 sm:text-sm sm:leading-6 px-2 focus:outline-none focus-visible:outline-2"
                                    placeholder="Enter your password"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                                />
                                <label
                                    htmlFor="remember-me"
                                    className="ml-3 block text-sm leading-6 text-gray-900"
                                >
                                    Remember me for 30 days
                                </label>
                            </div>

                            <div className="text-sm leading-6">
                                <Link
                                    href="#"
                                    className="text-black hover:text-gray-900"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex w-full border border-black justify-center rounded-md bg-black px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-white transition-colors hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Signing in..." : "Sign in"}
                            </button>
                        </div>

                        <div>
                            <Link
                                href="/register"
                                className="flex w-full border border-black justify-center rounded-md bg-black px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-white transition-colors hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                            >
                                Register
                            </Link>
                        </div>
                    </form>

                    <div>
                        <div className="relative mt-10">
                            <div
                                className="absolute inset-0 flex items-center"
                                aria-hidden="true"
                            >
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-sm font-medium leading-6">
                                <span className="bg-white px-6 text-gray-900">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={() =>
                                    signIn("google", {
                                        callbackUrl: "/",
                                    })
                                }
                                className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-300 bg-white px-4 py-2 text-black shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                            >
                                <img
                                    src="/google-logo.svg"
                                    alt="Google Logo"
                                    className="h-5 w-5"
                                />
                                <span className="text-sm font-medium">
                                    Sign in with Google
                                </span>
                            </button>
                        </div>
                        {error && (
                            <p 
                                id="login-error" 
                                className="text-red-600 text-center text-[16px] my-4"
                                role="alert"
                                aria-live="polite"
                            >
                                {error}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
