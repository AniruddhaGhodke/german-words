import toast from "react-hot-toast";

// TTS Provider Types
const TTS_PROVIDERS = {
    GOOGLE_TTS: 'google_tts',
    PUTER: 'puter',
    WEB_SPEECH: 'web_speech',
    AUTO: 'auto'
};

// Detect browser type for Safari-specific handling
const isSafari = () => {
    if (typeof navigator === 'undefined') return false;
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

const isMobile = () => {
    if (typeof navigator === 'undefined') return false;
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

const isIOS = () => {
    if (typeof navigator === 'undefined') return false;
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

// Check if Puter.js is available
const isPuterAvailable = () => {
    return typeof window !== 'undefined' && window.puter && window.puter.ai && window.puter.ai.txt2speech;
};

// Get user's preferred TTS provider from localStorage
const getPreferredProvider = () => {
    if (typeof localStorage === 'undefined') return TTS_PROVIDERS.AUTO;
    return localStorage.getItem('tts-provider') || TTS_PROVIDERS.AUTO;
};

// Set user's preferred TTS provider
const setPreferredProvider = (provider) => {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('tts-provider', provider);
    }
};

// Check if Google TTS is available (server-side API)
const isGoogleTTSAvailable = async () => {
    try {
        const response = await fetch('/api/tts/synthesize', {
            method: 'GET'
        });
        return response.ok;
    } catch (error) {
        return false;
    }
};

// Smart provider selection based on device and availability
const selectBestProvider = () => {
    const preferred = getPreferredProvider();

    if (preferred !== TTS_PROVIDERS.AUTO) {
        return preferred;
    }

    // Auto-selection logic - Google TTS is now highest priority
    // Note: We'll check Google TTS availability at runtime
    return TTS_PROVIDERS.GOOGLE_TTS;
};

// Initialize speech synthesis and load voices
const initializeSpeechSynthesis = () => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return;
    
    if ("speechSynthesis" in window) {
        // Force voices to load by calling getVoices()
        speechSynthesis.getVoices();
        
        // Wait for voices to be loaded (especially important for Safari)
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => {
                console.log('Voices loaded:', speechSynthesis.getVoices().length);
            };
        }
        
        // Some browsers need a user interaction to enable speech synthesis
        const enableSpeech = () => {
            if (speechSynthesis.speaking) return;
            
            // Create a silent utterance to initialize the API
            const utterance = new SpeechSynthesisUtterance('');
            utterance.volume = 0;
            utterance.rate = 1; // Use normal rate for initialization
            speechSynthesis.speak(utterance);
        };
        
        // Try to initialize on user interaction
        if (typeof document !== 'undefined') {
            document.addEventListener('click', enableSpeech, { once: true });
            document.addEventListener('touchstart', enableSpeech, { once: true });
        }
    }
};

// Debug function to log available voices
const logAvailableVoices = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    const voices = speechSynthesis.getVoices();
    console.log('Available voices:', voices.length);
    voices.forEach((voice, index) => {
        if (voice.lang.startsWith('de') || voice.lang.includes('German')) {
            console.log(`${index}: ${voice.name} (${voice.lang}) - Local: ${voice.localService}`);
        }
    });
};

