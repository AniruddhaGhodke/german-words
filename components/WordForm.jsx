"use client";

import { addWord } from "@/server_actions/words";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Table from "./Table";
import TableSkeleton from "./TableSkeleton";
import { motion } from "framer-motion";

const Accordion = ({ rate }) => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterData, setFilterData] = useState([]);
    const [isFiltered, setIsFiltered] = useState(false);

    async function fetchData() {
        setIsLoading(true);
        const response = await fetch("/api/words");
        const res = await response.json();
        setIsLoading(false);
        if (res.success && res.data) handleSetData(res.data.data);
    }

    function handleSetData(newData) {
        setData(newData);
        setFilterData(newData);
    }

    function handleFilter(filterType) {
        setIsFiltered(true);
        const caseInSensitiveType = filterType.toLowerCase();
        if (caseInSensitiveType === "all") {
            setFilterData(data);
            return;
        }
        const filteredData = data.filter(
            (i) => i?.type?.toLowerCase() === caseInSensitiveType
        );
        setFilterData(filteredData);
    }

    function handleSearch(searchTearm) {
        setIsFiltered(true);
        if (searchTearm === "") {
            setFilterData(data);
            return;
        }
        const caseInSensitiveSearch = searchTearm.toLowerCase();
        const searchedWords = data.filter(
            (i) =>
                i.german.toLowerCase().includes(caseInSensitiveSearch) ||
                i.english.toLowerCase().includes(caseInSensitiveSearch)
        );
        setFilterData(searchedWords);
    }

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <>
            <WordForm
                onWordAdd={handleSetData}
                onFilterChange={handleFilter}
                onSearch={handleSearch}
            />

            {isLoading ? (
                <TableSkeleton />
            ) : filterData.length ? (
                <Table
                    data={filterData.length ? filterData : data}
                    updateData={handleSetData}
                    handlePageChange={isFiltered}
                    rate={rate}
                />
            ) : (
                <p className="mt-20 w-full flex justify-center text-red-600 text-2xl">
                    No Words Found!!
                </p>
            )}
        </>
    );
};

const WordForm = ({ onWordAdd, onFilterChange, onSearch }) => {
    const formRef = useRef();
    const [isModalOpen, setModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(formData) {
        setIsLoading(true);
        const result = await addWord(formData);
        if (result.success) {
            onWordAdd(JSON.parse(result.data));
            toast.success("Word added successfully!");
            formRef.current.reset();
        } else {
            toast.error(result.error || "Failed to add word");
        }
        setIsLoading(false);
    }

    const openModal = () => setModalOpen(true);
    const closeModal = () => setModalOpen(false);

    return (
        <>
            <div className="py-5 px-5 shadow-lg mx-auto w-11/12 bg-gray-100 rounded-lg flex flex-col sm:flex-row">
                {/* Add Word Button for Mobile */}
                <button
                    onClick={openModal}
                    className="sm:hidden mb-4 p-2 border border-sky-800 hover:bg-sky-800 text-gray-800 hover:text-white rounded-md shadow-sm"
                >
                    Add Word
                </button>

                {/* Modal for adding a word */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <FormTemplate
                                ref={formRef}
                                action={handleSubmit}
                                className="space-y-4"
                                closeModal={closeModal}
                                isModal={isModalOpen}
                                isLoading={isLoading}
                            />
                        </div>
                    </div>
                )}

                {/* Original Form (hidden on mobile) */}
                <FormTemplate
                    ref={formRef}
                    className="hidden sm:flex gap-10 items-end flex-1"
                    action={handleSubmit}
                    isModal={isModalOpen}
                    isLoading={isLoading}
                    onSearch={onSearch}
                />

                {/* Filter Forms */}
                <div className="flex flex-1 flex-col justify-start gap-2 sm:justify-end sm:gap-12 sm:flex-row">
                    <form className="flex justify-start items-end gap-2 sm:justify-end">
                        <div className="w-full flex flex-col">
                            <label
                                htmlFor="searchWord"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Search:
                            </label>
                            <input
                                type="text"
                                id="searchWord"
                                name="searchWord"
                                className="mt-1 block px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:bg-secondary-100"
                                placeholder="Search Word"
                                onChange={(e) => onSearch(e.target.value)}
                            />
                        </div>
                    </form>

                    <form className="flex justify-start items-end gap-2 sm:justify-end">
                        <div className="w-full flex flex-col">
                            <label
                                htmlFor="filterWords"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Sort By:
                            </label>
                            <select
                                id="filterWords"
                                name="filterWords"
                                onChange={(e) => onFilterChange(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-100 outline-1 border border-gray-300 outline-gray-300 focus:bg-secondary-100 rounded-md"
                            >
                                <option>All</option>
                                <option>Noun</option>
                                <option>Verb</option>
                                <option>Adjective</option>
                                <option>Adverb</option>
                                <option>Pronoun</option>
                            </select>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

const FormTemplate = React.forwardRef(
    (
        {
            action,
            isModal,
            closeModal,
            isLoading,
            onSearch = () => {},
            ...props
        },
        ref
    ) => {
        return (
            <form ref={ref} action={action} {...props}>
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
                        className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:bg-secondary-100"
                        placeholder="Enter German word"
                        onChange={(e) => onSearch(e.target.value)}
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
                        className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:bg-secondary-100"
                        placeholder="Enter English word"
                        onChange={(e) => onSearch(e.target.value)}
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
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-100 outline-1 border border-gray-300 outline-gray-300 focus:bg-secondary-100 rounded-md"
                    >
                        <option>Noun</option>
                        <option>Verb</option>
                        <option>Adjective</option>
                        <option>Adverb</option>
                        <option>Pronoun</option>
                    </select>
                </div>
                <motion.button
                    whileHover={{
                        scale: 1.1,
                        transition: {
                            delay: 0.2, // Delay in seconds
                            duration: 0.2, // Animation duration
                        },
                    }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={isLoading}
                    className={`${
                        isModal ? "w-full" : "w-auto"
                    } flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium bg-gray-200 text-primary hover:bg-teriary hover:text-gray-100 transition-colors`}
                >
                    {isLoading && (
                        <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V4a10 10 0 00-10 10h2z"
                            ></path>
                        </svg>
                    )}
                    Add
                </motion.button>
                {isModal ? (
                    <button
                        type="button"
                        onClick={closeModal}
                        className="mt-4 w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                ) : null}
            </form>
        );
    }
);

export default Accordion;
