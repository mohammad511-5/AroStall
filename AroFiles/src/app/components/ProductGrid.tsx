import { motion } from 'motion/react';
import { ProductCard } from './ProductCard';
import { useLang } from '../../contexts/LanguageContext';
import type { Product } from '../App';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  category?: string;
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  const { t } = useLang();
  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center py-32"
      >
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 150 }}
          className="text-6xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {t.comingSoon}
        </motion.p>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="h-0.5 w-48 bg-gradient-to-r from-yellow-400 to-yellow-600 mt-4 rounded-full"
        />
      </motion.div>
    );
  }

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
  };

  const item = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, type: "spring", stiffness: 110 } },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      {products.map((product) => (
        <motion.div key={product.id} variants={item}>
          <ProductCard product={product} onAddToCart={onAddToCart} />
        </motion.div>
      ))}
    </motion.div>
  );
}