// Get the best German voice available with Safari optimizations
const getGermanVoice = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    
    const voices = speechSynthesis.getVoices();
    
    // Log available voices for debugging
    if (voices.length > 0) {
        logAvailableVoices();
    }
    
    if (isIOS()) {
        // iOS-specific voice preferences (all browsers on iOS use same voices)
        const iosPreferred = [
            'Anna', // Standard German voice on iOS
            'Helena', // Alternative German voice 
            'Petra', // Another German option
            'Markus', // Male German voice if available
            'Yannick' // Multilingual voice that sometimes works for German
        ];
        
        // First, specifically look for Anna since user confirmed it's available and high quality
        const annaVoice = voices.find(v => 
            v.name.toLowerCase().includes('anna') && 
            v.lang.startsWith('de')
        );
        if (annaVoice) {
            console.log('Selected Anna voice (iOS):', annaVoice.name, annaVoice.lang);
            return annaVoice;
        }
        
        // Try other high-quality voices, avoiding 'Compact' versions
        for (const voiceName of iosPreferred) {
            const voice = voices.find(v => 
                v.name.includes(voiceName) && 
                v.lang.startsWith('de') && 
                !v.name.includes('Compact')
            );
            if (voice) {
                console.log('Selected iOS-optimized voice:', voice.name);
                return voice;
            }
        }
        
        // Fallback to any non-compact German voice with local service
        const localGerman = voices.find(voice => 
            voice.lang.startsWith('de') && 
            voice.localService && 
            !voice.name.includes('Compact')
        );
        if (localGerman) {
            console.log('Selected local German voice (iOS):', localGerman.name);
            return localGerman;
        }
        
        // Last resort - any German voice (even compact ones)
        const anyGerman = voices.find(voice => 
            voice.lang.startsWith('de')
        );
        if (anyGerman) {
            console.log('Selected fallback German voice (iOS):', anyGerman.name);
            return anyGerman;
        }
        
        console.warn('No German voices found for iOS');
        return null;
    } else {
        // Priority order for other browsers: local German voices, then any German voices
        const voice = voices.find(voice => 
            voice.lang.startsWith('de') && voice.localService
        ) || voices.find(voice => 
            voice.lang.startsWith('de')
        ) || null;
        
        if (voice) {
            console.log('Selected Chrome/other browser voice:', voice.name);
        }
        return voice;
    }
};

// Puter.js Text-to-Speech function
const speakWithPuter = async (text, options = {}) => {
    return new Promise((resolve, reject) => {
        if (!isPuterAvailable()) {
            reject(new Error('Puter.js is not available'));
            return;
        }

        const {
            onStart = () => {},
            onEnd = () => {},
            onError = () => {}
        } = options;

        try {
            // Use German language for Puter.js
            const language = 'de-DE';
            
            console.log('Using Puter.js TTS for German:', text);
            onStart();

            window.puter.ai.txt2speech(text, language)
                .then((audio) => {
                    if (audio && audio.play) {
                        // Play the audio and handle events
                        audio.onended = () => {
                            console.log('Puter.js TTS completed:', text);
                            onEnd();
                            resolve();
                        };
                        
                        audio.onerror = (error) => {
                            console.error('Puter.js TTS error:', error);
                            onError(error);
                            reject(new Error('Puter.js TTS playback failed'));
                        };
                        
                        audio.play();
                    } else {
                        throw new Error('Invalid audio object received from Puter.js');
                    }
                })
                .catch((error) => {
                    console.error('Puter.js TTS synthesis error:', error);
                    onError(error);
                    reject(error);
                });
        } catch (error) {
            console.error('Puter.js TTS setup error:', error);
            onError(error);
            reject(error);
        }
    });
};

