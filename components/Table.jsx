"use client";
import React, { useState, useEffect } from "react";

const HEADERS = ["German word", "English word", "Type", "Speak"];

function Table({ data }) {
    const [currentPage, setCurrentPage] = useState(1);
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

    return (
        <div>
            <table className="w-11/12 m-auto table-fixed mt-10 shadow-xl">
                <thead>
                    <tr className="bg-sky-800 text-white">
                        {HEADERS.map((header, index) => (
                            <th
                                key={index}
                                scope="col"
                                className="capitalize py-2"
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
                            } text-center capitalize`}
                            key={d.german}
                        >
                            <td>{d.german}</td>
                            <td>{d.english}</td>
                            <td>{d.type || "Any"}</td>
                            <td>
                                <button
                                    className="bg-transparent border-2 border-sky-600 hover:bg-sky-800 hover:border-sky-800 hover:text-white py-1 px-4 my-2 rounded transition-all duration-500"
                                    onClick={() => handleSpeak(d.german)}
                                >
                                    Speak
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="w-full flex justify-center space-x-4 my-4 items-center">
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
            </div>
        </div>
    );
}

export default Table;
