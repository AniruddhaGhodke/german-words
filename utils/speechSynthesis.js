import toast from "react-hot-toast";

// Detect browser type for Safari-specific handling
const isSafari = () => {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

const isMobile = () => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
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

// Get the best German voice available with Safari optimizations
const getGermanVoice = () => {
    const voices = speechSynthesis.getVoices();
    
    if (isSafari() && isMobile()) {
        // Safari mobile specific voice selection
        // Prefer high-quality German voices that work well on Safari mobile
        return voices.find(voice => 
            voice.lang === 'de-DE' && voice.localService
        ) || voices.find(voice => 
            voice.lang.startsWith('de-') && voice.localService
        ) || voices.find(voice => 
            voice.lang.startsWith('de')
        ) || null;
    } else {
        // Priority order for other browsers: local German voices, then any German voices
        return voices.find(voice => 
            voice.lang.startsWith('de') && voice.localService
        ) || voices.find(voice => 
            voice.lang.startsWith('de')
        ) || null;
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

        // Safari mobile optimized default options
        const safariMobile = isSafari() && isMobile();
        const defaultRate = safariMobile ? 1.0 : 0.8; // Safari mobile works better with rate 1.0
        
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
            // Longer delay for Safari mobile to ensure proper cleanup
            const delay = safariMobile ? 200 : 100;
            
            setTimeout(() => {
                try {
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = "de-DE";
                    
                    // Safari mobile specific rate adjustment
                    utterance.rate = Math.max(0.5, Math.min(2.0, rate)); // Clamp rate to valid range
                    utterance.pitch = pitch;
                    utterance.volume = volume;

                    // Try to get a German voice
                    const germanVoice = getGermanVoice();
                    if (germanVoice) {
                        utterance.voice = germanVoice;
                        console.log('Using German voice:', germanVoice.name, germanVoice.lang);
                    } else {
                        console.warn('No German voice found, using default');
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

                    // Timeout fallback - longer for Safari mobile
                    const timeoutDuration = safariMobile ? 
                        (text.length * 300) + 3000 : 
                        (text.length * 200) + 2000;
                    
                    timeout = setTimeout(() => {
                        if (!hasEnded) {
                            console.log('Speech timeout for:', text);
                            handleEnd();
                        }
                    }, timeoutDuration);

                    // Safari mobile needs a slight delay before speaking
                    if (safariMobile) {
                        setTimeout(() => {
                            speechSynthesis.speak(utterance);
                        }, 50);
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