// Google Cloud TTS function
const speakWithGoogleTTS = async (text, options = {}) => {
    return new Promise(async (resolve, reject) => {
        const {
            language = 'de-DE',
            voiceName = 'de-DE-Standard-A',
            speakingRate = 1.0,
            onStart = () => {},
            onEnd = () => {},
            onError = () => {},
            onAudioReady = () => {} // Callback to get the audio element
        } = options;

        try {
            // Call our TTS API endpoint with speaking rate
            const response = await fetch('/api/tts/synthesize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text.trim(),
                    language,
                    voiceName,
                    speakingRate
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            // Get audio data as blob
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            // Allow external control of audio playback speed
            audio.playbackRate = speakingRate;

            // Store audio element immediately for pause/resume control
            onAudioReady(audio);

            // Set up audio event handlers
            audio.oncanplay = () => {
                onStart();
            };

            audio.onended = () => {
                URL.revokeObjectURL(audioUrl); // Clean up object URL
                onEnd();
                resolve();
            };

            audio.onerror = (error) => {
                console.error('Google TTS audio playback error:', error);
                URL.revokeObjectURL(audioUrl); // Clean up object URL
                onError(error);
                reject(new Error('Google TTS audio playback failed'));
            };

            // Play the audio
            await audio.play();

        } catch (error) {
            console.error('Google TTS error:', error);

            // Provide specific error messages based on error type
            let errorMessage = 'Google TTS failed';
            if (error.message.includes('quota')) {
                errorMessage = 'TTS quota exceeded';
            } else if (error.message.includes('authentication')) {
                errorMessage = 'TTS authentication failed';
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMessage = 'TTS network error';
            }

            toast.error(errorMessage);
            onError(error);
            reject(error);
        }
    });
};

// Web Speech API function (original implementation)
const speakWithWebSpeech = async (text, options = {}) => {
    return new Promise(async (resolve, reject) => {
        if (!("speechSynthesis" in window)) {
            const error = "Speech synthesis is not supported in this browser";
            toast.error(error);
            reject(new Error(error));
            return;
        }

        // Cancel any ongoing speech with iOS-specific handling
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
            
            // iOS needs extra time to properly cancel speech
            if (isIOS()) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        // Check for iOS limitations (affects all browsers on iOS)
        if (isIOS()) {
            const voices = speechSynthesis.getVoices();
            const hasQualityGermanVoice = voices.some(voice => 
                voice.lang.startsWith('de') && voice.localService && !voice.name.includes('Compact')
            );
            
            if (!hasQualityGermanVoice) {
                console.warn('iOS: Limited German voice quality detected');
                toast.error('Note: iOS devices have limited German voice quality. For better pronunciation, try on desktop browser.', {
                    duration: 5000,
                    id: 'ios-voice-warning'
                });
            }
        }

        // iOS-specific optimizations (all iOS browsers use WebKit)
        const iosDevice = isIOS();
        const defaultRate = iosDevice ? 1.0 : 0.8; // iOS works better with normal rate
        
        const {
            rate = defaultRate,
            pitch = 1,
            volume = 1,
            onStart = () => {},
            onEnd = () => {},
            onError = () => {}
        } = options;

        // Wait for voices to load before proceeding (crucial for Safari)
        const waitForVoices = () => {
            return new Promise((resolve) => {
                const voices = speechSynthesis.getVoices();
                if (voices.length > 0) {
                    resolve();
                } else {
                    speechSynthesis.onvoiceschanged = () => {
                        resolve();
                    };
                    // Fallback timeout
                    setTimeout(resolve, 1000);
                }
            });
        };

        waitForVoices().then(() => {
            // Longer delay for iOS devices to ensure proper cleanup
            const delay = iosDevice ? 300 : 100;
            
            setTimeout(() => {
                try {
                    // Preprocess text for better iOS pronunciation
                    let processedText = text;
                    if (iosDevice) {
                        // Clean text for iOS - remove extra spaces, normalize
                        processedText = text.trim().replace(/\s+/g, ' ');
                        
                        // Add slight pauses for complex German words (helps with stuttering)
                        if (processedText.length > 10) {
                            // Add tiny pause after compound word separators
                            processedText = processedText.replace(/([a-z])([A-Z])/g, '$1 $2');
                        }
                    }
                    
                    const utterance = new SpeechSynthesisUtterance(processedText);
                    
                    // iOS-specific language setting
                    if (iosDevice) {
                        utterance.lang = "de-DE"; // Explicit German language
                    } else {
                        utterance.lang = "de-DE";
                    }
                    
                    // iOS-specific rate adjustment (match native iOS speech as closely as possible)
                    if (iosDevice) {
                        // Use parameters that closely match iOS native speech
                        utterance.rate = 0.9; // Fixed rate that works best on iOS (ignore user rate)
                        utterance.pitch = 1.0; // Natural pitch like iOS native speech
                        utterance.volume = 1.0; // Full volume
                    } else {
                        utterance.rate = Math.max(0.5, Math.min(2.0, rate)); // Normal range for other browsers
                        utterance.pitch = pitch;
                        utterance.volume = volume;
                    }

                    // Try to get a German voice
                    const germanVoice = getGermanVoice();
                    if (germanVoice) {
                        utterance.voice = germanVoice;
                        console.log(`Using German voice: ${germanVoice.name} (${germanVoice.lang}) - iOS: ${iosDevice}`);
                    } else {
                        console.warn('No German voice found, using default');
                        if (iosDevice) {
                            // On iOS, try setting a more explicit language as fallback
                            utterance.lang = "de-DE";
                        }
                    }

                    let hasEnded = false;
                    let timeout;

                    // Event handlers
                    utterance.onstart = (event) => {
                        console.log('Speech started for:', text);
                        onStart(event);
                    };

                    const handleEnd = (event) => {
                        if (hasEnded) return;
                        hasEnded = true;
                        
                        if (timeout) clearTimeout(timeout);
                        console.log('Speech ended for:', text);
                        onEnd(event);
                        resolve(event);
                    };

                    utterance.onend = handleEnd;

                    utterance.onerror = (event) => {
                        if (hasEnded) return;
                        hasEnded = true;
                        
                        console.error('Speech synthesis error:', event);
                        const errorMsg = "Could not play audio";
                        toast.error(errorMsg);
                        onError(event);
                        reject(new Error(errorMsg));
                    };

                    // Timeout fallback - longer for iOS devices
                    const timeoutDuration = iosDevice ? 
                        (text.length * 400) + 4000 : 
                        (text.length * 200) + 2000;
                    
                    timeout = setTimeout(() => {
                        if (!hasEnded) {
                            console.log('Speech timeout for:', text);
                            handleEnd();
                        }
                    }, timeoutDuration);

                    // iOS needs a longer delay before speaking for stability
                    if (iosDevice) {
                        setTimeout(() => {
                            console.log('Speaking on iOS device with delay');
                            speechSynthesis.speak(utterance);
                        }, 100);
                    } else {
                        speechSynthesis.speak(utterance);
                    }
                    
                } catch (error) {
                    console.error('Speech synthesis setup error:', error);
                    toast.error("Speech synthesis failed");
                    reject(error);
                }
            }, delay);
        });
    });
};

// Enhanced main speak function with smart provider selection
export const speakGermanWord = async (text, options = {}) => {
    const provider = selectBestProvider();

    try {
        switch (provider) {
            case TTS_PROVIDERS.GOOGLE_TTS:
                console.log('Attempting Google Cloud TTS...');
                try {
                    await speakWithGoogleTTS(text, options);
                    return;
                } catch (error) {
                    console.warn('Google TTS failed, falling back to Puter.js:', error);
                    if (isPuterAvailable()) {
                        try {
                            await speakWithPuter(text, options);
                            return;
                        } catch (puterError) {
                            console.warn('Puter.js also failed, falling back to Web Speech API:', puterError);
                        }
                    }
                    // Final fallback to Web Speech API
                    toast.error('Premium TTS unavailable, using browser fallback');
                    await speakWithWebSpeech(text, options);
                    return;
                }

            case TTS_PROVIDERS.PUTER:
                console.log('Attempting Puter.js TTS...');
                try {
                    await speakWithPuter(text, options);
                    return;
                } catch (error) {
                    console.warn('Puter.js TTS failed, falling back to Web Speech API:', error);
                    toast.error('High-quality TTS unavailable, using fallback');
                    // Fallback to Web Speech API
                    await speakWithWebSpeech(text, options);
                    return;
                }

            case TTS_PROVIDERS.WEB_SPEECH:
            default:
                console.log('Using Web Speech API...');
                await speakWithWebSpeech(text, options);
                return;
        }
    } catch (error) {
        console.error('All TTS providers failed:', error);
        const fallbackError = "Text-to-speech failed. Please try again.";
        toast.error(fallbackError);
        throw new Error(fallbackError);
    }
};

// Export provider management functions
export const getTTSProviders = () => TTS_PROVIDERS;
export const getCurrentProvider = () => selectBestProvider();
export const setTTSProvider = (provider) => setPreferredProvider(provider);
export const getAvailableProviders = () => {
    const available = [];

    // Google TTS is always available (server-side)
    available.push({
        id: TTS_PROVIDERS.GOOGLE_TTS,
        name: 'Google Cloud TTS (Premium)',
        description: 'High-quality Google text-to-speech with caching'
    });

    if (isPuterAvailable()) {
        available.push({
            id: TTS_PROVIDERS.PUTER,
            name: 'Puter.js (High Quality)',
            description: 'Free high-quality German text-to-speech'
        });
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        available.push({
            id: TTS_PROVIDERS.WEB_SPEECH,
            name: 'Browser Native',
            description: 'Built-in browser text-to-speech'
        });
    }

    available.push({
        id: TTS_PROVIDERS.AUTO,
        name: 'Auto-Select',
        description: 'Automatically choose the best available option'
    });

    return available;
};

// Initialize on module load (only in browser)
if (typeof window !== 'undefined') {
    initializeSpeechSynthesis();
}

// Additional functions for StoryViewer compatibility

// Global state tracking for pause/resume/stop functionality
let currentAudio = null;
let currentUtterance = null;
let isCurrentlyPlaying = false;
let isCurrentlyPaused = false;
let currentProvider = null;

// Word tracking state for boundary events
let currentWordBoundaryCallback = null;
let currentText = null;
let boundaryEventSupported = null; // Cache boundary event support detection

// General text-to-speech function (supports any language)
export const speakText = async (text, language = 'de', options = {}) => {
    const provider = selectBestProvider();

    // Stop any current speech
    await stopSpeaking();

    // Store current word boundary callback and text for pause/resume
    currentWordBoundaryCallback = options.onWordBoundary || null;
    currentText = text;

    try {
        const processedOptions = {
            ...options,
            onStart: () => {
                isCurrentlyPlaying = true;
                currentProvider = provider;
                if (options.onStart) options.onStart();
            },
            onEnd: () => {
                isCurrentlyPlaying = false;
                isCurrentlyPaused = false;
                currentAudio = null;
                currentUtterance = null;
                currentProvider = null;
                currentWordBoundaryCallback = null;
                currentText = null;
                if (options.onEnd) options.onEnd();
            },
            onError: (error) => {
                isCurrentlyPlaying = false;
                isCurrentlyPaused = false;
                currentAudio = null;
                currentUtterance = null;
                currentProvider = null;
                currentWordBoundaryCallback = null;
                currentText = null;
                if (options.onError) options.onError(error);
            },
            onAudioReady: (audio) => {
                // Store audio reference for Google TTS
                if (provider === TTS_PROVIDERS.GOOGLE_TTS) {
                    currentAudio = audio;
                }
            }
        };
        
        switch (provider) {
            case TTS_PROVIDERS.GOOGLE_TTS:
                try {
                    const langCode = language === 'de' ? 'de-DE' : language === 'en' ? 'en-US' : `${language}-${language.toUpperCase()}`;
                    const voiceName = language === 'de' ? 'de-DE-Standard-A' : 'en-US-Standard-A';

                    await speakWithGoogleTTS(text, {
                        language: langCode,
                        voiceName: voiceName,
                        speakingRate: options.speakingRate || 1.0,
                        onStart: processedOptions.onStart,
                        onEnd: processedOptions.onEnd,
                        onError: processedOptions.onError,
                        onAudioReady: processedOptions.onAudioReady
                    });
                    return;
                } catch (error) {
                    console.warn('Google TTS failed, falling back to Puter.js:', error);
                    // Continue to Puter.js fallback
                    if (isPuterAvailable()) {
                        try {
                            const audio = await window.puter.ai.txt2speech(text, language === 'de' ? 'de-DE' : 'en-US');
                            currentAudio = audio;

                            if (audio && audio.play) {
                                audio.onended = processedOptions.onEnd;
                                audio.onerror = processedOptions.onError;
                                processedOptions.onStart();
                                await audio.play();
                            }
                            return;
                        } catch (puterError) {
                            console.warn('Puter.js also failed, falling back to Web Speech API:', puterError);
                            // Continue to Web Speech fallback
                        }
                    }
                }

            case TTS_PROVIDERS.PUTER:
                console.log('Attempting Puter.js TTS for text...');
                try {
                    // For Puter.js, we'll use German for now but could extend for other languages
                    const audio = await window.puter.ai.txt2speech(text, language === 'de' ? 'de-DE' : 'en-US');
                    currentAudio = audio;

                    if (audio && audio.play) {
                        audio.onended = processedOptions.onEnd;
                        audio.onerror = processedOptions.onError;
                        processedOptions.onStart();
                        await audio.play();
                    }
                    return;
                } catch (error) {
                    console.warn('Puter.js TTS failed, falling back to Web Speech API:', error);
                    // Continue to Web Speech fallback
                }

            case TTS_PROVIDERS.WEB_SPEECH:
            default:
                console.log(`Using Web Speech API for text in language: ${language}...`);

                if (options.onWordBoundary) {
                    console.log('Boundary events not supported, callback will not be used');
                }

                // Use standard Web Speech API without boundary events
                const langCode = language === 'de' ? 'de-DE' : language === 'en' ? 'en-US' : `${language}-${language.toUpperCase()}`;

                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = langCode;
                    utterance.rate = options.rate || 0.8;
                    utterance.volume = options.volume || 1;
                    utterance.pitch = options.pitch || 1;

                    console.log(`Standard TTS settings: lang=${langCode}, rate=${utterance.rate}, text preview="${text.substring(0, 50)}..."`);

                    // Find appropriate voice
                    const voices = window.speechSynthesis.getVoices();
                    const voice = voices.find(v => v.lang.startsWith(language)) ||
                                voices.find(v => v.lang.startsWith(langCode));
                    if (voice) {
                        utterance.voice = voice;
                        console.log(`Selected voice: ${voice.name} (${voice.lang})`);
                    }

                    utterance.onstart = processedOptions.onStart;
                    utterance.onend = processedOptions.onEnd;
                    utterance.onerror = processedOptions.onError;

                    currentUtterance = utterance;
                    window.speechSynthesis.speak(utterance);
                }
                return;
        }
    } catch (error) {
        console.error('All TTS providers failed:', error);
        if (options.onError) options.onError(error);
        throw error;
    }
};

