"use client";

import React, { useState, useRef, useEffect } from "react";
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
    FaCog
} from "react-icons/fa";
import toast from "react-hot-toast";

const StoryViewer = ({ story, onClose }) => {
    const [currentLanguage, setCurrentLanguage] = useState('german');
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const speechRef = useRef(null);

    // Cleanup audio when component unmounts or modal closes
    useEffect(() => {
        return () => {
            stopAudio();
        };
    }, []);

    // Stop audio when story changes or component is about to unmount
    useEffect(() => {
        if (!story) {
            stopAudio();
        }
    }, [story]);

    const stopAudio = () => {
        try {
            if ('speechSynthesis' in window) {
                // Cancel any ongoing speech
                window.speechSynthesis.cancel();
                
                // Wait a bit for the cancel to complete, then reset states
                setTimeout(() => {
                    setIsPlaying(false);
                    setIsPaused(false);
                    speechRef.current = null;
                }, 10);
            }
        } catch (error) {
            console.warn('Speech synthesis error during cleanup:', error);
            // Still reset the states even if there's an error
            setIsPlaying(false);
            setIsPaused(false);
            speechRef.current = null;
        }
    };

    const pauseAudio = () => {
        try {
            if ('speechSynthesis' in window && isPlaying) {
                window.speechSynthesis.pause();
                setIsPaused(true);
            }
        } catch (error) {
            console.warn('Speech synthesis pause error:', error);
        }
    };

    const resumeAudio = () => {
        try {
            if ('speechSynthesis' in window && isPaused) {
                window.speechSynthesis.resume();
                setIsPaused(false);
            }
        } catch (error) {
            console.warn('Speech synthesis resume error:', error);
        }
    };

    const handleReadStory = () => {
        if (!story) return;
        
        // Stop any ongoing speech first
        stopAudio();
        
        // Get the current story text based on language toggle
        const currentStory = currentLanguage === 'german' ? story.germanStory : story.englishStory;
        
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
            
            utterance.onerror = (event) => {
                console.warn('Speech synthesis error:', event);
                setIsPlaying(false);
                setIsPaused(false);
                speechRef.current = null;
                // Only show error toast if it's not due to interruption/cancellation
                if (event.error !== 'interrupted' && event.error !== 'canceled') {
                    toast.error("Speech synthesis error");
                }
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

    const handleExportStory = () => {
        try {
            const exportContent = `Bilingual German Learning Story
Generated on: ${new Date(story.createdAt).toLocaleDateString()}
Title: ${story.title}

Vocabulary Words Used: ${story.wordsUsed.map(w => `${w.german} (${w.english})`).join(', ')}

=== GERMAN VERSION ===
${story.germanStory}

=== ENGLISH VERSION ===
${story.englishStory}

Story Preferences:
- Style: ${story.preferences.style}
- Length: ${story.preferences.length}
- Include English Hints: ${story.preferences.includeEnglish ? 'Yes' : 'No'}

---
Generated with German Words Learning App`;

            const blob = new Blob([exportContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${Date.now()}.txt`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success("Story exported successfully!");
        } catch (error) {
            console.error("Error exporting story:", error);
            toast.error("Failed to export story");
        }
    };

    const renderStoryWithHighlights = (storyText) => {
        if (!storyText) return "";
        
        // Replace **word** with clickable highlighted spans
        return storyText.replace(/\*\*(.*?)\*\*/g, (match, word) => {
            // Remove any parentheses with translations for finding the word
            const cleanWord = word.replace(/\s*\(.*?\)\s*/, '').trim();
            
            const wordData = story.wordsUsed.find(w => 
                w.german.toLowerCase() === cleanWord.toLowerCase()
            );
            
            return `<span class="german-word" data-english="${wordData?.english || ''}" data-type="${wordData?.type || ''}">${word}</span>`;
        });
    };

    const handleWordClick = (word, english, type) => {
        if (word) {
            // Create speech for the clicked word
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(word);
                utterance.lang = 'de-DE';
                utterance.rate = 0.8;
                window.speechSynthesis.speak(utterance);
            }
        }
        toast(`${word} → ${english} (${type})`);
    };

    const getStyleEmoji = (style) => {
        const emojis = {
            educational: "📚",
            adventure: "🗺️",
            daily: "🏠",
            funny: "😂",
            mystery: "🔍"
        };
        return emojis[style] || "📖";
    };

    const getTimeAgo = (date) => {
        const now = new Date();
        const created = new Date(date);
        const diffTime = Math.abs(now - created);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
            if (diffHours === 0) {
                const diffMinutes = Math.floor(diffTime / (1000 * 60));
                return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
            }
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return created.toLocaleDateString();
        }
    };

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
                                            <span>{getTimeAgo(story.createdAt)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <FaTags />
                                            <span>{story.wordsUsed.length} words</span>
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
                                        Vocabulary Words Used ({story.wordsUsed.length})
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {story.wordsUsed.map((word, index) => (
                                            <div
                                                key={index}
                                                className="group relative"
                                            >
                                                <span
                                                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium cursor-pointer hover:bg-blue-200 transition-colors"
                                                    title={`${word.german} → ${word.english} (${word.type || 'word'})`}
                                                    onClick={() => handleWordClick(word.german, word.english, word.type)}
                                                >
                                                    {word.german}
                                                </span>
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                                    {word.english} ({word.type || 'word'})
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
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Style:</span>
                                            <span className="font-medium capitalize">
                                                {getStyleEmoji(story.preferences.style)} {story.preferences.style}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Length:</span>
                                            <span className="font-medium capitalize">{story.preferences.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">English Hints:</span>
                                            <span className="font-medium">
                                                {story.preferences.includeEnglish ? 'Yes' : 'No'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Language Toggle & Story Actions */}
                        <div className="p-6 border-b bg-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <h3 className="font-semibold text-gray-700">Story Content:</h3>
                                    
                                    {/* Language Toggle */}
                                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                        <button
                                            onClick={() => {
                                                setCurrentLanguage('german');
                                                stopAudio(); // Stop audio when switching language
                                            }}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
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
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
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
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                            title={`Read ${currentLanguage} story aloud`}
                                        >
                                            <FaVolumeUp />
                                            Read Aloud
                                        </button>
                                    ) : (
                                        <div className="flex gap-1">
                                            {!isPaused ? (
                                                <button
                                                    onClick={pauseAudio}
                                                    className="flex items-center gap-1 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                                                    title="Pause"
                                                >
                                                    <FaPause />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={resumeAudio}
                                                    className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                                    title="Resume"
                                                >
                                                    <FaVolumeUp />
                                                </button>
                                            )}
                                            <button
                                                onClick={stopAudio}
                                                className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                                title="Stop"
                                            >
                                                <FaStop />
                                            </button>
                                        </div>
                                    )}
                                    <button
                                        onClick={handleExportStory}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                        title="Export story"
                                    >
                                        <FaDownload />
                                        Export
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Story Content */}
                        <div className="p-6">
                            <div 
                                className="prose max-w-none text-gray-800 leading-relaxed text-lg"
                                dangerouslySetInnerHTML={{
                                    __html: renderStoryWithHighlights(
                                        currentLanguage === 'german' 
                                            ? story.germanStory 
                                            : story.englishStory
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
            `}</style>
        </AnimatePresence>
    );
};

export default StoryViewer;