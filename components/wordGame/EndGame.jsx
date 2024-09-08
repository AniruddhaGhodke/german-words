"use client";
import React from "react";
import { motion } from "framer-motion";
import Fuse from "fuse.js";

const EndGame = ({ responses, playAgain }) => {
    const checkResponse = (response, correctAnswers) => {
        const fuse = new Fuse(correctAnswers, {
            includeScore: true,
            threshold: 0.1, // Adjust this threshold based on your needs
        });
        const result = fuse.search(response);
        return result.length > 0 && result[0].score < 0.1;
    };

    return (
        <div className="bg-[url('/svg1.svg')] bg-cover bg-center relative h-screen pt-28">
            <div className="flex flex-col max-w-screen-xl mx-auto p-4">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0.8, 1.2, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="bg-teriary-100 bg-opacity-80 rounded-lg shadow-lg p-3 sm:p-6"
                >
                    <div className="flex flex-1 justify-between mb-6">
                        <h1 className="text-2xl sm:text-5xl font-bold text-teriary-900">
                            Game Over!
                        </h1>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className="text-teriary-800 font-bold py-2 px-4 underline"
                            onClick={playAgain}
                        >
                            Play Again!
                        </motion.button>
                    </div>
                    <div className="text-teriary-900 font-semibold text-2xl mb-4">
                        Your responses:{" "}
                    </div>
                    <table className="w-full table-fixed text-sm sm:text-base overflow-hidden rounded-md">
                        <thead>
                            <tr className="bg-teriary-900 text-white pb-3">
                                <th className="font-semibold text-base sm:text-xl mb-4">
                                    German Word
                                </th>
                                <th className="font-semibold text-base sm:text-xl mb-4">
                                    Correct Answer
                                </th>
                                <th className="font-semibold text-base sm:text-xl mb-4">
                                    Your Response
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {JSON.parse(responses).map((res, i) => (
                                <tr
                                    key={i}
                                    className="font-semibold text-teriary-900 text-center"
                                >
                                    <td>{res.word.german}</td>
                                    <td>{res.word.english}</td>
                                    <td
                                        className={
                                            checkResponse(
                                                res.response.toLowerCase(),
                                                res.word.english.split(",")
                                            )
                                                ? "text-green-500"
                                                : "text-red-500"
                                        }
                                    >
                                        {res.response}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            </div>
        </div>
    );
};

export default EndGame;
