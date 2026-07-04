import { ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';
import type { Product } from '../App';
import { useCurrency } from '../../contexts/CurrencyContext';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { currency } = useCurrency();
  const isOutOfStock = product.stockLabel === 'Out of Stock';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 120 }}
      whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(234,179,8,0.12)" }}
      className="bg-zinc-900 rounded-xl overflow-hidden border border-yellow-500/20 hover:border-yellow-400/60 transition-colors group">

      {product.stockLabel && (
        <div className={`text-xs font-bold px-3 py-1.5 text-center ${
          isOutOfStock
            ? 'bg-red-500/20 text-red-400 border-b border-red-500/30'
            : 'bg-green-500/10 text-green-400 border-b border-green-500/20'
        }`}>
          {product.stockLabel}
        </div>
      )}

      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 opacity-90"
        />
        {product.stock && product.stock < 10 && (
          <div className="absolute top-2 right-2 bg-black text-yellow-400 text-xs px-2 py-1 rounded-full font-semibold border border-yellow-500/50">
            Only {product.stock} left
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-white font-semibold text-lg mb-1">{product.name}</h3>
        <p className="text-yellow-400/60 text-sm mb-4">{product.description}</p>

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-yellow-400">
            {currency === 'USD' && product.priceUsd
              ? `$${product.priceUsd.toLocaleString()}`
              : `৳${product.price.toLocaleString()}`}
          </span>
          <motion.button
            whileHover={isOutOfStock ? {} : { scale: 1.06 }}
            whileTap={isOutOfStock ? {} : { scale: 0.94 }}
            onClick={() => !isOutOfStock && onAddToCart(product)}
            disabled={isOutOfStock}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md font-semibold ${
              isOutOfStock
                ? 'bg-white/10 text-white/30 cursor-not-allowed border border-white/10'
                : 'bg-black hover:bg-yellow-500 text-yellow-400 hover:text-black border border-yellow-500/30 hover:border-yellow-500'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Add
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
