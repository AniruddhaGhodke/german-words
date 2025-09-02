import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async authorized({ req, token }) {
            return !!token;
        },
    },
});

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|login|register|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.css|.*\\.js).*)",
    ],
};
