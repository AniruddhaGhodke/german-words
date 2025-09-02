import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/utils/db";
import Story from "@/models/story";
import User from "@/models/user";

// GET - Fetch user's stories with pagination and sorting
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Authentication required" }, 
                { status: 401 }
            );
        }

        await connectDB();

        // Find user to get userId
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json(
                { error: "User not found" }, 
                { status: 404 }
            );
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = Math.min(parseInt(searchParams.get('limit')) || 12, 50); // Max 50 per page
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
        const style = searchParams.get('style'); // Filter by style
        const search = searchParams.get('search'); // Search in title

        // Build query
        const query = { userId: user._id };
        
        if (style && style !== 'all') {
            query['preferences.style'] = style;
        }
        
        if (search && search.trim()) {
            query.title = { $regex: search.trim(), $options: 'i' };
        }

        // Get stories and total count
        const [stories, totalCount] = await Promise.all([
            Story.find(query)
                .sort({ [sortBy]: sortOrder })
                .skip((page - 1) * limit)
                .limit(limit)
                .select('title germanStory englishStory wordsUsed preferences createdAt updatedAt')
                .lean(),
            Story.countDocuments(query)
        ]);

        // Add preview to each story
        const storiesWithPreview = stories.map(story => ({
            ...story,
            germanPreview: story.germanStory ? 
                story.germanStory.replace(/\*\*(.*?)\*\*/g, '$1').substring(0, 150) + 
                (story.germanStory.length > 150 ? '...' : '') : '',
            englishPreview: story.englishStory ? 
                story.englishStory.replace(/\*\*(.*?)\*\*/g, '$1').substring(0, 150) + 
                (story.englishStory.length > 150 ? '...' : '') : ''
        }));

        const totalPages = Math.ceil(totalCount / limit);
        
        return NextResponse.json({
            success: true,
            data: {
                stories: storiesWithPreview,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                    limit
                }
            }
        });

    } catch (error) {
        console.error("Error fetching stories:", error);
        return NextResponse.json(
            { error: "Failed to fetch stories" }, 
            { status: 500 }
        );
    }
}

// POST - Create a new story
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Authentication required" }, 
                { status: 401 }
            );
        }

        await connectDB();

        // Find user to get userId
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json(
                { error: "User not found" }, 
                { status: 404 }
            );
        }

        const body = await request.json();
        
        // Validate required fields
        const { title, germanStory, englishStory, wordsUsed, preferences } = body;
        
        if (!title || !germanStory || !englishStory || !wordsUsed || !preferences) {
            return NextResponse.json(
                { error: "Missing required fields" }, 
                { status: 400 }
            );
        }

        if (!Array.isArray(wordsUsed) || wordsUsed.length === 0) {
            return NextResponse.json(
                { error: "At least one word must be provided" }, 
                { status: 400 }
            );
        }

        // Validate words structure
        const invalidWords = wordsUsed.some(word => 
            !word.german || !word.english || typeof word.german !== 'string' || typeof word.english !== 'string'
        );
        
        if (invalidWords) {
            return NextResponse.json(
                { error: "Invalid word structure" }, 
                { status: 400 }
            );
        }

        // Create new story
        const newStory = new Story({
            userId: user._id,
            title: title.trim(),
            germanStory,
            englishStory,
            wordsUsed,
            preferences
        });

        const savedStory = await newStory.save();

        return NextResponse.json({
            success: true,
            data: {
                story: savedStory,
                message: "Story saved successfully!"
            }
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating story:", error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return NextResponse.json(
                { error: "Validation error", details: errors }, 
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Failed to create story" }, 
            { status: 500 }
        );
    }
}