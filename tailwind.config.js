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
            colors: {
                primary: "hsl(204.88deg 100% 8.04%);",
                "primary-900": "hsl(205 100% 15% / 1)",
                secondary: "#297EA6",
                "secondary-100": "hsl(199 60% 90% / 1)",
                teriary: "#f6884d",
                "teriary-100": "hsl(21 90% 90% / 1)",
                "teriary-700": "hsl(21 90% 80% / 1)",
                "teriary-700": "hsl(21 90% 80% / 1)",
                "teriary-800": "hsl(29 92% 50% / 1)",
                "teriary-900": "hsl(29 92% 45% / 1)",
            },
            fontFamily: {
                nerko: ["Nerko One", "cursive"],
            },
        },
    },
    plugins: [],
};
