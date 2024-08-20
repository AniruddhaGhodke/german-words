import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

export default function Header() {
    const { data: session } = useSession();
    return (
        <section>
            <header className="bg-blue-500 text-white w-full fixed top-0 left-0 z-10">
                <div className="max-w-screen-xl mx-auto flex justify-between items-center p-4">
                    <Link href="/">
                        <span className="text-white font-bold">Home</span>
                    </Link>
                    {session ? (
                        <button
                            className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded"
                            onClick={signOut}
                        >
                            Google Sign Out
                        </button>
                    ) : (
                        <button
                            className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded"
                            onClick={() => signIn("google")}
                        >
                            Google Sign In
                        </button>
                    )}
                </div>
            </header>
        </section>
    );
}
