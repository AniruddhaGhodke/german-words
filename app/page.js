import { getServerSession } from "next-auth";

import Header from "@/components/Header";
import React from "react";
import { authOptions } from "./api/auth/[...nextauth]/route";
import Accordion from "@/components/WordForm";

const Home = async () => {
    const session = await getServerSession(authOptions);
    const user = session?.user || null;
    const isLoggedIn = !!user;
    return (
        <>
            <Header session={isLoggedIn} />
            {session ? <Accordion session={isLoggedIn} /> : null}
        </>
    );
};

export default Home;
