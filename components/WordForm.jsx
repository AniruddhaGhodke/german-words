"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FaSpinner } from "react-icons/fa";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { 
  useGetWordsQuery, 
  useAddWordMutation, 
  useTranslateWordMutation 
} from "@/store/api/wordsApi";
import {
  selectPagination,
  selectFilters,
  setPagination,
  setCurrentPage,
  setSearch,
  setTypeFilter,
  setSort
} from "@/store/slices/wordsSlice";

// Lazy load the Table and Skeleton components
const Table = dynamic(() => import("./Table"));
const TableSkeleton = dynamic(() => import("./TableSkeleton"));

const Accordion = ({ rate }) => {
    const dispatch = useAppDispatch();
    const pagination = useAppSelector(selectPagination);
    const filters = useAppSelector(selectFilters);

    // RTK Query for data fetching
    const {
        data: wordsResponse,
        error,
        isLoading,
        isFetching,
        refetch
    } = useGetWordsQuery({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        type: filters.type,
        sort: filters.sort
    });

    const data = wordsResponse?.data || [];
    const paginationData = wordsResponse?.pagination || pagination;

    // Update pagination in Redux when data changes
    useEffect(() => {
        if (wordsResponse?.pagination) {
            dispatch(setPagination(wordsResponse.pagination));
        }
    }, [wordsResponse?.pagination, dispatch]);


    const handleFilter = useCallback((filterType) => {
        dispatch(setTypeFilter(filterType === 'All' ? '' : filterType));
        dispatch(setCurrentPage(1));
    }, [dispatch]);

    const handleSort = useCallback((sortType) => {
        dispatch(setSort(sortType));
        dispatch(setCurrentPage(1));
    }, [dispatch]);

    const handleSearch = useCallback((searchTerm) => {
        dispatch(setSearch(searchTerm));
        dispatch(setCurrentPage(1));
    }, [dispatch]);

    const handlePageChange = useCallback((newPage) => {
        dispatch(setCurrentPage(newPage));
    }, [dispatch]);

    const handleSetData = useCallback(() => {
        // RTK Query automatically handles refetching
        refetch();
    }, [refetch]);

    // Show error toast if there's an error
    useEffect(() => {
        if (error) {
            toast.error('Failed to fetch words');
            console.error('Words fetch error:', error);
        }
    }, [error]);

    return (
        <>
            <WordForm
                onWordAdd={handleSetData}
                onFilterChange={handleFilter}
                onSearch={handleSearch}
                onSort={handleSort}
            />
            {(isLoading || isFetching) ? (
                <TableSkeleton />
            ) : data.length ? (
                <Table
                    data={data}
                    updateData={handleSetData}
                    pagination={paginationData}
                    onPageChange={handlePageChange}
                    rate={rate}
                    onFilterChange={handleFilter}
                    onSearch={handleSearch}
                    onSort={handleSort}
                    filters={filters}
                />
            ) : (
                <EmptyState onAddWord={() => {}} />
            )}
        </>
    );
};

const WordForm = React.memo(({ onWordAdd }) => {
    const formRef = useRef(null);
    const [isModalOpen, setModalOpen] = useState(false);
    const [addWord, { isLoading: isAddingWord }] = useAddWordMutation();

    const handleSubmit = async (formData) => {
        try {
            const wordData = {
                germanWord: formData.get('germanWord'),
                englishWord: formData.get('englishWord'),
                type: formData.get('type')
            };
            
            await addWord(wordData).unwrap();
            toast.success("Word added successfully!");
            formRef.current?.reset();
            if (onWordAdd) onWordAdd();
        } catch (error) {
            console.error('Add word error:', error);
            toast.error(error?.data?.message || "Failed to add word");
        }
    };

    const toggleModal = () => setModalOpen((prev) => !prev);

    return (
        <>
            <div className="py-3 sm:py-5 px-3 sm:px-5 shadow-lg mx-auto w-full sm:w-11/12 bg-gray-100 rounded-lg flex flex-col sm:flex-row">
                <button
                    onClick={toggleModal}
                    className="sm:hidden mb-4 p-3 border border-sky-800 hover:bg-sky-800 text-gray-800 hover:text-white rounded-md shadow-sm font-medium min-h-[44px]"
                >
                    + Add New Word
                </button>

                {isModalOpen && (
                    <Modal isOpen={isModalOpen} onClose={toggleModal}>
                        <FormTemplate
                            ref={formRef}
                            action={handleSubmit}
                            isLoading={isAddingWord}
                            closeModal={toggleModal}
                            isModal={true}
                        />
                    </Modal>
                )}

                <FormTemplate
                    ref={formRef}
                    action={handleSubmit}
                    isLoading={isAddingWord}
                    className="hidden sm:flex gap-6 lg:gap-10 items-end flex-1"
                />
            </div>
        </>
    );
});

