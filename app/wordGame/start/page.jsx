"use client";
import { getRandomWords } from "@/server_actions/words";
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import EndGame from "@/components/wordGame/EndGame";
import Loader from "@/components/utility/Loader";
import toast from "react-hot-toast";

const WordGame = () => {
    const [words, setWords] = useState([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [userInput, setUserInput] = useState("");
    const [responses, setResponses] = useState([]);
    const [refresh, setRefresh] = useState(false);
    const inputRef = useRef();

    useEffect(() => {
        const fetchData = async () => {
            const words = await getRandomWords();
            setWords(JSON.parse(words));
            if (inputRef.current) {
                inputRef.current.focus();
            }
        };
        fetchData();
    }, [refresh]);

    const handleNextWord = () => {
        if (userInput.trim() === "") {
            toast.error("Please enter a translation for the word");
            return;
        }
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
        return <Loader />;
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
                    <div className="text-gray-900 text-lg mb-4 flex justify-between items-center">
                        <span>
                            Word:{" "}
                            <span className="font-bold">
                                {words[currentWordIndex].german}
                            </span>
                        </span>
                        <span>
                            {currentWordIndex + 1} / {words.length}
                        </span>
                    </div>
                    <input
                        type="text"
                        value={userInput}
                        ref={inputRef}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => {
                            e.key === "Enter" ? handleNextWord() : null;
                        }}
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
