import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/utils/db";
import Story from "@/models/story";
import User from "@/models/user";
import mongoose from "mongoose";

// GET - Fetch a specific story by ID
export async function GET(request, { params }) {
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

        const { id } = params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: "Invalid story ID" }, 
                { status: 400 }
            );
        }

        // Find story and ensure it belongs to the user
        const story = await Story.findOne({ 
            _id: id, 
            userId: user._id 
        }).lean();

        if (!story) {
            return NextResponse.json(
                { error: "Story not found" }, 
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: { story }
        });

    } catch (error) {
        console.error("Error fetching story:", error);
        return NextResponse.json(
            { error: "Failed to fetch story" }, 
            { status: 500 }
        );
    }
}

// PUT - Update a specific story
export async function PUT(request, { params }) {
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

        const { id } = params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: "Invalid story ID" }, 
                { status: 400 }
            );
        }

        const body = await request.json();
        
        // Only allow updating specific fields
        const allowedUpdates = ['title'];
        const updates = {};
        
        allowedUpdates.forEach(field => {
            if (body[field] !== undefined) {
                updates[field] = body[field];
            }
        });

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: "No valid fields to update" }, 
                { status: 400 }
            );
        }

        // Validate title if being updated
        if (updates.title && (!updates.title.trim() || updates.title.length > 200)) {
            return NextResponse.json(
                { error: "Title must be 1-200 characters" }, 
                { status: 400 }
            );
        }

        // Find and update story
        const updatedStory = await Story.findOneAndUpdate(
            { _id: id, userId: user._id },
            { ...updates, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).lean();

        if (!updatedStory) {
            return NextResponse.json(
                { error: "Story not found" }, 
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: { 
                story: updatedStory,
                message: "Story updated successfully!"
            }
        });

    } catch (error) {
        console.error("Error updating story:", error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return NextResponse.json(
                { error: "Validation error", details: errors }, 
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Failed to update story" }, 
            { status: 500 }
        );
    }
}

// DELETE - Delete a specific story
export async function DELETE(request, { params }) {
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

        const { id } = params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: "Invalid story ID" }, 
                { status: 400 }
            );
        }

        // Find and delete story
        const deletedStory = await Story.findOneAndDelete({ 
            _id: id, 
            userId: user._id 
        });

        if (!deletedStory) {
            return NextResponse.json(
                { error: "Story not found" }, 
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: { 
                message: "Story deleted successfully!",
                deletedId: id
            }
        });

    } catch (error) {
        console.error("Error deleting story:", error);
        return NextResponse.json(
            { error: "Failed to delete story" }, 
            { status: 500 }
        );
    }
}