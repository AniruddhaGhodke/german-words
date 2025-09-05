import toast from "react-hot-toast";

// TTS Provider Types
const TTS_PROVIDERS = {
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

// Smart provider selection based on device and availability
const selectBestProvider = () => {
    const preferred = getPreferredProvider();
    
    if (preferred !== TTS_PROVIDERS.AUTO) {
        return preferred;
    }
    
    // Auto-selection logic
    if (isPuterAvailable()) {
        // Prefer Puter.js on iOS for better quality
        if (isIOS()) return TTS_PROVIDERS.PUTER;
        
        // Prefer Puter.js for all devices if available
        return TTS_PROVIDERS.PUTER;
    }
    
    return TTS_PROVIDERS.WEB_SPEECH;
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

// Export initialization function for manual use
export { initializeSpeechSynthesis };