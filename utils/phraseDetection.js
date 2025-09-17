// Phrase Detection Utility for Enhanced UX Features
// Provides intelligent phrase grouping for German and English text

/**
 * German-specific word patterns for phrase detection
 */
const GERMAN_PATTERNS = {
    // Articles + nouns
    articles: ['der', 'die', 'das', 'ein', 'eine', 'einen', 'einem', 'einer', 'eines'],

    // Prepositions that typically start phrases
    prepositions: ['in', 'an', 'auf', 'mit', 'zu', 'von', 'bei', 'nach', 'über', 'unter', 'vor', 'durch', 'für', 'gegen', 'ohne', 'um'],

    // Conjunctions
    conjunctions: ['und', 'oder', 'aber', 'denn', 'sondern', 'dass', 'weil', 'wenn', 'als', 'ob', 'damit', 'obwohl'],

    // Common adjectives that modify nouns
    adjectives: ['groß', 'klein', 'schön', 'gut', 'schlecht', 'neu', 'alt', 'jung', 'schnell', 'langsam', 'hell', 'dunkel', 'warm', 'kalt'],

    // Modal verbs
    modalVerbs: ['kann', 'könnte', 'muss', 'sollte', 'will', 'möchte', 'darf', 'soll', 'mag'],

    // Separable verb prefixes
    separablePrefixes: ['ab', 'an', 'auf', 'aus', 'bei', 'ein', 'mit', 'nach', 'vor', 'zu', 'zurück', 'zusammen']
};

/**
 * English-specific word patterns for phrase detection
 */
