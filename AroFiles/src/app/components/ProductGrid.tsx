import { motion } from 'motion/react';
import { SearchX } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { useLang } from '../../contexts/LanguageContext';
import type { Product } from '../App';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  searchQuery?: string;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, type: 'spring', stiffness: 130, damping: 18 } },
};

export function ProductGrid({ products, onAddToCart, searchQuery }: ProductGridProps) {
  const { t } = useLang();

  if (products.length === 0 && searchQuery) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-28 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-5">
          <SearchX className="w-7 h-7 text-white/25" />
        </div>
        <p className="text-white/50 font-semibold text-base mb-1.5">No results for "{searchQuery}"</p>
        <p className="text-white/25 text-sm">Try a different search term</p>
      </motion.div>
    );
  }

  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center py-28"
      >
        <motion.p
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 160 }}
          className="text-5xl sm:text-6xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {t.comingSoon}
        </motion.p>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="h-px w-32 bg-gradient-to-r from-transparent via-yellow-500/60 to-transparent mt-5"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/25 text-sm mt-4 tracking-wide"
        >
          This category is being stocked up
        </motion.p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5"
    >
      {products.map((product) => (
        <motion.div key={product.id} variants={item}>
          <ProductCard product={product} onAddToCart={onAddToCart} />
        </motion.div>
      ))}
    </motion.div>
  );
}
