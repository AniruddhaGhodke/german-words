import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import FlashcardModal from "./FlashcardModal";
import PronunciationTrainerModal from "./PronunciationTrainerModal";
import StoryGeneratorModal from "./StoryGeneratorModal";
const HEADERS = ["German word", "English word", "Type", "Actions"];

export default function Component({
    data,
    updateData,
    pagination,
    onPageChange,
    rate,
    onSearch,
    onFilterChange,
    onSort,
    filters,
}) {
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState(filters?.search || "");
    const [filterType, setFilterType] = useState(filters?.type || "All");
    const [selectedWords, setSelectedWords] = useState(new Set());
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [flashcardWord, setFlashcardWord] = useState(null);
    const [pronunciationWord, setPronunciationWord] = useState(null);
    const [storyGeneratorOpen, setStoryGeneratorOpen] = useState(false);
    const [showGerman, setShowGerman] = useState(true);
    const [showEnglish, setShowEnglish] = useState(true);
    const records = data; // Data is already paginated from server

    const modalRefs = useRef({});

    async function handleSpeak(speakword) {
        try {
            // Dynamic import to avoid SSR issues
            const { speakGermanWord } = await import("../utils/speechSynthesis");
            await speakGermanWord(speakword, {
                rate: rate || 0.8,
                onStart: () => console.log('Speaking:', speakword),
                onEnd: () => console.log('Finished speaking:', speakword)
            });
        } catch (error) {
            console.error('Speech error:', error);
            toast.error('Speech synthesis failed. Please try again.');
        }
    }

    async function handleDelete(uuid) {
        setLoading(true);
        try {
            const response = await fetch("/api/words", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uuid }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    updateData(data.data);
                    toast.success("Deleted Successfully!");
                } else {
                    toast.error("Failed to delete word");
                }
            } else {
                toast.error("Server error");
            }
        } catch (error) {
            toast.error("Request failed");
        } finally {
            setLoading(false);
            handleCloseModal(uuid);
        }
    }

    const handleOpenModal = (uuid) => {
        modalRefs.current[uuid]?.classList.remove("hidden");
    };

    const handleCloseModal = (uuid) => {
        modalRefs.current[uuid]?.classList.add("hidden");
    };

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        onSearch(value);
    };

    const handleFilterChange = (value) => {
        setFilterType(value);
        onFilterChange(value);
    };

    const clearSearch = () => {
        setSearchTerm("");
        onSearch("");
    };

    const toggleSelectMode = () => {
        setIsSelectMode(!isSelectMode);
        setSelectedWords(new Set());
    };

    const toggleSelectWord = (uuid) => {
        const newSelected = new Set(selectedWords);
        if (newSelected.has(uuid)) {
            newSelected.delete(uuid);
        } else {
            newSelected.add(uuid);
        }
        setSelectedWords(newSelected);
    };

    const selectAllVisible = () => {
        const allVisible = new Set(records.map(word => word.uuid));
        setSelectedWords(allVisible);
    };

    const deselectAll = () => {
        setSelectedWords(new Set());
    };

    const bulkDelete = async () => {
        if (selectedWords.size === 0) return;
        
        setLoading(true);
        try {
            const promises = Array.from(selectedWords).map(uuid => 
                fetch("/api/words", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ uuid }),
                })
            );
            
            await Promise.all(promises);
            
            // Refresh data after bulk delete
            updateData();
            toast.success(`Deleted ${selectedWords.size} words successfully!`);
            setSelectedWords(new Set());
            setIsSelectMode(false);
        } catch (error) {
            toast.error("Failed to delete words");
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = async () => {
        try {
            // Fetch all data for export (without pagination)
            const response = await fetch('/api/words?limit=1000000');
            const result = await response.json();
            const allData = result.success ? result.data : data;
            
            const headers = ['German Word,English Word,Type,Date Added'];
            const rows = allData.map(word => 
                `"${word.german}","${word.english}","${word.type || 'Any'}","${new Date(word.createdAt || Date.now()).toLocaleDateString()}"`
            );
            
            const csvContent = headers.concat(rows).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `german-words-${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success('Words exported successfully!');
            }
        } catch (error) {
            toast.error('Export failed');
        }
    };

    const exportToJSON = async () => {
        try {
            // Fetch all data for export (without pagination)
            const response = await fetch('/api/words?limit=1000000');
            const result = await response.json();
            const allData = result.success ? result.data : data;
            
            const exportData = {
                exportDate: new Date().toISOString(),
                totalWords: allData.length,
                words: allData.map(word => ({
                    german: word.german,
                    english: word.english,
                    type: word.type || 'Any',
                    dateAdded: word.createdAt || new Date().toISOString()
                }))
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const link = document.createElement('a');
            
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `german-words-${new Date().toISOString().split('T')[0]}.json`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success('Words exported successfully!');
            }
        } catch (error) {
            toast.error('Export failed');
        }
    };

    const openFlashcard = (word) => {
        setFlashcardWord(word);
    };

    const openPronunciationTrainer = (word) => {
        setPronunciationWord(word);
    };

    const openStoryGenerator = () => {
        if (selectedWords.size === 0) {
            toast.error("Please select some words first!");
            return;
        }
        setStoryGeneratorOpen(true);
    };

    const getSelectedWordsArray = () => {
        return records.filter(word => selectedWords.has(word.uuid));
    };

    useEffect(() => {
        setSearchTerm(filters?.search || '');
        setFilterType(filters?.type || 'All');
    }, [filters]);


    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full sm:w-11/12 mx-auto mt-6 sm:mt-10"
        >
            <motion.div
                className="overflow-hidden rounded-xl shadow-xl bg-white"
                whileHover={{
                    boxShadow:
                        "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
            >
                <div className="text-gray-300 bg-primary">
                    {/* Column visibility status */}
                    {(!showGerman || !showEnglish) && (
                        <div className="bg-amber-100 border-l-4 border-amber-500 p-3 text-amber-800 text-sm">
                            <div className="flex items-center gap-2">
                                <span>🎯</span>
                                <span>
                                    Practice Mode: {!showGerman ? 'English→German' : 'German→English'} 
                                    {' '}(hiding {!showGerman ? 'German' : 'English'} column for better practice)
                                </span>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex flex-col gap-4 sm:gap-6 lg:gap-10 p-3 sm:p-4 lg:p-5 font-normal sm:flex-row">
                        <div className="flex justify-start items-end sm:justify-end sm:basis-1/3">
                            <div className="w-full flex items-center gap-2">
                                <label
                                    htmlFor="searchWord"
                                    className="block text-sm font-medium"
                                >
                                    Search:
                                </label>
                                <div className="relative flex-1">
                                    <input
                                        type="search"
                                        id="searchWord"
                                        name="searchWord"
                                        value={searchTerm}
                                        className="mt-1 block px-3 py-3 w-full text-primary bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:bg-secondary-100 pr-8 min-h-[44px] text-sm sm:text-base"
                                        placeholder="Search words..."
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                    />
                                    {searchTerm && (
                                        <button
                                            type="button"
                                            onClick={clearSearch}
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            title="Clear search"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-start items-end gap-2 sm:justify-end sm:basis-1/3">
                            <div className="w-full flex items-center gap-2">
                                <label
                                    htmlFor="filterWords"
                                    className="block text-sm font-medium text-nowrap"
                                >
                                    Filter By:
                                </label>
                                <select
                                    id="filterWords"
                                    name="filterWords"
                                    value={filterType}
                                    onChange={(e) => handleFilterChange(e.target.value)}
                                    className="mt-1 block w-full min-w-max pl-3 pr-10 py-3 text-sm sm:text-base text-primary bg-gray-100 outline-1 border border-gray-300 outline-gray-300 focus:bg-secondary-100 rounded-md min-h-[44px]"
                                >
                                    <option>All</option>
                                    <option>Noun</option>
                                    <option>Verb</option>
                                    <option>Adjective</option>
                                    <option>Adverb</option>
                                    <option>Pronoun</option>
                                </select>
                            </div>
                        </div>
                        
                        {(searchTerm || filterType !== "All") && (
                            <div className="flex justify-center items-center sm:basis-1/3">
                                <div className="text-sm">
                                    <span className="font-medium">{pagination.total}</span> 
                                    <span className="ml-1">
                                        {pagination.total === 1 ? 'word' : 'words'} 
                                        {searchTerm && ` matching "${searchTerm}"`}
                                        {filterType !== "All" && ` (${filterType})`}
                                    </span>
                                    <button
                                        onClick={() => {
                                            clearSearch();
                                            setFilterType("All");
                                            onFilterChange("All");
                                        }}
                                        className="ml-2 text-xs underline hover:text-gray-100"
                                    >
                                        Clear all
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Sort Options Bar */}
                    <div className="bg-gray-50 px-3 sm:px-5 py-3 border-t border-gray-200">
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                            <span className="font-medium text-gray-700 w-full sm:w-auto mb-2 sm:mb-0">Sort by:</span>
                            <button 
                                onClick={() => onSort('german-asc')}
                                className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 min-h-[40px] text-xs sm:text-sm"
                            >
                                🇩🇪 A→Z
                            </button>
                            <button 
                                onClick={() => onSort('english-asc')}
                                className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 min-h-[40px] text-xs sm:text-sm"
                            >
                                🇺🇸 A→Z
                            </button>
                            <button 
                                onClick={() => onSort('date-newest')}
                                className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 min-h-[40px] text-xs sm:text-sm"
                            >
                                📅 Newest
                            </button>
                            <button 
                                onClick={() => onSort('type')}
                                className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 min-h-[40px] text-xs sm:text-sm"
                            >
                                📝 Type
                            </button>
                        </div>
                    </div>
                    
                    {/* Bulk Actions Bar */}
                    <div className="bg-blue-50 px-3 sm:px-5 py-3 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <button
                                onClick={toggleSelectMode}
                                className={`px-3 py-2 rounded text-xs sm:text-sm font-medium transition-colors min-h-[40px] ${
                                    isSelectMode 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {isSelectMode ? 'Exit Select' : 'Select Mode'}
                            </button>
                            
                            {/* Column visibility toggles */}
                            <div className="flex items-center gap-2 ml-0 sm:ml-4">
                                <span className="text-xs sm:text-sm text-gray-600">Show:</span>
                                <button
                                    onClick={() => {
                                        if (showGerman && !showEnglish) {
                                            toast.error("At least one column must be visible");
                                            return;
                                        }
                                        setShowGerman(!showGerman);
                                    }}
                                    className={`px-2 py-2 rounded text-xs font-medium transition-colors min-h-[36px] ${
                                        showGerman 
                                            ? 'bg-green-600 text-white' 
                                            : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                                    }`}
                                >
                                    🇩🇪 <span className="hidden sm:inline">German</span>
                                </button>
                                <button
                                    onClick={() => {
                                        if (showEnglish && !showGerman) {
                                            toast.error("At least one column must be visible");
                                            return;
                                        }
                                        setShowEnglish(!showEnglish);
                                    }}
                                    className={`px-2 py-2 rounded text-xs font-medium transition-colors min-h-[36px] ${
                                        showEnglish 
                                            ? 'bg-green-600 text-white' 
                                            : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                                    }`}
                                >
                                    🇺🇸 <span className="hidden sm:inline">English</span>
                                </button>
                                {(!showGerman || !showEnglish) && (
                                    <button
                                        onClick={() => {
                                            setShowGerman(true);
                                            setShowEnglish(true);
                                        }}
                                        className="px-2 py-2 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors min-h-[36px]"
                                    >
                                        Show All
                                    </button>
                                )}
                            </div>
                            
                            {isSelectMode && (
                                <>
                                    <span className="text-sm text-gray-600">
                                        {selectedWords.size} selected
                                    </span>
                                    <button
                                        onClick={selectAllVisible}
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        Select All ({records.length})
                                    </button>
                                    <button
                                        onClick={deselectAll}
                                        className="text-sm text-gray-600 hover:text-gray-800"
                                    >
                                        Deselect All
                                    </button>
                                </>
                            )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                            {pagination.total > 0 && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs sm:text-sm text-gray-600">Export:</span>
                                    <button
                                        onClick={exportToCSV}
                                        className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors min-h-[36px]"
                                    >
                                        📊 CSV
                                    </button>
                                    <button
                                        onClick={exportToJSON}
                                        className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors min-h-[36px]"
                                    >
                                        📄 JSON
                                    </button>
                                </div>
                            )}
                            
                            {isSelectMode && selectedWords.size > 0 && (
                                <>
                                    <button
                                        onClick={openStoryGenerator}
                                        className="px-3 py-2 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 transition-colors flex items-center gap-1 min-h-[36px] whitespace-nowrap"
                                        title="Generate story with selected words"
                                    >
                                        📖 <span className="hidden sm:inline">Story</span> ({selectedWords.size})
                                    </button>
                                    <button
                                        onClick={bulkDelete}
                                        disabled={loading}
                                        className="px-3 py-2 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 disabled:opacity-50 min-h-[36px] whitespace-nowrap"
                                    >
                                        {loading ? 'Deleting...' : `🗑️ Delete ${selectedWords.size}`}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                {/* Mobile Card Layout */}
                <div className="sm:hidden space-y-4 p-4">
                    {isSelectMode && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                            <input
                                type="checkbox"
                                checked={records.length > 0 && records.every(word => selectedWords.has(word.uuid))}
                                onChange={(e) => e.target.checked ? selectAllVisible() : deselectAll()}
                                className="w-5 h-5"
                            />
                            <span className="text-sm text-gray-700">Select all visible words</span>
                        </div>
                    )}
                    
                    {records.map((d, i) => (
                        <motion.div
                            key={d.uuid}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                                isSelectMode && selectedWords.has(d.uuid)
                                    ? 'border-blue-300 bg-blue-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                            }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    {showGerman && (
                                        <h3 className="text-lg font-bold text-gray-800 mb-1">
                                            {d.german}
                                        </h3>
                                    )}
                                    {showEnglish && (
                                        <p className="text-gray-600 mb-2">
                                            {d.english}
                                        </p>
                                    )}
                                    {d.type && (
                                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                            {d.type}
                                        </span>
                                    )}
                                </div>
                                
                                {isSelectMode && (
                                    <input
                                        type="checkbox"
                                        checked={selectedWords.has(d.uuid)}
                                        onChange={() => toggleSelectWord(d.uuid)}
                                        className="w-5 h-5 mt-1"
                                    />
                                )}
                            </div>
                            
                            {!isSelectMode && (
                                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex-1 bg-sky-50 hover:bg-sky-100 text-sky-700 hover:text-sky-800 p-3 rounded-xl border border-sky-200 hover:border-sky-300 transition-all duration-200 shadow-sm hover:shadow-md min-h-[48px] flex items-center justify-center gap-2"
                                        onClick={() => openPronunciationTrainer(d)}
                                        aria-label="Pronunciation Trainer"
                                    >
                                        <span className="text-xl">🎯</span>
                                        <span className="text-sm font-medium">Practice</span>
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800 p-3 rounded-xl border border-purple-200 hover:border-purple-300 transition-all duration-200 shadow-sm hover:shadow-md min-h-[48px] flex items-center justify-center gap-2"
                                        onClick={() => openFlashcard(d)}
                                        aria-label="Flashcard Practice"
                                    >
                                        <span className="text-xl">🃏</span>
                                        <span className="text-sm font-medium">Flashcard</span>
                                    </motion.button>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full table-fixed text-sm lg:text-base overflow-hidden min-w-[600px]">
                        <thead>
                            <tr className="bg-primary text-gray-300">
                                {isSelectMode && (
                                    <th className="w-12 py-3 px-4">
                                        <input
                                            type="checkbox"
                                            checked={records.length > 0 && records.every(word => selectedWords.has(word.uuid))}
                                            onChange={(e) => e.target.checked ? selectAllVisible() : deselectAll()}
                                            className="w-4 h-4"
                                        />
                                    </th>
                                )}
                                {HEADERS.map((header, index) => {
                                    // Skip German word column if hidden
                                    if (index === 0 && !showGerman) return null;
                                    // Skip English word column if hidden  
                                    if (index === 1 && !showEnglish) return null;
                                    
                                    return (
                                        <motion.th
                                            key={index}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.1 }}
                                            className={`${
                                                index === 2
                                                    ? "hidden lg:table-cell"
                                                    : ""
                                            } capitalize py-3 px-2 sm:px-4`}
                                        >
                                            {header}
                                        </motion.th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((d, i) => (
                                <motion.tr
                                    key={d.uuid}
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 50 }}
                                    transition={{
                                        duration: 0.3,
                                        delay: i * 0.05,
                                    }}
                                    className={`text-center transition-colors duration-200 ${
                                        isSelectMode && selectedWords.has(d.uuid)
                                            ? 'bg-blue-100 hover:bg-blue-200'
                                            : 'bg-gray-100 hover:bg-teriary-100'
                                    }`}
                                >
                                    {isSelectMode && (
                                        <td className="py-3 px-2 sm:px-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedWords.has(d.uuid)}
                                                onChange={() => toggleSelectWord(d.uuid)}
                                                className="w-4 h-4"
                                            />
                                        </td>
                                    )}
                                    {showGerman && (
                                        <td className="py-3 px-2 sm:px-4 font-medium text-sm">
                                            {d.german}
                                        </td>
                                    )}
                                    {showEnglish && (
                                        <td className="py-3 px-2 sm:px-4 text-sm">
                                            {d.english}
                                        </td>
                                    )}
                                    <td className="hidden lg:table-cell py-3 px-2 sm:px-4 text-sm">
                                        {d.type || "Any"}
                                    </td>
                                    <td className="py-3 px-1 sm:px-4">
                                        {!isSelectMode && (
                                            <div className="flex items-center justify-center gap-2 sm:gap-3">
                                                <motion.button
                                                    whileHover={{ scale: 1.1, y: -1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="bg-sky-50 hover:bg-sky-100 text-sky-700 hover:text-sky-800 p-3 rounded-lg sm:rounded-xl border border-sky-200 hover:border-sky-300 transition-all duration-200 shadow-sm hover:shadow-md min-h-[44px] min-w-[44px] flex items-center justify-center"
                                                    onClick={() => openPronunciationTrainer(d)}
                                                    aria-label="Pronunciation Trainer"
                                                    title="Advanced pronunciation practice"
                                                >
                                                    <span className="text-lg sm:text-xl">🎯</span>
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.1, y: -1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800 p-3 rounded-lg sm:rounded-xl border border-purple-200 hover:border-purple-300 transition-all duration-200 shadow-sm hover:shadow-md min-h-[44px] min-w-[44px] flex items-center justify-center"
                                                    onClick={() => openFlashcard(d)}
                                                    aria-label="Flashcard Practice"
                                                    title="Flashcard practice"
                                                >
                                                    <span className="text-lg sm:text-xl">🃏</span>
                                                </motion.button>
                                            </div>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex justify-center space-x-2 sm:space-x-4 my-6 sm:my-10 items-center flex-wrap gap-2"
            >
                <PageButton
                    onClick={() => onPageChange(1)}
                    disabled={!pagination.hasPrev}
                    className="hidden sm:inline-flex"
                >
                    First
                </PageButton>
                <PageButton
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                >
                    <span className="sm:hidden">‹</span>
                    <span className="hidden sm:inline">Prev</span>
                </PageButton>
                <span className="text-primary font-bold text-sm sm:text-base px-2 py-1 bg-gray-100 rounded">
                    {pagination.page} / {pagination.totalPages}
                </span>
                <PageButton
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                >
                    <span className="sm:hidden">›</span>
                    <span className="hidden sm:inline">Next</span>
                </PageButton>
                <PageButton
                    onClick={() => onPageChange(pagination.totalPages)}
                    disabled={!pagination.hasNext}
                    className="hidden sm:inline-flex"
                >
                    Last
                </PageButton>
            </motion.div>
            
            {/* Modals */}
            <FlashcardModal
                word={flashcardWord}
                isOpen={!!flashcardWord}
                onClose={() => setFlashcardWord(null)}
                onSpeak={handleSpeak}
            />
            <PronunciationTrainerModal
                word={pronunciationWord}
                isOpen={!!pronunciationWord}
                onClose={() => setPronunciationWord(null)}
            />
            <StoryGeneratorModal
                isOpen={storyGeneratorOpen}
                onClose={() => setStoryGeneratorOpen(false)}
                selectedWords={getSelectedWordsArray()}
                onSpeak={handleSpeak}
            />
        </motion.div>
    );
}

function PageButton({ children, onClick, disabled, className = "" }) {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base min-h-[40px] ${
                disabled
                    ? "bg-gray-300 text-gray-400 cursor-not-allowed"
                    : "bg-primary text-gray-200 hover:bg-primary/90"
            } ${className}`}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </motion.button>
    );
}
