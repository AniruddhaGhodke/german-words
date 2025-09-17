"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaTimes,
    FaVolumeUp,
    FaPause,
    FaStop,
    FaDownload,
    FaCalendarAlt,
    FaTags,
    FaLanguage,
    FaCog,
} from "react-icons/fa";
import toast from "react-hot-toast";

const StoryViewer = ({ story, onClose }) => {
    const [currentLanguage, setCurrentLanguage] = useState("german");
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [readingSpeed, setReadingSpeed] = useState(1.0);
    const speechRef = useRef(null);

    // Track if component is mounted
    const isMountedRef = useRef(true);

    // Stop audio function
    const stopAudio = useCallback(async () => {
        try {
            const { stopSpeaking } = await import("../utils/speechSynthesis");
            await stopSpeaking();
        } catch (error) {
            console.warn("Enhanced TTS stop error, using fallback:", error);
            if (typeof window !== "undefined" && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
            }
        } finally {
            if (isMountedRef.current) {
                setTimeout(() => {
                    if (isMountedRef.current) {
                        setIsPlaying(false);
                        setIsPaused(false);
                        speechRef.current = null;
                    }
                }, 10);
            }
        }
    }, []);

    // Pause audio
    const pauseAudio = useCallback(async () => {
        try {
            const { pauseSpeaking } = await import("../utils/speechSynthesis");
            const success = await pauseSpeaking();
            if (success) {
                setIsPaused(true);
            }
        } catch (error) {
            console.error("Error pausing audio:", error);
        }
    }, []);

    // Resume audio
    const resumeAudio = useCallback(async () => {
        try {
            const { resumeSpeaking } = await import("../utils/speechSynthesis");
            const success = await resumeSpeaking();
            if (success) {
                setIsPaused(false);
            }
        } catch (error) {
            console.error("Error resuming audio:", error);
        }
    }, []);

    // Handle read story
    const handleReadStory = useCallback(async () => {
        if (!story) return;

        await stopAudio();
        stopWordTracking();

        const currentStory =
            currentLanguage === "german"
                ? story.germanStory
                : story.englishStory;
        const cleanText = currentStory.replace(/\*\*(.*?)\*\*/g, "$1");

        try {
            const { speakText } = await import("../utils/speechSynthesis");

            setIsPlaying(true);
            setIsPaused(false);

            await speakText(
                cleanText,
                currentLanguage === "german" ? "de" : "en",
                {
                    rate: readingSpeed,
                    speakingRate: readingSpeed,
                    volume: 0.8,
                    pitch: 1,
                    onStart: () => {
                        if (isMountedRef.current) {
                            setIsPlaying(true);
                            setIsPaused(false);
                        }
                    },
                    onEnd: () => {
                        if (isMountedRef.current) {
                            setIsPlaying(false);
                            setIsPaused(false);
                            speechRef.current = null;
                        }
                    },
                    onError: (error) => {
                        if (isMountedRef.current) {
                            setIsPlaying(false);
                            setIsPaused(false);
                            speechRef.current = null;
                            if (
                                error !== "interrupted" &&
                                error !== "canceled"
                            ) {
                                toast.error("Speech synthesis error");
                            }
                        }
                    },
                }
            );

            toast.success(
                `📖 ${
                    currentLanguage === "german" ? "German" : "English"
                } story is being read!`
            );
        } catch (error) {
            console.error("Error with TTS:", error);
            // Fallback logic omitted for brevity
        }
    }, [story, currentLanguage, readingSpeed, stopAudio]);

    // Handle export story
    const handleExportStory = useCallback(() => {
        if (!story) return;

        try {
            const exportContent = `Bilingual German Learning Story
    Generated on: ${new Date(story.createdAt).toLocaleDateString()}
    Title: ${story.title}
    
    Vocabulary Words Used: ${story.wordsUsed
        .map((w) => `${w.german} (${w.english})`)
        .join(", ")}
    
    === GERMAN VERSION ===
    ${story.germanStory}
    
    === ENGLISH VERSION ===
    ${story.englishStory}
    
    Story Preferences:
    - Style: ${story.preferences.style}
    - Length: ${story.preferences.length}
    - Include English Hints: ${
        story.preferences.includeEnglish ? "Yes" : "No"
    }`;

            const blob = new Blob([exportContent], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${story.title
                .replace(/[^a-z0-9]/gi, "_")
                .toLowerCase()}-${Date.now()}.txt`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success("Story exported successfully!");
        } catch (error) {
            console.error("Error exporting story:", error);
            toast.error("Failed to export story");
        }
    }, [story]);

    // Handle word click
    const handleWordClick = useCallback(async (word, english, type) => {
        if (word) {
            try {
                const { speakGermanWord } = await import(
                    "../utils/speechSynthesis"
                );
                await speakGermanWord(word);
            } catch (error) {
                console.warn("TTS word click error:", error);
            }
        }
        toast(`${word} → ${english} (${type})`);
    }, []);

    // Simplified render function for story with vocabulary highlights only
    const renderStoryWithHighlights = useCallback(
        (storyText) => {
            if (!storyText) return "";

            // Replace **word** with vocabulary highlighting
            return storyText.replace(/\*\*(.*?)\*\*/g, (match, word) => {
                // Remove any parentheses with translations for finding the word
                const cleanWord = word.replace(/\s*\(.*?\)\s*/, "").trim();

                const wordData = story.wordsUsed.find(
                    (w) => w.german.toLowerCase() === cleanWord.toLowerCase()
                );

                return `<span class="german-word" data-english="${
                    wordData?.english || ""
                }" data-type="${wordData?.type || ""}">${word}</span>`;
            });
        },
        [story]
    );

    // Memoized helpers
    const getStyleEmoji = useCallback((style) => {
        const emojis = {
            educational: "📚",
            adventure: "🗺️",
            daily: "🏠",
            funny: "😂",
            mystery: "🔍",
        };
        return emojis[style] || "📖";
    }, []);

    const getTimeAgo = useCallback((date) => {
        const now = new Date();
        const created = new Date(date);
        const diffTime = Math.abs(now - created);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
            if (diffHours === 0) {
                const diffMinutes = Math.floor(diffTime / (1000 * 60));
                return `${diffMinutes} minute${
                    diffMinutes !== 1 ? "s" : ""
                } ago`;
            }
            return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
        } else if (diffDays === 1) {
            return "Yesterday";
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return created.toLocaleDateString();
        }
    }, []);

    // Memoized story content
    const storyContent = renderStoryWithHighlights(
        currentLanguage === "german" ? story?.germanStory : story?.englishStory
    );

    // Component mount/unmount tracking
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopAudio();
        };
    }, [stopAudio]);

    // Reset when story or language changes
    useEffect(() => {
        if (!story) {
            stopAudio();
        }
    }, [story, stopAudio]);

    if (!story) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        stopAudio();
                        onClose();
                    }
                }}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className="text-3xl">
                                    {getStyleEmoji(story.preferences.style)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold mb-2">
                                        {story.title}
                                    </h2>
                                    <div className="flex items-center gap-4 text-sm opacity-90">
                                        <div className="flex items-center gap-1">
                                            <FaCalendarAlt />
                                            <span>
                                                {getTimeAgo(story.createdAt)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <FaTags />
                                            <span>
                                                {story.wordsUsed.length} words
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <FaLanguage />
                                            <span>Bilingual</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    stopAudio();
                                    onClose();
                                }}
                                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
                        {/* Story Metadata */}
                        <div className="p-6 bg-gray-50 border-b">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Words Used */}
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        <FaTags />
                                        Vocabulary Words Used (
                                        {story.wordsUsed.length})
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {story.wordsUsed.map((word, index) => (
                                            <div
                                                key={index}
                                                className="group relative"
                                            >
                                                <span
                                                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium cursor-pointer hover:bg-blue-200 transition-colors"
                                                    title={`${word.german} → ${
                                                        word.english
                                                    } (${word.type || "word"})`}
                                                    onClick={() =>
                                                        handleWordClick(
                                                            word.german,
                                                            word.english,
                                                            word.type
                                                        )
                                                    }
                                                >
                                                    {word.german}
                                                </span>
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                                    {word.english} (
                                                    {word.type || "word"})
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Story Preferences */}
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        <FaCog />
                                        Story Settings
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex gap-3">
                                            <span className="text-gray-600">
                                                Style:
                                            </span>
                                            <span className="font-medium capitalize">
                                                {getStyleEmoji(
                                                    story.preferences.style
                                                )}{" "}
                                                {story.preferences.style}
                                            </span>
                                        </div>
                                        <div className="flex gap-3">
                                            <span className="text-gray-600">
                                                Length:
                                            </span>
                                            <span className="font-medium capitalize">
                                                {story.preferences.length}
                                            </span>
                                        </div>
                                        <div className="flex gap-3">
                                            <span className="text-gray-600">
                                                English Hints:
                                            </span>
                                            <span className="font-medium">
                                                {story.preferences
                                                    .includeEnglish
                                                    ? "Yes"
                                                    : "No"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Language Toggle & Story Actions */}
                        <div className="p-4 md:p-6 border-b bg-white">
                            {/* Header and Language Toggle */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    <h3 className="font-semibold text-gray-700">
                                        Story Content:
                                    </h3>

                                    {/* Language Toggle */}
                                    <div className="flex items-center bg-gray-100 rounded-lg p-1 w-fit">
                                        <button
                                            onClick={() => {
                                                setCurrentLanguage("german");
                                                stopAudio(); // Stop audio when switching language
                                            }}
                                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                                                currentLanguage === "german"
                                                    ? "bg-blue-600 text-white"
                                                    : "text-gray-600 hover:text-gray-800"
                                            }`}
                                        >
                                            🇩🇪 German
                                        </button>
                                        <button
                                            onClick={() => {
                                                setCurrentLanguage("english");
                                                stopAudio(); // Stop audio when switching language
                                            }}
                                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                                                currentLanguage === "english"
                                                    ? "bg-blue-600 text-white"
                                                    : "text-gray-600 hover:text-gray-800"
                                            }`}
                                        >
                                            🇺🇸 English
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Speed Control and Action Buttons */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                {/* Reading Speed Control */}
                                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                                    <span className="text-sm font-medium text-gray-600">
                                        Speed:
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">
                                            0.5x
                                        </span>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="2.0"
                                            step="0.1"
                                            value={readingSpeed}
                                            onChange={(e) =>
                                                setReadingSpeed(
                                                    parseFloat(e.target.value)
                                                )
                                            }
                                            className="w-16 sm:w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                            title={`Reading speed: ${readingSpeed}x`}
                                        />
                                        <span className="text-xs text-gray-500">
                                            2.0x
                                        </span>
                                        <span className="text-sm font-medium text-blue-600 min-w-[2.5rem]">
                                            {readingSpeed}x
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap items-center gap-2">
                                    {/* Audio Controls */}
                                    {!isPlaying ? (
                                        <button
                                            onClick={handleReadStory}
                                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                            title={`Read ${currentLanguage} story aloud`}
                                        >
                                            <FaVolumeUp />
                                            <span className="hidden xs:inline">
                                                Read Aloud
                                            </span>
                                            <span className="xs:hidden">
                                                Read
                                            </span>
                                        </button>
                                    ) : (
                                        <div className="flex gap-1">
                                            {!isPaused ? (
                                                <button
                                                    onClick={pauseAudio}
                                                    className="flex items-center gap-1 px-2 sm:px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                                                    title="Pause"
                                                >
                                                    <FaPause />
                                                    <span className="hidden sm:inline">
                                                        Pause
                                                    </span>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={resumeAudio}
                                                    className="flex items-center gap-1 px-2 sm:px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                                    title="Resume"
                                                >
                                                    <FaVolumeUp />
                                                    <span className="hidden sm:inline">
                                                        Resume
                                                    </span>
                                                </button>
                                            )}
                                            <button
                                                onClick={stopAudio}
                                                className="flex items-center gap-1 px-2 sm:px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                                title="Stop"
                                            >
                                                <FaStop />
                                                <span className="hidden sm:inline">
                                                    Stop
                                                </span>
                                            </button>
                                        </div>
                                    )}
                                    <button
                                        onClick={handleExportStory}
                                        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                                        title="Export story"
                                    >
                                        <FaDownload />
                                        <span className="hidden xs:inline">
                                            Export
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Story Content */}
                        <div className="p-6">
                            <div
                                className="prose max-w-none text-gray-800 leading-relaxed text-lg story-content"
                                dangerouslySetInnerHTML={{
                                    __html: storyContent,
                                }}
                                onClick={(e) => {
                                    if (
                                        e.target.classList.contains(
                                            "german-word"
                                        )
                                    ) {
                                        const word = e.target.textContent;
                                        const english =
                                            e.target.getAttribute(
                                                "data-english"
                                            );
                                        const type =
                                            e.target.getAttribute("data-type");
                                        handleWordClick(word, english, type);
                                    }
                                }}
                            />
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Custom Styles */}
            <style jsx global>{`
                .german-word {
                    background-color: #fef3c7;
                    color: #92400e;
                    padding: 3px 8px;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: 2px solid transparent;
                    margin: 0 2px;
                }

                .german-word:hover {
                    background-color: #fcd34d;
                    border-color: #f59e0b;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .slider::-webkit-slider-thumb {
                    appearance: none;
                    height: 16px;
                    width: 16px;
                    border-radius: 50%;
                    background: #2563eb;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }

                .slider::-webkit-slider-thumb:hover {
                    background: #1d4ed8;
                    transform: scale(1.1);
                }

                .slider::-moz-range-thumb {
                    height: 16px;
                    width: 16px;
                    border-radius: 50%;
                    background: #2563eb;
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }

                .slider::-moz-range-thumb:hover {
                    background: #1d4ed8;
                    transform: scale(1.1);
                }

                .story-content {
                    scroll-behavior: smooth;
                    position: relative;
                }

                /* Accessibility improvements */
                @media (prefers-reduced-motion: reduce) {
                    .story-content {
                        scroll-behavior: auto;
                    }
                }
            `}</style>
        </AnimatePresence>
    );
};

export default StoryViewer;
