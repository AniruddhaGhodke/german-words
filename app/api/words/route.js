import { connectDB } from "@/utils/db";
import Word from "@/models/word";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({
                success: false,
                error: "Unauthorized access",
            });
        }

        const body = await req.json();
        if (!body) {
            throw new Error("Missing request body");
        }

        const existingWord = await Word.findOne({ email: session.user.email });
        if (existingWord) {
            existingWord.data.push(body);
            await existingWord.save();
            return NextResponse.json({ success: true, data: existingWord });
        } else {
            const word = new Word({
                email: session.user.email,
                data: [body],
            });
            await word.save();
            return NextResponse.json({ success: true, data: word });
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: error.message });
    }
}

export async function GET() {
    try {
        await connectDB();
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({
                success: false,
                error: "Unauthorized access",
            });
        }
        const userEmail = session.user.email;
        const words = await Word.find({ email: userEmail });

        return NextResponse.json({ success: true, data: words[0] });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: error.message });
    }
}

export async function DELETE(req, res) {
    await connectDB();

    const session = await getServerSession();
    if (!session) {
        return NextResponse.json({
            success: false,
            error: "Unauthorized access",
        });
    }
    const body = await req.json();
    const email = session.user.email;
    const { uuid } = body;
    if (!uuid) {
        return NextResponse.json({
            success: false,
            error: "UUID is required",
        });
    }

    try {
        const existingWord = await Word.findOne({ email });

        if (!existingWord) {
            return NextResponse.json({
                success: false,
                error: "Record not found",
            });
        }

        const updatedData = existingWord.data.filter(
            (item) => item.uuid !== uuid
        );

        if (updatedData.length === existingWord.data.length) {
            return NextResponse.json({
                success: false,
                error: "Word not found in data array",
            });
        }

        existingWord.data = updatedData;
        await existingWord.save();

        return NextResponse.json({ success: true, data: existingWord.data });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: "Internal Server Error",
        });
    }
}
