'use client'

import { signOut, signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from 'next/navigation';

export default function Header({session}) {
    const router = useRouter();
    const handleSignOut = async () => {
        await signOut({ redirect: false });
        router.push('/login');
    }
    return (
        <section>
            <header className="bg-blue-500 text-white w-full fixed top-0 left-0 z-10">
                <div className="max-w-screen-xl mx-auto flex justify-between items-center p-4">
                    <Link href="/">
                        <span className="text-white font-bold">Home</span>
                    </Link>
                    {session ? (
                        <button
                            onClick={handleSignOut}
                            className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded"
                        >
                            Sign Out
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link href="/login">
                                <span className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded">
                                    Sign In/ Register
                                </span>
                            </Link>
                            <button
                                onClick={() => signIn("google")}
                                className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded"
                            >
                                Google Sign in
                            </button>
                        </div>
                    )}
                </div>
            </header>
        </section>
    );
}