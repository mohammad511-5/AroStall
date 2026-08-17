import { ShoppingCart, Package } from 'lucide-react';
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

  const displayPrice = currency === 'USD' && product.priceUsd
    ? `$${product.priceUsd.toLocaleString()}`
    : `৳${product.price.toLocaleString()}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, type: 'spring', stiffness: 140 }}
      whileHover={{ y: -5, transition: { type: 'spring', stiffness: 400, damping: 24 } }}
      className="group relative bg-zinc-900/50 rounded-2xl overflow-hidden border border-white/[0.07] hover:border-yellow-500/25 transition-colors duration-300"
      style={{ backdropFilter: 'blur(4px)' }}
    >
      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.06) 0%, transparent 70%)',
      }} />

      {/* Image */}
      <div className="relative h-32 sm:h-44 overflow-hidden bg-zinc-900">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
        />
        {/* Bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-transparent to-transparent" />

        {/* Stock badge */}
        {product.stockLabel && (
          <div className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full leading-none ${
            isOutOfStock
              ? 'bg-red-500/85 text-white'
              : 'bg-emerald-500/85 text-white'
          }`} style={{ backdropFilter: 'blur(6px)' }}>
            {product.stockLabel}
          </div>
        )}

        {/* Low stock warning (for items without stockLabel) */}
        {product.stock && product.stock < 10 && !product.stockLabel && (
          <div className="absolute top-3 right-3 bg-black/60 text-yellow-400 text-xs px-2 py-1 rounded-full font-medium border border-yellow-500/30 flex items-center gap-1" style={{ backdropFilter: 'blur(6px)' }}>
            <Package className="w-3 h-3" />
            {product.stock} left
          </div>
        )}

        {/* Subcategory chip */}
        {product.subcategory && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-yellow-400/70 text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide border border-yellow-500/20" style={{ backdropFilter: 'blur(6px)' }}>
            {product.subcategory}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        <h3 className="text-white/90 font-semibold text-xs sm:text-sm leading-snug mb-0.5 sm:mb-1 line-clamp-2 group-hover:text-white transition-colors">
          {product.name}
        </h3>
        <p className="text-white/30 text-[10px] sm:text-xs mb-3 sm:mb-4 line-clamp-1">{product.description}</p>

        <div className="flex items-center justify-between gap-1 sm:gap-2">
          <div className="min-w-0">
            <span className="text-yellow-400 font-bold text-sm sm:text-lg leading-none">{displayPrice}</span>
            {currency === 'BDT' && product.priceUsd && (
              <span className="text-white/25 text-[10px] sm:text-[11px] ml-1 hidden sm:inline">${product.priceUsd}</span>
            )}
          </div>

          <motion.button
            whileHover={isOutOfStock ? {} : { scale: 1.06 }}
            whileTap={isOutOfStock ? {} : { scale: 0.94 }}
            onClick={() => !isOutOfStock && onAddToCart(product)}
            disabled={isOutOfStock}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all duration-200 flex-none ${
              isOutOfStock
                ? 'bg-white/[0.04] text-white/20 cursor-not-allowed'
                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 hover:bg-yellow-500 hover:text-black hover:border-yellow-500 hover:shadow-md hover:shadow-yellow-500/20'
            }`}
          >
            <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">{isOutOfStock ? 'Sold Out' : 'Add'}</span>
            <span className="sm:hidden">{isOutOfStock ? 'Out' : 'Add'}</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
