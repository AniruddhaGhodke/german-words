"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Header() {
    const { data: session, status: sessionStatus } = useSession();
    const isLoading = sessionStatus === "loading";
    return (
        <section>
            <header className="bg-blue-500 text-white w-full fixed top-0 left-0 z-10">
                <div className="max-w-screen-xl mx-auto flex justify-between items-center p-4">
                    <Link href="/">
                        <span className="text-white font-bold">Home</span>
                    </Link>
                    {isLoading ? (
                        <div className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded flex justify-center items-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        </div>
                    ) : session ? (
                        <button
                            className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded"
                            onClick={() => signOut()}
                        >
                            Sign Out
                        </button>
                    ) : (
                        <Link href="/login">
                            <span className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded">
                                Sign In/ Register
                            </span>
                        </Link>
                    )}
                </div>
            </header>
        </section>
    );
}
