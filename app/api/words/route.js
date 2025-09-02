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

export async function GET(req) {
    try {
        await connectDB();
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({
                success: false,
                error: "Unauthorized access",
            });
        }
        
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const search = searchParams.get('search') || '';
        const type = searchParams.get('type') || '';
        const sort = searchParams.get('sort') || '';
        
        const userEmail = session.user.email;
        const userWords = await Word.findOne({ email: userEmail });

        if (!userWords || !userWords.data) {
            return NextResponse.json({ 
                success: true, 
                data: [], 
                pagination: {
                    page: 1,
                    limit,
                    total: 0,
                    totalPages: 0
                }
            });
        }

        let filteredData = [...userWords.data];

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            filteredData = filteredData.filter(word => 
                word.german?.toLowerCase().includes(searchLower) ||
                word.english?.toLowerCase().includes(searchLower)
            );
        }

        // Apply type filter
        if (type && type.toLowerCase() !== 'all') {
            filteredData = filteredData.filter(word => 
                word.type?.toLowerCase() === type.toLowerCase()
            );
        }

        // Apply sorting
        if (sort) {
            filteredData.sort((a, b) => {
                switch (sort) {
                    case 'german-asc':
                        return a.german?.localeCompare(b.german) || 0;
                    case 'german-desc':
                        return b.german?.localeCompare(a.german) || 0;
                    case 'english-asc':
                        return a.english?.localeCompare(b.english) || 0;
                    case 'english-desc':
                        return b.english?.localeCompare(a.english) || 0;
                    case 'date-newest':
                        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                    case 'date-oldest':
                        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
                    case 'type':
                        return (a.type || '').localeCompare(b.type || '');
                    default:
                        return 0;
                }
            });
        }

        const total = filteredData.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        return NextResponse.json({ 
            success: true, 
            data: paginatedData,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
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
