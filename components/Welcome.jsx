"use client";
import React from "react";
import { motion } from "framer-motion";

const Welcome = ({ name }) => {
    return (
        <div className="bg-[url('/svg1.svg')] bg-cover bg-center relative h-screen pt-16 sm:pt-20 lg:pt-28">
            <div className="flex flex-col max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
                <h1 className="mt-8 sm:mt-16 lg:mt-20 text-4xl sm:text-5xl lg:text-6xl text-gray-300 font-bold">
                    Hello!
                </h1>
                <h2 className="mt-3 sm:mt-4 lg:mt-5 text-5xl sm:text-6xl lg:text-8xl text-[#f6884d] font-nerko leading-tight">
                    {name}
                </h2>
                <p className="mt-4 text-base sm:text-lg lg:text-xl text-gray-300 flex flex-col sm:flex-row sm:items-center gap-2 font-semibold">
                    <span className="text-teriary-700">Aniruddha Ghodke</span>
                    <span className="flex items-center gap-2">
                        welcomes you with{" "}
                        <span className="bg-[url('/heart.svg')] w-5 h-5 sm:w-6 sm:h-6 bg-cover text-[hsl(199,90%,63%)]"></span>
                    </span>
                </p>

                <a
                    href="#content"
                    className="absolute left-1/2 -translate-x-1/2 bottom-[25%] sm:bottom-[20%] flex items-center justify-center group"
                    aria-label="Scroll to content"
                >
                    <div className="w-[32px] h-[56px] sm:w-[40px] sm:h-[70px] lg:w-[44px] lg:h-[76px] rounded-3xl border-3 sm:border-4 border-[hsl(199,60%,55%)] flex justify-center items-start p-2 sm:p-3 transition-all duration-300 group-hover:border-[hsl(199,70%,65%)] group-hover:scale-110">
                        <motion.div
                            animate={{
                                y: [0, "40%", 0],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatType: "loop",
                                ease: "easeInOut",
                            }}
                            className="w-[6px] h-[6px] sm:w-[8px] sm:h-[8px] lg:w-[10px] lg:h-[10px] rounded-full bg-[hsl(199,60%,55%)] shadow-sm"
                        />
                    </div>
                    <div className="absolute -bottom-8 text-xs sm:text-sm text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                        Scroll down
                    </div>
                </a>
            </div>
        </div>
    );
};

export default Welcome;
