"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";
import { useTranslateWordMutation } from "@/store/api/wordsApi";

/**
 * Modal component for adding words on mobile
 * Client component for modal state management
 */
export default function AddWordModal({ isOpen, onClose, onSubmit, isLoading }) {
  const formRef = useRef(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <WordFormTemplate
          ref={formRef}
          action={onSubmit}
          isLoading={isLoading}
          closeModal={onClose}
          isModal={true}
        />
      </div>
    </div>
  );
}

/**
 * Form template component for word input in modal
 * Handles validation and translation features
 */
const WordFormTemplate = React.forwardRef(
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
      <form ref={ref} action={action} onKeyDown={handleKeyDown} className="space-y-4" {...props}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Word</h2>

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

        <div className="space-y-2">
          <motion.button
            whileHover={{
              scale: 1.05,
              transition: { delay: 0.1, duration: 0.2 },
            }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={isLoading || isTranslating || !isFormValid}
            className={`w-full flex justify-center py-3 px-4 rounded-md shadow-sm text-sm font-medium transition-colors min-h-[44px] ${
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
            className={`w-full flex justify-center py-3 px-4 rounded-md shadow-sm text-sm font-medium transition-colors min-h-[44px] ${
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
            className="w-full flex justify-center py-3 px-4 rounded-md shadow-sm text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors min-h-[44px]"
            title="Clear form (Esc)"
          >
            Clear
          </motion.button>

          <button
            type="button"
            onClick={closeModal}
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors min-h-[44px]"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }
);

WordFormTemplate.displayName = 'WordFormTemplate';