import { FaSpinner, FaBookOpen } from "react-icons/fa";

export default function Loading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-24">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header Skeleton */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-600 text-white rounded-xl">
                            <FaBookOpen className="text-2xl" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">My Stories</h1>
                            <div className="flex items-center gap-3 mt-2">
                                <FaSpinner className="animate-spin text-blue-600" />
                                <p className="text-gray-600">Loading your stories...</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Skeleton */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, index) => (
                            <div key={index} className="animate-pulse">
                                <div className="h-10 bg-gray-200 rounded-lg"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stories Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="animate-pulse">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gray-200 rounded"></div>
                                        <div className="space-y-2">
                                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="mb-4 space-y-2">
                                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                                    <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                                </div>

                                {/* Tags */}
                                <div className="mb-4">
                                    <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                                    <div className="flex flex-wrap gap-1">
                                        {[...Array(3)].map((_, idx) => (
                                            <div key={idx} className="h-6 w-16 bg-gray-200 rounded-full"></div>
                                        ))}
                                    </div>
                                </div>

                                {/* Meta */}
                                <div className="flex items-center gap-4 text-xs mb-4">
                                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                                    <div className="h-3 bg-gray-200 rounded w-14"></div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between">
                                    <div className="h-8 bg-gray-200 rounded w-24"></div>
                                    <div className="flex gap-1">
                                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}