// Stop any current speech
export const stopSpeaking = async () => {
    isCurrentlyPlaying = false;
    isCurrentlyPaused = false;

    // Stop Google TTS / Puter.js audio if active
    if (currentAudio && currentAudio.pause) {
        try {
            currentAudio.pause();
            if (currentAudio.currentTime !== undefined) {
                currentAudio.currentTime = 0;
            }
        } catch (error) {
            console.warn('Error stopping audio:', error);
        }
    }

    // Stop Web Speech API if active
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
            window.speechSynthesis.cancel();
            // iOS needs extra time
            if (isIOS()) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (error) {
            console.warn('Error stopping Web Speech API:', error);
        }
    }

    // Clean up boundary event state
    currentAudio = null;
    currentUtterance = null;
    currentProvider = null;
    currentWordBoundaryCallback = null;
    currentText = null;
};

// Pause current speech (supports both Google TTS and Web Speech API)
export const pauseSpeaking = async () => {
    if (!isCurrentlyPlaying || isCurrentlyPaused) {
        return false;
    }

    try {
        if (currentProvider === TTS_PROVIDERS.GOOGLE_TTS && currentAudio) {
            // Pause HTML5 Audio (Google TTS)
            currentAudio.pause();
            isCurrentlyPaused = true;
            return true;
        } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            // Pause Web Speech API
            window.speechSynthesis.pause();
            isCurrentlyPaused = true;
            return true;
        }
    } catch (error) {
        console.warn('Error pausing speech:', error);
        return false;
    }
    return false;
};

