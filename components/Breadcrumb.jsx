"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const Breadcrumb = () => {
    const pathname = usePathname();
    
    const getBreadcrumbs = () => {
        const pathSegments = pathname.split('/').filter(Boolean);
        
        const breadcrumbs = [
            { name: 'Home', href: '/', current: pathname === '/' }
        ];
        
        let currentPath = '';
        pathSegments.forEach((segment, index) => {
            currentPath += `/${segment}`;
            const isLast = index === pathSegments.length - 1;
            
            let name = segment;
            switch (segment) {
                case 'wordGame':
                    name = 'Word Challenge';
                    break;
                case 'login':
                    name = 'Sign In';
                    break;
                case 'register':
                    name = 'Sign Up';
                    break;
                case 'start':
                    name = 'Game Setup';
                    break;
                default:
                    name = segment.charAt(0).toUpperCase() + segment.slice(1);
            }
            
            breadcrumbs.push({
                name,
                href: currentPath,
                current: isLast
            });
        });
        
        return breadcrumbs;
    };

    const breadcrumbs = getBreadcrumbs();
    
    if (pathname === '/login' || pathname === '/register') {
        return null; // Don't show breadcrumbs on auth pages
    }

    return (
        <motion.nav 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white shadow-sm border-b border-gray-200"
            aria-label="Breadcrumb"
        >
            <div className="max-w-screen-xl mx-auto px-4 py-3">
                <ol className="flex items-center space-x-2 text-sm">
                    {breadcrumbs.map((breadcrumb, index) => (
                        <li key={breadcrumb.href} className="flex items-center">
                            {index > 0 && (
                                <svg
                                    className="w-4 h-4 text-gray-400 mx-2"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            )}
                            {breadcrumb.current ? (
                                <span className="text-gray-500 font-medium" aria-current="page">
                                    {breadcrumb.name}
                                </span>
                            ) : (
                                <Link
                                    href={breadcrumb.href}
                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                    {breadcrumb.name}
                                </Link>
                            )}
                        </li>
                    ))}
                </ol>
            </div>
        </motion.nav>
    );
};

export default Breadcrumb;