"use client";
import React, { useState } from "react";

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
            // utterance.rate = 1;
            speechSynthesis.speak(utterance);
        } else {
            alert("SpeechSynthesis is not supported in this browser");
        }
    }

    return (
        <div>
            <table className="w-full table-fixed mt-10">
                <thead>
                    {HEADERS.map((h, i) => (
                        <th key={i} className="bg-gray-200 capitalize py-2">
                            {h}
                        </th>
                    ))}
                </thead>
                <tbody>
                    {records.map((d, i) => {
                        return (
                            <tr
                                className={`${
                                    i % 2 !== 0 && "bg-gray-200"
                                } text-center capitalize`}
                                key={d.german}
                            >
                                <td className="">{d.german}</td>
                                <td>{d.english}</td>
                                <td>{d.type ? d.type : 'Any'}</td>
                                <td>
                                    <button
                                        className="bg-transparent border-2 border-blue-500 hover:bg-blue-800 hover:text-white py-1 px-4 my-2 rounded transition-all duration-500"
                                        onClick={() => handleSpeak(d.german)}
                                    >
                                        Speak
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <div className="w-full flex flex-row items-center p-5">
                <div className="flex flex-row items-center gap-4">
                    <span
                        className="cursor-pointer font-semibold"
                        onClick={() => prevPage()}
                    >
                        prev
                    </span>
                    <div className="flex flex-row items-center">
                        <span>{currentPage}</span>
                        <span>/</span>
                        <span>{numberOfPages}</span>
                    </div>
                    <span
                        className="cursor-pointer font-semibold"
                        onClick={() => nextPage()}
                    >
                        next
                    </span>
                </div>
            </div>
        </div>
    );

    function nextPage() {
        if (currentPage != numberOfPages) {
            setCurrentPage((prev) => prev + 1);
        }
    }

    function prevPage() {
        if (currentPage != 1) {
            setCurrentPage((prev) => prev - 1);
        }
    }
}

export default Table;
