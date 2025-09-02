"use server";
import * as deepl from "deepl-node";

const authKey = process.env.DEEPL_SECRET;
const translator = new deepl.Translator(authKey);

export async function generateGermanSentences(word, wordType, englishMeaning) {
    if (!authKey) {
        throw new Error("DeepL API key not configured");
    }

    try {
        // Generate contextual English sentences based on word meaning and type
        const englishSentences = generateEnglishTemplates(englishMeaning, wordType);
        
        // Translate each sentence to German using DeepL
        const germanSentences = [];
        
        for (const englishSentence of englishSentences) {
            try {
                const result = await translator.translateText(
                    englishSentence,
                    'en',
                    'de'
                );
                germanSentences.push({
                    english: englishSentence,
                    german: result.text,
                    source: 'deepl'
                });
            } catch (error) {
                console.error(`Failed to translate: ${englishSentence}`, error);
                // Continue with other sentences even if one fails
            }
        }

        return {
            success: true,
            sentences: germanSentences,
            count: germanSentences.length
        };

    } catch (error) {
        console.error("Error generating sentences:", error);
        return {
            success: false,
            error: "Failed to generate sentences",
            fallback: generateFallbackSentences(word, wordType, englishMeaning)
        };
    }
}

function generateEnglishTemplates(englishMeaning, wordType) {
    const meaning = englishMeaning.toLowerCase();
    const type = wordType?.toLowerCase() || 'unknown';
    
    // Create contextual sentences based on the word meaning
    const templates = [];
    
    if (type === 'noun') {
        templates.push(
            `I need a ${meaning} for my daily activities.`,
            `The ${meaning} is very important to me.`,
            `Where can I find a good ${meaning}?`,
            `My ${meaning} is new and works perfectly.`,
            `Everyone should have a ${meaning} like this.`
        );
    } else if (type === 'verb') {
        templates.push(
            `I like to ${meaning} in the morning.`,
            `We should ${meaning} together sometime.`,
            `Can you ${meaning} with me today?`,
            `It's important to ${meaning} regularly.`,
            `I learned how to ${meaning} last year.`
        );
    } else if (type === 'adjective') {
        templates.push(
            `The weather is very ${meaning} today.`,
            `I feel ${meaning} when I'm with my family.`,
            `This is a ${meaning} example of good design.`,
            `The food tastes really ${meaning}.`,
            `She is always so ${meaning} and kind.`
        );
    } else {
        // Generic templates that work for most word types
        templates.push(
            `${englishMeaning} is something I encounter daily.`,
            `I think about ${englishMeaning} quite often.`,
            `${englishMeaning} plays an important role in life.`,
            `Understanding ${englishMeaning} is very helpful.`,
            `${englishMeaning} can be found everywhere.`
        );
    }
    
    // Return 3 random templates to avoid repetition
    return templates.sort(() => Math.random() - 0.5).slice(0, 3);
}

function generateFallbackSentences(word, wordType, englishMeaning) {
    // Fallback sentences in case DeepL fails
    const type = wordType?.toLowerCase() || 'any';
    
    switch (type) {
        case 'noun':
            return [
                { 
                    german: `Das ${word} ist sehr nützlich.`,
                    english: `The ${englishMeaning} is very useful.`,
                    source: 'fallback'
                },
                { 
                    german: `Ich brauche ein ${word}.`,
                    english: `I need a ${englishMeaning}.`,
                    source: 'fallback'
                },
                { 
                    german: `Mein ${word} ist neu.`,
                    english: `My ${englishMeaning} is new.`,
                    source: 'fallback'
                }
            ];
        case 'verb':
            return [
                { 
                    german: `Ich möchte ${word}.`,
                    english: `I want to ${englishMeaning}.`,
                    source: 'fallback'
                },
                { 
                    german: `Wir können ${word}.`,
                    english: `We can ${englishMeaning}.`,
                    source: 'fallback'
                },
                { 
                    german: `Es ist gut zu ${word}.`,
                    english: `It's good to ${englishMeaning}.`,
                    source: 'fallback'
                }
            ];
        default:
            return [
                { 
                    german: `${word} bedeutet "${englishMeaning}".`,
                    english: `${word} means "${englishMeaning}".`,
                    source: 'fallback'
                },
                { 
                    german: `Das Wort "${word}" ist interessant.`,
                    english: `The word "${word}" is interesting.`,
                    source: 'fallback'
                },
                { 
                    german: `Ich lerne "${word}" heute.`,
                    english: `I'm learning "${word}" today.`,
                    source: 'fallback'
                }
            ];
    }
}

// Function to get example sentences for a specific German word by reverse translation
export async function getExampleSentencesForGermanWord(germanWord, englishMeaning, wordType) {
    if (!authKey) {
        throw new Error("DeepL API key not configured");
    }

    try {
        // Create example sentences in English using the word meaning
        const contextualExamples = [
            `I use ${englishMeaning} every day.`,
            `The ${englishMeaning} is essential for this task.`,
            `My friend showed me how to ${englishMeaning}.`,
            `Without ${englishMeaning}, it would be difficult.`,
            `Everyone needs ${englishMeaning} in their life.`
        ];

        // Translate to German and then replace with the actual German word
        const results = [];
        
        for (const example of contextualExamples.slice(0, 3)) {
            try {
                const translation = await translator.translateText(example, 'en', 'de');
                // Try to replace the translated English meaning with the actual German word
                let germanSentence = translation.text;
                
                // Simple word replacement (this could be improved with better linguistic analysis)
                const translatedMeaning = await translator.translateText(englishMeaning, 'en', 'de');
                germanSentence = germanSentence.replace(translatedMeaning.text, germanWord);
                
                results.push({
                    english: example,
                    german: germanSentence,
                    source: 'deepl-contextual'
                });
            } catch (error) {
                console.error(`Failed to process example: ${example}`, error);
            }
        }

        return {
            success: true,
            sentences: results
        };

    } catch (error) {
        console.error("Error generating contextual sentences:", error);
        return {
            success: false,
            error: "Failed to generate contextual sentences"
        };
    }
}