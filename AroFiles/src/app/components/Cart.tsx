import { useState } from 'react';
import { X, Minus, Plus, Trash2, ShoppingBag, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { projectId } from '/utils/supabase/info';
import type { CartItem } from '../App';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  total: number;
  onCheckoutComplete: () => void;
}

export function Cart({ isOpen, onClose, items, onUpdateQuantity, onRemoveItem, total, onCheckoutComplete }: CartProps) {
  const { user, accessToken } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCheckout = async () => {
    if (!user || !accessToken) {
      setCheckoutMessage({ type: 'error', text: 'Please login to complete your purchase' });
      return;
    }

    if (items.length === 0) {
      setCheckoutMessage({ type: 'error', text: 'Your cart is empty' });
      return;
    }

    setIsProcessing(true);
    setCheckoutMessage(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f343f1a0/transaction`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            items: items.map(item => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity
            })),
            total
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setCheckoutMessage({ type: 'success', text: 'Purchase completed successfully!' });
        setTimeout(() => {
          onCheckoutComplete();
          setCheckoutMessage(null);
          onClose();
        }, 2000);
      } else {
        setCheckoutMessage({ type: 'error', text: data.error || 'Checkout failed' });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutMessage({ type: 'error', text: 'Network error during checkout' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
    {isOpen && (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-black shadow-2xl shadow-yellow-500/10 z-50 flex flex-col border-l border-yellow-500/30">
        <div className="p-6 border-b border-yellow-500/20 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-yellow-400" />
            Shopping Cart
          </h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-yellow-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/40 text-lg">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/5 rounded-lg p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition-colors"
                >
                  <div className="flex gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">{item.name}</h3>
                      <p className="text-yellow-400 text-sm mb-2 font-medium">৳{item.price.toLocaleString()}</p>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="bg-white/10 hover:bg-yellow-500/20 text-white hover:text-yellow-400 w-8 h-8 rounded flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-white w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="bg-white/10 hover:bg-yellow-500/20 text-white hover:text-yellow-400 w-8 h-8 rounded flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="ml-auto text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-yellow-500/20 bg-white/5">
            {checkoutMessage && (
              <div className={`mb-4 p-3 rounded-lg border flex items-center gap-2 ${
                checkoutMessage.type === 'success'
                  ? 'bg-green-500/20 border-green-500/50 text-green-300'
                  : 'bg-red-500/20 border-red-500/50 text-red-300'
              }`}>
                {checkoutMessage.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="text-sm">{checkoutMessage.text}</span>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <span className="text-white/60 text-lg">Total:</span>
              <span className="text-yellow-400 text-2xl font-bold">৳{total.toLocaleString()}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={isProcessing || !user}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black py-3 rounded-lg font-semibold transition-all shadow-lg shadow-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              {isProcessing ? 'Processing...' : user ? 'Checkout' : 'Login to Checkout'}
            </button>
          </div>
        )}
      </motion.div>
    </>
    )}
    </AnimatePresence>
  );
}
