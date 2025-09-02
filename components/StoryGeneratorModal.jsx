"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSpinner, FaVolumeUp, FaPause, FaStop, FaSave, FaDownload, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import { generateStory } from "@/server_actions/generateStories";

const StoryGeneratorModal = ({ isOpen, onClose, selectedWords, onSpeak }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedStory, setGeneratedStory] = useState(null);
    const [currentLanguage, setCurrentLanguage] = useState('german'); // 'german' or 'english'
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const speechRef = useRef(null);
    const [preferences, setPreferences] = useState({
        length: "medium",
        style: "educational",
        includeEnglish: true
    });
    const [hoveredWord, setHoveredWord] = useState(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setGeneratedStory(null);
            setIsGenerating(false);
            setCurrentLanguage('german');
            stopAudio();
        }
    }, [isOpen]);

    // Cleanup audio when component unmounts
    useEffect(() => {
        return () => {
            stopAudio();
        };
    }, []);

    const handleGenerateStory = async () => {
        if (!selectedWords || selectedWords.length === 0) {
            toast.error("Please select some words first!");
            return;
        }

        setIsGenerating(true);
        try {
            const result = await generateStory(selectedWords, preferences);
            
            if (result.success) {
                setGeneratedStory(result);
                toast.success("Story generated successfully!");
            } else {
                toast.error(result.error || "Failed to generate story");
            }
        } catch (error) {
            toast.error("An error occurred while generating the story");
            console.error("Story generation error:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveStory = async () => {
        if (!generatedStory) return;
        
        try {
            const storyToSave = {
                title: `Bilingual story with ${selectedWords.length} words`,
                germanStory: generatedStory.germanStory,
                englishStory: generatedStory.englishStory,
                wordsUsed: selectedWords,
                preferences
            };

            const response = await fetch('/api/stories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(storyToSave)
            });

            const result = await response.json();

            if (result.success) {
                toast.success("Story saved successfully!");
            } else {
                throw new Error(result.error || "Failed to save story");
            }
        } catch (error) {
            console.error("Error saving story:", error);
            toast.error(error.message || "Failed to save story");
        }
    };

    const handleExportStory = () => {
        if (!generatedStory) return;
        
        try {
            const exportContent = `Bilingual German Learning Story
Generated on: ${new Date().toLocaleDateString()}

Vocabulary Words Used: ${selectedWords.map(w => `${w.german} (${w.english})`).join(', ')}

=== GERMAN VERSION ===
${generatedStory.germanStory}

=== ENGLISH VERSION ===
${generatedStory.englishStory}

---
Generated with German Words Learning App`;

            const blob = new Blob([exportContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `bilingual-story-${Date.now()}.txt`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success("Story exported successfully!");
        } catch (error) {
            toast.error("Failed to export story");
        }
    };

    const stopAudio = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            setIsPaused(false);
            speechRef.current = null;
        }
    };

    const pauseAudio = () => {
        if ('speechSynthesis' in window && isPlaying) {
            window.speechSynthesis.pause();
            setIsPaused(true);
        }
    };

    const resumeAudio = () => {
        if ('speechSynthesis' in window && isPaused) {
            window.speechSynthesis.resume();
            setIsPaused(false);
        }
    };

    const handleReadStory = () => {
        if (!generatedStory) return;
        
        // Stop any ongoing speech first
        stopAudio();
        
        // Get the current story text based on language toggle
        const currentStory = currentLanguage === 'german' ? generatedStory.germanStory : generatedStory.englishStory;
        
        // Remove markdown formatting for speech
        const cleanText = currentStory.replace(/\*\*(.*?)\*\*/g, '$1');
        
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.rate = 0.7; // Slower rate for learning
            utterance.volume = 0.8;
            utterance.lang = currentLanguage === 'german' ? 'de-DE' : 'en-US';
            
            // Set up event listeners
            utterance.onstart = () => {
                setIsPlaying(true);
                setIsPaused(false);
            };
            
            utterance.onend = () => {
                setIsPlaying(false);
                setIsPaused(false);
                speechRef.current = null;
            };
            
            utterance.onerror = () => {
                setIsPlaying(false);
                setIsPaused(false);
                speechRef.current = null;
                toast.error("Speech synthesis error");
            };
            
            // Load voices first if not already loaded
            const setVoice = () => {
                const voices = window.speechSynthesis.getVoices();
                let targetVoice;
                
                if (currentLanguage === 'german') {
                    targetVoice = voices.find(voice => 
                        voice.lang.includes('de') || voice.lang.includes('DE')
                    );
                } else {
                    targetVoice = voices.find(voice => 
                        voice.lang.includes('en') || voice.lang.includes('EN')
                    );
                }
                
                if (targetVoice) {
                    utterance.voice = targetVoice;
                    console.log(`Using ${currentLanguage} voice:`, targetVoice.name);
                } else {
                    console.log(`No ${currentLanguage} voice found, using default`);
                }
            };

            // Voices might not be loaded immediately
            if (window.speechSynthesis.getVoices().length === 0) {
                window.speechSynthesis.addEventListener('voiceschanged', setVoice, { once: true });
            } else {
                setVoice();
            }
            
            speechRef.current = utterance;
            window.speechSynthesis.speak(utterance);
            toast.success(`${currentLanguage === 'german' ? 'German' : 'English'} story is being read...`);
        } else {
            toast.error("Speech synthesis not supported in your browser");
        }
    };

    const renderStoryWithHighlights = (story) => {
        if (!story) return "";
        
        // Replace **word** with clickable highlighted spans
        return story.replace(/\*\*(.*?)\*\*/g, (match, word) => {
            // Remove any parentheses with translations for finding the word
            const cleanWord = word.replace(/\s*\(.*?\)\s*/, '').trim();
            
            const wordData = selectedWords.find(w => 
                w.german.toLowerCase() === cleanWord.toLowerCase()
            );
            
            return `<span class="german-word" data-english="${wordData?.english || ''}" data-type="${wordData?.type || ''}">${word}</span>`;
        });
    };

    const handleWordClick = (word, english, type) => {
        if (onSpeak && word) {
            onSpeak(word);
        }
        toast(`${word} → ${english} (${type})`);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-primary text-white p-4 flex items-center justify-between">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            📖 Bilingual Story Generator
                            <span className="text-sm font-normal opacity-80">
                                ({selectedWords?.length || 0} words selected)
                            </span>
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                        >
                            <FaTimes />
                        </button>
                    </div>

                    <div className="overflow-y-auto max-h-[calc(90vh-4rem)]">
                        {/* Selected Words Display */}
                        <div className="p-4 bg-gray-50 border-b">
                            <h3 className="font-medium text-gray-700 mb-2">Selected Words:</h3>
                            <div className="flex flex-wrap gap-2">
                                {selectedWords?.map((word, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                                        title={`${word.german} → ${word.english} (${word.type || 'word'})`}
                                    >
                                        {word.german}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Story Preferences */}
                        {!generatedStory && (
                            <div className="p-4 border-b bg-white">
                                <h3 className="font-medium text-gray-700 mb-3">Story Preferences:</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Length Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">
                                            Length:
                                        </label>
                                        <select
                                            value={preferences.length}
                                            onChange={(e) => setPreferences({...preferences, length: e.target.value})}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="short">Short (150-200 words)</option>
                                            <option value="medium">Medium (300-400 words)</option>
                                            <option value="long">Long (500-700 words)</option>
                                        </select>
                                    </div>

                                    {/* Style Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">
                                            Style:
                                        </label>
                                        <select
                                            value={preferences.style}
                                            onChange={(e) => setPreferences({...preferences, style: e.target.value})}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="educational">📚 Educational</option>
                                            <option value="adventure">🗺️ Adventure</option>
                                            <option value="daily">🏠 Daily Life</option>
                                            <option value="funny">😂 Funny</option>
                                            <option value="mystery">🔍 Mystery</option>
                                        </select>
                                    </div>

                                    {/* Options */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">
                                            Options:
                                        </label>
                                        <div className="space-y-2">
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={preferences.includeEnglish}
                                                    onChange={(e) => setPreferences({...preferences, includeEnglish: e.target.checked})}
                                                    className="mr-2"
                                                />
                                                <span className="text-sm">Include English hints</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Generate Button */}
                        {!generatedStory && (
                            <div className="p-4 border-b">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleGenerateStory}
                                    disabled={isGenerating || !selectedWords?.length}
                                    className={`w-full py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                                        isGenerating || !selectedWords?.length
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                >
                                    {isGenerating ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            Creating German story & English translation...
                                        </>
                                    ) : (
                                        <>
                                            ✨ Generate Bilingual Story
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        )}

                        {/* Generated Story Display */}
                        {generatedStory && (
                            <div className="p-4">
                                {/* Language Toggle & Story Actions */}
                                <div className="flex items-center justify-between mb-4 pb-3 border-b">
                                    <div className="flex items-center gap-4">
                                        <h3 className="font-medium text-gray-700">Your Story:</h3>
                                        
                                        {/* Language Toggle */}
                                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                            <button
                                                onClick={() => {
                                                    setCurrentLanguage('german');
                                                    stopAudio(); // Stop audio when switching language
                                                }}
                                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                                                    currentLanguage === 'german'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-gray-600 hover:text-gray-800'
                                                }`}
                                            >
                                                🇩🇪 German
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setCurrentLanguage('english');
                                                    stopAudio(); // Stop audio when switching language
                                                }}
                                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                                                    currentLanguage === 'english'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-gray-600 hover:text-gray-800'
                                                }`}
                                            >
                                                🇺🇸 English
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        {/* Audio Controls */}
                                        {!isPlaying ? (
                                            <button
                                                onClick={handleReadStory}
                                                className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                                title={`Read ${currentLanguage} story aloud`}
                                            >
                                                <FaVolumeUp />
                                            </button>
                                        ) : (
                                            <div className="flex gap-1">
                                                {!isPaused ? (
                                                    <button
                                                        onClick={pauseAudio}
                                                        className="p-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                                                        title="Pause"
                                                    >
                                                        <FaPause />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={resumeAudio}
                                                        className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                                        title="Resume"
                                                    >
                                                        <FaVolumeUp />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={stopAudio}
                                                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                                    title="Stop"
                                                >
                                                    <FaStop />
                                                </button>
                                            </div>
                                        )}
                                        <button
                                            onClick={handleSaveStory}
                                            className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                            title="Save story"
                                        >
                                            <FaSave />
                                        </button>
                                        <button
                                            onClick={handleExportStory}
                                            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                            title="Export story"
                                        >
                                            <FaDownload />
                                        </button>
                                        <button
                                            onClick={() => setGeneratedStory(null)}
                                            className="p-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                                            title="Generate new story"
                                        >
                                            🔄 New Story
                                        </button>
                                    </div>
                                </div>

                                {/* Story Content */}
                                <div 
                                    className="prose max-w-none text-gray-800 leading-relaxed"
                                    dangerouslySetInnerHTML={{
                                        __html: renderStoryWithHighlights(
                                            currentLanguage === 'german' 
                                                ? generatedStory.germanStory 
                                                : generatedStory.englishStory
                                        )
                                    }}
                                    onClick={(e) => {
                                        if (e.target.classList.contains('german-word')) {
                                            const word = e.target.textContent;
                                            const english = e.target.getAttribute('data-english');
                                            const type = e.target.getAttribute('data-type');
                                            handleWordClick(word, english, type);
                                        }
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>

            {/* Custom Styles */}
            <style jsx global>{`
                .german-word {
                    background-color: #fef3c7;
                    color: #92400e;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: 2px solid transparent;
                }
                
                .german-word:hover {
                    background-color: #fcd34d;
                    border-color: #f59e0b;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
            `}</style>
        </AnimatePresence>
    );
};

export default StoryGeneratorModal;