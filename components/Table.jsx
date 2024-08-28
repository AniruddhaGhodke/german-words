import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";

const HEADERS = ["German word", "English word", "Type", "Actions"];

function Table({ data, updateData, handlePageChange }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const nbPerPage = 10;
    const lastIndex = currentPage * nbPerPage;
    const startIndex = lastIndex - nbPerPage;
    const numberOfPages = Math.ceil(data.length / nbPerPage);
    const records = data.slice(startIndex, lastIndex);

    function handleSpeak(speakword) {
        if ("speechSynthesis" in window) {
            const utterance = new SpeechSynthesisUtterance(speakword);
            utterance.lang = "de-DE";
            speechSynthesis.speak(utterance);
        } else {
            alert("SpeechSynthesis is not supported in this browser");
        }
    }

    function nextPage() {
        if (currentPage < numberOfPages) {
            setCurrentPage((prev) => prev + 1);
        }
    }

    function prevPage() {
        if (currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
        }
    }

    async function handleDelete(uuid) {
        setLoading(true);
        try {
            const response = await fetch("/api/words", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ uuid }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    updateData(data.data);
                    toast.success("Deleted Successfully!");
                } else {
                    console.error("Failed to delete word:", data.error);
                }
            } else {
                console.error("Server error:", response.status);
            }
        } catch (error) {
            console.error("Request failed:", error);
        } finally {
            setLoading(false);
            handleCloseModal();
        }
    }
    const modalRefs = useRef({});

    const handleOpenModal = (uuid) => {
        const modal = modalRefs.current[uuid];
        if (modal) {
            modal.classList.remove("hidden");
        }
    };

    const handleCloseModal = (uuid) => {
        const modal = modalRefs.current[uuid];
        if (modal) {
            modal.classList.add("hidden");
        }
    };

    const handleConfirmDelete = (uuid) => {
        handleDelete(uuid);
    };

    // Reset to first page when data changes
    useEffect(() => {
        setCurrentPage(1);
    }, [handlePageChange]);

    return (
        <div>
            <div className="rounded-xl overflow-hidden w-11/12 m-auto mt-10 shadow-xl">
                <table className="w-full table-fixed text-sm sm:text-base">
                    <thead>
                        <tr className="bg-sky-800 text-white">
                            {HEADERS.map((header, index) => (
                                <th
                                    key={index}
                                    scope="col"
                                    className={`${
                                        index === 2
                                            ? "hidden sm:table-cell"
                                            : ""
                                    } capitalize py-2`}
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((d, i) => (
                            <tr
                                className={`${
                                    i % 2 !== 0 ? "bg-gray-200" : ""
                                } text-center`}
                                key={d.uuid}
                            >
                                <td>{d.german}</td>
                                <td>{d.english}</td>
                                <td className="hidden sm:table-cell">
                                    {d.type || "Any"}
                                </td>
                                <td>
                                    <button
                                        className="bg-transparent hover:text-white py-1 px-2 my-2 rounded"
                                        onClick={() => handleSpeak(d.german)}
                                        aria-label="Speak"
                                    >
                                        <img
                                            src="/speaker.svg"
                                            alt="Speak Icon"
                                            className="h-5 w-5"
                                        />
                                    </button>

                                    <button
                                        className="bg-transparent py-1 px-2 my-2 ml-2 rounded"
                                        aria-label="Delete"
                                        onClick={() => handleOpenModal(d.uuid)}
                                    >
                                        <img
                                            src="/delete.svg"
                                            alt="Delete Icon"
                                            className="h-5 w-5"
                                        />
                                    </button>

                                    <div
                                        ref={(el) =>
                                            (modalRefs.current[d.uuid] = el)
                                        }
                                        className={`fixed inset-0 flex items-center justify-center z-50 hidden`}
                                    >
                                        <div className="bg-white p-4 rounded shadow-lg z-10">
                                            <p>
                                                Are you sure you want to delete{" "}
                                                <span className="font-bold">
                                                    {d.german}
                                                </span>
                                                ?
                                            </p>
                                            <div className="flex justify-end mt-4">
                                                <button
                                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                                                    onClick={() =>
                                                        handleCloseModal(d.uuid)
                                                    }
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex gap-2"
                                                    onClick={() =>
                                                        handleConfirmDelete(
                                                            d.uuid
                                                        )
                                                    }
                                                    disabled={loading}
                                                >
                                                    {loading && (
                                                        <svg
                                                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                                                    Confirm
                                                </button>
                                            </div>
                                        </div>
                                        <div
                                            className="fixed inset-0 bg-black opacity-50"
                                            onClick={() =>
                                                handleCloseModal(d.uuid)
                                            }
                                        ></div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="w-full flex justify-center space-x-4 my-4 items-center">
                <button
                    className="p-3 rounded-full border border-transparent text-sky-800 hover:animate-border-clockwise"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === numberOfPages}
                >
                    First
                </button>
                <button
                    className="p-3 rounded-full bg-sky-800 text-white"
                    onClick={prevPage}
                    disabled={currentPage === 1}
                >
                    Prev
                </button>
                <span>
                    {currentPage} / {numberOfPages}
                </span>
                <button
                    className="p-3 rounded-full bg-sky-800 text-white"
                    onClick={nextPage}
                    disabled={currentPage === numberOfPages}
                >
                    Next
                </button>
                <button
                    className="p-3 rounded-full border border-transparent text-sky-800 hover:animate-border-clockwise"
                    onClick={() => setCurrentPage(numberOfPages)}
                    disabled={currentPage === numberOfPages}
                >
                    Last
                </button>
            </div>
        </div>
    );
}

export default Table;
