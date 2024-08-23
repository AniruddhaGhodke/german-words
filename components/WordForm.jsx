"use client";

import { addWord } from "@/server_actions/words";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Table from "./Table";

const Accordion = ({session}) => {
    const [isOpen, setIsOpen] = useState(false);
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

    const toggleAccordion = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            <div className="mt-20 max-w-screen-xl mx-auto flex items-center justify-center flex-col">
                <a
                    href="#"
                    onClick={toggleAccordion}
                    className="text-blue-500 hover:text-blue-600 cursor-pointer"
                >
                    {isOpen ? "Hide Form" : "Show Form"}
                </a>
                {isOpen && <WordForm onWordAdd={handleSetData} />}
            </div>

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

const WordForm = ({ onWordAdd }) => {
    const formRef = useRef();

    async function handleSubmit(formData) {
        const result = await addWord(formData);
        if (result.success) {
            onWordAdd(result.data);
            toast.success("Word added successfully!");
            formRef.current.reset();
        } else {
            toast.error(result.error || "Failed to add word");
        }
    }

    return (
        <div className="shadow-lg p-5 w-full bg-white rounded-lg mt-2">
            <form ref={formRef} className="space-y-4" action={handleSubmit}>
                <div>
                    <label
                        htmlFor="germanWord"
                        className="block text-sm font-medium text-gray-700"
                    >
                        German Word:
                    </label>
                    <input
                        type="text"
                        id="germanWord"
                        name="germanWord"
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter German word"
                    />
                </div>
                <div>
                    <label
                        htmlFor="englishWord"
                        className="block text-sm font-medium text-gray-700"
                    >
                        English Word:
                    </label>
                    <input
                        type="text"
                        id="englishWord"
                        name="englishWord"
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter English word"
                    />
                </div>
                <div>
                    <label
                        htmlFor="type"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Type:
                    </label>
                    <select
                        id="type"
                        name="type"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base outline-1 outline-gray-300 focus:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm rounded-md"
                    >
                        <option>Noun</option>
                        <option>Verb</option>
                        <option>Adjective</option>
                        <option>Adverb</option>
                        <option>Pronoun</option>
                    </select>
                </div>
                <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Add
                </button>
            </form>
        </div>
    );
};

export default Accordion;
