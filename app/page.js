"use client";

import Header from "@/components/Header";
import Table from "@/components/Table";
import Accordion from "@/components/WordForm";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function Home() {
    const [data, setData] = useState([]);
    async function fetchData() {
        const response = await fetch("/api/words");
        const data = await response.json();
        if (data.success) handleSetData(data.data.data);
    }

    function handleSetData(newData) {
        setData(newData);
    }

    useEffect(() => {
        fetchData();
    }, []);

    const { data: session } = useSession();

    return (
        <>
            <Header />
            {session ? <Accordion onWordAdd={handleSetData} /> : null}
            {data.length ? (
                <Table data={data} />
            ) : (
                <p className="mt-20 w-full flex justify-center text-red-600 text-2xl">
                    No records or you need to login first
                </p>
            )}
        </>
    );
}
