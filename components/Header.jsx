"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Header({ session }) {
    const router = useRouter();
    const handleSignOut = async () => {
        await signOut({ redirect: false });
        router.push("/login");
    };
    return (
        <header className="bg-gradient-to-r from-black via-red-600 to-yellow-400 text-white w-full sticky top-0 left-0 z-10">
            <div className="absolute inset-0 bg-black opacity-40"></div>
            <div className="relative max-w-screen-xl mx-auto flex justify-between items-center p-4">
                <Link href="/">
                    <span className="text-white font-bold">Home</span>
                </Link>
                {session ? (
                    <button
                        onClick={handleSignOut}
                        className="bg-gray-900 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Sign Out
                    </button>
                ) : (
                    <div className="flex items-center gap-3">
                        <Link href="/login">
                            <span className="bg-gray-900 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                                Sign In/ Register
                            </span>
                        </Link>
                    </div>
                )}
            </div>
        </header>
    );
}
