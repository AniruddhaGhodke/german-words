"use client";

import React, { useState } from "react";

const Accordion = ({onWordAdd}) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleAccordion = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="mt-20 max-w-screen-xl mx-auto flex items-center justify-center flex-col">
            <a
                href="#"
                onClick={toggleAccordion}
                className="text-blue-500 hover:text-blue-600 cursor-pointer"
            >
                {isOpen ? "Hide Form" : "Show Form"}
            </a>
            {isOpen && <WordForm onWordAdd={onWordAdd} />}
        </div>
    );
};

const WordForm = ({onWordAdd}) => {
    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            german: formData.get("germanWord"),
            english: formData.get("englishWord"),
            type: formData.get("type"),
        };
        try {
            const response = await fetch('/api/words',{
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                  'content-type': 'application/json'
                }
            });
            const res = await response.json();
            console.log(res.data.data);
            if(res.success) {
                console.log("here");
                onWordAdd(res.data.data);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <div className="shadow-lg p-5 w-full bg-white rounded-lg mt-2">
            <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                    <label
                        htmlFor="germanWord"
                        className="block text-sm font-medium text-gray-700"
                    >
                        German Word:
                    </label>
                    <input
                        type="text"
                        id="germanWord"
                        name="germanWord"
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter German word"
                    />
                </div>
                <div>
                    <label
                        htmlFor="englishWord"
                        className="block text-sm font-medium text-gray-700"
                    >
                        English Word:
                    </label>
                    <input
                        type="text"
                        id="englishWord"
                        name="englishWord"
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter English word"
                    />
                </div>
                <div>
                    <label
                        htmlFor="type"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Type:
                    </label>
                    <select
                        id="type"
                        name="type"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm rounded-md"
                    >
                        <option>Noun</option>
                        <option>Verb</option>
                        <option>Adjective</option>
                    </select>
                </div>
                <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Add
                </button>
            </form>
        </div>
    );
};

export default Accordion;
