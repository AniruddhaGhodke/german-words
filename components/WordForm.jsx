"use client";

import { addWord } from "@/server_actions/words";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Table from "./Table";
import TableSkeleton from "./TableSkeleton";

const Accordion = () => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterData, setFilterData] = useState([]);

    async function fetchData() {
        setIsLoading(true);
        const response = await fetch("/api/words");
        const res = await response.json();
        setIsLoading(false);
        if (res.success && res.data) handleSetData(res.data.data);
    }

    function handleSetData(newData) {
        setData(newData);
    }

    function handleFilter(filterType) {
        if (filterType === "All") {
            setFilterData(data);
            return;
        }
        const filteredData = data.filter((i) => i.type === filterType);
        setFilterData(filteredData);
    }

    function handleSearch(searchTearm) {
        if (searchTearm === "") {
            setFilterData(data);
            return;
        }
        const searchedWords = data.filter(
            (i) =>
                i.german.includes(searchTearm) ||
                i.english.includes(searchTearm)
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
            ) : data.length ? (
                <Table data={filterData.length ? filterData : data} />
            ) : (
                <p className="mt-20 w-full flex justify-center text-red-600 text-2xl">
                    No records
                </p>
            )}
        </>
    );
};

const WordForm = ({ onWordAdd, onFilterChange, onSearch }) => {
    const formRef = useRef();
    const [isModalOpen, setModalOpen] = useState(false);

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

    const openModal = () => setModalOpen(true);
    const closeModal = () => setModalOpen(false);

    return (
        <div className="py-5 w-11/12 bg-white rounded-lg mt-2 flex flex-col sm:flex-row m-auto">
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
            />

            {/* Filter Forms */}
            <div className="flex flex-1 flex-col justify-start gap-2 sm:justify-end sm:gap-12 sm:flex-row">
                <form className="flex justify-start items-end gap-2 sm:justify-end">
                    <div>
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
                            className="mt-1 block px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
                            placeholder="Search Word"
                            onChange={(e) => onSearch(e.target.value)}
                        />
                    </div>
                </form>

                <form className="flex justify-start items-end gap-2 sm:justify-end">
                    <div>
                        <label
                            htmlFor="filterWords"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Filter:
                        </label>
                        <select
                            id="filterWords"
                            name="filterWords"
                            onChange={(e) => onFilterChange(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base outline-1 border border-gray-300 outline-gray-300 focus:bg-sky-50 rounded-md"
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
    );
};

const FormTemplate = React.forwardRef(({ action, isModal, closeModal, ...props }, ref) => {
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
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
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
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
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
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base outline-1 border border-gray-300 outline-gray-300 focus:bg-sky-50 rounded-md"
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
                className={`${isModal ? 'w-full' : 'w-auto'} flex justify-center py-2 px-4 border border-sky-800 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-sky-800 hover:text-white transition-colors`}
            >
                Add
            </button>
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
});

export default Accordion;
