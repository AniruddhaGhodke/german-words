import { Inter } from "next/font/google";
import "./globals.css";
import Provider from "@/components/Provider";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

import { Toaster } from "react-hot-toast";
import Header from "@/components/Header";
import Breadcrumb from "@/components/Breadcrumb";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "Practice German | Aniruddha",
    description: "Developed by Aniruddha Ghodke to practice german",
    icons: {
        icon: "/logo.svg",
    },
};

export default async function RootLayout({ children }) {
    const session = await getServerSession(authOptions);
    
    return (
        <html lang="en">
            <head>
                <title>{metadata.title}</title>
                <meta name="description" content={metadata.description} />
                <link
                    rel="icon"
                    href={metadata.icons.icon}
                    type="image/svg+xml"
                />
                <script src="https://js.puter.com/v2/" async></script>
            </head>
            <body className={inter.className}>
                <Provider session={session}>
                    <Header />
                    <Breadcrumb />
                    {children}

                    <Toaster
                        position="top-center"
                        reverseOrder={false}
                        gutter={8}
                        containerClassName=""
                        containerStyle={{}}
                        toastOptions={{
                            // Define default options
                            className: "",
                            duration: 5000,
                            style: {
                                background: "#363636",
                                color: "#fff",
                            },
                        }}
                    />
                </Provider>
            </body>
        </html>
    );
}
