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
        <div className="bg-[url('/svg1.svg')] bg-cover bg-center relative h-full min-h-screen pt-28">
            <div className="flex flex-col max-w-screen-xl mx-auto p-4">
                <div className="bg-primary-900 rounded-lg shadow-2xl p-10">
                    <h1 className="text-3xl font-bold text-secondary-100 mb-4">
                        Lets Start the Game!
                    </h1>
                    <p className="text-secondary-100 font-semibold mb-4">
                        Instructions:{" "}
                    </p>
                    <ul className="text-secondary-100 mb-4">
                        {INSTRUCTIONS.map((instruction, index) => (
                            <li key={index}>{instruction}</li>
                        ))}
                    </ul>
                    <a
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="bg-teriary text-teriary-100 font-bold py-2 px-4 rounded shadow-lg hover:bg-teriary-200 hover:text-primary-900 transition-colors duration-300"
                        href="/wordGame/start"
                    >
                        Start
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Start;