// Resume paused speech (supports both Google TTS and Web Speech API)
export const resumeSpeaking = async () => {
    if (!isCurrentlyPlaying || !isCurrentlyPaused) {
        return false;
    }

    try {
        if (currentProvider === TTS_PROVIDERS.GOOGLE_TTS && currentAudio) {
            // Resume HTML5 Audio (Google TTS)
            await currentAudio.play();
            isCurrentlyPaused = false;
            return true;
        } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            // Resume Web Speech API
            window.speechSynthesis.resume();
            isCurrentlyPaused = false;
            return true;
        }
    } catch (error) {
        console.warn('Error resuming speech:', error);
        return false;
    }
    return false;
};

// Check if currently speaking
export const isSpeaking = () => isCurrentlyPlaying;

// Check if currently paused
export const isPaused = () => isCurrentlyPaused;

// Update reading speed during playback
export const updateSpeechRate = (newRate) => {
    try {
        if (currentProvider === TTS_PROVIDERS.GOOGLE_TTS && currentAudio) {
            // Update playback rate for Google TTS audio element
            currentAudio.playbackRate = newRate;
            console.log(`Updated Google TTS playback rate to ${newRate}`);
            return true;
        } else if (currentProvider === TTS_PROVIDERS.WEB_SPEECH && currentUtterance) {
            // Web Speech API doesn't support rate changes during playback
            // We would need to restart speech with new rate
            console.log('Web Speech API doesn\'t support rate changes during playback');
            return false;
        } else if (currentProvider === TTS_PROVIDERS.PUTER && currentAudio) {
            // Update playback rate for Puter.js audio element
            currentAudio.playbackRate = newRate;
            console.log(`Updated Puter.js playback rate to ${newRate}`);
            return true;
        }
    } catch (error) {
        console.warn('Error updating speech rate:', error);
        return false;
    }
    return false;
};

