import { useState, useRef, useEffect } from 'react';
import { ShoppingCart, User, LogIn, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import logoImg from '../../imports/ChatGPT_Image_Jul_2__2026__02_14_30_AM.png';

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
  onLoginClick: () => void;
  onDashboardClick: () => void;
  onLogoClick?: () => void;
  onAdminOpen?: () => void;
}

export function Header({ cartCount, onCartClick, onLoginClick, onDashboardClick, onLogoClick, onAdminOpen }: HeaderProps) {
  const { user } = useAuth();
  const { lang, setLang, t } = useLang();
  const { currency, setCurrency } = useCurrency();
  const [clickCount, setClickCount] = useState(0);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const currencyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handler = (e: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setCurrencyOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currencies = [
    { value: 'BDT' as const, sign: '৳', name: 'Bangladeshi Taka' },
    { value: 'USD' as const, sign: '$', name: 'US Dollar' },
  ];
  const selected = currencies.find(c => c.value === currency) ?? currencies[0];

  const ADMIN_EMAILS = ['huzip2@gmail.com', 'Ritoshi887@gmail.com'];
  const isAdmin = !!user && ADMIN_EMAILS.some(e => e.toLowerCase() === user.email?.toLowerCase());

  return (
    <header className="bg-gradient-to-r from-zinc-950 via-black to-zinc-950 border-b border-yellow-500/40 sticky top-0 z-50 shadow-2xl shadow-yellow-500/5 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">

        <button
          onClick={() => {
            onLogoClick?.();
            if (!isAdmin) return;
            const next = clickCount + 1;
            setClickCount(next);
            if (next >= 3) { onAdminOpen?.(); setClickCount(0); }
            setTimeout(() => setClickCount(0), 1500);
          }}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-shrink-0"
        >
          <img
            src={logoImg}
            alt="AroStall"
            className="w-10 h-10 rounded-lg object-cover shadow-md shadow-yellow-500/40"
          />
          <span className="font-bold text-xl tracking-wide bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 bg-clip-text text-transparent" style={{ fontFamily: "'Cinzel', serif" }}>AroStall</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">

          {/* Currency dropdown */}
          <div ref={currencyRef} className="relative">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrencyOpen(o => !o)}
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-yellow-500/40 text-white/80 hover:text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
            >
              <span className="text-yellow-400">{selected.sign}</span>
              <span>{selected.value}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform ${currencyOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
              {currencyOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-1.5 right-0 bg-zinc-900 border border-yellow-500/20 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 min-w-[160px]"
                >
                  {currencies.map(c => (
                    <button
                      key={c.value}
                      onClick={() => { setCurrency(c.value); setCurrencyOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        currency === c.value
                          ? 'bg-yellow-500/10 text-yellow-400'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="text-base font-bold w-5 text-center">{c.sign}</span>
                      <span>{c.name}</span>
                      {currency === c.value && <span className="ml-auto text-yellow-400 text-xs">✓</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Language toggle */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg overflow-hidden text-sm font-semibold">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 transition-colors ${lang === 'en' ? 'bg-yellow-500 text-black' : 'text-white/50 hover:text-white'}`}
            >
              EN
            </motion.button>
            <div className="w-px h-5 bg-white/10" />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setLang('bn')}
              className={`px-3 py-1.5 transition-colors ${lang === 'bn' ? 'bg-yellow-500 text-black' : 'text-white/50 hover:text-white'}`}
            >
              বাং
            </motion.button>
          </div>

          {user ? (
            <button
              onClick={onDashboardClick}
              className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 hover:border-yellow-400 px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md shadow-yellow-500/10"
            >
              <User className="w-5 h-5" />
              <span className="hidden sm:inline">{user.name}</span>
            </button>
          ) : (
            <button
              onClick={onLoginClick}
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-yellow-500/20 text-sm"
            >
              <LogIn className="w-5 h-5" />
              <span className="hidden sm:inline">{t.login}</span>
            </button>
          )}

          <button
            onClick={onCartClick}
            className={`relative bg-white/5 hover:bg-white/10 text-white border px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${cartCount > 0 ? 'border-yellow-500/40 shadow-md shadow-yellow-500/10' : 'border-white/10 hover:border-yellow-500/50'}`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:inline">{t.cart}</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
