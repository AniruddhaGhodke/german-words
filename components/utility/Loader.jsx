import React from "react";

const Loader = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-700 opacity-70">
            <div className="spinner border-4 border-gray-200 rounded-full w-16 h-16"></div>
        </div>
    );
};

export default Loader;
