import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { generateGermanSentences } from "../server_actions/generateSentences";

const SentenceBuilderModal = ({ word, isOpen, onClose, onSpeak }) => {
    const [currentExercise, setCurrentExercise] = useState(0);
    const [userAnswer, setUserAnswer] = useState("");
    const [selectedChoice, setSelectedChoice] = useState("");
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [score, setScore] = useState(0);
    const [isGeneratingSentences, setIsGeneratingSentences] = useState(false);
    const [deeplSentences, setDeeplSentences] = useState([]);

    // Generate contextual sentences and exercises based on word type
    const generateExercises = (word, deeplSentences = null) => {
        const exercises = [];
        let sentences = [];
        let sourceType = 'database';
        
        // Real German sentence patterns with proper context
        const sentenceDatabase = {
            // Common German words with real usage examples
            'Haus': [
                'Mein Haus ist blau und sehr groß.',
                'Wir kaufen ein neues Haus in der Stadt.',
                'Das alte Haus hat einen schönen Garten.'
            ],
            'Wasser': [
                'Ich trinke jeden Tag viel Wasser.',
                'Das Wasser im See ist sehr kalt.',
                'Ohne Wasser können wir nicht leben.'
            ],
            'Zeit': [
                'Wir haben keine Zeit für das Spiel.',
                'Die Zeit vergeht sehr schnell.',
                'In meiner Freizeit lese ich gerne.'
            ],
            'gehen': [
                'Ich gehe jeden Morgen zur Arbeit.',
                'Wir gehen heute ins Kino.',
                'Die Kinder gehen gerne in den Park.'
            ],
            'sprechen': [
                'Können Sie Deutsch sprechen?',
                'Wir sprechen über das Wetter.',
                'Er spricht drei Sprachen fließend.'
            ],
            'machen': [
                'Was machen Sie am Wochenende?',
                'Wir machen eine Pause.',
                'Die Hausaufgaben machen mir Spaß.'
            ],
            'gut': [
                'Das Essen schmeckt sehr gut.',
                'Sie ist eine gute Freundin.',
                'Heute ist ein guter Tag.'
            ],
            'groß': [
                'Der Baum ist sehr groß.',
                'Berlin ist eine große Stadt.',
                'Mein Bruder ist größer als ich.'
            ],
            'schön': [
                'Das ist ein schönes Bild.',
                'Heute ist das Wetter schön.',
                'Sie hat eine schöne Stimme.'
            ],
            'lernen': [
                'Ich lerne jeden Tag neue Wörter.',
                'Wir lernen Deutsch in der Schule.',
                'Kinder lernen sehr schnell.'
            ],
            'arbeiten': [
                'Ich arbeite von Montag bis Freitag.',
                'Meine Mutter arbeitet im Krankenhaus.',
                'Wo arbeiten Sie?'
            ],
            'essen': [
                'Was essen wir heute zum Mittagessen?',
                'Ich esse gerne Obst und Gemüse.',
                'Die Familie isst zusammen am Tisch.'
            ],
            'Freund': [
                'Mein bester Freund kommt aus Italien.',
                'Ich treffe meine Freunde am Wochenende.',
                'Ein guter Freund hilft immer.'
            ],
            'Stadt': [
                'München ist eine schöne Stadt.',
                'In der Stadt gibt es viele Geschäfte.',
                'Wir fahren in die Stadt zum Einkaufen.'
            ],
            'klein': [
                'Das ist ein kleines Auto.',
                'Meine kleine Schwester ist fünf Jahre alt.',
                'Der kleine Hund ist sehr süß.'
            ]
        };

        // Priority: DeepL sentences > Database sentences > Generated sentences
        if (deeplSentences && deeplSentences.length > 0) {
            sentences = deeplSentences.map(s => s.german);
            sourceType = 'deepl';
        } else {
            sentences = sentenceDatabase[word.german.toLowerCase()];
            
            if (!sentences) {
                // Generate contextually appropriate sentences based on word type
                sentences = generateContextualSentences(word);
                sourceType = 'generated';
            }
        }

        function generateContextualSentences(word) {
            const type = word.type?.toLowerCase() || 'any';
            const german = word.german;
            const english = word.english;

            // TODO: Future improvement - integrate with German grammar API or linguistic database
            // for more accurate declension and conjugation
            
            switch (type) {
                case 'noun':
                    return [
                        `Das ${german} ist sehr interessant.`,
                        `Ich kenne ein schönes ${german}.`,
                        `Wo ist das ${german}?`
                    ];
                case 'verb':
                    // Use infinitive form for better grammar
                    return [
                        `Ich möchte ${german}.`,
                        `Wir können zusammen ${german}.`,
                        `Es ist wichtig zu ${german}.`
                    ];
                case 'adjective':
                    return [
                        `Das ist sehr ${german}.`,
                        `Ein ${german}es Beispiel.`,
                        `Heute fühle ich mich ${german}.`
                    ];
                case 'adverb':
                    return [
                        `Ich mache das ${german}.`,
                        `Er spricht ${german}.`,
                        `Das funktioniert ${german}.`
                    ];
                default:
                    return [
                        `"${german}" ist ein deutsches Wort.`,
                        `${german} bedeutet "${english}".`,
                        `Ich lerne das Wort "${german}".`
                    ];
            }
        }
        
        // Exercise 1: Fill in the blank
        exercises.push({
            type: 'fill-blank',
            germanSentence: sentences[0].replace(word.german, '______'),
            correctAnswer: word.german,
            instruction: 'Fill in the blank with the correct German word:',
            explanation: `"${word.german}" means "${word.english}" in English.`,
            source: sourceType
        });

        // Exercise 2: Multiple choice translation
        const wrongChoices = [
            'Haus', 'Auto', 'Buch', 'Wasser', 'Leben', 'Zeit', 'Mann', 'Frau'
        ].filter(w => w !== word.german).slice(0, 2);
        
        exercises.push({
            type: 'multiple-choice',
            englishSentence: sentences[1].replace(word.german, word.english),
            germanSentence: sentences[1],
            choices: [word.german, ...wrongChoices].sort(() => Math.random() - 0.5),
            correctAnswer: word.german,
            instruction: 'Which German word completes this sentence?',
            explanation: `The correct answer is "${word.german}" which means "${word.english}".`
        });

        // Exercise 3: Sentence construction
        const words = sentences[2].split(' ').filter(w => w !== word.german);
        words.push(word.german);
        words.sort(() => Math.random() - 0.5);
        
        exercises.push({
            type: 'sentence-order',
            scrambledWords: words,
            correctSentence: sentences[2],
            instruction: 'Arrange these words to form a correct sentence:',
            explanation: `The correct sentence is: "${sentences[2]}"`
        });

        return exercises;
    };

    // Fetch DeepL sentences
    const fetchDeeplSentences = async (word) => {
        if (!word || isGeneratingSentences) return;
        
        setIsGeneratingSentences(true);
        try {
            const result = await generateGermanSentences(
                word.german, 
                word.type, 
                word.english
            );
            
            if (result.success && result.sentences.length > 0) {
                setDeeplSentences(result.sentences);
                toast.success(`Generated ${result.sentences.length} DeepL sentences! 🎉`);
            } else if (result.fallback) {
                setDeeplSentences(result.fallback);
                toast.info("Using fallback sentences (DeepL unavailable)");
            }
        } catch (error) {
            console.error("Error fetching DeepL sentences:", error);
            toast.error("Failed to generate new sentences");
        } finally {
            setIsGeneratingSentences(false);
        }
    };

    const [exercises, setExercises] = useState([]);

    useEffect(() => {
        if (word && isOpen) {
            // Use DeepL sentences if available, otherwise use static/generated ones
            const sentencesToUse = deeplSentences.length > 0 ? deeplSentences : null;
            setExercises(generateExercises(word, sentencesToUse));
            setCurrentExercise(0);
            setUserAnswer("");
            setSelectedChoice("");
            setShowResult(false);
            setScore(0);
        }
    }, [word, isOpen, deeplSentences]);

    const checkAnswer = () => {
        const exercise = exercises[currentExercise];
        let correct = false;
        
        switch (exercise.type) {
            case 'fill-blank':
                correct = userAnswer.toLowerCase().trim() === exercise.correctAnswer.toLowerCase();
                break;
            case 'multiple-choice':
                correct = selectedChoice === exercise.correctAnswer;
                break;
            case 'sentence-order':
                correct = userAnswer === exercise.correctSentence;
                break;
        }
        
        setIsCorrect(correct);
        setShowResult(true);
        
        if (correct) {
            setScore(score + 1);
            toast.success("Correct! Well done! 🎉");
        } else {
            toast.error("Not quite right. Keep trying! 💪");
        }
    };

    const nextExercise = () => {
        if (currentExercise < exercises.length - 1) {
            setCurrentExercise(currentExercise + 1);
            setUserAnswer("");
            setSelectedChoice("");
            setShowResult(false);
        } else {
            // Show final score and close
            toast.success(`Exercise completed! Score: ${score}/${exercises.length}`);
            setTimeout(() => onClose(), 2000);
        }
    };

    const renderExercise = () => {
        if (!exercises[currentExercise]) return null;
        
        const exercise = exercises[currentExercise];
        
        switch (exercise.type) {
            case 'fill-blank':
                return (
                    <div className="space-y-4">
                        <p className="text-lg text-gray-800">{exercise.germanSentence}</p>
                        <input
                            type="text"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter the German word..."
                        />
                    </div>
                );
                
            case 'multiple-choice':
                return (
                    <div className="space-y-4">
                        <p className="text-lg text-gray-800 mb-2">{exercise.englishSentence}</p>
                        <p className="text-sm text-gray-600 mb-4">German version:</p>
                        <p className="text-lg font-medium text-gray-800 mb-4">
                            {exercise.germanSentence.replace(word.german, '______')}
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                            {exercise.choices.map((choice, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedChoice(choice)}
                                    className={`p-3 text-left border rounded-lg transition-colors ${
                                        selectedChoice === choice
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                >
                                    {choice}
                                </button>
                            ))}
                        </div>
                    </div>
                );
                
            case 'sentence-order':
                return (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">Drag words or type the sentence:</p>
                        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg min-h-[60px]">
                            {exercise.scrambledWords.map((wordItem, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm cursor-pointer hover:bg-blue-200"
                                    onClick={() => setUserAnswer(prev => prev ? prev + ' ' + wordItem : wordItem)}
                                >
                                    {wordItem}
                                </span>
                            ))}
                        </div>
                        <input
                            type="text"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Type the complete sentence here..."
                        />
                    </div>
                );
                
            default:
                return null;
        }
    };

    if (!isOpen || !word || exercises.length === 0) return null;

    const exercise = exercises[currentExercise];

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
                    className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
                >
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Sentence Practice</h2>
                            <p className="text-sm text-gray-600">
                                Word: <span className="font-semibold">{word.german}</span> ({word.english})
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                    {exercises.length > 0 && (
                                        exercises[0].source === 'deepl' ? '🌍 DeepL AI sentences' :
                                        exercises[0].source === 'database' ? '📚 Real German examples' : 
                                        '🤖 Generated contextual sentences'
                                    )}
                                </div>
                                <button
                                    onClick={() => fetchDeeplSentences(word)}
                                    disabled={isGeneratingSentences}
                                    className="text-xs text-blue-600 hover:text-blue-800 underline disabled:text-gray-400"
                                >
                                    {isGeneratingSentences ? '⏳ Generating...' : '🔄 Generate new sentences'}
                                </button>
                                {deeplSentences.length > 0 && (
                                    <button
                                        onClick={() => {
                                            setDeeplSentences([]);
                                            toast.info("Reset to original sentences");
                                        }}
                                        className="text-xs text-gray-500 hover:text-gray-700 underline"
                                    >
                                        ↺ Reset
                                    </button>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    {/* Progress indicator */}
                    <div className="flex items-center mb-6">
                        <div className="flex space-x-2 flex-1">
                            {exercises.map((_, index) => (
                                <div
                                    key={index}
                                    className={`h-2 flex-1 rounded ${
                                        index < currentExercise
                                            ? 'bg-green-500'
                                            : index === currentExercise
                                            ? 'bg-blue-500'
                                            : 'bg-gray-300'
                                    }`}
                                />
                            ))}
                        </div>
                        <span className="ml-4 text-sm text-gray-600">
                            {currentExercise + 1}/{exercises.length}
                        </span>
                    </div>

                    {!showResult ? (
                        <>
                            <p className="text-sm text-gray-600 mb-4">{exercise.instruction}</p>
                            {renderExercise()}
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => onSpeak(word.german)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    🔊 Hear word
                                </button>
                                <button
                                    onClick={checkAnswer}
                                    disabled={!userAnswer && !selectedChoice}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors ml-auto"
                                >
                                    Check Answer
                                </button>
                            </div>
                        </>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-6"
                        >
                            <div className="text-6xl mb-4">
                                {isCorrect ? '🎉' : '💪'}
                            </div>
                            <p className={`text-xl font-semibold mb-3 ${isCorrect ? 'text-green-600' : 'text-orange-600'}`}>
                                {isCorrect ? 'Correct!' : 'Not quite right'}
                            </p>
                            <p className="text-gray-700 mb-6">{exercise.explanation}</p>
                            <button
                                onClick={nextExercise}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                {currentExercise < exercises.length - 1 ? 'Next Exercise' : 'Complete'}
                            </button>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SentenceBuilderModal;