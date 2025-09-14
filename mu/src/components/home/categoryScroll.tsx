import React, { useRef, useState, useEffect } from 'react'
import CategoryBtn from './categoryBtn';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useCategoryStatus } from '@/contextApi/categoryStatus';

interface CategoryScrollProps {
    onChooseCategory: (category: string) => void;
}

function CategoryScroll({ onChooseCategory }: CategoryScrollProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isAtStart, setIsAtStart] = useState(true);
    const [isAtEnd, setIsAtEnd] = useState(false);
    const { toggleCategory } = useCategoryStatus();
    const catergories = ["All", "Favourite", "Rap", "Old Vibes", "Classic", "LK", "Free Style", "Memory Lane"];

    // Handle category click
    const chooseCategory = (category: string) => {
        onChooseCategory(category);
        toggleCategory(category);
    }

    const updateScrollState = () => {
        const el = scrollRef.current;
        if (!el) return;
        setIsAtStart(el.scrollLeft <= 0);
        setIsAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
    };

    const scrollLeft = () => {
        scrollRef.current?.scrollBy({ left: -150, behavior: "smooth" });
    };

    const scrollRight = () => {
        scrollRef.current?.scrollBy({ left: 150, behavior: "smooth" });
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        updateScrollState();
        el.addEventListener('scroll', updateScrollState, { passive: true });
        window.addEventListener('resize', updateScrollState);
        return () => {
            el.removeEventListener('scroll', updateScrollState);
            window.removeEventListener('resize', updateScrollState);
        };
    }, []);

    return (
        <div className='w-auto h-auto flex overflow-x-auto  py-4  scrollbar-hide'>
            <div className="relative  w-full py-4  px-12 ">
                <button
                    className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-auto justify-center 
            items-center text-black dark:text-white text-neutral-700
             mb-2 
            p-3  rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 ${isAtStart ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={!isAtStart ? scrollLeft : undefined}
                    disabled={isAtStart}
                >
                    <FontAwesomeIcon
                        icon={faChevronLeft}
                        className={`w-4 h-4 text-black dark:text-white`}
                    />
                </button>
                <div className='flex overflow-x-auto scrollbar-hide space-x-2'
                    ref={scrollRef}
                >
                    {catergories.map((category, index) => (
                        <CategoryBtn key={index} category={category} index={index} chooseCategory={chooseCategory} />
                    ))}
                </div>
                <button
                    className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-auto justify-center 
            items-center text-black dark:text-white text-neutral-700
              mb-2 
            p-3  rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 ${isAtEnd ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={!isAtEnd ? scrollRight : undefined}
                    disabled={isAtEnd}
                >
                    <FontAwesomeIcon
                        icon={faChevronRight}
                        className={`w-4 h-4 text-black dark:text-white`}
                    />
                </button>
            </div>
        </div>
    )
}

export default CategoryScroll;