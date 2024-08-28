/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
            keyframes: {
                "border-clockwise": {
                    "0%": {
                        borderColor: "transparent",
                        borderTopColor: "currentColor",
                    },
                    "25%": {
                        borderRightColor: "currentColor",
                    },
                    "50%": {
                        borderBottomColor: "currentColor",
                    },
                    "75%": {
                        borderLeftColor: "currentColor",
                    },
                    "100%": {
                        borderColor: "currentColor",
                    },
                },
            },
            animation: {
                "border-clockwise": "border-clockwise 0.5s linear forwards",
            },
        },
    },
    plugins: [],
};
