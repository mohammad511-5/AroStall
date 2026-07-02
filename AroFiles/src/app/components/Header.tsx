import { useState } from 'react';
import { ShoppingCart, User, LogIn } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LanguageContext';
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
  const [clickCount, setClickCount] = useState(0);

  return (
    <header className="bg-black border-b-2 border-yellow-500 sticky top-0 z-50 shadow-lg shadow-yellow-500/10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">

        <button
          onClick={() => {
            onLogoClick?.();
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
          <span className="text-white font-bold text-xl tracking-wide" style={{ fontFamily: "'Cinzel', serif" }}>AroStall</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">

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
              className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:border-yellow-400 px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
            >
              <User className="w-5 h-5" />
              <span className="hidden sm:inline">{user.name}</span>
            </button>
          ) : (
            <button
              onClick={onLoginClick}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md shadow-yellow-500/30"
            >
              <LogIn className="w-5 h-5" />
              <span className="hidden sm:inline">{t.login}</span>
            </button>
          )}

          <button
            onClick={onCartClick}
            className="relative bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-yellow-500/50 px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
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
