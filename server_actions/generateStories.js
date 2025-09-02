"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateStory(selectedWords, preferences = {}) {
    try {
        // Validate input
        if (!selectedWords || selectedWords.length === 0) {
            return {
                success: false,
                error: "No words provided for story generation"
            };
        }

        if (!process.env.GEMINI_API_KEY) {
            return {
                success: false,
                error: "Gemini API key not configured"
            };
        }

        const {
            length = "medium",
            style = "educational",
            includeEnglish = true
        } = preferences;

        // Get the generative model
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Step 1: Generate German story first
        const germanPrompt = createGermanStoryPrompt(selectedWords, { length, style, includeEnglish });
        const germanResult = await model.generateContent(germanPrompt);
        const germanStory = germanResult.response.text();

        // Step 2: Convert the German story to English
        const conversionPrompt = createConversionPrompt(germanStory);
        const englishResult = await model.generateContent(conversionPrompt);
        const englishStory = englishResult.response.text();

        return {
            success: true,
            germanStory: germanStory,
            englishStory: englishStory,
            wordsUsed: selectedWords,
            preferences: { length, style, includeEnglish }
        };

    } catch (error) {
        console.error("Story generation error:", error);
        return {
            success: false,
            error: error.message || "Failed to generate story"
        };
    }
}

function createGermanStoryPrompt(words, options) {
    const { length, style, includeEnglish } = options;
    
    // Create word context for the AI
    const wordContext = words.map(word => 
        `- ${word.german} (${word.english}) - ${word.type || 'word'}`
    ).join('\n');

    // Determine story length specifications
    const lengthSpecs = {
        short: "150-200 words",
        medium: "300-400 words", 
        long: "500-700 words"
    };

    // Determine style specifications
    const styleSpecs = {
        educational: "educational and informative, suitable for language learning",
        adventure: "exciting adventure story with vivid descriptions",
        daily: "everyday life scenario that feels natural and relatable",
        funny: "humorous and entertaining story that makes learning enjoyable",
        mystery: "intriguing mystery story that keeps the reader engaged"
    };

    const prompt = `You are a creative German language learning assistant. Create a ${styleSpecs[style]} story IN GERMAN that naturally incorporates ALL of the following German words:

${wordContext}

Requirements:
- Story length: ${lengthSpecs[length]}
- Style: ${styleSpecs[style]}
- Write the ENTIRE story in German language
- Use EVERY German word from the list above naturally in the story
- Make the target vocabulary words stand out by putting them in **bold** (e.g., **Hund**)
- Use simple to intermediate German grammar suitable for learners
- Create a flowing, engaging narrative in German
- Make the vocabulary words feel natural, not forced
- Include a variety of German sentence structures
- Use clear, understandable German prose
${includeEnglish ? "- After each **bold** vocabulary word, you may include the English translation in parentheses if it helps comprehension" : ""}

The story should help German language learners practice reading German while remembering these vocabulary words through an engaging, memorable narrative. Focus on creating vivid scenes and contexts in German that make the vocabulary meaningful and memorable.

German Story:`;

    return prompt;
}

function createConversionPrompt(germanStory) {
    const prompt = `You are a translation expert specializing in German-English translation for language learners. 

Please convert this German story to English while maintaining the following requirements:

ORIGINAL GERMAN STORY:
${germanStory}

CONVERSION REQUIREMENTS:
- Translate the entire story to natural, fluent English
- Keep the exact same story structure, plot, and narrative flow
- When you encounter **bold German words** (vocabulary words), keep them in German and bold, then add the English translation in parentheses
  Example: **Hund** becomes **Hund** (dog)
- Maintain all the same scenes, characters, and story elements
- Make the English version read naturally while preserving the learning elements
- Keep the same paragraph structure and flow
- Ensure the English version tells exactly the same story as the German version

The goal is to create an English version that helps learners understand the German story context while keeping the German vocabulary words visible for learning purposes.

English Translation:`;

    return prompt;
}

export async function generateMultipleStoryOptions(selectedWords, preferences = {}) {
    try {
        if (!selectedWords || selectedWords.length === 0) {
            return {
                success: false,
                error: "No words provided for story generation"
            };
        }

        // Generate 3 different story options
        const styles = ['educational', 'adventure', 'daily'];
        const storyPromises = styles.map(style => 
            generateStory(selectedWords, { ...preferences, style })
        );

        const results = await Promise.all(storyPromises);
        
        const stories = results
            .filter(result => result.success)
            .map((result, index) => ({
                ...result,
                style: styles[index],
                id: `story_${Date.now()}_${index}`
            }));

        if (stories.length === 0) {
            return {
                success: false,
                error: "Failed to generate any story options"
            };
        }

        return {
            success: true,
            stories: stories,
            wordsUsed: selectedWords
        };

    } catch (error) {
        console.error("Multiple story generation error:", error);
        return {
            success: false,
            error: error.message || "Failed to generate story options"
        };
    }
}