import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import FlashcardModal from "./FlashcardModal";
import SentenceBuilderModal from "./SentenceBuilderModal";
import WordAssociationModal from "./WordAssociationModal";
import PronunciationTrainerModal from "./PronunciationTrainerModal";
import StoryGeneratorModal from "./StoryGeneratorModal";
import { speakGermanWord } from "../utils/speechSynthesis";

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
    const [sentenceWord, setSentenceWord] = useState(null);
    const [associationWord, setAssociationWord] = useState(null);
    const [pronunciationWord, setPronunciationWord] = useState(null);
    const [storyGeneratorOpen, setStoryGeneratorOpen] = useState(false);
    const [showGerman, setShowGerman] = useState(true);
    const [showEnglish, setShowEnglish] = useState(true);
    const records = data; // Data is already paginated from server

    const modalRefs = useRef({});

    function handleSpeak(speakword) {
        speakGermanWord(speakword, {
            rate: rate || 0.8,
            onStart: () => console.log('Speaking:', speakword),
            onEnd: () => console.log('Finished speaking:', speakword)
        }).catch(error => {
            console.error('Speech error:', error);
        });
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

    const openSentenceBuilder = (word) => {
        setSentenceWord(word);
    };

    const openWordAssociation = (word) => {
        setAssociationWord(word);
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
            className="w-11/12 mx-auto mt-10"
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
                    
                    <div className="flex flex-col gap-10 p-5 font-normal sm:flex-row">
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
                                        className="mt-1 block px-3 py-2 w-full text-primary bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:bg-secondary-100 pr-8"
                                        placeholder="Search German or English words..."
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
                                    className="mt-1 block w-full min-w-max pl-3 pr-10 py-2 text-base text-primary bg-gray-100 outline-1 border border-gray-300 outline-gray-300 focus:bg-secondary-100 rounded-md"
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
                    <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-medium text-gray-700">Sort by:</span>
                            <button 
                                onClick={() => onSort('german-asc')}
                                className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                            >
                                German A→Z
                            </button>
                            <button 
                                onClick={() => onSort('english-asc')}
                                className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                            >
                                English A→Z
                            </button>
                            <button 
                                onClick={() => onSort('date-newest')}
                                className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                            >
                                Newest First
                            </button>
                            <button 
                                onClick={() => onSort('type')}
                                className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                            >
                                By Type
                            </button>
                        </div>
                    </div>
                    
                    {/* Bulk Actions Bar */}
                    <div className="bg-blue-50 px-5 py-3 border-t border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleSelectMode}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                    isSelectMode 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {isSelectMode ? 'Exit Select' : 'Select Mode'}
                            </button>
                            
                            {/* Column visibility toggles */}
                            <div className="flex items-center gap-2 ml-4">
                                <span className="text-sm text-gray-600">Show:</span>
                                <button
                                    onClick={() => {
                                        if (showGerman && !showEnglish) {
                                            toast.error("At least one column must be visible");
                                            return;
                                        }
                                        setShowGerman(!showGerman);
                                    }}
                                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                        showGerman 
                                            ? 'bg-green-600 text-white' 
                                            : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                                    }`}
                                >
                                    🇩🇪 German
                                </button>
                                <button
                                    onClick={() => {
                                        if (showEnglish && !showGerman) {
                                            toast.error("At least one column must be visible");
                                            return;
                                        }
                                        setShowEnglish(!showEnglish);
                                    }}
                                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                        showEnglish 
                                            ? 'bg-green-600 text-white' 
                                            : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                                    }`}
                                >
                                    🇺🇸 English
                                </button>
                                {(!showGerman || !showEnglish) && (
                                    <button
                                        onClick={() => {
                                            setShowGerman(true);
                                            setShowEnglish(true);
                                        }}
                                        className="px-2 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
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
                        
                        <div className="flex items-center gap-2">
                            {pagination.total > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Export:</span>
                                    <button
                                        onClick={exportToCSV}
                                        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                    >
                                        CSV
                                    </button>
                                    <button
                                        onClick={exportToJSON}
                                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                    >
                                        JSON
                                    </button>
                                </div>
                            )}
                            
                            {isSelectMode && selectedWords.size > 0 && (
                                <>
                                    <button
                                        onClick={openStoryGenerator}
                                        className="px-3 py-1 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-1"
                                        title="Generate story with selected words"
                                    >
                                        📖 Generate Story ({selectedWords.size})
                                    </button>
                                    <button
                                        onClick={bulkDelete}
                                        disabled={loading}
                                        className="px-3 py-1 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {loading ? 'Deleting...' : `Delete ${selectedWords.size} Selected`}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <table className="w-full table-fixed text-sm sm:text-base overflow-hidden">
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
                                                ? "hidden sm:table-cell"
                                                : ""
                                        } capitalize py-3 px-4`}
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
                                    <td className="py-3 px-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedWords.has(d.uuid)}
                                            onChange={() => toggleSelectWord(d.uuid)}
                                            className="w-4 h-4"
                                        />
                                    </td>
                                )}
                                {showGerman && (
                                    <td className="py-3 px-4 font-medium">
                                        {d.german}
                                    </td>
                                )}
                                {showEnglish && (
                                    <td className="py-3 px-4">
                                        {d.english}
                                    </td>
                                )}
                                <td className="hidden sm:table-cell py-3 px-4">
                                    {d.type || "Any"}
                                </td>
                                <td className="py-3 px-4">
                                    {!isSelectMode && (
                                        <div className="flex items-center justify-center gap-2 flex-wrap">
                                            <motion.button
                                                whileHover={{ scale: 1.15, y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="bg-sky-50 hover:bg-sky-100 text-sky-700 hover:text-sky-800 p-3 rounded-xl border border-sky-200 hover:border-sky-300 transition-all duration-200 shadow-sm hover:shadow-md"
                                                onClick={() => openPronunciationTrainer(d)}
                                                aria-label="Pronunciation Trainer"
                                                title="Advanced pronunciation practice"
                                            >
                                                <span className="text-lg">🎯</span>
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.15, y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800 p-3 rounded-xl border border-purple-200 hover:border-purple-300 transition-all duration-200 shadow-sm hover:shadow-md"
                                                onClick={() => openFlashcard(d)}
                                                aria-label="Flashcard Practice"
                                                title="Flashcard practice"
                                            >
                                                <span className="text-lg">🃏</span>
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.15, y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="bg-green-50 hover:bg-green-100 text-green-700 hover:text-green-800 p-3 rounded-xl border border-green-200 hover:border-green-300 transition-all duration-200 shadow-sm hover:shadow-md"
                                                onClick={() => openSentenceBuilder(d)}
                                                aria-label="Sentence Practice"
                                                title="Sentence practice"
                                            >
                                                <span className="text-lg">📝</span>
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.15, y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="bg-orange-50 hover:bg-orange-100 text-orange-700 hover:text-orange-800 p-3 rounded-xl border border-orange-200 hover:border-orange-300 transition-all duration-200 shadow-sm hover:shadow-md"
                                                onClick={() => openWordAssociation(d)}
                                                aria-label="Word Association Game"
                                                title="Word association game"
                                            >
                                                <span className="text-lg">🧩</span>
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.15, y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 p-3 rounded-xl border border-red-200 hover:border-red-300 transition-all duration-200 shadow-sm hover:shadow-md"
                                                onClick={() => handleOpenModal(d.uuid)}
                                                aria-label="Delete"
                                                title="Delete word"
                                            >
                                                <img
                                                    src="/delete.svg"
                                                    alt="Delete Icon"
                                                    className="h-5 w-5"
                                                />
                                            </motion.button>
                                        </div>
                                    )}
                                    <div
                                        ref={(el) =>
                                            (modalRefs.current[d.uuid] = el)
                                        }
                                        className="fixed inset-0 flex items-center justify-center z-50 hidden"
                                    >
                                        <motion.div
                                            initial={{
                                                opacity: 0,
                                                scale: 0.8,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                scale: 1,
                                            }}
                                            exit={{
                                                opacity: 0,
                                                scale: 0.8,
                                            }}
                                            className="bg-white p-6 rounded-lg shadow-xl z-10 max-w-sm w-full"
                                        >
                                            <h3 className="text-lg font-semibold mb-4">
                                                Confirm Deletion
                                            </h3>
                                            <p className="mb-6">
                                                Are you sure you want to delete{" "}
                                                <span className="font-bold">
                                                    {d.german}
                                                </span>
                                                ?
                                            </p>
                                            <div className="flex justify-end space-x-4">
                                                <motion.button
                                                    whileHover={{
                                                        scale: 1.05,
                                                    }}
                                                    whileTap={{
                                                        scale: 0.95,
                                                    }}
                                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors duration-200"
                                                    onClick={() =>
                                                        handleCloseModal(d.uuid)
                                                    }
                                                >
                                                    Cancel
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{
                                                        scale: 1.05,
                                                    }}
                                                    whileTap={{
                                                        scale: 0.95,
                                                    }}
                                                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200 flex items-center"
                                                    onClick={() =>
                                                        handleDelete(d.uuid)
                                                    }
                                                    disabled={loading}
                                                >
                                                    {loading && (
                                                        <svg
                                                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            ></circle>
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8V4a10 10 0 00-10 10h2z"
                                                            ></path>
                                                        </svg>
                                                    )}
                                                    Confirm
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                        <div
                                            className="fixed inset-0 bg-black opacity-50"
                                            onClick={() =>
                                                handleCloseModal(d.uuid)
                                            }
                                        ></div>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex justify-center space-x-4 my-10 items-center"
            >
                <PageButton
                    onClick={() => onPageChange(1)}
                    disabled={!pagination.hasPrev}
                >
                    First
                </PageButton>
                <PageButton
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                >
                    Prev
                </PageButton>
                <span className="text-primary font-bold">
                    {pagination.page} / {pagination.totalPages}
                </span>
                <PageButton
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                >
                    Next
                </PageButton>
                <PageButton
                    onClick={() => onPageChange(pagination.totalPages)}
                    disabled={!pagination.hasNext}
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
            <SentenceBuilderModal
                word={sentenceWord}
                isOpen={!!sentenceWord}
                onClose={() => setSentenceWord(null)}
                onSpeak={handleSpeak}
            />
            <WordAssociationModal
                word={associationWord}
                allWords={data}
                isOpen={!!associationWord}
                onClose={() => setAssociationWord(null)}
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

function PageButton({ children, onClick, disabled }) {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded-full ${
                disabled
                    ? "bg-gray-300 text-gray-400 cursor-not-allowed"
                    : "bg-primary text-gray-200"
            }`}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </motion.button>
    );
}
