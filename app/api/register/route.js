
import User from "@/models/user";
import { connectDB } from "@/utils/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { runRateLimit, authRateLimit } from "@/utils/rateLimit";
import { validatePassword, isValidEmail } from "@/utils/passwordValidation";

export const POST = async (request) => {
    // Apply rate limiting
    try {
        await runRateLimit(request, new Response(), authRateLimit);
    } catch (error) {
        return new NextResponse(
            JSON.stringify({ error: "Too many registration attempts, please try again later." }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
    }
    
    try {
        const { email, password, name } = await request.json();
        
        console.log("Registration attempt for:", email);

        if (!email || !password || !name) {
            console.log("Missing required fields");
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Validate email format
        if (!isValidEmail(email)) {
            console.log("Invalid email format:", email);
            return new NextResponse("Invalid email format", { status: 400 });
        }

        // Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            console.log("Password validation failed:", passwordValidation.errors);
            return new NextResponse(
                JSON.stringify({ 
                    error: "Password requirements not met",
                    details: passwordValidation.errors 
                }),
                { 
                    status: 400, 
                    headers: { 'Content-Type': 'application/json' } 
                }
            );
        }

        await connectDB();

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            console.log("Email already exists:", email);
            return new NextResponse("Email is already in use", { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = new User({
            email,
            password: hashedPassword,
            name
        });

        await newUser.save();
        console.log("User registered successfully:", email);
        return new NextResponse("user is registered", { status: 200 });
    } catch (err) {
        console.error("Registration error:", err);
        return new NextResponse("Internal server error", {
            status: 500,
        });
    }
};
