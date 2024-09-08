import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import React from "react";
import { authOptions } from "./api/auth/[...nextauth]/route";
import Accordion from "@/components/WordForm";
import Welcome from "@/components/Welcome";

const Home = async () => {
    const session = await getServerSession(authOptions);
    const user = session?.user || null;
    const isLoggedIn = !!user;
    if (!isLoggedIn) redirect("/login");
    const { name } = user;
    return (
        <>
            <Welcome name={name} />
            <div
                className="flex flex-col h-full bg-[url('/blob-haikei-1.svg')] bg-primary bg-cover bg-center min-h-screen pt-20 sm:px-20"
                id="content"
            >
                {session ? (
                    <Accordion
                        session={isLoggedIn}
                        rate={process.env.SPEAK_RATE}
                    />
                ) : null}
            </div>
        </>
    );
};

export default Home;
