import React from 'react';
import { Roboto } from 'next/font/google';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

const roboto = Roboto({ subsets: ['latin'], weight: ['400', '500', '700'] });

function LoginFooter() {
    const router = useRouter();
    const currentYear = new Date().getFullYear();

    const handleLegalClick = () => {
        router.push('/legal');
    };

    return (
        <motion.footer
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative bg-slate-900/40 dark:bg-slate-980/40 backdrop-blur-xl mt-auto"
        >
            <div className="mx-4 px-3 lg:mx-16 lg:px-6 py-2">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="pt-2 pb-2"
                >
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <p className={`${roboto.className} text-xs text-gray-800 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-400`}
                            onClick={() => window.open('https://nowenkottage.com', '_blank', 'noopener,noreferrer')}
                        >
                            © {currentYear} NowenKottage
                        </p>

                        <div className="flex items-center space-x-6">
                            <span className={`${roboto.className} text-xs text-gray-800 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-400`}
                                onClick={handleLegalClick}
                            >
                                Term & Conditions
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.footer>
    );
}

export default LoginFooter;