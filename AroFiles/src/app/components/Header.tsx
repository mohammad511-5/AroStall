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
  const clickResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    if (next >= 3) { onAdminOpen?.(); setClickCount(0); if (clickResetRef.current) clearTimeout(clickResetRef.current); return; }
    if (clickResetRef.current) clearTimeout(clickResetRef.current);
    clickResetRef.current = setTimeout(() => setClickCount(0), 1500);
  };

  return (
    <div className="sticky top-0 z-50 px-2 sm:px-4 pt-2.5 sm:pt-3 pb-1.5 sm:pb-2 pointer-events-none"
      style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.92) 0%, transparent 100%)' }}
    >
      <header className="max-w-7xl mx-auto pointer-events-auto">
        <div
          className="bg-zinc-950/95 border border-white/[0.07] rounded-2xl shadow-2xl shadow-black/70"
          style={{ backdropFilter: 'blur(24px)' }}
        >

          {/* ── Row 1: Logo · Nav · Controls ── */}
          <div className="px-3 sm:px-5 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4 min-w-0">

            {/* Logo */}
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-2 sm:gap-2.5 hover:opacity-85 transition-opacity flex-shrink-0 focus:outline-none group"
            >
              <div className="relative flex-none">
                <img src={logoImg} alt="AroStall"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover shadow-lg shadow-yellow-500/25"
                />
                <div className="absolute inset-0 rounded-xl ring-1 ring-yellow-500/20 group-hover:ring-yellow-500/40 transition-all" />
              </div>
              {/* "Aro" golden · "Stall" white */}
              <span
                className="font-black tracking-tight text-sm sm:text-[17px] leading-none select-none"
                style={{ fontFamily: "'Cinzel', serif", letterSpacing: '-0.01em' }}
              >
                <span className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">Aro</span><span className="text-white/90">Stall</span>
              </span>
            </button>

            {/* ── Desktop nav tabs ── */}
            <div className="hidden sm:flex flex-1 items-center justify-center gap-0.5">
              {showCategoryBar && NAV_CATS.map(({ id, label, icon: Icon }) => {
                const isActive = activeCategory === id;
                return (
                  <button key={id} onClick={() => onCategoryChange?.(id)}
                    className={`relative flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                      isActive ? 'text-yellow-400' : 'text-white/35 hover:text-white/65 hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-none" />
                    {label}
                    {isActive && (
                      <motion.div layoutId="cat-pill"
                        className="absolute inset-0 rounded-xl bg-yellow-500/10 border border-yellow-500/20"
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
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">

              {/* Currency dropdown */}
              <div ref={currencyRef} className="relative">
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setCurrencyOpen(o => !o)}
                  className={`flex items-center gap-1 sm:gap-1.5 h-8 sm:h-9 px-2 sm:px-3 rounded-xl border text-xs font-bold transition-all ${
                    currencyOpen
                      ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300'
                      : 'bg-white/[0.04] border-white/[0.08] text-white/55 hover:bg-white/[0.07] hover:border-white/[0.14] hover:text-white/80'
                  }`}
                >
                  <span className={`font-black text-sm ${currencyOpen ? 'text-yellow-300' : 'text-yellow-400/80'}`}>
                    {selected.sign}
                  </span>
                  <span className="hidden sm:inline tracking-wide">{selected.value}</span>
                  <ChevronDown className={`w-3 h-3 opacity-50 transition-transform duration-200 ${currencyOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {currencyOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      transition={{ duration: 0.14, type: 'spring', stiffness: 420, damping: 30 }}
                      className="absolute top-[calc(100%+6px)] right-0 bg-zinc-950 border border-white/[0.09] rounded-2xl shadow-2xl shadow-black/80 z-[200] min-w-[190px] overflow-hidden"
                    >
                      {currencies.map(c => (
                        <button key={c.value}
                          onClick={() => { setCurrency(c.value); setCurrencyOpen(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${
                            currency === c.value
                              ? 'bg-yellow-500/10 text-yellow-300'
                              : 'text-white/50 hover:bg-white/[0.05] hover:text-white'
                          }`}
                        >
                          <span className={`text-base font-black w-5 text-center ${currency === c.value ? 'text-yellow-400' : 'text-white/40'}`}>{c.sign}</span>
                          <span className="flex-1 text-left text-xs font-medium">{c.name}</span>
                          {currency === c.value && (
                            <span className="w-4 h-4 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                            </span>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Language toggle */}
              <div className="flex items-center h-8 sm:h-9 bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
                <motion.button whileTap={{ scale: 0.92 }}
                  onClick={() => setLang('en')}
                  className={`h-full px-2 sm:px-2.5 text-[10px] sm:text-[11px] font-black tracking-wider transition-all ${
                    lang === 'en'
                      ? 'bg-gradient-to-b from-yellow-400 to-amber-500 text-black shadow-inner'
                      : 'text-white/30 hover:text-white/55'
                  }`}
                >EN</motion.button>
                <div className="w-px h-4 bg-white/[0.08]" />
                <motion.button whileTap={{ scale: 0.92 }}
                  onClick={() => setLang('bn')}
                  className={`h-full px-2 sm:px-2.5 text-[10px] sm:text-[11px] font-black transition-all ${
                    lang === 'bn'
                      ? 'bg-gradient-to-b from-yellow-400 to-amber-500 text-black shadow-inner'
                      : 'text-white/30 hover:text-white/55'
                  }`}
                >বাং</motion.button>
              </div>

              {/* Auth button */}
              {user ? (
                <motion.button whileTap={{ scale: 0.94 }} onClick={onDashboardClick}
                  className="flex items-center gap-1.5 h-8 sm:h-9 px-2 sm:px-3 rounded-xl border border-yellow-500/20 bg-yellow-500/[0.06] hover:bg-yellow-500/[0.12] hover:border-yellow-500/35 text-yellow-400 transition-all text-xs font-semibold"
                >
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center flex-none">
                    <User className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </div>
                  <span className="hidden md:inline truncate max-w-[72px] text-yellow-300/90 font-semibold">{user.name}</span>
                </motion.button>
              ) : (
                <motion.button whileTap={{ scale: 0.94 }} onClick={onLoginClick}
                  className="flex items-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-4 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-bold text-[11px] sm:text-xs shadow-md shadow-yellow-500/25 hover:shadow-yellow-500/40 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5 flex-none" />
                  <span className="hidden sm:inline tracking-wide">{t.login}</span>
                </motion.button>
              )}

              {/* Cart button */}
              <motion.button whileTap={{ scale: 0.94 }} onClick={onCartClick}
                className={`relative flex items-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-xl border text-xs font-semibold transition-all ${
                  cartCount > 0
                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/15 shadow-sm shadow-yellow-500/10'
                    : 'bg-white/[0.04] border-white/[0.08] text-white/45 hover:bg-white/[0.07] hover:border-white/[0.14] hover:text-white/70'
                }`}
              >
                <ShoppingCart className={`w-3.5 h-3.5 flex-none transition-colors ${cartCount > 0 ? 'text-yellow-400' : ''}`} />
                <span className="hidden sm:inline tracking-wide">{t.cart}</span>
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-gradient-to-br from-yellow-400 to-amber-500 text-black text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-md shadow-yellow-500/40"
                  >{cartCount}</motion.span>
                )}
              </motion.button>

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
                      className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold transition-colors ${
                        isActive ? 'text-yellow-400' : 'text-white/25 hover:text-white/50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 flex-none" />
                      <span>{shortLabel}</span>
                      {isActive && (
                        <motion.div layoutId="mobile-cat-line"
                          className="absolute bottom-0 left-4 right-4 h-[2px] bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"
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
