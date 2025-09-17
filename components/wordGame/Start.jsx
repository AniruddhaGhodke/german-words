import React from "react";

const INSTRUCTIONS = [
    "1. Click on the start button to start the game.",
    "2. You will be given a random word in German.",
    "3. You have to choose the correct translation in English in the given time.",
    "4. If you choose the correct translation, you will get a point.",
    "5. If you choose the wrong translation, you will lose a point.",
    "6. You can also use the speaker button to listen to the word.",
    "7. The game will end after 10 rounds.",
    "8. Your final score will be displayed at the end of the game.",
    "9. You can also click on the 'New Game' button to start a new game.",
    "10. Have fun and learn new words!",
];

const Start = () => {
    return (
        <div className="bg-[url('/svg1.svg')] bg-cover bg-center relative h-full min-h-screen pt-20 sm:pt-24 lg:pt-28">
            <div className="flex flex-col max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="bg-primary-900 rounded-lg shadow-2xl p-4 sm:p-6 lg:p-10">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-secondary-100 mb-4">
                        Let&apos;s Start the Game!
                    </h1>
                    <p className="text-secondary-100 font-semibold mb-4 text-sm sm:text-base">
                        Instructions:{" "}
                    </p>
                    <ul className="text-secondary-100 mb-6 text-sm sm:text-base space-y-1">
                        {INSTRUCTIONS.map((instruction, index) => (
                            <li key={index} className="leading-relaxed">{instruction}</li>
                        ))}
                    </ul>
                    <a
                        className="inline-block bg-teriary text-teriary-100 font-bold py-3 px-6 rounded shadow-lg hover:bg-teriary-200 hover:text-primary-900 transition-colors duration-300 text-center min-h-[44px] text-sm sm:text-base"
                        href="/wordGame/start"
                    >
                        🎯 Start Game
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Start;