const ENGLISH_PATTERNS = {
    // Articles + determiners
    articles: ['the', 'a', 'an', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their'],

    // Prepositions
    prepositions: ['in', 'on', 'at', 'by', 'for', 'with', 'to', 'from', 'of', 'about', 'through', 'during', 'before', 'after', 'above', 'below', 'over', 'under'],

    // Conjunctions
    conjunctions: ['and', 'or', 'but', 'so', 'yet', 'for', 'nor', 'because', 'since', 'although', 'while', 'if', 'unless', 'when', 'where', 'why', 'how'],

    // Common adjectives
    adjectives: ['big', 'small', 'good', 'bad', 'new', 'old', 'young', 'fast', 'slow', 'bright', 'dark', 'warm', 'cold', 'beautiful', 'ugly'],

    // Modal verbs and auxiliaries
    modalVerbs: ['can', 'could', 'should', 'would', 'will', 'shall', 'may', 'might', 'must', 'have', 'has', 'had', 'do', 'does', 'did', 'am', 'is', 'are', 'was', 'were']
};

/**
 * Clean a word by removing punctuation and converting to lowercase
 * @param {string} word - The word to clean
 * @returns {string} - The cleaned word
 */
const cleanWord = (word) => {
    if (!word) return '';
    return word.replace(/[.,!?;:"()\[\]{}]/g, '').toLowerCase().trim();
};

/**
 * Determine if a word belongs to a specific category in the given language
 * @param {string} word - The word to check
 * @param {string} category - The category to check ('articles', 'prepositions', etc.)
 * @param {string} language - The language ('german' or 'english')
 * @returns {boolean} - Whether the word belongs to the category
 */
const isWordCategory = (word, category, language) => {
    const cleanedWord = cleanWord(word);
    const patterns = language === 'german' ? GERMAN_PATTERNS : ENGLISH_PATTERNS;

    return patterns[category] && patterns[category].includes(cleanedWord);
};

/**
 * Check if a word is likely a noun (basic heuristic)
 * @param {string} word - The word to check
 * @param {string} language - The language ('german' or 'english')
 * @returns {boolean} - Whether the word is likely a noun
 */
const isLikelyNoun = (word, language) => {
    const cleanedWord = cleanWord(word);

    if (language === 'german') {
        // German nouns are capitalized
        return word.length > 0 && word[0] === word[0].toUpperCase() &&
               !isWordCategory(word, 'articles', language) &&
               !isWordCategory(word, 'prepositions', language) &&
               !isWordCategory(word, 'conjunctions', language);
    } else {
        // For English, use length and position heuristics
        // This is a simplified check - in a real implementation you'd use POS tagging
        return cleanedWord.length > 2 &&
               !isWordCategory(word, 'articles', language) &&
               !isWordCategory(word, 'prepositions', language) &&
               !isWordCategory(word, 'conjunctions', language) &&
               !isWordCategory(word, 'modalVerbs', language);
    }
};

/**
 * Detect natural phrase boundaries based on language patterns
 * @param {Array} words - Array of word objects with text and index
 * @param {string} language - The language ('german' or 'english')
 * @returns {Array} - Array of phrase objects with startIndex, endIndex, and words
 */
export const detectPhrases = (words, language = 'german') => {
    if (!words || words.length === 0) return [];

    const phrases = [];
    let currentPhrase = {
        startIndex: 0,
        endIndex: 0,
        words: [words[0]]
    };

    for (let i = 1; i < words.length; i++) {
        const currentWord = words[i];
        const previousWord = words[i - 1];
        const nextWord = words[i + 1];

        const currentText = currentWord.text;
        const previousText = previousWord.text;

        let shouldStartNewPhrase = false;

        // Phrase boundary rules
        if (isWordCategory(currentText, 'articles', language) &&
            (isLikelyNoun(nextWord?.text, language) || isWordCategory(nextWord?.text, 'adjectives', language))) {
            // Start new phrase: Article + (Adjective) + Noun
            shouldStartNewPhrase = currentPhrase.words.length > 1;
        } else if (isWordCategory(currentText, 'prepositions', language)) {
            // Start new phrase: Preposition phrase
            shouldStartNewPhrase = currentPhrase.words.length > 1;
        } else if (isWordCategory(currentText, 'conjunctions', language)) {
            // Start new phrase after conjunction
            shouldStartNewPhrase = true;
        } else if (isWordCategory(currentText, 'modalVerbs', language)) {
            // Start new phrase: Modal verb phrase
            shouldStartNewPhrase = currentPhrase.words.length > 2;
        } else if (language === 'german' && isWordCategory(previousText, 'separablePrefixes', language)) {
            // German separable verbs: include prefix with verb
            shouldStartNewPhrase = false;
        } else if (currentPhrase.words.length >= 4) {
            // Limit phrase length to avoid overly long phrases
            shouldStartNewPhrase = true;
        } else if (cleanWord(currentText).match(/^[.,!?;:]$/)) {
            // Punctuation marks end phrases
            currentPhrase.words.push(currentWord);
            currentPhrase.endIndex = currentWord.index;
            phrases.push({ ...currentPhrase });

            if (i < words.length - 1) {
                currentPhrase = {
                    startIndex: words[i + 1]?.index || currentWord.index + 1,
                    endIndex: words[i + 1]?.index || currentWord.index + 1,
                    words: []
                };
            }
            continue;
        }

        if (shouldStartNewPhrase && currentPhrase.words.length > 0) {
            // Finalize current phrase
            currentPhrase.endIndex = previousWord.index;
            phrases.push({ ...currentPhrase });

            // Start new phrase
            currentPhrase = {
                startIndex: currentWord.index,
                endIndex: currentWord.index,
                words: [currentWord]
            };
        } else {
            // Continue current phrase
            currentPhrase.words.push(currentWord);
            currentPhrase.endIndex = currentWord.index;
        }
    }

    // Add the last phrase
    if (currentPhrase.words.length > 0) {
        phrases.push(currentPhrase);
    }

    // Post-process: merge very short phrases (single words) with adjacent phrases
    const mergedPhrases = [];
    for (let i = 0; i < phrases.length; i++) {
        const phrase = phrases[i];

        if (phrase.words.length === 1 && mergedPhrases.length > 0) {
            // Merge single words with previous phrase if it's not too long
            const lastPhrase = mergedPhrases[mergedPhrases.length - 1];
            if (lastPhrase.words.length < 3) {
                lastPhrase.words.push(...phrase.words);
                lastPhrase.endIndex = phrase.endIndex;
                continue;
            }
        }

        mergedPhrases.push(phrase);
    }

    return mergedPhrases;
};

/**
 * Generate phrase text from phrase object
 * @param {Object} phrase - Phrase object with words array
 * @returns {string} - Combined text of the phrase
 */
export const getPhraseText = (phrase) => {
    if (!phrase || !phrase.words) return '';
    return phrase.words.map(word => word.text).join(' ');
};

/**
 * Map word index to phrase index
 * @param {number} wordIndex - The current word index
 * @param {Array} phrases - Array of phrase objects
 * @returns {number} - The phrase index containing the word
 */
export const mapWordIndexToPhraseIndex = (wordIndex, phrases) => {
    if (!phrases || phrases.length === 0) return 0;

    for (let i = 0; i < phrases.length; i++) {
        const phrase = phrases[i];
        if (wordIndex >= phrase.startIndex && wordIndex <= phrase.endIndex) {
            return i;
        }
    }

    // If not found, return the closest phrase
    return Math.min(Math.floor(wordIndex / 3), phrases.length - 1);
};

/**
 * Get configuration options for phrase detection
 * @returns {Object} - Configuration options
 */
export const getPhraseDetectionConfig = () => {
    return {
        modes: [
            {
                id: 'single',
                name: 'Single Word',
                description: 'Highlight individual words'
            },
            {
                id: 'phrase',
                name: 'Smart Phrases',
                description: 'Highlight meaningful word groups (2-3 words)'
            },
            {
                id: 'adaptive',
                name: 'Adaptive',
                description: 'Switch between single words and phrases based on content'
            }
        ],
        defaultMode: 'phrase'
    };
};

/**
 * Apply phrase detection based on mode
 * @param {Array} words - Array of word objects
 * @param {string} mode - Detection mode ('single', 'phrase', 'adaptive')
 * @param {string} language - The language ('german' or 'english')
 * @returns {Array} - Array of phrase/word objects to highlight
 */
export const applyPhraseDetection = (words, mode = 'phrase', language = 'german') => {
    if (!words || words.length === 0) return [];

    switch (mode) {
        case 'single':
            // Return individual words as single-word phrases
            return words.map(word => ({
                startIndex: word.index,
                endIndex: word.index,
                words: [word]
            }));

        case 'phrase':
            // Use intelligent phrase detection
            return detectPhrases(words, language);

        case 'adaptive':
            // Use phrases for longer texts, single words for shorter texts
            if (words.length > 20) {
                return detectPhrases(words, language);
            } else {
                return words.map(word => ({
                    startIndex: word.index,
                    endIndex: word.index,
                    words: [word]
                }));
            }

        default:
            return detectPhrases(words, language);
    }
};