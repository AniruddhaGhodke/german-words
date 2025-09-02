"use client";

import { useState, useEffect } from "react";
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
import StoryViewer from "@/components/StoryViewer";
import { migrateLocalStorageStories, hasLocalStorageStories } from "@/utils/storyMigration";

export default function MyStoriesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [selectedStory, setSelectedStory] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [showMigration, setShowMigration] = useState(false);
    const [migrating, setMigrating] = useState(false);
    
    // Filters and sorting
    const [searchTerm, setSearchTerm] = useState("");
    const [styleFilter, setStyleFilter] = useState("all");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");
    const [currentPage, setCurrentPage] = useState(1);

    // Redirect if not authenticated
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }
    }, [status, router]);

    // Fetch stories
    const fetchStories = async (page = 1) => {
        if (!session?.user) return;
        
        try {
            setLoading(true);
            
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "12",
                sortBy,
                sortOrder,
                style: styleFilter,
                search: searchTerm
            });
            
            const response = await fetch(`/api/stories?${params}`);
            const result = await response.json();
            
            if (result.success) {
                setStories(result.data.stories);
                setPagination(result.data.pagination);
                setCurrentPage(page);
            } else {
                throw new Error(result.error || "Failed to fetch stories");
            }
        } catch (error) {
            console.error("Error fetching stories:", error);
            toast.error(error.message || "Failed to load stories");
        } finally {
            setLoading(false);
        }
    };

    // Check for localStorage stories on first load
    useEffect(() => {
        if (session?.user && hasLocalStorageStories()) {
            setShowMigration(true);
        }
    }, [session]);

    // Initial load and when filters change
    useEffect(() => {
        if (session?.user) {
            fetchStories(1);
        }
    }, [session, searchTerm, styleFilter, sortBy, sortOrder]);

    // Handle page change
    const handlePageChange = (page) => {
        fetchStories(page);
    };

    // Handle story deletion
    const handleDeleteStory = async (storyId) => {
        try {
            const response = await fetch(`/api/stories/${storyId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                toast.success("Story deleted successfully!");
                setStories(stories.filter(story => story._id !== storyId));
                setDeleteConfirm(null);
            } else {
                throw new Error(result.error || "Failed to delete story");
            }
        } catch (error) {
            console.error("Error deleting story:", error);
            toast.error(error.message || "Failed to delete story");
        }
    };

    // Handle localStorage migration
    const handleMigration = async () => {
        setMigrating(true);
        try {
            const result = await migrateLocalStorageStories();
            if (result && result.migrated > 0) {
                toast.success(`Successfully migrated ${result.migrated} stories!`);
                setShowMigration(false);
                // Refresh the stories list
                fetchStories(1);
            } else if (result && result.failed > 0) {
                toast.error(`Migration completed with ${result.failed} failures`);
            } else {
                toast.error("No stories found to migrate");
            }
        } catch (error) {
            console.error("Migration error:", error);
            toast.error("Migration failed");
        } finally {
            setMigrating(false);
        }
    };

    // Handle story export
    const handleExportStory = (story) => {
        try {
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
                        {pagination.totalCount > 0 && (
                            <span className="block mt-2 text-teriary font-bold">
                                📚 {pagination.totalCount} amazing {pagination.totalCount === 1 ? 'story' : 'stories'} created!
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
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
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
                                value={styleFilter}
                                onChange={(e) => setStyleFilter(e.target.value)}
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
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
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
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
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
                    {loading ? (
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
                    ) : stories.length === 0 ? (
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
                            {stories.map((story, index) => {
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
                                        stiffness: 100,
                                        damping: 15
                                    }}
                                    whileHover={{ 
                                        y: -8, 
                                        rotateY: 5,
                                        scale: 1.02,
                                        transition: { duration: 0.3 } 
                                    }}
                                    className="group relative"
                                    style={{ perspective: "1000px" }}
                                >
                                    {/* Book spine effect */}
                                    <div className={`absolute -left-2 top-4 bottom-4 w-6 bg-gradient-to-b ${styleColors.bg} rounded-l-lg shadow-lg transform group-hover:scale-105 transition-transform duration-300`}></div>
                                    
                                    {/* Main book cover */}
                                    <div className="bg-white rounded-2xl shadow-xl border-4 border-white hover:shadow-2xl transition-all duration-300 overflow-hidden transform-gpu group-hover:shadow-teriary/20"
                                         style={{ 
                                             boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                                         }}
                                    >
                                        {/* Colorful header stripe */}
                                        <div className={`h-3 bg-gradient-to-r ${styleColors.bg}`}></div>
                                        
                                        <div className="p-6">
                                            {/* Fun Story Header */}
                                            <div className="flex items-start justify-between mb-6">
                                                <div className="flex items-start gap-3">
                                                    <motion.div
                                                        whileHover={{ scale: 1.2, rotate: 10 }}
                                                        className={`text-4xl p-2 bg-${styleColors.light} rounded-full`}
                                                    >
                                                        {getStyleEmoji(story.preferences.style)}
                                                    </motion.div>
                                                    <div>
                                                        <h3 className="font-nerko text-xl text-gray-800 line-clamp-2 leading-tight">
                                                            {story.title}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                                                            <FaCalendarAlt className="text-teriary" />
                                                            <span className="font-medium">{getTimeAgo(story.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Fun Story Preview */}
                                            <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200">
                                                <p className="text-gray-700 line-clamp-3 italic leading-relaxed">
                                                    "{story.germanPreview}"
                                                </p>
                                            </div>

                                            {/* Colorful Words Used */}
                                            <div className="mb-6">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <FaTags className="text-teriary" />
                                                    <span className="text-sm text-gray-700 font-bold">
                                                        ✨ {story.wordsUsed.length} Magic Words:
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {story.wordsUsed.slice(0, 4).map((word, idx) => (
                                                        <motion.span
                                                            key={idx}
                                                            whileHover={{ scale: 1.1 }}
                                                            className={`px-3 py-1 bg-${styleColors.accent} text-white text-sm rounded-full font-medium shadow-md cursor-pointer`}
                                                        >
                                                            {word.german}
                                                        </motion.span>
                                                    ))}
                                                    {story.wordsUsed.length > 4 && (
                                                        <span className="px-3 py-1 bg-gradient-to-r from-teriary to-teriary-800 text-white text-sm rounded-full font-medium shadow-md">
                                                            +{story.wordsUsed.length - 4} more! 🎉
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                        {/* Story Meta */}
                                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                                            <div className="flex items-center gap-1">
                                                <FaLanguage />
                                                <span>Bilingual</span>
                                            </div>
                                            <div className="capitalize">
                                                {story.preferences.length} length
                                            </div>
                                            <div className="capitalize">
                                                {story.preferences.style}
                                            </div>
                                        </div>

                                            {/* Fun Actions */}
                                            <div className="flex items-center justify-between pt-4 border-t-2 border-dashed border-gray-200">
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => setSelectedStory(story)}
                                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teriary to-teriary-800 text-white font-bold rounded-full hover:from-teriary-800 hover:to-teriary-900 transition-all duration-300 shadow-lg hover:shadow-xl"
                                                >
                                                    <FaEye />
                                                    📖 Read Story
                                                </motion.button>
                                                
                                                <div className="flex items-center gap-3">
                                                    <motion.button
                                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleExportStory(story)}
                                                        className="p-3 text-secondary bg-secondary-100 hover:bg-secondary hover:text-white rounded-full transition-all duration-300 shadow-md hover:shadow-lg"
                                                        title="Export story"
                                                    >
                                                        <FaDownload />
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1, rotate: -5 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => setDeleteConfirm(story._id)}
                                                        className="p-3 text-red-500 bg-red-100 hover:bg-red-500 hover:text-white rounded-full transition-all duration-300 shadow-md hover:shadow-lg"
                                                        title="Delete story"
                                                    >
                                                        <FaTrash />
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Pagination */}
                {pagination.totalPages > 1 && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-center items-center gap-2 mt-8"
                    >
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={!pagination.hasPrevPage}
                            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                            Previous
                        </button>
                        
                        <div className="flex gap-1">
                            {[...Array(pagination.totalPages)].map((_, index) => {
                                const pageNumber = index + 1;
                                const isCurrentPage = pageNumber === currentPage;
                                
                                return (
                                    <button
                                        key={pageNumber}
                                        onClick={() => handlePageChange(pageNumber)}
                                        className={`px-3 py-2 rounded-lg transition-colors ${
                                            isCurrentPage
                                                ? 'bg-blue-600 text-white'
                                                : 'border border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {pageNumber}
                                    </button>
                                );
                            })}
                        </div>
                        
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={!pagination.hasNextPage}
                            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                            Next
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Story Viewer Modal */}
            {selectedStory && (
                <StoryViewer
                    story={selectedStory}
                    onClose={() => setSelectedStory(null)}
                />
            )}

            {/* Migration Modal */}
            <AnimatePresence>
                {showMigration && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
                        >
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FaBookOpen className="text-2xl text-blue-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Migrate Your Stories
                                </h3>
                                <p className="text-gray-600">
                                    We found stories saved in your browser. Would you like to migrate them to your account for better storage and access across devices?
                                </p>
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowMigration(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    disabled={migrating}
                                >
                                    Skip
                                </button>
                                <button
                                    onClick={handleMigration}
                                    disabled={migrating}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {migrating ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            Migrating...
                                        </>
                                    ) : (
                                        'Migrate Stories'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
                        >
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Delete Story?
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete this story? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteStory(deleteConfirm)}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}