"use server";
import * as deepl from "deepl-node";

const authKey = process.env.DEEPL_SECRET;
const translator = new deepl.Translator(authKey);

export async function Translate(formData) {
    if (!formData || typeof formData !== "object") {
        throw new Error("Invalid form data provided");
    }

    const englishWord = formData.get("englishWord");
    const germanWord = formData.get("germanWord");

    if (typeof englishWord !== "string" || typeof germanWord !== "string") {
        throw new Error("Invalid input types for words");
    }

    const { sourceLang, targetLang, word } = determineLanguage(
        englishWord,
        germanWord
    );

    try {
        const result = await translator.translateText(
            word,
            sourceLang,
            targetLang
        );

        return { success: true, [targetLang]: result.text };
    } catch (error) {
        return { success: false, error: "Translation failed" };
    }
}

function determineLanguage(englishWord, germanWord) {
    const sourceLang = englishWord.trim() !== "" ? "en" : "de";
    const targetLang = englishWord.trim() !== "" ? "de" : "en-US";
    const word = englishWord.trim() !== "" ? englishWord : germanWord;
    return { sourceLang, targetLang, word };
}
