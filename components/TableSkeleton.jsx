import React from "react";

const TH = () => (
    <th className="px-6 py-5 bg-gray-50 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
        <div className="animate-pulse h-2 bg-gray-200 rounded"></div>
    </th>
);

const TD = () => (
    <td className="px-6 py-4 whitespace-nowrap my-2">
        <div className="animate-pulse h-4 bg-gray-200 rounded"></div>
    </td>
);

const TableSkeleton = () => {
    return (
        <table className="border-collapse border-gray-200 w-11/12 m-auto table-fixed mt-10 shadow-xl">
            <thead>
                <tr>
                    {Array.from({ length: 4 }).map((_, index) => (
                        <TH key={index} />
                    ))}
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: 10 }).map((_, index) => (
                    <tr key={index}>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <TD key={i} />
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default TableSkeleton;
