import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FlashcardModal = ({ word, isOpen, onClose, onSpeak }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [difficulty, setDifficulty] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsFlipped(false);
            setDifficulty(null);
            setShowFeedback(false);
        }
    }, [isOpen, word]);

    const handleDifficultySelect = (level) => {
        setDifficulty(level);
        setShowFeedback(true);
        
        // Store learning progress (you can extend this to save to database)
        const progress = JSON.parse(localStorage.getItem('wordProgress') || '{}');
        progress[word.uuid] = {
            lastReviewed: new Date().toISOString(),
            difficulty: level,
            reviewCount: (progress[word.uuid]?.reviewCount || 0) + 1
        };
        localStorage.setItem('wordProgress', JSON.stringify(progress));

        setTimeout(() => {
            onClose();
        }, 2000);
    };

    const flipCard = () => {
        setIsFlipped(!isFlipped);
    };

    if (!isOpen || !word) return null;

    const difficultyColors = {
        easy: 'bg-green-500 hover:bg-green-600',
        medium: 'bg-yellow-500 hover:bg-yellow-600',
        hard: 'bg-red-500 hover:bg-red-600'
    };

    const feedbackMessages = {
        easy: "Great! You'll see this word less frequently.",
        medium: "Good work! Keep practicing.",
        hard: "No worries! You'll see this word more often."
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
                >
                    <div className="flex justify-between items-center mb-4 sm:mb-6">
                        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">Flashcard Practice</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                            ×
                        </button>
                    </div>

                    {!showFeedback ? (
                        <>
                            {/* Flashcard */}
                            <div
                                className="relative h-36 sm:h-44 lg:h-48 mb-4 sm:mb-6 cursor-pointer"
                                onClick={flipCard}
                                style={{ perspective: '1000px' }}
                            >
                                <motion.div
                                    className="absolute inset-0 w-full h-full rounded-lg shadow-lg"
                                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                                    transition={{ duration: 0.6 }}
                                    style={{ 
                                        transformStyle: 'preserve-3d',
                                        transformOrigin: 'center center'
                                    }}
                                >
                                    {/* Front of card */}
                                    <div 
                                        className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"
                                        style={{ 
                                            backfaceVisibility: 'hidden',
                                            WebkitBackfaceVisibility: 'hidden'
                                        }}
                                    >
                                        <div className="text-center text-white px-2">
                                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">{word.german}</p>
                                            <p className="text-xs sm:text-sm opacity-80">({word.type || 'Any'})</p>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSpeak(word.german);
                                                }}
                                                className="mt-3 sm:mt-4 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                            >
                                                🔊
                                            </button>
                                        </div>
                                    </div>

                                    {/* Back of card */}
                                    <div 
                                        className="absolute inset-0 w-full h-full bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center"
                                        style={{ 
                                            backfaceVisibility: 'hidden',
                                            WebkitBackfaceVisibility: 'hidden',
                                            transform: 'rotateY(180deg)'
                                        }}
                                    >
                                        <div className="text-center text-white px-2">
                                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{word.english}</p>
                                            <p className="text-sm sm:text-base lg:text-lg mt-2 opacity-90">English Translation</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            <p className="text-center text-gray-600 mb-6">
                                {!isFlipped ? "Click to reveal translation" : "How well did you know this word?"}
                            </p>

                            {/* Difficulty buttons */}
                            {isFlipped && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-3 justify-center"
                                >
                                    <button
                                        onClick={() => handleDifficultySelect('hard')}
                                        className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${difficultyColors.hard}`}
                                    >
                                        Hard 😓
                                    </button>
                                    <button
                                        onClick={() => handleDifficultySelect('medium')}
                                        className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${difficultyColors.medium}`}
                                    >
                                        Medium 🤔
                                    </button>
                                    <button
                                        onClick={() => handleDifficultySelect('easy')}
                                        className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${difficultyColors.easy}`}
                                    >
                                        Easy 😊
                                    </button>
                                </motion.div>
                            )}
                        </>
                    ) : (
                        /* Feedback */
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-8"
                        >
                            <div className="text-6xl mb-4">
                                {difficulty === 'easy' ? '🎉' : difficulty === 'medium' ? '👍' : '💪'}
                            </div>
                            <p className="text-xl font-semibold text-gray-800 mb-2">
                                {feedbackMessages[difficulty]}
                            </p>
                            <p className="text-gray-600">Next word coming up...</p>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>

        </AnimatePresence>
    );
};

export default FlashcardModal;