import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const WordAssociationModal = ({ word, allWords, isOpen, onClose, onSpeak }) => {
    const [associatedWords, setAssociatedWords] = useState([]);
    const [selectedAssociations, setSelectedAssociations] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);
    const [gameMode, setGameMode] = useState('association'); // 'association', 'semantic', 'category'

    const generateAssociations = (targetWord, wordsList) => {
        if (!targetWord || !wordsList.length) return [];

        const associations = [];
        const targetType = targetWord.type?.toLowerCase();
        
        // Get words of the same type
        const sameType = wordsList
            .filter(w => w.uuid !== targetWord.uuid && w.type?.toLowerCase() === targetType)
            .slice(0, 3);
        
        // Get random words from different types
        const differentTypes = wordsList
            .filter(w => w.uuid !== targetWord.uuid && w.type?.toLowerCase() !== targetType)
            .sort(() => Math.random() - 0.5)
            .slice(0, 4);

        // Create association groups
        associations.push({
            type: 'correct',
            words: sameType,
            label: `Same type (${targetWord.type || 'Any'})`,
            isCorrect: true
        });

        associations.push({
            type: 'incorrect',
            words: differentTypes,
            label: 'Different types',
            isCorrect: false
        });

        return associations;
    };

    const generateSemanticGame = (targetWord, wordsList) => {
        // Create semantic associations based on common German word patterns
        const semanticGroups = {
            family: ['Mutter', 'Vater', 'Bruder', 'Schwester', 'Kind', 'Familie'],
            colors: ['rot', 'blau', 'grün', 'gelb', 'schwarz', 'weiß'],
            food: ['Brot', 'Wasser', 'Fleisch', 'Gemüse', 'Obst', 'Milch'],
            animals: ['Hund', 'Katze', 'Vogel', 'Pferd', 'Kuh', 'Schwein'],
            time: ['Tag', 'Nacht', 'Stunde', 'Minute', 'Jahr', 'Monat'],
            body: ['Hand', 'Fuß', 'Kopf', 'Auge', 'Mund', 'Herz']
        };

        // Find which semantic group the target word might belong to
        let correctGroup = null;
        let correctLabel = '';
        
        for (const [groupName, words] of Object.entries(semanticGroups)) {
            if (words.some(w => w.toLowerCase() === targetWord.german.toLowerCase())) {
                correctGroup = words.filter(w => w.toLowerCase() !== targetWord.german.toLowerCase());
                correctLabel = groupName.charAt(0).toUpperCase() + groupName.slice(1);
                break;
            }
        }

        if (!correctGroup) {
            // If no semantic group found, fall back to type-based associations
            return generateAssociations(targetWord, wordsList);
        }

        // Get random words from other categories
        const incorrectWords = [];
        const otherGroups = Object.entries(semanticGroups)
            .filter(([name]) => name !== correctLabel.toLowerCase());
        
        otherGroups.forEach(([_, words]) => {
            incorrectWords.push(...words.slice(0, 2));
        });

        return [
            {
                type: 'correct',
                words: correctGroup.map(german => ({ german, english: `${german} (related)`, type: 'Related' })).slice(0, 4),
                label: `${correctLabel} related`,
                isCorrect: true
            },
            {
                type: 'incorrect', 
                words: incorrectWords.map(german => ({ german, english: `${german} (unrelated)`, type: 'Other' })).slice(0, 4),
                label: 'Unrelated words',
                isCorrect: false
            }
        ];
    };

    const generateCategoryGame = (targetWord, wordsList) => {
        const categories = {
            'Noun': wordsList.filter(w => w.type === 'Noun').slice(0, 4),
            'Verb': wordsList.filter(w => w.type === 'Verb').slice(0, 4),
            'Adjective': wordsList.filter(w => w.type === 'Adjective').slice(0, 4),
            'Other': wordsList.filter(w => !['Noun', 'Verb', 'Adjective'].includes(w.type)).slice(0, 4)
        };

        const targetCategory = targetWord.type || 'Other';
        const correctWords = categories[targetCategory]?.filter(w => w.uuid !== targetWord.uuid) || [];
        
        // Get words from other categories
        const incorrectWords = Object.entries(categories)
            .filter(([cat]) => cat !== targetCategory)
            .flatMap(([_, words]) => words)
            .slice(0, 5);

        return [
            {
                type: 'correct',
                words: correctWords,
                label: targetCategory,
                isCorrect: true
            },
            {
                type: 'incorrect',
                words: incorrectWords,
                label: 'Other categories',
                isCorrect: false
            }
        ];
    };

    useEffect(() => {
        if (word && allWords && isOpen) {
            let associations;
            switch (gameMode) {
                case 'semantic':
                    associations = generateSemanticGame(word, allWords);
                    break;
                case 'category':
                    associations = generateCategoryGame(word, allWords);
                    break;
                default:
                    associations = generateAssociations(word, allWords);
            }
            setAssociatedWords(associations);
            setSelectedAssociations([]);
            setShowResults(false);
            setScore(0);
        }
    }, [word, allWords, isOpen, gameMode]);

    const handleWordSelect = (selectedWord, groupType) => {
        if (showResults) return;
        
        const association = { word: selectedWord, isCorrect: groupType === 'correct' };
        setSelectedAssociations([...selectedAssociations, association]);
        
        if (association.isCorrect) {
            toast.success("Correct! ✨");
        } else {
            toast.error("Not quite right 🤔");
        }
    };

    const checkResults = () => {
        const correctCount = selectedAssociations.filter(a => a.isCorrect).length;
        setScore(correctCount);
        setShowResults(true);
        
        if (correctCount === selectedAssociations.length && correctCount > 0) {
            toast.success("Perfect! All correct! 🎉");
        } else if (correctCount > selectedAssociations.length / 2) {
            toast.success("Good job! 👍");
        } else {
            toast("Keep practicing! 💪", { icon: '📚' });
        }
    };

    const resetGame = () => {
        setSelectedAssociations([]);
        setShowResults(false);
        setScore(0);
    };

    const renderWordCloud = () => {
        if (associatedWords.length === 0) return null;

        const allWordsFlat = associatedWords.flatMap(group => 
            group.words.map(w => ({ ...w, groupType: group.type, groupLabel: group.label }))
        );

        return (
            <div className="space-y-6">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Find words related to: 
                        <span className="text-blue-600 ml-2 text-xl">{word.german}</span>
                        <button
                            onClick={() => onSpeak(word.german)}
                            className="ml-2 text-blue-500 hover:text-blue-700"
                        >
                            🔊
                        </button>
                    </h3>
                    <p className="text-sm text-gray-600">
                        Mode: {gameMode === 'association' ? 'Type Association' : gameMode === 'semantic' ? 'Semantic Association' : 'Category Match'}
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {allWordsFlat.map((w, index) => {
                        const isSelected = selectedAssociations.some(a => a.word.uuid === w.uuid || a.word.german === w.german);
                        const selectedAssoc = selectedAssociations.find(a => a.word.uuid === w.uuid || a.word.german === w.german);
                        
                        return (
                            <motion.button
                                key={`${w.german}-${index}`}
                                whileHover={{ scale: showResults ? 1 : 1.05 }}
                                whileTap={{ scale: showResults ? 1 : 0.95 }}
                                onClick={() => !isSelected && handleWordSelect(w, w.groupType)}
                                disabled={isSelected || showResults}
                                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                                    isSelected
                                        ? showResults
                                            ? selectedAssoc?.isCorrect
                                                ? 'border-green-500 bg-green-50 text-green-800'
                                                : 'border-red-500 bg-red-50 text-red-800'
                                            : 'border-blue-500 bg-blue-50 text-blue-800'
                                        : 'border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50'
                                } ${showResults && w.groupType === 'correct' ? 'ring-2 ring-green-300' : ''}`}
                            >
                                <div className="text-center">
                                    <p className="font-semibold text-sm">{w.german}</p>
                                    <p className="text-xs text-gray-600">{w.english}</p>
                                    {showResults && (
                                        <p className="text-xs mt-1 font-medium">
                                            {w.groupType === 'correct' ? '✓ Related' : '✗ Not related'}
                                        </p>
                                    )}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">
                        Selected: {selectedAssociations.length} words
                        {showResults && (
                            <span className="ml-2 font-medium">
                                Score: {score}/{selectedAssociations.length}
                            </span>
                        )}
                    </p>
                    
                    {!showResults ? (
                        <div className="flex gap-2 justify-center">
                            <button
                                onClick={checkResults}
                                disabled={selectedAssociations.length === 0}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                            >
                                Check Results
                            </button>
                            <button
                                onClick={resetGame}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                            Done
                        </button>
                    )}
                </div>
            </div>
        );
    };

    if (!isOpen || !word) return null;

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
                    className="bg-white rounded-xl shadow-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
                >
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Word Association Game</h2>
                            <p className="text-sm text-gray-600">Find words that are related to the target word</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    {/* Game mode selector */}
                    <div className="flex gap-2 mb-6 justify-center">
                        <button
                            onClick={() => setGameMode('association')}
                            className={`px-3 py-1 rounded text-sm ${gameMode === 'association' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            Type Match
                        </button>
                        <button
                            onClick={() => setGameMode('semantic')}
                            className={`px-3 py-1 rounded text-sm ${gameMode === 'semantic' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            Semantic
                        </button>
                        <button
                            onClick={() => setGameMode('category')}
                            className={`px-3 py-1 rounded text-sm ${gameMode === 'category' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            Category
                        </button>
                    </div>

                    {renderWordCloud()}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default WordAssociationModal;