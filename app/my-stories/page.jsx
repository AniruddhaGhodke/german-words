"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaBookOpen,
    FaSearch,
    FaFilter,
    FaSort,
    FaEye,
    FaTrash,
    FaDownload,
    FaSpinner,
    FaCalendarAlt,
    FaLanguage,
    FaTags
} from "react-icons/fa";
import toast from "react-hot-toast";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { 
    useGetStoriesQuery,
    useDeleteStoryMutation 
} from "@/store/api/storiesApi";
import {
    selectStories,
    selectSelectedStory,
    selectStoriesPagination,
    selectStoriesFilters,
    selectDeleteConfirmId,
    setSelectedStory,
    setPagination,
    setCurrentPage,
    setSearch,
    setStyleFilter,
    setSortBy,
    setSortOrder,
    setDeleteConfirmId,
    setExporting
} from "@/store/slices/storiesSlice";
import StoryViewer from "@/components/StoryViewer";

export default function MyStoriesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const dispatch = useAppDispatch();
    
    // RTK State
    const stories = useAppSelector(selectStories);
    
    const selectedStory = useAppSelector(selectSelectedStory);
    const pagination = useAppSelector(selectStoriesPagination);
    const filters = useAppSelector(selectStoriesFilters);
    const deleteConfirmId = useAppSelector(selectDeleteConfirmId);
    
    // RTK Query
    const {
        data: storiesResponse,
        error,
        isLoading,
        isFetching,
        refetch
    } = useGetStoriesQuery({
        page: pagination.page,
        limit: pagination.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        style: filters.style,
        search: filters.search
    }, {
        skip: !session?.user,
        refetchOnMountOrArgChange: true
    });
    
    // RTK Mutations
    const [deleteStory, { isLoading: isDeleting }] = useDeleteStoryMutation();

    // Update local state when data changes
    useEffect(() => {
        if (storiesResponse) {
            dispatch(setPagination(storiesResponse.pagination));
        }
    }, [storiesResponse, dispatch]);

    // Redirect if not authenticated
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }
    }, [status, router]);


    // Handle page change
    const handlePageChange = (page) => {
        dispatch(setCurrentPage(page));
    };

    // Handle story deletion
    const handleDeleteStory = async (storyId) => {
        try {
            await deleteStory(storyId).unwrap();
            toast.success("Story deleted successfully!");
            dispatch(setDeleteConfirmId(null));
        } catch (error) {
            console.error("Error deleting story:", error);
            toast.error(error?.data?.message || "Failed to delete story");
        }
    };


    // Handle story export
    const handleExportStory = (story) => {
        try {
            dispatch(setExporting(true));
            const exportContent = `Bilingual German Learning Story
Generated on: ${new Date(story.createdAt).toLocaleDateString()}
Title: ${story.title}

Vocabulary Words Used: ${story.wordsUsed.map(w => `${w.german} (${w.english})`).join(', ')}

=== GERMAN VERSION ===
${story.germanStory}

=== ENGLISH VERSION ===
${story.englishStory}

Story Style: ${story.preferences.style}
Story Length: ${story.preferences.length}
Include English Hints: ${story.preferences.includeEnglish ? 'Yes' : 'No'}

---
Generated with German Words Learning App`;

            const blob = new Blob([exportContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${Date.now()}.txt`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success("Story exported successfully!");
        } catch (error) {
            console.error("Error exporting story:", error);
            toast.error("Failed to export story");
        } finally {
            dispatch(setExporting(false));
        }
    };

    // Get style emoji
    const getStyleEmoji = (style) => {
        const emojis = {
            educational: "📚",
            adventure: "🗺️",
            daily: "🏠",
            funny: "😂",
            mystery: "🔍"
        };
        return emojis[style] || "📖";
    };

    // Get time ago display
    const getTimeAgo = (date) => {
        const now = new Date();
        const created = new Date(date);
        const diffTime = Math.abs(now - created);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
            if (diffHours === 0) {
                const diffMinutes = Math.floor(diffTime / (1000 * 60));
                return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
            }
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return created.toLocaleDateString();
        }
    };

    // Handle search change
    const handleSearchChange = (value) => {
        dispatch(setSearch(value));
        dispatch(setCurrentPage(1));
    };

    // Handle filter change
    const handleStyleFilterChange = (style) => {
        dispatch(setStyleFilter(style));
        dispatch(setCurrentPage(1));
    };

    // Handle sort change
    const handleSortChange = (sortBy, sortOrder) => {
        dispatch(setSortBy(sortBy));
        dispatch(setSortOrder(sortOrder));
        dispatch(setCurrentPage(1));
    };

    // Show error toast if there's an error
    useEffect(() => {
        if (error) {
            toast.error('Failed to fetch stories');
            console.error('Stories fetch error:', error);
        }
    }, [error]);

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex items-center gap-3">
                    <FaSpinner className="animate-spin text-2xl text-blue-600" />
                    <span className="text-lg text-gray-600">Loading...</span>
                </div>
            </div>
        );
    }

    if (status === "unauthenticated") {
        return null; // Will redirect in useEffect
    }

    const currentStories = storiesResponse?.stories || [];

    return (
        <div className="min-h-screen bg-[url('/blob-haikei-1.svg')] bg-primary bg-cover bg-center pt-24">
            {/* Floating decorative elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-teriary opacity-20 rounded-full animate-pulse"></div>
                <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-secondary opacity-30 rounded-full animate-bounce"></div>
                <div className="absolute bottom-1/4 left-1/3 w-12 h-12 bg-teriary-800 opacity-25 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
            <div className="relative max-w-7xl mx-auto px-4 py-8">
                {/* Fun Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="inline-block p-4 bg-gradient-to-r from-teriary-800 to-teriary rounded-full mb-6 shadow-lg"
                    >
                        <FaBookOpen className="text-4xl text-white" />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-6xl font-nerko text-teriary mb-4"
                    >
                        My Story Collection
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-xl text-gray-300 font-medium"
                    >
                        🌟 Your magical bilingual adventures await! ✨
                        {pagination.total > 0 && (
                            <span className="block mt-2 text-teriary font-bold">
                                📚 {pagination.total} amazing {pagination.total === 1 ? 'story' : 'stories'} created!
                            </span>
                        )}
                    </motion.p>
                </motion.div>


                {/* Fun Filters and Search */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border-4 border-teriary/20 p-8 mb-12 relative overflow-hidden"
                >
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-l from-teriary/10 to-transparent rounded-full transform translate-x-16 -translate-y-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-r from-secondary/10 to-transparent rounded-full transform -translate-x-12 translate-y-12"></div>
                    <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Fun Search */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="relative"
                        >
                            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-teriary" />
                            <input
                                type="text"
                                placeholder="🔍 Find your story..."
                                value={filters.search}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border-2 border-teriary/30 rounded-xl focus:ring-4 focus:ring-teriary/20 focus:border-teriary transition-all bg-gradient-to-r from-white to-teriary/5 font-medium"
                            />
                        </motion.div>

                        {/* Style Filter */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="relative"
                        >
                            <FaFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary z-10" />
                            <select
                                value={filters.style}
                                onChange={(e) => handleStyleFilterChange(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border-2 border-secondary/30 rounded-xl focus:ring-4 focus:ring-secondary/20 focus:border-secondary appearance-none bg-gradient-to-r from-white to-secondary/5 font-medium transition-all cursor-pointer"
                            >
                                <option value="all">🌈 All Styles</option>
                                <option value="educational">📚 Educational</option>
                                <option value="adventure">🗺️ Adventure</option>
                                <option value="daily">🏠 Daily Life</option>
                                <option value="funny">😂 Funny</option>
                                <option value="mystery">🔍 Mystery</option>
                            </select>
                        </motion.div>

                        {/* Sort By */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="relative"
                        >
                            <FaSort className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary z-10" />
                            <select
                                value={filters.sortBy}
                                onChange={(e) => handleSortChange(e.target.value, filters.sortOrder)}
                                className="w-full pl-12 pr-4 py-3 border-2 border-primary/30 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary appearance-none bg-gradient-to-r from-white to-primary/5 font-medium transition-all cursor-pointer"
                            >
                                <option value="createdAt">📅 Date Created</option>
                                <option value="updatedAt">✨ Date Modified</option>
                                <option value="title">🔤 Title</option>
                            </select>
                        </motion.div>

                        {/* Sort Order */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="relative"
                        >
                            <select
                                value={filters.sortOrder}
                                onChange={(e) => handleSortChange(filters.sortBy, e.target.value)}
                                className="w-full px-4 py-3 border-2 border-teriary-800/30 rounded-xl focus:ring-4 focus:ring-teriary-800/20 focus:border-teriary-800 appearance-none bg-gradient-to-r from-white to-teriary-800/5 font-medium transition-all cursor-pointer"
                            >
                                <option value="desc">⬇️ Newest First</option>
                                <option value="asc">⬆️ Oldest First</option>
                            </select>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Stories Grid */}
                <AnimatePresence mode="wait">
                    {(isLoading || isFetching) ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {[...Array(6)].map((_, index) => (
                                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="animate-pulse">
                                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                                        <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                                        <div className="h-3 bg-gray-200 rounded w-5/6 mb-4"></div>
                                        <div className="flex justify-between items-center">
                                            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                                            <div className="h-8 bg-gray-200 rounded w-20"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    ) : currentStories.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-20"
                        >
                            <div className="mb-8">
                                <motion.div
                                    animate={{
                                        y: [0, -10, 0],
                                        rotate: [0, 5, -5, 0]
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        repeatType: "loop"
                                    }}
                                    className="w-32 h-32 bg-gradient-to-br from-teriary to-teriary-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
                                >
                                    <FaBookOpen className="text-5xl text-white" />
                                </motion.div>
                                <h3 className="text-4xl font-nerko text-teriary mb-4">No Stories Yet!</h3>
                                <p className="text-xl text-gray-300 mb-8 font-medium">
                                    🌟 Your magical story collection awaits! ✨<br />
                                    Start creating bilingual adventures now!
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => router.push("/")}
                                    className="px-8 py-4 bg-gradient-to-r from-teriary to-teriary-800 text-white rounded-full hover:from-teriary-800 hover:to-teriary-900 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl"
                                >
                                    🚀 Start Creating Magic!
                                </motion.button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="stories"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            {currentStories.map((story, index) => {
                                // Get style colors
                                const getStyleColors = (style) => {
                                    const colors = {
                                        educational: { bg: 'from-blue-400 to-blue-600', accent: 'blue-500', light: 'blue-100' },
                                        adventure: { bg: 'from-green-400 to-green-600', accent: 'green-500', light: 'green-100' },
                                        daily: { bg: 'from-purple-400 to-purple-600', accent: 'purple-500', light: 'purple-100' },
                                        funny: { bg: 'from-yellow-400 to-yellow-600', accent: 'yellow-500', light: 'yellow-100' },
                                        mystery: { bg: 'from-red-400 to-red-600', accent: 'red-500', light: 'red-100' }
                                    };
                                    return colors[style] || colors.educational;
                                };

                                const styleColors = getStyleColors(story.preferences.style);

                                return (
                                <motion.div
                                    key={story._id}
                                    initial={{ opacity: 0, y: 20, rotateY: -15 }}
                                    animate={{ opacity: 1, y: 0, rotateY: 0 }}
                                    transition={{
                                        delay: index * 0.1,
                                        type: "spring",
                                        stiffness: 100
                                    }}
                                    whileHover={{
                                        y: -8,
                                        rotateY: 3,
                                        transition: { duration: 0.3 }
                                    }}
                                    className="group relative"
                                >
                                    {/* Magical Glow Effect */}
                                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>

                                    <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-white/50 overflow-hidden">
                                        {/* Decorative Header */}
                                        <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-600"></div>

                                        <div className="p-6">
                                            {/* Header with style and date */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <motion.div
                                                        whileHover={{ rotate: 360, scale: 1.2 }}
                                                        transition={{ duration: 0.5 }}
                                                        className="p-2 bg-blue-50 rounded-full"
                                                    >
                                                        <span className="text-2xl">{getStyleEmoji(story.preferences.style)}</span>
                                                    </motion.div>
                                                    <div>
                                                        <p className="text-gray-600 font-semibold text-sm capitalize">
                                                            {story.preferences.style}
                                                        </p>
                                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                                            <FaCalendarAlt />
                                                            <span>{getTimeAgo(story.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <motion.div
                                                    whileHover={{ scale: 1.1 }}
                                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold"
                                                >
                                                    ✨ Story
                                                </motion.div>
                                            </div>

                                            {/* Story Title */}
                                            <motion.h3
                                                whileHover={{ scale: 1.02 }}
                                                className="text-xl font-bold text-gray-800 mb-3 group-hover:text-teriary transition-colors duration-300 line-clamp-2 cursor-pointer"
                                            >
                                                {story.title}
                                            </motion.h3>

                                            {/* Story Preview */}
                                            <div className="mb-4">
                                                <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                                                    {story.germanStory?.substring(0, 120)}...
                                                </p>
                                            </div>

                                            {/* Word Tags */}
                                            {story.wordsUsed && story.wordsUsed.length > 0 && (
                                                <div className="mb-6">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <FaLanguage className="text-teriary text-sm" />
                                                        <span className="text-xs font-medium text-teriary">Vocabulary Used</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {story.wordsUsed.slice(0, 4).map((word, wordIndex) => {
                                                            const getWordTagClasses = (style) => {
                                                                const styleClasses = {
                                                                    educational: 'bg-blue-100 text-blue-700 border-blue-200',
                                                                    adventure: 'bg-green-100 text-green-700 border-green-200',
                                                                    daily: 'bg-purple-100 text-purple-700 border-purple-200',
                                                                    funny: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                                                                    mystery: 'bg-red-100 text-red-700 border-red-200'
                                                                };
                                                                return styleClasses[style] || styleClasses.educational;
                                                            };

                                                            return (
                                                                <motion.span
                                                                    key={wordIndex}
                                                                    whileHover={{ scale: 1.05 }}
                                                                    className={`text-xs px-3 py-1 rounded-full font-medium border cursor-default ${getWordTagClasses(story.preferences.style)}`}
                                                                >
                                                                    {word.german}
                                                                </motion.span>
                                                            );
                                                        })}
                                                        {story.wordsUsed.length > 4 && (
                                                            <span className="text-xs text-gray-400 font-medium px-2 py-1">
                                                                +{story.wordsUsed.length - 4} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="flex gap-3">
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => {
                                                        dispatch(setSelectedStory(story));
                                                    }}
                                                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 font-semibold hover:from-blue-600 hover:to-blue-700"
                                                >
                                                    <FaEye className="text-lg" />
                                                    Read Story
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleExportStory(story)}
                                                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center"
                                                    title="Export Story"
                                                >
                                                    <FaDownload className="text-lg" />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => dispatch(setDeleteConfirmId(story._id))}
                                                    className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-3 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center"
                                                    title="Delete Story"
                                                >
                                                    <FaTrash className="text-lg" />
                                                </motion.button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Fun Pagination */}
                {pagination.totalPages > 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="flex justify-center items-center gap-4 mt-16 mb-8"
                    >
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={!pagination.hasPrev}
                            className="px-6 py-3 bg-gradient-to-r from-teriary to-teriary-800 text-white rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-teriary-800 hover:to-teriary-900 transition-all shadow-lg hover:shadow-xl disabled:hover:scale-100"
                        >
                            ⬅️ Previous
                        </motion.button>

                        <div className="flex items-center gap-2">
                            {[...Array(pagination.totalPages)].map((_, index) => {
                                const pageNum = index + 1;
                                const isActive = pageNum === pagination.page;
                                return (
                                    <motion.button
                                        key={pageNum}
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`w-10 h-10 rounded-full font-bold transition-all ${
                                            isActive
                                                ? 'bg-gradient-to-br from-teriary to-teriary-800 text-white shadow-lg transform scale-110'
                                                : 'bg-white text-teriary hover:bg-teriary/10 border-2 border-teriary/20'
                                        }`}
                                    >
                                        {pageNum}
                                    </motion.button>
                                );
                            })}
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={!pagination.hasNext}
                            className="px-6 py-3 bg-gradient-to-r from-teriary to-teriary-800 text-white rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-teriary-800 hover:to-teriary-900 transition-all shadow-lg hover:shadow-xl disabled:hover:scale-100"
                        >
                            Next ➡️
                        </motion.button>
                    </motion.div>
                )}

                {/* Story Viewer Modal */}
                {selectedStory && (
                    <StoryViewer
                        story={selectedStory}
                        isOpen={!!selectedStory}
                        onClose={() => dispatch(setSelectedStory(null))}
                    />
                )}

                {/* Fun Delete Confirmation Modal */}
                <AnimatePresence>
                    {deleteConfirmId && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0, rotateY: -30 }}
                                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                                exit={{ scale: 0.8, opacity: 0, rotateY: 30 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-white/20 relative overflow-hidden"
                            >
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-l from-rose-200/30 to-transparent rounded-full transform translate-x-8 -translate-y-8"></div>
                                <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-r from-orange-200/30 to-transparent rounded-full transform -translate-x-8 translate-y-8"></div>

                                <div className="relative text-center">
                                    <motion.div
                                        animate={{
                                            rotate: [0, -5, 5, -5, 0],
                                            scale: [1, 1.1, 1]
                                        }}
                                        transition={{
                                            duration: 0.8,
                                            repeat: Infinity,
                                            repeatDelay: 2
                                        }}
                                        className="w-20 h-20 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                                    >
                                        <FaTrash className="text-3xl text-white" />
                                    </motion.div>

                                    <motion.h3
                                        initial={{ y: -20 }}
                                        animate={{ y: 0 }}
                                        className="text-3xl font-nerko text-rose-600 mb-4"
                                    >
                                        Delete This Story?
                                    </motion.h3>

                                    <motion.p
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="text-gray-600 mb-8 text-lg font-medium leading-relaxed"
                                    >
                                        🗑️ This magical story will be gone forever! <br />
                                        Are you absolutely sure? ✨
                                    </motion.p>

                                    <div className="flex gap-4">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => dispatch(setDeleteConfirmId(null))}
                                            className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 rounded-2xl font-bold hover:from-gray-300 hover:to-gray-400 transition-all duration-300 shadow-lg hover:shadow-xl"
                                            disabled={isDeleting}
                                        >
                                            🤔 Keep It
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleDeleteStory(deleteConfirmId)}
                                            disabled={isDeleting}
                                            className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-2xl font-bold hover:from-rose-600 hover:to-rose-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                        >
                                            {isDeleting ? (
                                                <>
                                                    <FaSpinner className="animate-spin" />
                                                    Deleting...
                                                </>
                                            ) : (
                                                <>
                                                    <FaTrash />
                                                    🗑️ Delete It
                                                </>
                                            )}
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}