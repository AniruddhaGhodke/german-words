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
                            return user;
                        } else {
                            return {
                                success: false,
                                msg: "Incorrect Password",
                            };
                        }
                    } else {
                        return {
                            success: false,
                            msg: `User doesn't exists with email ID: ${credentials.email}`,
                        };
                    }
                } catch (err) {
                    throw new Error(err);
                }
            },
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_ID,
            clientSecret: process.env.GOOGLE_SECRET,
        }),
    ],
    callbacks: {
        async session({ session }) {
            const sessionUser = await User.findOne({
                email: session.user.email,
            });
            session.user.id = sessionUser._id;
            return session;
        },
        async signIn({ profile, account }) {
            if (account?.provider == "credentials") {
                return true;
            }

            if (account?.provider == "google") {
                try {
                    await connectDB;

                    const userExist = await User.findOne({
                        email: profile.email,
                    });

                    if (!userExist) {
                        const user = await User.create({
                            email: profile.email,
                            name: profile.name,
                            image: profile.picture,
                        });
                    }
                    return true;
                } catch (error) {
                    console.log(error);
                    return false;
                }
            }
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions };
