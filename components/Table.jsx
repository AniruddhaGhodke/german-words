import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const HEADERS = ["German word", "English word", "Type", "Actions"];

export default function Component({ data, updateData, handlePageChange }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const nbPerPage = 10;
    const lastIndex = currentPage * nbPerPage;
    const startIndex = lastIndex - nbPerPage;
    const numberOfPages = Math.ceil(data.length / nbPerPage);
    const records = data.slice(startIndex, lastIndex);

    const modalRefs = useRef({});

    function handleSpeak(speakword) {
        if ("speechSynthesis" in window) {
            const utterance = new SpeechSynthesisUtterance(speakword);
            utterance.lang = "de-DE";
            speechSynthesis.speak(utterance);
        } else {
            toast.error("SpeechSynthesis is not supported in this browser");
        }
    }

    async function handleDelete(uuid) {
        setLoading(true);
        try {
            const response = await fetch("/api/words", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uuid }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    updateData(data.data);
                    toast.success("Deleted Successfully!");
                } else {
                    toast.error("Failed to delete word");
                }
            } else {
                toast.error("Server error");
            }
        } catch (error) {
            toast.error("Request failed");
        } finally {
            setLoading(false);
            handleCloseModal(uuid);
        }
    }

    const handleOpenModal = (uuid) => {
        modalRefs.current[uuid]?.classList.remove("hidden");
    };

    const handleCloseModal = (uuid) => {
        modalRefs.current[uuid]?.classList.add("hidden");
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [handlePageChange]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-11/12 mx-auto mt-10"
        >
            <motion.div
                className="overflow-hidden rounded-xl shadow-xl bg-white"
                whileHover={{
                    boxShadow:
                        "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
            >
                <table className="w-full table-fixed text-sm sm:text-base overflow-hidden">
                    <thead>
                        <tr className="bg-sky-800 text-white">
                            {HEADERS.map((header, index) => (
                                <motion.th
                                    key={index}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`${
                                        index === 2
                                            ? "hidden sm:table-cell"
                                            : ""
                                    } capitalize py-3 px-4`}
                                >
                                    {header}
                                </motion.th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((d, i) => (
                            <motion.tr
                                key={d.uuid}
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 50 }}
                                transition={{
                                    duration: 0.3,
                                    delay: i * 0.05,
                                }}
                                className={`${
                                    i % 2 !== 0 ? "bg-gray-100" : ""
                                } text-center hover:bg-sky-50 transition-colors duration-200`}
                            >
                                <td className="py-3 px-4">{d.german}</td>
                                <td className="py-3 px-4">{d.english}</td>
                                <td className="hidden sm:table-cell py-3 px-4">
                                    {d.type || "Any"}
                                </td>
                                <td className="py-3 px-4">
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="bg-transparent text-sky-800 p-2 rounded-full hover:bg-sky-100 transition-colors duration-200 mr-2"
                                        onClick={() => handleSpeak(d.german)}
                                        aria-label="Speak"
                                    >
                                        <img
                                            src="/speaker.svg"
                                            alt="Speak Icon"
                                            className="h-5 w-5"
                                        />
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="bg-transparent text-red-600 p-2 rounded-full hover:bg-red-100 transition-colors duration-200"
                                        onClick={() => handleOpenModal(d.uuid)}
                                        aria-label="Delete"
                                    >
                                        <img
                                            src="/delete.svg"
                                            alt="Delete Icon"
                                            className="h-5 w-5"
                                        />
                                    </motion.button>
                                    <div
                                        ref={(el) =>
                                            (modalRefs.current[d.uuid] = el)
                                        }
                                        className="fixed inset-0 flex items-center justify-center z-50 hidden"
                                    >
                                        <motion.div
                                            initial={{
                                                opacity: 0,
                                                scale: 0.8,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                scale: 1,
                                            }}
                                            exit={{
                                                opacity: 0,
                                                scale: 0.8,
                                            }}
                                            className="bg-white p-6 rounded-lg shadow-xl z-10 max-w-sm w-full"
                                        >
                                            <h3 className="text-lg font-semibold mb-4">
                                                Confirm Deletion
                                            </h3>
                                            <p className="mb-6">
                                                Are you sure you want to delete{" "}
                                                <span className="font-bold">
                                                    {d.german}
                                                </span>
                                                ?
                                            </p>
                                            <div className="flex justify-end space-x-4">
                                                <motion.button
                                                    whileHover={{
                                                        scale: 1.05,
                                                    }}
                                                    whileTap={{
                                                        scale: 0.95,
                                                    }}
                                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors duration-200"
                                                    onClick={() =>
                                                        handleCloseModal(d.uuid)
                                                    }
                                                >
                                                    Cancel
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{
                                                        scale: 1.05,
                                                    }}
                                                    whileTap={{
                                                        scale: 0.95,
                                                    }}
                                                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200 flex items-center"
                                                    onClick={() =>
                                                        handleDelete(d.uuid)
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
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                        <div
                                            className="fixed inset-0 bg-black opacity-50"
                                            onClick={() =>
                                                handleCloseModal(d.uuid)
                                            }
                                        ></div>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex justify-center space-x-4 my-10 items-center"
            >
                <PageButton
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                >
                    First
                </PageButton>
                <PageButton
                    onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                >
                    Prev
                </PageButton>
                <span className="text-sky-800 font-medium">
                    {currentPage} / {numberOfPages}
                </span>
                <PageButton
                    onClick={() =>
                        setCurrentPage((prev) =>
                            Math.min(prev + 1, numberOfPages)
                        )
                    }
                    disabled={currentPage === numberOfPages}
                >
                    Next
                </PageButton>
                <PageButton
                    onClick={() => setCurrentPage(numberOfPages)}
                    disabled={currentPage === numberOfPages}
                >
                    Last
                </PageButton>
            </motion.div>
        </motion.div>
    );
}

function PageButton({ children, onClick, disabled }) {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded-full ${
                disabled
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-sky-800 text-white hover:bg-sky-700 transition-colors duration-200"
            }`}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </motion.button>
    );
}
