import React from 'react';
import { useAppContext } from '../context/AppContext';

export default function CategoryBar({ activeCategory, setActiveCategory }) {
  const { categories } = useAppContext();

  return (
    <div className="w-full overflow-x-auto py-4 scrollbar-hide border-b border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === category
                ? 'bg-primary text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
