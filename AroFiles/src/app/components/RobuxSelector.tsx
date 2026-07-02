import { useState, useRef, useCallback } from 'react';
import { ShoppingCart, Coins, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLang } from '../../contexts/LanguageContext';
import robuxIcon from '../../imports/ea98f8c6c438d2d8136a6751282a153c6b28b892.png';
import type { Product } from '../App';

interface RobuxSelectorProps {
  onAddToCart: (product: Product) => void;
}

export function RobuxSelector({ onAddToCart }: RobuxSelectorProps) {
  const [robuxAmount, setRobuxAmount] = useState(1000);
  const [showWarning, setShowWarning] = useState(false);
  const { t } = useLang();
  const fillRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const shimmerRef = useRef<HTMLDivElement>(null);

  const getFillPct = (val: number) => ((val - 100) / 4900) * 100;

  const handleSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    const pct = getFillPct(val);
    if (fillRef.current) fillRef.current.style.width = `${pct}%`;
    if (glowRef.current) glowRef.current.style.left = `calc(${pct}% - 10px)`;
    if (shimmerRef.current) {
      shimmerRef.current.style.opacity = '1';
      clearTimeout((shimmerRef.current as any)._t);
      (shimmerRef.current as any)._t = setTimeout(() => {
        if (shimmerRef.current) shimmerRef.current.style.opacity = '0';
      }, 600);
    }
    setRobuxAmount(val);
  }, []);

  const price = Math.round((robuxAmount / 1000) * 850);

  const handleAddToCart = () => {
    if (robuxAmount > 500) {
      setShowWarning(true);
    } else {
      addToCart();
    }
  };

  const addToCart = () => {
    const product: Product = {
      id: `robux-${robuxAmount}-${Date.now()}`,
      name: `${robuxAmount.toLocaleString()} Robux`,
      price,
      description: `Get ${robuxAmount.toLocaleString()} Robux instantly`,
      category: 'ROBUX',
      image: robuxIcon,
    };
    onAddToCart(product);
    setShowWarning(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        className="max-w-3xl mx-auto"
      >
        <div className="bg-black rounded-2xl p-8 border border-yellow-500/40 shadow-2xl shadow-yellow-500/10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full mb-4 shadow-lg shadow-yellow-500/40">
              <Coins className="w-8 h-8 text-black" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">{t.selectRobux}</h2>
            <p className="text-yellow-400/70">{t.selectRobuxSub}</p>
          </div>

          <div className="space-y-8">
            {/* Display Section */}
            <div className="bg-white/5 rounded-xl p-6 border border-yellow-500/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white/60 text-sm mb-1">{t.robuxAmount}</p>
                  <AnimatePresence mode="popLayout">
                    <motion.p
                      key={robuxAmount}
                      initial={{ y: -12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 12, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 22 }}
                      className="text-4xl font-bold text-white"
                    >
                      {robuxAmount.toLocaleString()}
                    </motion.p>
                  </AnimatePresence>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-sm mb-1">{t.price}</p>
                  <AnimatePresence mode="popLayout">
                    <motion.p
                      key={price}
                      initial={{ y: -12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 12, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 22 }}
                      className="text-4xl font-bold text-yellow-400"
                    >
                      ৳{price.toLocaleString()}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
              <div className="bg-yellow-500/10 rounded-lg px-4 py-2 border border-yellow-500/30">
                <p className="text-yellow-300 text-sm text-center">{t.rate}</p>
              </div>
            </div>

            {/* Slider */}
            <div>
              <div className="flex justify-between mb-4">
                <span className="text-white/50 text-sm">100 R$</span>
                <span className="text-white/50 text-sm">5,000 R$</span>
              </div>
              <div className="relative py-3">
                {/* Track background */}
                <div className="h-2 bg-white/10 rounded-full overflow-visible relative">
                  {/* Animated fill */}
                  <div
                    ref={fillRef}
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${getFillPct(robuxAmount)}%`,
                      background: 'linear-gradient(90deg, #facc15, #ca8a04)',
                      boxShadow: '0 0 8px rgba(250,204,21,0.6)',
                    }}
                  />
                  {/* Shimmer flash on drag */}
                  <div
                    ref={shimmerRef}
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      opacity: 0,
                      transition: 'opacity 0.3s',
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmerSlide 0.6s ease forwards',
                    }}
                  />
                </div>

                {/* Glow orb at thumb */}
                <div
                  ref={glowRef}
                  className="absolute top-1/2 pointer-events-none"
                  style={{
                    left: `calc(${getFillPct(robuxAmount)}% - 10px)`,
                    transform: 'translateY(-50%)',
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(250,204,21,0.8) 0%, rgba(250,204,21,0) 70%)',
                    filter: 'blur(4px)',
                  }}
                />

                {/* Native input — invisible but interactive */}
                <input
                  type="range"
                  min={100}
                  max={5000}
                  step={100}
                  value={robuxAmount}
                  onChange={handleSlider}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  style={{ height: '100%' }}
                />

                {/* Custom thumb */}
                <div
                  className="absolute top-1/2 pointer-events-none"
                  style={{
                    left: `calc(${getFillPct(robuxAmount)}% - 10px)`,
                    transform: 'translateY(-50%)',
                  }}
                >
                  {/* Pulse ring */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'rgba(250,204,21,0.3)',
                      animation: 'thumbPulse 1.8s ease-in-out infinite',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                    }}
                  />
                  {/* Thumb dot */}
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #fde68a, #d97706)',
                      border: '2px solid #fff',
                      boxShadow: '0 0 10px rgba(250,204,21,0.9), 0 2px 6px rgba(0,0,0,0.5)',
                    }}
                  />
                </div>
              </div>

              {/* Keyframes injected once */}
              <style>{`
                @keyframes thumbPulse {
                  0%, 100% { transform: scale(1); opacity: 0.4; }
                  50% { transform: scale(1.9); opacity: 0; }
                }
                @keyframes shimmerSlide {
                  0% { background-position: -200% 0; }
                  100% { background-position: 200% 0; }
                }
              `}</style>
            </div>

            {/* Custom Input */}
            <div>
              <label className="text-white/60 text-sm mb-2 block">{t.customAmount}</label>
              <input
                type="number"
                value={robuxAmount}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value >= 100 && value <= 5000) setRobuxAmount(value);
                }}
                className="w-full bg-white/5 border border-yellow-500/30 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30 transition-all"
                min={100}
                max={5000}
                placeholder="Enter Robux amount"
              />
            </div>

            {/* Quick Select */}
            <div className="grid grid-cols-4 gap-3">
              {[500, 1000, 2500, 5000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setRobuxAmount(amount)}
                  className={`py-3 rounded-lg font-semibold transition-all border ${
                    robuxAmount === amount
                      ? 'bg-yellow-500 text-black border-yellow-400 shadow-lg shadow-yellow-500/30'
                      : 'bg-white/5 text-white/70 border-white/10 hover:border-yellow-500/50 hover:text-yellow-400'
                  }`}
                >
                  {amount >= 1000 ? `${amount / 1000}K` : amount}
                </button>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleAddToCart}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-colors shadow-xl shadow-yellow-500/30"
            >
              <ShoppingCart className="w-6 h-6" />
              {t.addToCart} — ৳{price.toLocaleString()}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Warning Modal */}
      <AnimatePresence>
        {showWarning && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              onClick={() => setShowWarning(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50 px-4"
            >
              <div className="bg-zinc-950 border border-yellow-500/40 rounded-2xl shadow-2xl shadow-yellow-500/10 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-yellow-500/20 bg-yellow-500/5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-400 font-bold text-lg">📢 Robux+ Send Requirement</span>
                  </div>
                  <button onClick={() => setShowWarning(false)} className="text-white/40 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto text-sm leading-relaxed">
                  <p className="text-white/80">
                    If you wish to purchase more than <span className="text-yellow-400 font-semibold">500 Robux</span> through the Robux+ Send method, you must enable either <span className="text-yellow-400 font-semibold">Two-Step Verification (2FA)</span> or <span className="text-yellow-400 font-semibold">Enhanced Protection</span> on your Roblox account before the transfer.
                  </p>
                  <p className="text-white/60">
                    This is a Roblox security requirement. Accounts without one of these security features enabled are subject to lower Robux transfer limits and may not be eligible to receive larger Robux+ Send transfers.
                  </p>
                  <p className="text-white/80 font-medium">Before placing your order, please ensure you have:</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2">
                      <span className="text-green-400 mt-0.5">✅</span>
                      <span className="text-white/80">Two-Step Verification (2FA) enabled  <span className="text-white/40">or</span></span>
                    </div>
                    <div className="flex items-start gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2">
                      <span className="text-green-400 mt-0.5">✅</span>
                      <span className="text-white/80">Enhanced Protection enabled</span>
                    </div>
                  </div>
                  <p className="text-white/50 text-xs">
                    Failure to enable one of these features may delay your order or prevent us from completing the transfer. Thank you for your understanding!
                  </p>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-yellow-500/20 flex gap-3">
                  <button
                    onClick={() => setShowWarning(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 py-2.5 rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={addToCart}
                    className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black font-bold py-2.5 rounded-lg transition-colors shadow-lg shadow-yellow-500/20"
                  >
                    I understand, Add to Cart
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
