import { useCategoryStatus } from '@/contextApi/categoryStatus';
import React from 'react'

interface CategoryBtnProps {
    category: string;
    index: number;
    chooseCategory: (category: string) => void;
}


function CategoryBtn({ category, index, chooseCategory }: CategoryBtnProps) {
        const { category: selectedCategory } = useCategoryStatus();
    return (
        <div>
            <button
                key={index}
                       className={`w-32 flex-shrink-0 whitespace-nowrap  justify-center 
            items-center text-black dark:text-white text-neutral-700
            mt-2  mb-2 space-x-2 
            p-3  rounded-full ${selectedCategory.trim().toLowerCase() === category.trim().toLowerCase() ?"bg-blue-200 dark:bg-blue-800" :"bg-gray-100 dark:bg-gray-800"}   mr-4`}
                onClick={() => chooseCategory(category)}
            >
                {category}
            </button>
        </div>
    )
}

export default CategoryBtn;