import { ShoppingCart, Package } from 'lucide-react';
import { motion } from 'motion/react';
import type { Product } from '../App';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 120 }}
      whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(234,179,8,0.12)" }}
      className="bg-zinc-900 rounded-xl overflow-hidden border border-yellow-500/20 hover:border-yellow-400/60 transition-colors group">
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
          <span className="text-2xl font-bold text-yellow-400">৳{product.price.toLocaleString()}</span>
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => onAddToCart(product)}
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-md shadow-yellow-500/20 font-semibold"
          >
            <ShoppingCart className="w-4 h-4" />
            Add
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
