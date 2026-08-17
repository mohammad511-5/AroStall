import { motion } from 'motion/react';
import { Coins, Gamepad2, User, Gem } from 'lucide-react';
import type { Category } from '../App';

interface CategoryTabsProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
}

const categories = [
  { id: 'ROBUX' as Category, label: 'Robux', icon: Coins },
  { id: 'INGAME CURRENCIES' as Category, label: 'In-Game', icon: Gamepad2 },
  { id: 'ACCOUNTS' as Category, label: 'Accounts', icon: User },
  { id: 'LIMITEDS' as Category, label: 'Limiteds', icon: Gem },
];

export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      {categories.map(({ id, label, icon: Icon }) => {
        const isActive = activeCategory === id;
        return (
          <motion.button
            key={id}
            onClick={() => onCategoryChange(id)}
            whileHover={{ scale: isActive ? 1 : 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 px-2 sm:px-5 py-3 sm:py-3.5 rounded-2xl transition-all duration-200 border relative overflow-hidden ${
              isActive
                ? 'bg-gradient-to-br from-yellow-500/20 to-amber-600/10 border-yellow-500/40 shadow-md shadow-yellow-500/10'
                : 'bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.05] hover:border-yellow-500/20'
            }`}
          >
            {/* Active background pulse */}
            {isActive && (
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent pointer-events-none" />
            )}

            <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl transition-all flex-none ${
              isActive
                ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-sm shadow-yellow-500/40'
                : 'bg-white/[0.06]'
            }`}>
              <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${isActive ? 'text-black' : 'text-white/40'}`} />
            </div>

            <span className={`text-[10px] sm:text-sm font-bold tracking-wide leading-none transition-colors ${
              isActive ? 'text-yellow-400' : 'text-white/40'
            }`}>
              {label}
            </span>

            {/* Active indicator dot */}
            {isActive && (
              <div className="hidden sm:block absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-yellow-400" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
