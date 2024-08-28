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
