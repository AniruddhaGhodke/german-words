import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/utils/db";
import User from "@/models/user";
import bcrypt from "bcryptjs";

const authOptions = {
    providers: [
        CredentialsProvider({
            id: "credentials",
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                await connectDB();
                try {
                    const user = await User.findOne({
                        email: credentials.email,
                    });
                    if (user) {
                        const isPasswordCorrect = await bcrypt.compare(
                            credentials.password,
                            user.password
                        );
                        if (isPasswordCorrect) {
                            return {
                                id: user._id.toString(),
                                email: user.email,
                                name: user.name,
                                image: user.image,
                            };
                        } else {
                            console.log("Incorrect password for user:", credentials.email);
                            return null;
                        }
                    } else {
                        console.log("User not found:", credentials.email);
                        return null;
                    }
                } catch (err) {
                    console.error("Credentials auth error:", err);
                    return null;
                }
            },
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_ID,
            clientSecret: process.env.GOOGLE_SECRET,
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.name = user.name;
                token.email = user.email;
                token.image = user.image;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.name = token.name;
                session.user.email = token.email;
                session.user.image = token.image;
            }
            return session;
        },
        async signIn({ profile, account, user }) {
            if (account?.provider == "credentials") {
                console.log("Credentials sign-in successful for user:", user?.email);
                return true;
            }
            if (account?.provider == "google") {
                try {
                    console.log("Google sign-in attempt for:", profile?.email);
                    await connectDB();

                    const userExist = await User.findOne({
                        email: profile.email,
                    });

                    if (!userExist) {
                        console.log("Creating new Google user:", profile.email);
                        await User.create({
                            email: profile.email,
                            name: profile.name,
                            image: profile.picture,
                        });
                    } else {
                        console.log("Existing Google user found:", profile.email);
                    }
                    return true;
                } catch (error) {
                    console.error("Google sign-in error:", error);
                    return false;
                }
            }
            console.log("Unknown provider:", account?.provider);
            return false;
        },
    },
    pages: {
        signIn: "/login",
    },
    events: {
        error: async (message) => {
            console.error("NextAuth error:", message);
            return `/login`;
        },
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        updateAge: 24 * 60 * 60, // 24 hours
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions };
