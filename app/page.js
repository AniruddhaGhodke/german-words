import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import Header from "@/components/Header";
import React from "react";
import { authOptions } from "./api/auth/[...nextauth]/route";
import Accordion from "@/components/WordForm";

const Home = async () => {
    const session = await getServerSession(authOptions);
    const user = session?.user || null;
    const isLoggedIn = !!user;
    if (!isLoggedIn) redirect("/login");
    const { name } = user;
    return (
        <div className="min-h-screen">
            <Header session={name} />
            {session ? <Accordion session={isLoggedIn} /> : null}
        </div>
    );
};

export default Home;
