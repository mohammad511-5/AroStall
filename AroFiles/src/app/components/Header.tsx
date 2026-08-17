import { useState, useRef, useEffect } from 'react';
import { ShoppingCart, User, LogIn, ChevronDown, Coins, Gamepad2, Gem } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import logoImg from '../../imports/ChatGPT_Image_Jul_2__2026__02_14_30_AM.png';
import type { Category } from '../App';

const NAV_CATS = [
  { id: 'ROBUX' as Category, label: 'Robux', icon: Coins },
  { id: 'INGAME CURRENCIES' as Category, label: 'In-Game', icon: Gamepad2 },
  { id: 'ACCOUNTS' as Category, label: 'Accounts', icon: User },
  { id: 'LIMITEDS' as Category, label: 'Limiteds', icon: Gem },
];

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
  onLoginClick: () => void;
  onDashboardClick: () => void;
  onLogoClick?: () => void;
  onAdminOpen?: () => void;
  showCategoryBar?: boolean;
  activeCategory?: Category;
  onCategoryChange?: (cat: Category) => void;
}

export function Header({ cartCount, onCartClick, onLoginClick, onDashboardClick, onLogoClick, onAdminOpen, showCategoryBar, activeCategory, onCategoryChange }: HeaderProps) {
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

  const handleLogoClick = () => {
    onLogoClick?.();
    if (!isAdmin) return;
    const next = clickCount + 1;
    setClickCount(next);
    if (next >= 3) { onAdminOpen?.(); setClickCount(0); }
    setTimeout(() => setClickCount(0), 1500);
  };

  return (
    <div className="sticky top-0 z-50 px-3 sm:px-5 pt-3 pb-2 bg-gradient-to-b from-black/90 to-transparent backdrop-blur-none pointer-events-none">
      <header className="max-w-7xl mx-auto pointer-events-auto">
        <div className="bg-zinc-950/95 border border-white/[0.07] rounded-2xl shadow-2xl shadow-black/60" style={{ backdropFilter: 'blur(20px)' }}>
        <div className="px-4 sm:px-5 py-3 flex items-center gap-3">

          {/* Logo */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity flex-shrink-0 focus:outline-none"
          >
            <img
              src={logoImg}
              alt="AroStall"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover shadow-md shadow-yellow-500/30 flex-none"
            />
            <span
              className="font-bold text-lg sm:text-xl tracking-wide bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent hidden sm:block"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              AroStall
            </span>
          </button>

          {/* Category tabs — center fill */}
          <div className="flex-1 flex items-center justify-center gap-0.5 sm:gap-1">
            {showCategoryBar ? NAV_CATS.map(({ id, label, icon: Icon }) => {
              const isActive = activeCategory === id;
              return (
                <button
                  key={id}
                  onClick={() => onCategoryChange?.(id)}
                  className={`relative flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-yellow-500/15 text-yellow-400'
                      : 'text-white/35 hover:text-white/65 hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-none" />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{label.split(' ')[0]}</span>
                  {isActive && (
                    <motion.div
                      layoutId="cat-pill"
                      className="absolute inset-0 rounded-xl bg-yellow-500/10 border border-yellow-500/25"
                      style={{ zIndex: -1 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            }) : null}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">

            {/* Currency dropdown */}
            <div ref={currencyRef} className="relative">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrencyOpen(o => !o)}
                className="flex items-center gap-1 sm:gap-1.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] hover:border-yellow-500/30 text-white/70 hover:text-white px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all"
              >
                <span className="text-yellow-400 font-bold">{selected.sign}</span>
                <span className="hidden sm:inline">{selected.value}</span>
                <ChevronDown className={`w-3 h-3 text-white/30 transition-transform ${currencyOpen ? 'rotate-180' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {currencyOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.14 }}
                    className="absolute top-full mt-2 right-0 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50 min-w-[170px]"
                  >
                    {currencies.map(c => (
                      <button
                        key={c.value}
                        onClick={() => { setCurrency(c.value); setCurrencyOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                          currency === c.value
                            ? 'bg-yellow-500/10 text-yellow-400'
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
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
            <div className="flex items-center bg-white/[0.05] border border-white/[0.08] rounded-xl overflow-hidden text-xs font-bold">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setLang('en')}
                className={`px-2.5 sm:px-3 py-2 transition-colors ${lang === 'en' ? 'bg-yellow-500 text-black' : 'text-white/40 hover:text-white'}`}
              >
                EN
              </motion.button>
              <div className="w-px h-4 bg-white/10" />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setLang('bn')}
                className={`px-2.5 sm:px-3 py-2 transition-colors ${lang === 'bn' ? 'bg-yellow-500 text-black' : 'text-white/40 hover:text-white'}`}
              >
                বাং
              </motion.button>
            </div>

            {/* Auth / Dashboard */}
            {user ? (
              <button
                onClick={onDashboardClick}
                className="bg-white/[0.05] hover:bg-white/[0.08] text-yellow-400 border border-yellow-500/20 hover:border-yellow-500/40 px-3 sm:px-4 py-2 rounded-xl flex items-center gap-2 transition-all text-sm font-semibold"
              >
                <User className="w-4 h-4 flex-none" />
                <span className="hidden md:inline truncate max-w-[100px]">{user.name}</span>
              </button>
            ) : (
              <button
                onClick={onLoginClick}
                className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-bold px-3 sm:px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-yellow-500/20 text-xs sm:text-sm"
              >
                <LogIn className="w-4 h-4 flex-none" />
                <span className="hidden sm:inline">{t.login}</span>
              </button>
            )}

            {/* Cart */}
            <button
              onClick={onCartClick}
              className={`relative bg-white/[0.05] hover:bg-white/[0.08] text-white border px-3 sm:px-4 py-2 rounded-xl flex items-center gap-1.5 sm:gap-2 transition-all text-xs sm:text-sm font-semibold ${
                cartCount > 0 ? 'border-yellow-500/30 shadow-sm shadow-yellow-500/10' : 'border-white/[0.08] hover:border-yellow-500/30'
              }`}
            >
              <ShoppingCart className="w-4 h-4 flex-none" />
              <span className="hidden sm:inline">{t.cart}</span>
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center"
                >
                  {cartCount}
                </motion.span>
              )}
            </button>
          </div>
        </div>

        </div>
      </header>
    </div>
  );
}
