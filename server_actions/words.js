"use server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth/next";
import Word from "@/models/word";
import { v4 as uuidv4 } from "uuid";

import { connectDB } from "@/utils/db";

export async function addWord(formData) {
    const session = await getServerSession(authOptions);

    const body = {
        german: formData.get("germanWord"),
        english: formData.get("englishWord"),
        type: formData.get("type"),
        uuid: uuidv4(),
    };
    if (body.german === "" || body.english === "") {
        return { success: false, error: "All fields are required!!" };
    }
    try {
        await connectDB();
        if (!session) {
            return {
                success: false,
                error: "Unauthorized access",
            };
        }
        const existingWord = await Word.findOne({ email: session.user.email });
        if (existingWord) {
            existingWord.data.unshift(body);
            await existingWord.save();
            return { success: true, data: JSON.stringify(existingWord.data) };
        } else {
            const word = new Word({
                email: session.user.email,
                data: [body],
            });
            await word.save();
            return { success: true };
        }
    } catch (error) {
        console.error("Error:", error);
        return { success: false, error: error.message };
    }
}

export async function getRandomWords() {
    // 1. Connect to database
    await connectDB();
    // Get the user session
    const session = await getServerSession(authOptions);

    if (!session) {
        throw new Error("User is not authenticated");
    }

    // Find the user document using the session user's email
    const userDoc = await Word.findOne({ email: session.user.email });

    if (!userDoc || !userDoc.data) {
        throw new Error("User document or data array not found");
    }

    // Get 10 random words from the data array
    const randomTenElements = getRandomElements(userDoc.data, 10);
    return JSON.stringify(randomTenElements);
}

const getRandomElements = (arr, num) => {
    const shuffled = arr.slice(); // Create a copy of the array
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
    }
    return shuffled.slice(0, num); // Get the first 'num' elements
};
