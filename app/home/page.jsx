"use client";

import Header from "@/components/Header";
import Table from "@/components/Table";
import Accordion from "@/components/WordForm";
import { useSession } from "next-auth/react";
import React, { useState, useEffect } from "react";

const Home = () => {
    const { data: session } = useSession();

    const [data, setData] = useState([]);

    async function fetchData() {
        const response = await fetch("/api/words");
        const res = await response.json();
        if (res.success && res.data) handleSetData(res.data.data);
    }

    function handleSetData(newData) {
        setData(newData);
    }

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <>
            <Header />
            {session ? <Accordion onWordAdd={handleSetData} /> : ""}
            {data.length && session ? (
                <Table data={data} />
            ) : (
                <p className="mt-20 w-full flex justify-center text-red-600 text-2xl">
                    No records or you need to login first
                </p>
            )}
        </>
    );
};

export default Home;
