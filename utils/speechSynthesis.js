import toast from "react-hot-toast";

// Initialize speech synthesis and load voices
const initializeSpeechSynthesis = () => {
    if ("speechSynthesis" in window) {
        // Force voices to load by calling getVoices()
        speechSynthesis.getVoices();
        
        // Some browsers need a user interaction to enable speech synthesis
        const enableSpeech = () => {
            if (speechSynthesis.speaking) return;
            
            // Create a silent utterance to initialize the API
            const utterance = new SpeechSynthesisUtterance('');
            utterance.volume = 0;
            speechSynthesis.speak(utterance);
        };
        
        // Try to initialize on user interaction
        document.addEventListener('click', enableSpeech, { once: true });
        document.addEventListener('touchstart', enableSpeech, { once: true });
    }
};

// Get the best German voice available
const getGermanVoice = () => {
    const voices = speechSynthesis.getVoices();
    
    // Priority order: local German voices, then any German voices
    return voices.find(voice => 
        voice.lang.startsWith('de') && voice.localService
    ) || voices.find(voice => 
        voice.lang.startsWith('de')
    ) || null;
};

// Enhanced speak function with better error handling and reliability
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

        // Default options
        const {
            rate = 0.8,
            pitch = 1,
            volume = 1,
            onStart = () => {},
            onEnd = () => {},
            onError = () => {}
        } = options;

        // Small delay to ensure cancellation is complete
        setTimeout(() => {
            try {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = "de-DE";
                utterance.rate = rate;
                utterance.pitch = pitch;
                utterance.volume = volume;

                // Try to get a German voice
                const germanVoice = getGermanVoice();
                if (germanVoice) {
                    utterance.voice = germanVoice;
                }

                // Event handlers
                utterance.onstart = (event) => {
                    console.log('Speech started for:', text);
                    onStart(event);
                };

                utterance.onend = (event) => {
                    console.log('Speech ended for:', text);
                    onEnd(event);
                    resolve(event);
                };

                utterance.onerror = (event) => {
                    console.error('Speech synthesis error:', event);
                    const errorMsg = "Could not play audio";
                    toast.error(errorMsg);
                    onError(event);
                    reject(new Error(errorMsg));
                };

                // Timeout fallback (some browsers don't trigger onend reliably)
                const timeout = setTimeout(() => {
                    console.log('Speech timeout for:', text);
                    resolve();
                }, (text.length * 200) + 2000); // Rough estimate based on text length

                utterance.onend = (event) => {
                    clearTimeout(timeout);
                    console.log('Speech ended for:', text);
                    onEnd(event);
                    resolve(event);
                };

                speechSynthesis.speak(utterance);
                
            } catch (error) {
                console.error('Speech synthesis setup error:', error);
                toast.error("Speech synthesis failed");
                reject(error);
            }
        }, 100);
    });
};

// Initialize on module load
initializeSpeechSynthesis();

// Export initialization function for manual use
export { initializeSpeechSynthesis };