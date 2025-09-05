import toast from "react-hot-toast";

// Detect browser type for Safari-specific handling
const isSafari = () => {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

const isMobile = () => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

const isIOS = () => {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

// Initialize speech synthesis and load voices
const initializeSpeechSynthesis = () => {
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
        document.addEventListener('click', enableSpeech, { once: true });
        document.addEventListener('touchstart', enableSpeech, { once: true });
    }
};

// Debug function to log available voices
const logAvailableVoices = () => {
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
        
        // First, try to avoid 'Compact' voices which are lower quality
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

// Enhanced speak function with Safari mobile optimizations
export const speakGermanWord = (text, options = {}) => {
    return new Promise((resolve, reject) => {
        if (!("speechSynthesis" in window)) {
            const error = "Speech synthesis is not supported in this browser";
            toast.error(error);
            reject(new Error(error));
            return;
        }

        // Cancel any ongoing speech
        speechSynthesis.cancel();

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
                    const utterance = new SpeechSynthesisUtterance(text);
                    
                    // iOS-specific language setting
                    if (iosDevice) {
                        utterance.lang = "de-DE"; // Explicit German language
                    } else {
                        utterance.lang = "de-DE";
                    }
                    
                    // iOS-specific rate adjustment (more conservative)
                    if (iosDevice) {
                        utterance.rate = Math.max(0.7, Math.min(1.2, rate)); // More restrictive range for iOS
                        utterance.pitch = Math.max(0.8, Math.min(1.2, pitch)); // Conservative pitch for iOS
                    } else {
                        utterance.rate = Math.max(0.5, Math.min(2.0, rate)); // Normal range for other browsers
                        utterance.pitch = pitch;
                    }
                    utterance.volume = volume;

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

// Initialize on module load
initializeSpeechSynthesis();

// Export initialization function for manual use
export { initializeSpeechSynthesis };