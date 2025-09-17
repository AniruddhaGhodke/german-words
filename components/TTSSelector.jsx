"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
    selectPreferences,
    selectSpeechRate,
    selectSelectedVoice,
    setSpeechRate,
    setSelectedVoice,
    updatePreferences 
} from '@/store/slices/uiSlice';
import toast from 'react-hot-toast';

const TTSSelector = ({ isOpen, onClose }) => {
    const dispatch = useAppDispatch();
    
    // RTK State
    const preferences = useAppSelector(selectPreferences);
    const speechRate = useAppSelector(selectSpeechRate);
    const selectedVoice = useAppSelector(selectSelectedVoice);
    
    // Local state for TTS providers
    const [availableProviders, setAvailableProviders] = useState([]);
    const [currentProvider, setCurrentProvider] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Only run in browser environment
        if (typeof window === 'undefined') return;
        
        // Load available providers and current selection
        const loadProviders = async () => {
            try {
                const { getAvailableProviders, getCurrentProvider } = await import('../utils/speechSynthesis');
                const providers = getAvailableProviders();
                const current = getCurrentProvider();
                setAvailableProviders(providers);
                setCurrentProvider(current);
                
                // Sync with RTK state if needed
                if (selectedVoice && selectedVoice !== current) {
                    setCurrentProvider(selectedVoice);
                }
            } catch (error) {
                console.error('Error loading TTS providers:', error);
            }
        };

        loadProviders();
        
        // Check periodically if Puter.js becomes available
        const interval = setInterval(loadProviders, 2000);
        return () => clearInterval(interval);
    }, [isOpen, selectedVoice]);

    const handleProviderChange = async (providerId) => {
        if (providerId === currentProvider) return;
        
        setIsLoading(true);
        try {
            const { setTTSProvider } = await import('../utils/speechSynthesis');
            setTTSProvider(providerId);
            setCurrentProvider(providerId);
            
            // Update RTK state
            dispatch(setSelectedVoice(providerId));
            
            // Give feedback to user
            const provider = availableProviders.find(p => p.id === providerId);
            toast.success(`Voice changed to: ${provider?.name}`);
            console.log(`TTS provider changed to: ${provider?.name}`);
        } catch (error) {
            console.error('Error changing TTS provider:', error);
            toast.error('Failed to change voice provider');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSpeechRateChange = (newRate) => {
        dispatch(setSpeechRate(newRate));
        toast.success(`Speech rate set to ${newRate}x`);
    };

    const testSpeech = async () => {
        try {
            const { speakGermanWord } = await import('../utils/speechSynthesis');
            await speakGermanWord('Hallo Welt', {
                rate: speechRate,
                onStart: () => console.log('Testing speech...'),
                onEnd: () => console.log('Speech test completed')
            });
        } catch (error) {
            console.error('Speech test error:', error);
            toast.error('Speech test failed');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">
                            Voice Settings
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-2xl min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                            ×
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Speech Rate Control */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">
                                Speech Rate: {speechRate}x
                            </label>
                            <div className="space-y-2">
                                <input
                                    type="range"
                                    min="0.5"
                                    max="2"
                                    step="0.1"
                                    value={speechRate}
                                    onChange={(e) => handleSpeechRateChange(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                />
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Slow (0.5x)</span>
                                    <span>Normal (1.0x)</span>
                                    <span>Fast (2.0x)</span>
                                </div>
                            </div>
                        </div>

                        {/* Test Speech Button */}
                        <div className="flex justify-center">
                            <button
                                onClick={testSpeech}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors min-h-[44px] flex items-center gap-2"
                            >
                                <span>🔊</span>
                                Test Speech
                            </button>
                        </div>

                        {/* Provider Selection */}
                        <div className="space-y-3">
                            <div className="text-sm font-medium text-gray-700 mb-2">
                                Choose your preferred text-to-speech provider:
                            </div>
                            <div className="text-xs text-gray-600 mb-4">
                                Different providers offer varying voice quality and mobile compatibility.
                            </div>

                            {availableProviders.map((provider) => (
                                <motion.div
                                    key={provider.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 min-h-[60px] ${
                                        currentProvider === provider.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => !isLoading && handleProviderChange(provider.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-4 h-4 rounded-full border-2 transition-colors ${
                                                currentProvider === provider.id
                                                    ? 'border-blue-500 bg-blue-500'
                                                    : 'border-gray-300'
                                            }`}>
                                                {currentProvider === provider.id && (
                                                    <div className="w-full h-full rounded-full bg-white transform scale-50"></div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-800">
                                                    {provider.name}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {provider.description}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {provider.id === 'puter' && (
                                            <div className="text-green-600 font-semibold text-sm">
                                                Recommended
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="text-xs text-gray-500 space-y-1">
                            <div><strong>Puter.js:</strong> High-quality voices, works great on mobile</div>
                            <div><strong>Browser Native:</strong> Uses your device&apos;s built-in voices</div>
                            <div><strong>Auto-Select:</strong> Automatically chooses the best option</div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                            Settings saved automatically
                        </div>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px]"
                        >
                            Done
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default TTSSelector;