WordForm.displayName = 'WordForm';

const FormTemplate = React.forwardRef(
    ({ action, isLoading, closeModal, ...props }, ref) => {
        const germanRef = useRef(null);
        const englishRef = useRef(null);
        const [formErrors, setFormErrors] = useState({});
        const [isFormValid, setIsFormValid] = useState(false);
        const [translateWord, { isLoading: isTranslating }] = useTranslateWordMutation();

        const validateField = (name, value) => {
            const errors = { ...formErrors };
            
            switch (name) {
                case 'germanWord':
                    if (!value?.trim()) {
                        errors.germanWord = 'German word is required';
                    } else if (value.trim().length < 2) {
                        errors.germanWord = 'German word must be at least 2 characters';
                    } else {
                        delete errors.germanWord;
                    }
                    break;
                case 'englishWord':
                    if (!value?.trim()) {
                        errors.englishWord = 'English word is required';
                    } else if (value.trim().length < 2) {
                        errors.englishWord = 'English word must be at least 2 characters';
                    } else {
                        delete errors.englishWord;
                    }
                    break;
            }
            
            setFormErrors(errors);
            setIsFormValid(Object.keys(errors).length === 0 && 
                germanRef.current?.value?.trim() && 
                englishRef.current?.value?.trim());
        };

        const handleInputChange = (e) => {
            const { name, value } = e.target;
            validateField(name, value);
        };

        const handleTranslate = async () => {
            try {
                const formData = new FormData(ref.current);
                const wordData = {
                    germanWord: formData.get('germanWord'),
                    englishWord: formData.get('englishWord')
                };
                
                const result = await translateWord(wordData).unwrap();
                
                if (result.englishWord) {
                    englishRef.current.value = result.englishWord;
                    validateField('englishWord', result.englishWord);
                }
                if (result.germanWord) {
                    germanRef.current.value = result.germanWord;
                    validateField('germanWord', result.germanWord);
                }
                toast.success("Translation completed!");
            } catch (error) {
                console.error('Translation error:', error);
                toast.error("Translation failed. Please try again.");
            }
        };

        const handleClearForm = () => {
            ref.current?.reset();
            setFormErrors({});
            setIsFormValid(false);
            germanRef.current?.focus();
        };

        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                if (isFormValid && !isLoading && !isTranslating) {
                    ref.current?.requestSubmit();
                }
            } else if (e.ctrlKey && e.key === 't') {
                e.preventDefault();
                if (!isLoading && !isTranslating) {
                    handleTranslate();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                if (closeModal) {
                    closeModal();
                } else {
                    handleClearForm();
                }
            }
        };

        return (
            <form ref={ref} action={action} onKeyDown={handleKeyDown} {...props}>
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
                        ref={germanRef}
                        className={`mt-1 block w-full px-3 py-2 bg-gray-100 border rounded-md shadow-sm focus:bg-secondary-100 transition-colors ${
                            formErrors.germanWord 
                                ? 'border-red-500 focus:border-red-500' 
                                : 'border-gray-300 focus:border-blue-500'
                        }`}
                        placeholder="Enter German word"
                        onChange={handleInputChange}
                        aria-invalid={!!formErrors.germanWord}
                        aria-describedby={formErrors.germanWord ? "germanWord-error" : undefined}
                    />
                    {formErrors.germanWord && (
                        <p id="germanWord-error" className="mt-1 text-sm text-red-600" role="alert">
                            {formErrors.germanWord}
                        </p>
                    )}
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
                        ref={englishRef}
                        className={`mt-1 block w-full px-3 py-2 bg-gray-100 border rounded-md shadow-sm focus:bg-secondary-100 transition-colors ${
                            formErrors.englishWord 
                                ? 'border-red-500 focus:border-red-500' 
                                : 'border-gray-300 focus:border-blue-500'
                        }`}
                        placeholder="Enter English word"
                        onChange={handleInputChange}
                        aria-invalid={!!formErrors.englishWord}
                        aria-describedby={formErrors.englishWord ? "englishWord-error" : undefined}
                    />
                    {formErrors.englishWord && (
                        <p id="englishWord-error" className="mt-1 text-sm text-red-600" role="alert">
                            {formErrors.englishWord}
                        </p>
                    )}
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
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-100 outline-1 border border-gray-300 outline-gray-300 focus:bg-secondary-100 rounded-md"
                    >
                        <option>Noun</option>
                        <option>Verb</option>
                        <option>Adjective</option>
                        <option>Adverb</option>
                        <option>Pronoun</option>
                    </select>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <motion.button
                        whileHover={{
                            scale: 1.05,
                            transition: { delay: 0.1, duration: 0.2 },
                        }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={isLoading || isTranslating || !isFormValid}
                        className={`${
                            props.isModal ? "w-full" : "flex-1"
                        } flex justify-center py-3 px-4 rounded-md shadow-sm text-sm font-medium transition-colors min-h-[44px] ${
                            isLoading || isTranslating || !isFormValid 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-200 text-primary hover:bg-tertiary hover:text-gray-100'
                        }`}
                        title="Add word (Ctrl+Enter)"
                    >
                        {(isLoading || isTranslating) ? (
                            <FaSpinner className="animate-spin w-5 h-5" />
                        ) : (
                            "Add"
                        )}
                    </motion.button>
                    <motion.button
                        whileHover={{
                            scale: 1.05,
                            transition: { delay: 0.1, duration: 0.2 },
                        }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={handleTranslate}
                        disabled={isLoading || isTranslating}
                        className={`${
                            props.isModal ? "w-full" : "flex-1"
                        } flex justify-center py-3 px-4 rounded-md shadow-sm text-sm font-medium transition-colors min-h-[44px] ${
                            isLoading || isTranslating 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-yellow-200 text-primary hover:bg-yellow-300'
                        }`}
                        title="Translate (Ctrl+T)"
                    >
                        {isTranslating ? (
                            <FaSpinner className="animate-spin w-5 h-5" />
                        ) : (
                            "Translate"
                        )}
                    </motion.button>
                    <motion.button
                        whileHover={{
                            scale: 1.05,
                            transition: { delay: 0.1, duration: 0.2 },
                        }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={handleClearForm}
                        disabled={isLoading || isTranslating}
                        className={`${
                            props.isModal ? "w-full" : "w-auto lg:flex-1"
                        } flex justify-center py-3 px-4 rounded-md shadow-sm text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors min-h-[44px]`}
                        title="Clear form (Esc)"
                    >
                        Clear
                    </motion.button>
                </div>
                {props.isModal && (
                    <button
                        type="button"
                        onClick={closeModal}
                        className="mt-4 w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors min-h-[44px]"
                    >
                        Cancel
                    </button>
                )}
            </form>
        );
    }
);

FormTemplate.displayName = 'FormTemplate';

// Empty State Component
const EmptyState = ({ onAddWord }) => {
    return (
        <div className="mt-20 w-full flex flex-col items-center justify-center text-center p-8">
            <div className="bg-gray-100 rounded-full p-6 mb-6">
                <svg 
                    className="w-16 h-16 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
                    />
                </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                No German words yet!
            </h3>
            <p className="text-gray-500 mb-6 max-w-md">
                Start building your German vocabulary by adding your first word. You can also use the translate feature to help you learn new words.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={onAddWord}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    Add Your First Word
                </button>
                <button
                    onClick={() => window.location.href = '/wordGame'}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                    Try Word Challenge
                </button>
            </div>
        </div>
    );
};

// Modal Component
const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                {children}
            </div>
        </div>
    );
};

export default Accordion;