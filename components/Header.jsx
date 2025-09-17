"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { 
    selectIsMobileMenuOpen, 
    selectModalState,
    toggleMobileMenu,
    setMobileMenu,
    openModal,
    closeModal
} from "@/store/slices/uiSlice";
import TTSSelector from "./TTSSelector";

export default function Header() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const dispatch = useAppDispatch();
    
    // RTK State
    const isMobileMenuOpen = useAppSelector(selectIsMobileMenuOpen);
    const ttsModal = useAppSelector(selectModalState('ttsSelector'));
    
    const handleSignOut = async () => {
        await signOut();
    };
    
    const handleToggleMobileMenu = () => {
        dispatch(toggleMobileMenu());
    };
    
    const openTTSSelector = () => {
        dispatch(openModal({ modalType: 'ttsSelector' }));
        dispatch(setMobileMenu(false));
    };
    
    const closeMobileMenu = () => {
        dispatch(setMobileMenu(false));
    };

    return (
        <header className="bg-primary text-white w-full top-0 left-0 z-20 absolute">
            <div className="absolute inset-0 opacity-40"></div>
            <div className="relative max-w-screen-xl mx-auto">
                {/* Main header bar */}
                <div className="flex justify-between items-center p-4">
                    <Link
                        href="/"
                        className="bg-[url('/logo.svg')] w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-cover bg-no-repeat text-[hsl(199,60%,55%)] flex-shrink-0"
                    />

                    {status === "loading" ? (
                        <div className="flex gap-2 text-xs sm:text-sm">
                            <div className="bg-gray-900 text-[hsl(199,60%,55%)] font-bold py-2 px-3 sm:px-4 rounded animate-pulse">
                                Loading...
                            </div>
                        </div>
                    ) : session ? (
                        <>
                            {/* Desktop navigation */}
                            <div className="hidden sm:flex gap-2 lg:gap-3 text-sm lg:text-base">
                                <Link
                                    href="/my-stories"
                                    className="bg-gray-900 hover:bg-gray-700 text-[hsl(199,60%,55%)] font-bold py-2 px-3 lg:px-4 rounded whitespace-nowrap"
                                >
                                    My Stories
                                </Link>
                                <Link
                                    href="/wordGame"
                                    className="bg-gray-900 hover:bg-gray-700 text-[hsl(199,60%,55%)] font-bold py-2 px-3 lg:px-4 rounded whitespace-nowrap"
                                >
                                    Word Challenge
                                </Link>
                                <button
                                    onClick={openTTSSelector}
                                    className="bg-gray-900 hover:bg-gray-700 text-[hsl(199,60%,55%)] font-bold py-2 px-3 lg:px-4 rounded whitespace-nowrap"
                                    title="Voice Settings"
                                >
                                    🎤
                                </button>
                                <button
                                    onClick={handleSignOut}
                                    className="bg-gray-900 hover:bg-gray-700 text-[hsl(199,60%,55%)] font-bold py-2 px-3 lg:px-4 rounded whitespace-nowrap"
                                >
                                    Sign Out
                                </button>
                            </div>
                            
                            {/* Mobile hamburger menu */}
                            <button
                                onClick={handleToggleMobileMenu}
                                className="sm:hidden bg-gray-900 hover:bg-gray-700 text-[hsl(199,60%,55%)] font-bold p-3 rounded focus:outline-none focus:ring-2 focus:ring-[hsl(199,60%,55%)]"
                                aria-label="Toggle menu"
                            >
                                <div className="w-5 h-5 flex flex-col justify-center items-center">
                                    <span className={`block w-full h-0.5 bg-current transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-45 translate-y-0.5' : '-translate-y-1'}`}></span>
                                    <span className={`block w-full h-0.5 bg-current transition-opacity duration-200 ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                                    <span className={`block w-full h-0.5 bg-current transition-transform duration-200 ${isMobileMenuOpen ? '-rotate-45 -translate-y-0.5' : 'translate-y-1'}`}></span>
                                </div>
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/login">
                                <span className="bg-gray-900 hover:bg-gray-700 text-[hsl(199,60%,55%)] font-bold py-3 px-4 rounded text-sm min-h-[44px] flex items-center">
                                    <span className="hidden sm:inline">Sign In / Register</span>
                                    <span className="sm:hidden">Sign In</span>
                                </span>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile dropdown menu */}
                {session && (
                    <div className={`sm:hidden bg-gray-900/95 backdrop-blur-sm transition-all duration-200 ease-in-out overflow-hidden ${
                        isMobileMenuOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                        <div className="px-4 py-2 space-y-1">
                            <Link
                                href="/my-stories"
                                className="block w-full text-left text-[hsl(199,60%,55%)] font-semibold py-3 px-4 rounded hover:bg-gray-800 transition-colors min-h-[44px] flex items-center"
                                onClick={closeMobileMenu}
                            >
                                📚 My Stories
                            </Link>
                            <Link
                                href="/wordGame"
                                className="block w-full text-left text-[hsl(199,60%,55%)] font-semibold py-3 px-4 rounded hover:bg-gray-800 transition-colors min-h-[44px] flex items-center"
                                onClick={closeMobileMenu}
                            >
                                🎯 Word Challenge
                            </Link>
                            <button
                                onClick={openTTSSelector}
                                className="block w-full text-left text-[hsl(199,60%,55%)] font-semibold py-3 px-4 rounded hover:bg-gray-800 transition-colors min-h-[44px] flex items-center"
                            >
                                🎤 Voice Settings
                            </button>
                            <button
                                onClick={() => {
                                    handleSignOut();
                                    closeMobileMenu();
                                }}
                                className="block w-full text-left text-[hsl(199,60%,55%)] font-semibold py-3 px-4 rounded hover:bg-gray-800 transition-colors min-h-[44px] flex items-center"
                            >
                                🚪 Sign Out
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* TTS Selector Modal */}
            <TTSSelector
                isOpen={ttsModal.isOpen}
                onClose={() => dispatch(closeModal('ttsSelector'))}
            />
        </header>
    );
}