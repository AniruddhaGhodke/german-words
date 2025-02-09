
import User from "@/models/user";
import { connectDB } from "@/utils/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export const POST = async (request) => {
    const { email, password, name } = await request.json();

    await connectDB();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return new NextResponse("Email is already in use", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 5);
    const newUser = new User({
        email,
        password: hashedPassword,
        name
    });

    try {
        await newUser.save();
        return new NextResponse("user is registered", { status: 200 });
    } catch (err) {
        return new NextResponse(err, {
            status: 500,
        });
    }
};
