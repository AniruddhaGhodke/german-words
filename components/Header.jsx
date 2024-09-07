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
        <header className="bg-primary text-white w-full top-0 left-0 z-10 absolute">
            <div className="absolute inset-0 opacity-40"></div>
            <div className="relative max-w-screen-xl mx-auto flex justify-between items-center p-4">
                <div className="bg-[url('/logo.svg')] w-20 h-20 bg-cover bg-no-repeat text-[hsl(199,60%,55%)]" />

                {session ? (
                    <div className="flex gap-3">
                        <Link
                            href="wordGame"
                            className="bg-gray-900 hover:bg-gray-700 text-[hsl(199,60%,55%)] font-bold py-2 px-4 rounded"
                        >
                            Word Challenge
                        </Link>
                        <button
                            onClick={handleSignOut}
                            className="bg-gray-900 hover:bg-gray-700 text-[hsl(199,60%,55%)] font-bold py-2 px-4 rounded"
                        >
                            Sign Out
                        </button>
                    </div>
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
