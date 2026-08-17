import { useState, useRef, useEffect } from 'react';
import { ShoppingCart, User, LogIn, ChevronDown, Coins, Gamepad2, Gem } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import logoImg from '../../imports/ChatGPT_Image_Jul_2__2026__02_14_30_AM.png';
import type { Category } from '../App';

const NAV_CATS = [
  { id: 'ROBUX' as Category,             label: 'Robux',     shortLabel: 'Robux',    icon: Coins },
  { id: 'INGAME CURRENCIES' as Category, label: 'In-Game',   shortLabel: 'In-Game',  icon: Gamepad2 },
  { id: 'ACCOUNTS' as Category,          label: 'Accounts',  shortLabel: 'Accounts', icon: User },
  { id: 'LIMITEDS' as Category,          label: 'Limiteds',  shortLabel: 'Limited',  icon: Gem },
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

export function Header({
  cartCount, onCartClick, onLoginClick, onDashboardClick,
  onLogoClick, onAdminOpen, showCategoryBar, activeCategory, onCategoryChange,
}: HeaderProps) {
  const { user } = useAuth();
  const { lang, setLang, t } = useLang();
  const { currency, setCurrency } = useCurrency();
  const [clickCount, setClickCount] = useState(0);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const currencyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node))
        setCurrencyOpen(false);
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
    /* Outer sticky wrapper — pointer-events-none so the transparent gradient doesn't block clicks */
    <div className="sticky top-0 z-50 px-2 sm:px-4 pt-2.5 sm:pt-3 pb-1.5 sm:pb-2 pointer-events-none"
      style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.88) 0%, transparent 100%)' }}
    >
      <header className="max-w-7xl mx-auto pointer-events-auto">
        {/*
          Pill container — NO overflow-hidden so dropdown isn't clipped.
          Instead, rounded-2xl just sets the visual shape; children manage
          their own overflow where needed (mobile tab row uses overflow-x-auto).
        */}
        <div
          className="bg-zinc-950/95 border border-white/[0.07] rounded-2xl shadow-2xl shadow-black/60"
          style={{ backdropFilter: 'blur(20px)' }}
        >

          {/* ── Row 1: Logo · [Desktop nav center] · Controls ── */}
          <div className="px-3 sm:px-5 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 min-w-0">

            {/* Logo */}
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-1.5 sm:gap-2.5 hover:opacity-80 transition-opacity flex-shrink-0 focus:outline-none"
            >
              <img src={logoImg} alt="AroStall"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover shadow-md shadow-yellow-500/30 flex-none"
              />
              <span className="font-bold text-sm sm:text-lg tracking-wide bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent"
                style={{ fontFamily: "'Cinzel', serif" }}
              >AroStall</span>
            </button>

            {/* ── Desktop category tabs (hidden on mobile) ── */}
            <div className="hidden sm:flex flex-1 items-center justify-center gap-0.5">
              {showCategoryBar && NAV_CATS.map(({ id, label, icon: Icon }) => {
                const isActive = activeCategory === id;
                return (
                  <button key={id} onClick={() => onCategoryChange?.(id)}
                    className={`relative flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                      isActive ? 'text-yellow-400' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-none" />
                    {label}
                    {isActive && (
                      <motion.div layoutId="cat-pill"
                        className="absolute inset-0 rounded-xl bg-yellow-500/10 border border-yellow-500/25"
                        style={{ zIndex: -1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                  </button>
                );
              })}
              {!showCategoryBar && <div className="flex-1" />}
            </div>

            {/* Spacer on mobile */}
            <div className="flex-1 sm:hidden" />

            {/* ── Right controls ── */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">

              {/* Currency dropdown */}
              <div ref={currencyRef} className="relative">
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrencyOpen(o => !o)}
                  className="flex items-center gap-1 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] hover:border-yellow-500/30 text-white/70 hover:text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all"
                >
                  <span className="text-yellow-400 font-bold">{selected.sign}</span>
                  <span className="hidden sm:inline text-white/60">{selected.value}</span>
                  <ChevronDown className={`w-3 h-3 text-white/30 transition-transform duration-200 ${currencyOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                {/* Dropdown — rendered via portal-like fixed position to avoid clipping */}
                <AnimatePresence>
                  {currencyOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15, type: 'spring', stiffness: 400, damping: 30 }}
                      className="absolute top-[calc(100%+8px)] right-0 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/80 z-[200] min-w-[180px] overflow-hidden"
                    >
                      {currencies.map(c => (
                        <button key={c.value}
                          onClick={() => { setCurrency(c.value); setCurrencyOpen(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                            currency === c.value ? 'bg-yellow-500/10 text-yellow-400' : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
                          }`}
                        >
                          <span className="text-base font-bold w-5 text-center">{c.sign}</span>
                          <span className="flex-1 text-left">{c.name}</span>
                          {currency === c.value && <span className="text-yellow-400 text-xs">✓</span>}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Language toggle */}
              <div className="flex items-center bg-white/[0.05] border border-white/[0.08] rounded-xl overflow-hidden text-[10px] sm:text-xs font-bold">
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => setLang('en')}
                  className={`px-2 sm:px-2.5 py-1.5 sm:py-2 transition-colors ${lang === 'en' ? 'bg-yellow-500 text-black' : 'text-white/40 hover:text-white'}`}
                >EN</motion.button>
                <div className="w-px h-3.5 bg-white/10" />
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => setLang('bn')}
                  className={`px-2 sm:px-2.5 py-1.5 sm:py-2 transition-colors ${lang === 'bn' ? 'bg-yellow-500 text-black' : 'text-white/40 hover:text-white'}`}
                >বাং</motion.button>
              </div>

              {/* Auth */}
              {user ? (
                <button onClick={onDashboardClick}
                  className="bg-white/[0.05] hover:bg-white/[0.08] text-yellow-400 border border-yellow-500/20 hover:border-yellow-500/40 p-1.5 sm:px-3 sm:py-2 rounded-xl flex items-center gap-2 transition-all text-sm font-semibold"
                >
                  <User className="w-4 h-4 flex-none" />
                  <span className="hidden md:inline truncate max-w-[80px]">{user.name}</span>
                </button>
              ) : (
                <button onClick={onLoginClick}
                  className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-bold p-1.5 sm:px-4 sm:py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-yellow-500/20 text-xs"
                >
                  <LogIn className="w-4 h-4 flex-none" />
                  <span className="hidden sm:inline">{t.login}</span>
                </button>
              )}

              {/* Cart */}
              <button onClick={onCartClick}
                className={`relative bg-white/[0.05] hover:bg-white/[0.08] text-white border p-1.5 sm:px-3 sm:py-2 rounded-xl flex items-center gap-1.5 transition-all text-xs font-semibold ${
                  cartCount > 0 ? 'border-yellow-500/30 shadow-sm shadow-yellow-500/10' : 'border-white/[0.08] hover:border-yellow-500/30'
                }`}
              >
                <ShoppingCart className="w-4 h-4 flex-none" />
                <span className="hidden sm:inline">{t.cart}</span>
                {cartCount > 0 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 bg-yellow-500 text-black text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center"
                  >{cartCount}</motion.span>
                )}
              </button>
            </div>
          </div>

          {/* ── Row 2: Category tabs — MOBILE ONLY ── */}
          {showCategoryBar && (
            <div className="sm:hidden border-t border-white/[0.05]">
              <div className="flex">
                {NAV_CATS.map(({ id, shortLabel, icon: Icon }) => {
                  const isActive = activeCategory === id;
                  return (
                    <button key={id} onClick={() => onCategoryChange?.(id)}
                      className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${
                        isActive ? 'text-yellow-400' : 'text-white/30'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 flex-none" />
                      <span>{shortLabel}</span>
                      {isActive && (
                        <motion.div layoutId="mobile-cat-line"
                          className="absolute bottom-0 left-3 right-3 h-0.5 bg-yellow-400 rounded-full"
                          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </header>
    </div>
  );
}
