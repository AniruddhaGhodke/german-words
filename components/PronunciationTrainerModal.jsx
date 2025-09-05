import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const PronunciationTrainerModal = ({ word, isOpen, onClose }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioURL, setAudioURL] = useState("");
    const [playbackSpeed, setPlaybackSpeed] = useState(0.8);
    const [showPhonetics, setShowPhonetics] = useState(false);
    const [practiceMode, setPracticeMode] = useState('listen'); // 'listen', 'repeat', 'compare'
    const [recordingTime, setRecordingTime] = useState(0);
    const [feedback, setFeedback] = useState(null);
    
    const mediaRecorderRef = useRef(null);
    const audioStreamRef = useRef(null);
    const intervalRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const canvasRef = useRef(null);
    const animationRef = useRef(null);

    // German phonetic patterns for common words
    const phoneticMap = {
        // Common words and their IPA
        'hallo': '/ˈhaloː/',
        'wasser': '/ˈvasɐ/',
        'brot': '/broːt/',
        'haus': '/haʊ̯s/',
        'zeit': '/tsaɪ̯t/',
        'leben': '/ˈleːbən/',
        'sprechen': '/ˈʃprɛçən/',
        'machen': '/ˈmaxən/',
        'gehen': '/ˈgeːən/',
        'kommen': '/ˈkɔmən/',
        'sehen': '/ˈzeːən/',
        'wissen': '/ˈvɪsən/',
        'können': '/ˈkœnən/',
        'sollen': '/ˈzɔlən/',
        'müssen': '/ˈmʏsən/'
    };

    const germanTips = {
        'ü': 'Round your lips like "oo" but say "ee"',
        'ö': 'Round your lips like "oh" but say "eh"', 
        'ä': 'Like "e" in "bed" but more open',
        'ch': 'Soft "h" sound, like clearing your throat gently',
        'sch': 'Like "sh" in "ship"',
        'z': 'Always pronounced like "ts" in "cats"',
        'w': 'Pronounced like "v" in "very"',
        'v': 'Usually pronounced like "f" in "fox"',
        'ie': 'Long "ee" sound as in "see"',
        'ei': 'Like "eye" or "I"'
    };

    const getPhonetic = (germanWord) => {
        return phoneticMap[germanWord.toLowerCase()] || `/${germanWord.toLowerCase()}/`;
    };

    const getPronunciationTips = (germanWord) => {
        const tips = [];
        const lowerWord = germanWord.toLowerCase();
        
        Object.entries(germanTips).forEach(([pattern, tip]) => {
            if (lowerWord.includes(pattern)) {
                tips.push(`"${pattern}": ${tip}`);
            }
        });
        
        return tips.length > 0 ? tips : ['Focus on clear consonants and pure vowels'];
    };

    useEffect(() => {
        if (!isOpen) {
            stopRecording();
            cleanup();
        }
    }, [isOpen]);

    const cleanup = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
            audioStreamRef.current = null;
        }
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
    };

    const handleSpeak = async (text, speed = playbackSpeed) => {
        try {
            // Dynamic import to avoid SSR issues
            const { speakGermanWord } = await import("../utils/speechSynthesis");
            await speakGermanWord(text, {
                rate: speed,
                onStart: () => console.log('Speaking at rate', speed, ':', text),
                onEnd: () => console.log('Finished speaking:', text)
            });
        } catch (error) {
            console.error('Speech error in pronunciation trainer:', error);
            toast.error('Speech synthesis failed. Please try again.');
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStreamRef.current = stream;
            
            // Set up audio context for visualization
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
            
            analyserRef.current.fftSize = 256;
            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            // Start visualization
            const visualize = () => {
                if (!analyserRef.current || !canvasRef.current) return;
                
                analyserRef.current.getByteFrequencyData(dataArray);
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                const barWidth = (canvas.width / bufferLength) * 2.5;
                let x = 0;
                
                for (let i = 0; i < bufferLength; i++) {
                    const barHeight = (dataArray[i] / 255) * canvas.height;
                    
                    const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
                    gradient.addColorStop(0, '#3b82f6');
                    gradient.addColorStop(1, '#1e40af');
                    
                    ctx.fillStyle = gradient;
                    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                    
                    x += barWidth + 1;
                }
                
                animationRef.current = requestAnimationFrame(visualize);
            };
            visualize();

            mediaRecorderRef.current = new MediaRecorder(stream);
            const chunks = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                chunks.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/wav' });
                const url = URL.createObjectURL(blob);
                setAudioURL(url);
                provideFeedback();
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);
            
            // Start timer
            intervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

            toast.success("Recording started! 🎤");
        } catch (error) {
            toast.error("Could not access microphone");
            console.error("Recording error:", error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
            
            cleanup();
            toast.success("Recording stopped! ✅");
        }
    };

    const provideFeedback = () => {
        // Simple feedback based on recording time and practice mode
        const wordLength = word.german.length;
        const expectedDuration = Math.max(1, wordLength * 0.15); // rough estimate
        
        let feedbackText = "";
        let score = 0;
        
        if (recordingTime < expectedDuration * 0.5) {
            feedbackText = "Try speaking a bit slower and clearer. German words often need more precise articulation.";
            score = 60;
        } else if (recordingTime > expectedDuration * 2) {
            feedbackText = "Good effort! Try to be a bit more concise. German pronunciation is often crisp and clear.";
            score = 75;
        } else {
            feedbackText = "Great timing! Your pronunciation duration sounds natural for this German word.";
            score = 90;
        }
        
        setFeedback({ text: feedbackText, score });
    };

    const playRecording = () => {
        if (audioURL) {
            const audio = new Audio(audioURL);
            audio.play();
        }
    };

    if (!isOpen || !word) return null;

    const phonetic = getPhonetic(word.german);
    const tips = getPronunciationTips(word.german);

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
                            <h2 className="text-2xl font-bold text-gray-800">Pronunciation Trainer</h2>
                            <p className="text-sm text-gray-600">Perfect your German pronunciation</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    {/* Word and translation */}
                    <div className="text-center mb-8">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 mb-4">
                            <h3 className="text-4xl font-bold mb-2">{word.german}</h3>
                            <p className="text-xl opacity-90">{word.english}</p>
                            {showPhonetics && (
                                <p className="text-lg mt-2 font-mono opacity-80">{phonetic}</p>
                            )}
                        </div>
                        
                        <div className="flex justify-center gap-2 mb-4">
                            <button
                                onClick={() => setShowPhonetics(!showPhonetics)}
                                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                            >
                                {showPhonetics ? 'Hide' : 'Show'} Phonetics
                            </button>
                        </div>
                    </div>

                    {/* Practice mode selector */}
                    <div className="flex justify-center gap-2 mb-6">
                        <button
                            onClick={() => setPracticeMode('listen')}
                            className={`px-4 py-2 rounded ${practiceMode === 'listen' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                        >
                            Listen
                        </button>
                        <button
                            onClick={() => setPracticeMode('repeat')}
                            className={`px-4 py-2 rounded ${practiceMode === 'repeat' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                        >
                            Repeat
                        </button>
                        <button
                            onClick={() => setPracticeMode('compare')}
                            className={`px-4 py-2 rounded ${practiceMode === 'compare' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                        >
                            Compare
                        </button>
                    </div>

                    {/* Speed control */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Playback Speed: {playbackSpeed}x
                        </label>
                        <input
                            type="range"
                            min="0.5"
                            max="1.5"
                            step="0.1"
                            value={playbackSpeed}
                            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Slow</span>
                            <span>Normal</span>
                            <span>Fast</span>
                        </div>
                    </div>

                    {/* Audio controls */}
                    <div className="text-center mb-6">
                        <div className="flex justify-center gap-4 mb-4">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleSpeak(word.german, playbackSpeed)}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                            >
                                🔊 Listen
                            </motion.button>
                            
                            {practiceMode !== 'listen' && (
                                <>
                                    {!isRecording ? (
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={startRecording}
                                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
                                        >
                                            🎤 Record
                                        </motion.button>
                                    ) : (
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={stopRecording}
                                            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2"
                                        >
                                            ⏹️ Stop ({recordingTime}s)
                                        </motion.button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Audio visualization */}
                        {isRecording && (
                            <div className="mb-4">
                                <canvas
                                    ref={canvasRef}
                                    width={400}
                                    height={100}
                                    className="border rounded-lg bg-gray-50 mx-auto"
                                />
                                <p className="text-sm text-gray-600 mt-2">Recording... Speak clearly!</p>
                            </div>
                        )}

                        {/* Playback controls */}
                        {audioURL && (
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={playRecording}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 mx-auto"
                            >
                                ▶️ Play Recording
                            </motion.button>
                        )}
                    </div>

                    {/* Feedback */}
                    {feedback && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-blue-800">Feedback</h4>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm text-blue-600">Score:</span>
                                    <span className="font-bold text-blue-800">{feedback.score}/100</span>
                                </div>
                            </div>
                            <p className="text-blue-700">{feedback.text}</p>
                        </motion.div>
                    )}

                    {/* Pronunciation tips */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-800 mb-3">💡 Pronunciation Tips</h4>
                        <ul className="space-y-2">
                            {tips.map((tip, index) => (
                                <li key={index} className="text-sm text-yellow-700 flex items-start">
                                    <span className="text-yellow-500 mr-2">•</span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PronunciationTrainerModal;