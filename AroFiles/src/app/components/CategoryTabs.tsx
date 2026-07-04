import { motion } from 'motion/react';
import type { Category } from '../App';

interface CategoryTabsProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
}

const categories: Category[] = ['ROBUX', 'INGAME CURRENCIES', 'ACCOUNTS', 'LIMITEDS'];

export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-wrap gap-2 mb-8 justify-center p-1"
    >
      {categories.map((category) => (
        <motion.button
          key={category}
          onClick={() => onCategoryChange(category)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 border ${
            activeCategory === category
              ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black border-transparent shadow-lg shadow-yellow-500/30 font-black'
              : 'bg-zinc-900 text-white/50 border-zinc-800 hover:border-yellow-500/40 hover:text-yellow-400 hover:bg-zinc-800'
          }`}
        >
          {category}
        </motion.button>
      ))}
    </motion.div>
  );
}
