"use client";
import { getRandomWords } from "@/server_actions/words";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import EndGame from "@/components/wordGame/EndGame";

const WordGame = () => {
    const [words, setWords] = useState([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [userInput, setUserInput] = useState("");
    const [responses, setResponses] = useState([]);
    const [refresh, setRefresh] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const words = await getRandomWords();
            setWords(JSON.parse(words));
        };
        fetchData();
    }, [refresh]);

    const handleInputChange = (e) => {
        setUserInput(e.target.value);
    };

    const handleNextWord = () => {
        setResponses([
            ...responses,
            { word: words[currentWordIndex], response: userInput },
        ]);
        setUserInput("");
        setCurrentWordIndex(currentWordIndex + 1);
    };

    const handleRefresh = () => {
        setRefresh(!refresh);
        setCurrentWordIndex(0);
        setUserInput("");
        setResponses([]);
    };

    if (words.length === 0) {
        return <p>Loading...</p>;
    }

    if (currentWordIndex >= words.length) {
        return (
            <EndGame
                playAgain={handleRefresh}
                responses={JSON.stringify(responses)}
            />
        );
    }
    return (
        <div className="bg-[url('/svg1.svg')] bg-cover bg-center relative h-screen pt-28">
            <div className="flex flex-col max-w-screen-xl mx-auto p-4">
                <div className="bg-white bg-opacity-80 rounded-lg shadow-lg p-6">
                    <div className="text-gray-900 text-lg mb-4">
                        Word:{" "}
                        <span className="font-bold">
                            {words[currentWordIndex].german}
                        </span>
                    </div>
                    <input
                        type="text"
                        value={userInput}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded mb-4"
                        placeholder="Enter your translation for above word"
                    />
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        onClick={handleNextWord}
                        className="bg-teriary-900 text-gray-200 font-bold py-2 px-4 rounded hover:bg-teriary-800 hover:text-white"
                    >
                        Next
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default WordGame;