// Detect if boundary events are supported by the current browser
export const detectBoundaryEventSupport = () => {
    if (boundaryEventSupported !== null) {
        return boundaryEventSupported;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        boundaryEventSupported = false;
        return false;
    }

    try {
        // Create a test utterance to check for boundary event support
        const testUtterance = new SpeechSynthesisUtterance('');

        // Check if onboundary exists and is a function property
        const hasBoundarySupport = 'onboundary' in testUtterance &&
                                 typeof testUtterance.onboundary !== 'undefined';

        boundaryEventSupported = hasBoundarySupport;
        console.log('Boundary event support detected:', hasBoundarySupport);

        return hasBoundarySupport;
    } catch (error) {
        console.warn('Error detecting boundary event support:', error);
        boundaryEventSupported = false;
        return false;
    }
};

// Parse text into words for boundary event mapping
const parseTextIntoWords = (text) => {
    if (!text) return [];

    // Clean the text first (remove markdown formatting)
    const cleanText = text.replace(/\*\*(.*?)\*\*/g, '$1').trim();

    // Split into words while preserving word boundaries
    // This regex splits on whitespace but keeps punctuation with words
    const words = cleanText.split(/\s+/).filter(word => word.trim().length > 0);

    return words.map((word, index) => ({
        text: word,
        index: index,
        // Remove punctuation for better TTS boundary matching
        cleanText: word.replace(/[.,!?;:"()\[\]{}]/g, '').toLowerCase()
    }));
};

// Map TTS boundary events to our word indices
const mapBoundaryToWordIndex = (boundaryCharIndex, wordArray, originalText) => {
    if (!wordArray || wordArray.length === 0) return 0;

    try {
        // Clean the original text to match what TTS processes
        const cleanOriginal = originalText.replace(/\*\*(.*?)\*\*/g, '$1').trim();

        // Find which word the boundary character index falls into
        let charCount = 0;
        for (let i = 0; i < wordArray.length; i++) {
            const word = wordArray[i];
            const wordStart = charCount;
            const wordEnd = charCount + word.text.length;

            // If boundary falls within this word's range
            if (boundaryCharIndex >= wordStart && boundaryCharIndex <= wordEnd) {
                return Math.min(i, wordArray.length - 1);
            }

            // Account for spaces between words
            charCount = wordEnd + 1;
        }

        // If boundary index is beyond text, return last word
        if (boundaryCharIndex >= cleanOriginal.length) {
            return wordArray.length - 1;
        }

        // Fallback: find the closest word
        let closestWordIndex = 0;
        let minDistance = Math.abs(boundaryCharIndex - 0);

        charCount = 0;
        for (let i = 0; i < wordArray.length; i++) {
            const word = wordArray[i];
            const wordMiddle = charCount + (word.text.length / 2);
            const distance = Math.abs(boundaryCharIndex - wordMiddle);

            if (distance < minDistance) {
                minDistance = distance;
                closestWordIndex = i;
            }

            charCount += word.text.length + 1;
        }

        return Math.min(closestWordIndex, wordArray.length - 1);
    } catch (error) {
        console.warn('Error mapping boundary to word index:', error);
        return 0;
    }
};

// Enhanced Web Speech API function with boundary event support
const speakWithWebSpeechBoundary = async (text, options = {}) => {
    return new Promise(async (resolve, reject) => {
        if (!("speechSynthesis" in window)) {
            const error = "Speech synthesis is not supported in this browser";
            toast.error(error);
            reject(new Error(error));
            return;
        }

        // Cancel any ongoing speech
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
            if (isIOS()) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        const {
            rate = 0.8,
            pitch = 1,
            volume = 1,
            onStart = () => {},
            onEnd = () => {},
            onError = () => {},
            onWordBoundary = null // New callback for word boundaries
        } = options;

        const iosDevice = isIOS();
        const boundarySupported = detectBoundaryEventSupport();

        // Parse text into words for boundary mapping
        const wordArray = parseTextIntoWords(text);
        currentText = text;

        // Wait for voices to load
        const waitForVoices = () => {
            return new Promise((resolve) => {
                const voices = speechSynthesis.getVoices();
                if (voices.length > 0) {
                    resolve();
                } else {
                    speechSynthesis.onvoiceschanged = () => {
                        resolve();
                    };
                    setTimeout(resolve, 1000);
                }
            });
        };

        waitForVoices().then(() => {
            const delay = iosDevice ? 300 : 100;

            setTimeout(() => {
                try {
                    let processedText = text.replace(/\*\*(.*?)\*\*/g, '$1').trim();

                    if (iosDevice) {
                        processedText = processedText.replace(/\s+/g, ' ');
                        if (processedText.length > 10) {
                            processedText = processedText.replace(/([a-z])([A-Z])/g, '$1 $2');
                        }
                    }

                    const utterance = new SpeechSynthesisUtterance(processedText);

                    utterance.lang = "de-DE";

                    if (iosDevice) {
                        utterance.rate = 0.9;
                        utterance.pitch = 1.0;
                        utterance.volume = 1.0;
                    } else {
                        utterance.rate = Math.max(0.5, Math.min(2.0, rate));
                        utterance.pitch = pitch;
                        utterance.volume = volume;
                    }

                    // Try to get a German voice
                    const germanVoice = getGermanVoice();
                    if (germanVoice) {
                        utterance.voice = germanVoice;
                        console.log(`Using German voice: ${germanVoice.name} (${germanVoice.lang}) - iOS: ${iosDevice}`);
                    }

                    let hasEnded = false;
                    let timeout;

                    // Set up boundary event listener if supported and callback provided
                    if (boundarySupported && onWordBoundary && !iosDevice) {
                        utterance.onboundary = (event) => {
                            try {
                                console.log('Boundary event:', event.name, event.charIndex, event.charLength);

                                // Only handle word boundaries, not sentence boundaries
                                if (event.name === 'word') {
                                    const wordIndex = mapBoundaryToWordIndex(event.charIndex, wordArray, processedText);
                                    console.log(`Mapped boundary charIndex ${event.charIndex} to word index ${wordIndex}`);
                                    onWordBoundary(wordIndex);
                                }
                            } catch (boundaryError) {
                                console.warn('Error in boundary event handler:', boundaryError);
                            }
                        };
                        console.log('Boundary events enabled for word tracking');
                    } else if (onWordBoundary) {
                        console.log('Boundary events not supported or iOS detected, callback will not be used');
                    }

                    // Event handlers
                    utterance.onstart = (event) => {
                        console.log('Speech started for:', text.substring(0, 50) + '...');
                        onStart(event);
                    };

                    const handleEnd = (event) => {
                        if (hasEnded) return;
                        hasEnded = true;

                        if (timeout) clearTimeout(timeout);
                        console.log('Speech ended');
                        onEnd(event);
                        resolve(event);
                    };

                    utterance.onend = handleEnd;

                    utterance.onerror = (event) => {
                        if (hasEnded) return;
                        hasEnded = true;

                        console.error('Speech synthesis error:', event);
                        const errorMsg = "Could not play audio";
                        toast.error(errorMsg);
                        onError(event);
                        reject(new Error(errorMsg));
                    };

                    // Timeout fallback
                    const timeoutDuration = iosDevice ?
                        (text.length * 400) + 4000 :
                        (text.length * 200) + 2000;

                    timeout = setTimeout(() => {
                        if (!hasEnded) {
                            console.log('Speech timeout');
                            handleEnd();
                        }
                    }, timeoutDuration);

                    currentUtterance = utterance;

                    if (iosDevice) {
                        setTimeout(() => {
                            speechSynthesis.speak(utterance);
                        }, 100);
                    } else {
                        speechSynthesis.speak(utterance);
                    }

                } catch (error) {
                    console.error('Speech synthesis setup error:', error);
                    toast.error("Speech synthesis failed");
                    reject(error);
                }
            }, delay);
        });
    });
};

// Export initialization function for manual use
export { initializeSpeechSynthesis };