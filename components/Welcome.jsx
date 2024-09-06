"use client";
import React from "react";
import { motion } from "framer-motion";

const Welcome = ({ name }) => {
    return (
        <div className="relative h-screen flex flex-col max-w-screen-xl mx-auto p-4">
            <h1 className="mt-20 text-5xl text-gray-300 font-bold">Hello!</h1>
            <h2 className="mt-5 text-7xl text-[#f6884d] font-nerko">{name}</h2>
            <p
                className="mt-2 text-gray-300
             flex items-center gap-1 font-semibold"
            >
                <span className="text-teriary-700">Aniruddha Ghodke</span>{" "}
                welcomes you with{" "}
                <span className="bg-[url('/heart.svg')] w-5 h-5 bg-cover mt-[1px] text-[hsl(199,90%,63%)]"></span>
            </p>

            <a
                href="#content"
                className="absolute left-1/2 -translate-x-1/2 bottom-[37%] sm:bottom-[25%] flex items-center justify-center"
            >
                <div className="w-[35px] h-[64px] rounded-3xl border-4 border-[hsl(199,60%,55%)] flex justify-center items-start p-2">
                    <motion.div
                        animate={{
                            y: [0, 24, 0],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatType: "loop",
                        }}
                        className="w-3 h-3 rounded-full bg-[hsl(199,60%,55%)] mb-1"
                    />
                </div>
            </a>
        </div>
    );
};

export default Welcome;
