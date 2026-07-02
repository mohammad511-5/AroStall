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
      className="flex flex-wrap gap-2 mb-8 justify-center"
    >
      {categories.map((category) => (
        <motion.button
          key={category}
          onClick={() => onCategoryChange(category)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors border relative ${
            activeCategory === category
              ? 'bg-black text-yellow-400 border-yellow-500 shadow-lg shadow-yellow-500/20'
              : 'bg-zinc-800 text-white/70 border-zinc-700 hover:border-yellow-500/50 hover:text-yellow-400'
          }`}
        >
          {activeCategory === category && (
            <motion.span
              layoutId="tab-indicator"
              className="absolute inset-0 rounded-lg bg-black border border-yellow-500"
              style={{ zIndex: -1 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          {category}
        </motion.button>
      ))}
    </motion.div>
  );
}
