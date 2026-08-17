import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import logoImg from '../imports/ChatGPT_Image_Jul_2__2026__02_14_30_AM.png';
import ogImg from '../imports/ChatGPT_Image_Jul_3__2026__12_30_52_AM.png';
import { AuthProvider } from '../contexts/AuthContext';
import { LanguageProvider, useLang } from '../contexts/LanguageContext';
import { CurrencyProvider } from '../contexts/CurrencyContext';
import { SettingsProvider, useSettings } from '../contexts/SettingsContext';
import { Header } from './components/Header';
import { ProductGrid } from './components/ProductGrid';
import { Cart } from './components/Cart';
import { RobuxSelector } from './components/RobuxSelector';
import { AuthModal } from './components/AuthModal';
import { UserDashboard } from './components/UserDashboard';
import { AdminPanel } from './components/AdminPanel';
import { ArrowRight, Shield, Users, Zap, Star, Search, X, SlidersHorizontal, ArrowUpDown, Check, Coins, Gem, Gamepad2, TrendingUp, Lock, Clock, BadgeCheck } from 'lucide-react';
import { ChatWidget } from './components/ChatWidget';
import { Footer } from './components/Footer';
import { motion, AnimatePresence } from 'motion/react';

export type Category = 'ROBUX' | 'INGAME CURRENCIES' | 'ACCOUNTS' | 'LIMITEDS';

export const LIMITED_SUBCATEGORIES = ['All', 'Hats', 'Faces', 'Hair', 'Neck', 'Shoulder', 'Back'] as const;
export type LimitedSubcategory = typeof LIMITED_SUBCATEGORIES[number];

export const INGAME_SUBCATEGORIES = ['All', 'Fisch', 'Murder Mystery 2', 'Blade Ball', 'Adopt Me', 'Steal a Brainrot', 'Blox Fruit', 'Grow A Garden'] as const;
export type IngameSubcategory = typeof INGAME_SUBCATEGORIES[number];

export const INGAME_TYPES = ['All', 'Items', 'Currency', 'Gamepass'] as const;
export type IngameType = typeof INGAME_TYPES[number];

export type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc';

export interface Product {
  id: string;
  name: string;
  price: number;
  priceUsd?: number;
  description: string;
  category: Category;
  image: string;
  stock?: number;
  stockLabel?: string;
  subcategory?: string;
  productType?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

const mockProducts: Product[] = [
  { id: '5', name: 'Adopt Me Bucks (10K)', price: 1799, description: '10,000 Adopt Me Bucks', category: 'INGAME CURRENCIES', image: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&fit=crop', stock: 75, subcategory: 'Adopt Me', productType: 'Currency' },
  { id: '5b', name: 'Adopt Me Pet (Neon)', price: 4499, description: 'Neon legendary pet', category: 'INGAME CURRENCIES', image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop', stock: 8, subcategory: 'Adopt Me', productType: 'Items' },
  { id: '6', name: 'Blox Fruit Money (1M)', price: 2999, description: '1,000,000 Blox Fruit Money', category: 'INGAME CURRENCIES', image: 'https://images.unsplash.com/photo-1621570074981-ef8cf0d90d72?w=400&h=300&fit=crop', stock: 60, subcategory: 'Blox Fruit', productType: 'Currency' },
  { id: '6b', name: 'Blox Fruit 2x Mastery Pass', price: 1299, description: '2x Mastery gamepass', category: 'INGAME CURRENCIES', image: 'https://images.unsplash.com/photo-1535223289429-72aad6dd3f1a?w=400&h=300&fit=crop', stock: 30, subcategory: 'Blox Fruit', productType: 'Gamepass' },
  { id: '7', name: 'Fish Bucks (500)', price: 2399, description: '500 Fisch Bucks', category: 'INGAME CURRENCIES', image: 'https://images.unsplash.com/photo-1511207538754-e8555f2bc187?w=400&h=300&fit=crop', stock: 80, subcategory: 'Fisch', productType: 'Currency' },
  { id: '7b', name: 'Fisch Rod (Legendary)', price: 3799, description: 'Legendary fishing rod item', category: 'INGAME CURRENCIES', image: 'https://images.unsplash.com/photo-1500045788903-f8a1e408c880?w=400&h=300&fit=crop', stock: 5, subcategory: 'Fisch', productType: 'Items' },
  { id: '8', name: 'MM2 Diamonds (100)', price: 1559, description: '100 Murder Mystery 2 Diamonds', category: 'INGAME CURRENCIES', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop', stock: 90, subcategory: 'Murder Mystery 2', productType: 'Currency' },
  { id: '8b', name: 'MM2 Godly Knife (Chroma)', price: 5999, description: 'Rare chroma godly weapon', category: 'INGAME CURRENCIES', image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&h=300&fit=crop', stock: 3, subcategory: 'Murder Mystery 2', productType: 'Items' },
  { id: '13', name: 'Garden Seeds Pack (50)', price: 1299, description: '50 premium seeds for Grow A Garden', category: 'INGAME CURRENCIES', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop', stock: 40, subcategory: 'Grow A Garden', productType: 'Items' },
  { id: '13b', name: 'Garden VIP Gamepass', price: 899, description: 'VIP access for Grow A Garden', category: 'INGAME CURRENCIES', image: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&h=300&fit=crop', stock: 50, subcategory: 'Grow A Garden', productType: 'Gamepass' },
  { id: '14', name: 'Blade Ball Coins (5K)', price: 899, description: '5,000 Blade Ball Coins', category: 'INGAME CURRENCIES', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop', stock: 120, subcategory: 'Blade Ball', productType: 'Currency' },
  { id: '9', name: 'Starter Account', price: 3599, description: 'Level 50+ account with rare items', category: 'ACCOUNTS', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop', stock: 10 },
  { id: '10', name: 'Premium Account', price: 9599, description: 'Level 100+ with rare limited items', category: 'ACCOUNTS', image: 'https://images.unsplash.com/photo-1614294148960-9aa740632a87?w=400&h=300&fit=crop', stock: 5 },
  { id: '11', name: 'Pro Account', price: 17999, description: 'Level 200+ with limiteds included', category: 'ACCOUNTS', image: 'https://images.unsplash.com/photo-1556438064-2d7646166914?w=400&h=300&fit=crop', stock: 3 },
  { id: '12', name: 'Elite Account', price: 35999, description: 'Max level with exclusive items', category: 'ACCOUNTS', image: 'https://images.unsplash.com/photo-1579547621309-3e0f203d9aba?w=400&h=300&fit=crop', stock: 2 },
  { id: 'LMTD-1', name: '8-bit Royal Crown (8BRC)', price: 45000, priceUsd: 385, description: 'Rare limited crown item', category: 'LIMITEDS', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop', stockLabel: '5 in Stock', subcategory: 'Hats' },
  { id: 'LMTD-2', name: 'Gold Clockwork Headphones (GCWHP)', price: 38000, priceUsd: 325, description: 'Limited edition gold headphones', category: 'LIMITEDS', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop', stockLabel: '2 in Stock', subcategory: 'Neck' },
  { id: 'LMTD-3', name: 'Perfectly Legitimate Business Hat (Legit)', price: 28000, priceUsd: 239, description: 'Classic Roblox limited item', category: 'LIMITEDS', image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400&h=300&fit=crop', stockLabel: 'Out of Stock', subcategory: 'Hats' },
  { id: 'LMTD-4', name: 'Silver King of the Night (SKOTN)', price: 52000, priceUsd: 445, description: 'Ultra rare limited item', category: 'LIMITEDS', image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828d0a?w=400&h=300&fit=crop', stockLabel: '1 in Stock', subcategory: 'Back' },
];


function AppContent() {
  const { t } = useLang();
  const { settings } = useSettings();

  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [activeCategory, setActiveCategory] = useState<Category>('ROBUX');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [limitedSubcat, setLimitedSubcat] = useState<string>('All');
  const [ingameSubcat, setIngameSubcat] = useState<string>('All');
  const [ingameType, setIngameType] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    supabase.from('products').select('*').eq('active', true).then(({ data }) => {
      if (data && data.length > 0) {
        setProducts(data.map((r: any) => ({
          id: r.id,
          name: r.name,
          price: r.price_bdt,
          priceUsd: r.price_usd,
          description: r.description,
          category: r.category as Category,
          image: r.image,
          stockLabel: r.stock_label,
          subcategory: r.subcategory,
        })));
      }
    });
  }, []);

  useEffect(() => {
    document.title = 'AroStall | One-stop Roblox Market';
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = logoImg;
    const setMeta = (prop: string, content: string, attr = 'property') => {
      let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${prop}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, prop); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    setMeta('og:title', 'AroStall — All-in-One Roblox Shop');
    setMeta('og:description', 'The #1 trusted marketplace for Robux, Limiteds, Accounts & in-game currencies.');
    setMeta('og:image', ogImg);
    setMeta('og:url', 'https://arostall.xyz');
    setMeta('twitter:card', 'summary_large_image', 'name');
    setMeta('twitter:title', 'AroStall — All-in-One Roblox Shop', 'name');
    setMeta('twitter:image', ogImg, 'name');
  }, []);

  const filteredProducts = (() => {
    let list = products.filter(p => {
      if (p.category !== activeCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
      }
      if (activeCategory === 'LIMITEDS' && limitedSubcat !== 'All' && p.subcategory !== limitedSubcat) return false;
      if (activeCategory === 'INGAME CURRENCIES' && ingameSubcat !== 'All' && p.subcategory !== ingameSubcat) return false;
      if (activeCategory === 'INGAME CURRENCIES' && ingameType !== 'All' && p.productType !== ingameType) return false;
      if (inStockOnly) {
        const hasStock = p.stock !== undefined ? p.stock > 0 : !p.stockLabel?.toLowerCase().includes('out');
        if (!hasStock) return false;
      }
      return true;
    });
    if (sortBy === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    else if (sortBy === 'name-asc') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  })();

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => setCartItems(prev => prev.filter(item => item.id !== productId));

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(productId); return; }
    setCartItems(prev => prev.map(item => item.id === productId ? { ...item, quantity } : item));
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleCategoryChange = (cat: Category) => {
    setActiveCategory(cat);
    setSearchQuery('');
    setLimitedSubcat('All');
    setIngameSubcat('All');
    setIngameType('All');
    setSortBy('default');
    setInStockOnly(false);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <Header
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onDashboardClick={() => setIsDashboardOpen(true)}
        onLogoClick={() => { setShowShop(false); setSearchQuery(''); setLimitedSubcat('All'); setIngameSubcat('All'); setIngameType('All'); setSortBy('default'); setInStockOnly(false); }}
        onAdminOpen={() => setIsAdminOpen(true)}
        showCategoryBar={showShop}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />

      {/* Announcement banner */}
      {settings.announcement_enabled === 'true' && settings.announcement_text && (
        <motion.div
          initial={{ y: -32, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-yellow-500/12 border-b border-yellow-500/20 px-4 py-2.5 text-center"
        >
          <span className="text-yellow-400 text-sm font-semibold">📢 {settings.announcement_text}</span>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {!showShop ? (
          <motion.main
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35 }}
            className="relative overflow-hidden"
          >
            {/* ── Layered background ── */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-yellow-500/[0.04] rounded-full blur-[100px]" />
              <div className="absolute top-1/3 left-0 w-96 h-96 bg-amber-600/[0.03] rounded-full blur-[80px]" />
              <div className="absolute top-1/4 right-0 w-80 h-80 bg-yellow-400/[0.03] rounded-full blur-[80px]" />
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle, rgba(250,204,21,0.055) 1px, transparent 1px)',
                backgroundSize: '44px 44px',
                maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black 0%, transparent 100%)',
              }} />
              {/* Horizontal rule glow at very top */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent" />
            </div>

            {/* ── Hero headline block ── */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-10 text-center">

              {/* Verified pill */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.5 }}
                className="inline-flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.09] text-white/50 text-[11px] font-semibold px-4 py-2 rounded-full mb-8 tracking-widest uppercase"
              >
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Bangladesh&apos;s #1 Roblox Marketplace
                <BadgeCheck className="w-3.5 h-3.5 text-yellow-400" />
              </motion.div>

              {/* Main headline */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.7, type: 'spring', stiffness: 80 }}
              >
                <p className="text-white/25 text-sm sm:text-base font-medium tracking-[0.5em] uppercase mb-3">
                  The Ultimate
                </p>
                <h1
                  className="font-black leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-100 to-yellow-500"
                  style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(3.5rem, 13vw, 9rem)', lineHeight: 0.9 }}
                >
                  ROBLOX
                </h1>
                <h2
                  className="font-black leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-600"
                  style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(2rem, 7vw, 4.5rem)', lineHeight: 1.1, marginTop: '0.15em' }}
                >
                  MARKETPLACE
                </h2>
              </motion.div>

              {/* Subtext */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.38, duration: 0.6 }}
                className="text-white/35 text-sm sm:text-base max-w-lg mx-auto mt-6 leading-relaxed"
              >
                Buy Robux, Limiteds, Accounts &amp; In-Game items safely with instant delivery. Trusted by {settings.trusted_count || '300+'} happy players.
              </motion.p>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.52, duration: 0.5 }}
                className="flex items-center justify-center gap-3 mt-8 flex-wrap"
              >
                <motion.button
                  whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setShowShop(true)}
                  className="inline-flex items-center gap-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-bold text-sm sm:text-base px-7 sm:px-9 py-3.5 rounded-2xl shadow-2xl shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-shadow"
                >
                  {t.exploreShop}
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
                <motion.a
                  whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                  href={settings.discord_url || 'https://discord.gg/c5wrvVcKem'}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] hover:border-indigo-500/40 text-white/70 hover:text-white font-semibold text-sm sm:text-base px-7 sm:px-9 py-3.5 rounded-2xl transition-all"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-indigo-400 flex-none">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                  </svg>
                  Join Discord
                </motion.a>
              </motion.div>
            </div>

            {/* ── Trust ticker ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65, duration: 0.5 }}
              className="relative overflow-hidden py-4 border-y border-white/[0.05] bg-white/[0.015]"
            >
              <div className="flex gap-0 animate-[marquee_28s_linear_infinite] whitespace-nowrap">
                {[
                  { icon: Zap, text: 'Instant Delivery' },
                  { icon: Lock, text: 'Secure Payments' },
                  { icon: BadgeCheck, text: 'Verified Seller' },
                  { icon: Clock, text: '24/7 Support' },
                  { icon: Shield, text: 'bKash & Nagad' },
                  { icon: TrendingUp, text: 'Best Prices' },
                  { icon: Users, text: `${settings.trusted_count || '300+'} Happy Players` },
                  { icon: Star, text: '5★ Rated' },
                  { icon: Zap, text: 'Instant Delivery' },
                  { icon: Lock, text: 'Secure Payments' },
                  { icon: BadgeCheck, text: 'Verified Seller' },
                  { icon: Clock, text: '24/7 Support' },
                  { icon: Shield, text: 'bKash & Nagad' },
                  { icon: TrendingUp, text: 'Best Prices' },
                  { icon: Users, text: `${settings.trusted_count || '300+'} Happy Players` },
                  { icon: Star, text: '5★ Rated' },
                ].map(({ icon: Icon, text }, i) => (
                  <span key={i} className="inline-flex items-center gap-2 px-6 text-xs font-semibold text-white/30">
                    <Icon className="w-3 h-3 text-yellow-500/50 flex-none" />
                    {text}
                    <span className="text-white/10 ml-4">·</span>
                  </span>
                ))}
              </div>
              <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
            </motion.div>

            {/* ── Category bento grid ── */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-16">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-center text-white/20 text-[10px] font-semibold uppercase tracking-[0.4em] mb-6"
              >
                Browse Categories
              </motion.p>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {([
                  {
                    id: 'ROBUX' as Category,
                    label: 'Robux',
                    desc: 'Top-up instantly',
                    icon: Coins,
                    gradient: 'from-yellow-500/20 to-amber-600/10',
                    border: 'border-yellow-500/25 hover:border-yellow-400/50',
                    glow: 'hover:shadow-yellow-500/10',
                    iconBg: 'bg-yellow-500/15',
                    iconColor: 'text-yellow-400',
                    tag: 'Instant',
                    tagColor: 'bg-yellow-500/15 text-yellow-400',
                  },
                  {
                    id: 'LIMITEDS' as Category,
                    label: 'Limiteds',
                    desc: 'Rare collectibles',
                    icon: Gem,
                    gradient: 'from-purple-500/15 to-indigo-600/10',
                    border: 'border-purple-500/20 hover:border-purple-400/40',
                    glow: 'hover:shadow-purple-500/10',
                    iconBg: 'bg-purple-500/15',
                    iconColor: 'text-purple-400',
                    tag: 'Exclusive',
                    tagColor: 'bg-purple-500/15 text-purple-400',
                  },
                  {
                    id: 'INGAME CURRENCIES' as Category,
                    label: 'In-Game',
                    desc: 'Coins, items & passes',
                    icon: Gamepad2,
                    gradient: 'from-blue-500/15 to-cyan-600/10',
                    border: 'border-blue-500/20 hover:border-blue-400/40',
                    glow: 'hover:shadow-blue-500/10',
                    iconBg: 'bg-blue-500/15',
                    iconColor: 'text-blue-400',
                    tag: 'All Games',
                    tagColor: 'bg-blue-500/15 text-blue-400',
                  },
                  {
                    id: 'ACCOUNTS' as Category,
                    label: 'Accounts',
                    desc: 'Ready-to-play',
                    icon: Users,
                    gradient: 'from-emerald-500/15 to-green-600/10',
                    border: 'border-emerald-500/20 hover:border-emerald-400/40',
                    glow: 'hover:shadow-emerald-500/10',
                    iconBg: 'bg-emerald-500/15',
                    iconColor: 'text-emerald-400',
                    tag: 'Verified',
                    tagColor: 'bg-emerald-500/15 text-emerald-400',
                  },
                ] as const).map((cat, i) => (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.75 + i * 0.08, duration: 0.5, type: 'spring', stiffness: 120 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setShowShop(true); handleCategoryChange(cat.id); }}
                    className={`group relative bg-gradient-to-br ${cat.gradient} border ${cat.border} rounded-2xl p-5 sm:p-6 text-left flex flex-col gap-4 overflow-hidden shadow-xl ${cat.glow} hover:shadow-2xl transition-all duration-300`}
                  >
                    {/* Corner accent */}
                    <div className={`absolute -top-6 -right-6 w-20 h-20 ${cat.iconBg} rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`} />

                    <div className="flex items-start justify-between">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${cat.iconBg} rounded-2xl flex items-center justify-center flex-none`}>
                        <cat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${cat.iconColor}`} />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${cat.tagColor}`}>
                        {cat.tag}
                      </span>
                    </div>

                    <div>
                      <p className="text-white font-bold text-base sm:text-lg leading-tight">{cat.label}</p>
                      <p className="text-white/40 text-xs mt-0.5">{cat.desc}</p>
                    </div>

                    <div className={`flex items-center gap-1 text-xs font-semibold ${cat.iconColor} group-hover:gap-2 transition-all`}>
                      Shop now <ArrowRight className="w-3 h-3" />
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.5 }}
                className="grid grid-cols-3 gap-3 sm:gap-6 mt-8 pt-8 border-t border-white/[0.05]"
              >
                {[
                  { icon: Users, value: settings.trusted_count || '300+', label: 'Happy Customers' },
                  { icon: Zap, value: '1,200+', label: 'Orders Completed' },
                  { icon: Star, value: '5.0★', label: 'Average Rating' },
                ].map(({ icon: Icon, value, label }) => (
                  <div key={label} className="text-center">
                    <div className="inline-flex items-center gap-1.5 mb-1">
                      <Icon className="w-3.5 h-3.5 text-yellow-500/60" />
                      <p className="text-xl sm:text-3xl font-black text-yellow-400">{value}</p>
                    </div>
                    <p className="text-white/20 text-[11px] tracking-wide">{label}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.main>
        ) : (
          <motion.main
            key="shop"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="container mx-auto px-4 pt-4 pb-6"
          >
            {/* Layout: sidebar + content */}
            <div className="flex gap-4 mt-4">

              {/* Left sidebar — subcategories + filters */}
              <AnimatePresence>
                {(activeCategory === 'LIMITEDS' || activeCategory === 'INGAME CURRENCIES') && (
                  <motion.aside
                    key="subcategory-sidebar"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.22 }}
                    className="flex-none w-36 sm:w-44"
                  >
                    <div className="bg-zinc-900/50 border border-white/[0.07] rounded-2xl p-2 sticky top-24 space-y-1">

                      {/* Game / Type subcategory section */}
                      <div>
                        <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest px-2 pt-1 pb-2">
                          {activeCategory === 'LIMITEDS' ? 'Type' : 'Game'}
                        </p>
                        <div className="flex flex-col gap-0.5">
                          {(activeCategory === 'LIMITEDS' ? LIMITED_SUBCATEGORIES : INGAME_SUBCATEGORIES).map(sub => {
                            const isActive = activeCategory === 'LIMITEDS' ? limitedSubcat === sub : ingameSubcat === sub;
                            return (
                              <button
                                key={sub}
                                onClick={() => { if (activeCategory === 'LIMITEDS') { setLimitedSubcat(sub); } else { setIngameSubcat(sub); setIngameType('All'); } }}
                                className={`relative w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                  isActive ? 'text-yellow-400' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                                }`}
                              >
                                {isActive && (
                                  <motion.div
                                    layoutId="subcat-pill"
                                    className="absolute inset-0 rounded-xl bg-yellow-500/10 border border-yellow-500/25"
                                    style={{ zIndex: -1 }}
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                  />
                                )}
                                {sub !== 'All' && activeCategory === 'INGAME CURRENCIES' && (
                                  <span className="w-5 h-5 rounded-md flex-none bg-zinc-800 border border-white/10" />
                                )}
                                <span className="truncate">{sub}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Ingame Type filter section */}
                      {activeCategory === 'INGAME CURRENCIES' && (
                        <>
                          <div className="h-px bg-white/[0.06] mx-2" />
                          <div>
                            <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest px-2 pt-2 pb-2">
                              Type
                            </p>
                            <div className="flex flex-col gap-0.5">
                              {INGAME_TYPES.map(type => {
                                const isActive = ingameType === type;
                                return (
                                  <button
                                    key={type}
                                    onClick={() => setIngameType(type)}
                                    className={`relative w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                      isActive ? 'text-yellow-400' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                                    }`}
                                  >
                                    {isActive && (
                                      <motion.div
                                        layoutId="ingame-type-pill"
                                        className="absolute inset-0 rounded-xl bg-yellow-500/10 border border-yellow-500/25"
                                        style={{ zIndex: -1 }}
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                      />
                                    )}
                                    {type}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Filters section */}
                      <div className="h-px bg-white/[0.06] mx-2" />
                      <div>
                        <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest px-2 pt-2 pb-2 flex items-center gap-1.5">
                          <SlidersHorizontal className="w-2.5 h-2.5" />
                          Filters
                        </p>

                        {/* Sort */}
                        <div className="px-2 mb-2">
                          <p className="text-white/30 text-[10px] mb-1.5 flex items-center gap-1">
                            <ArrowUpDown className="w-2.5 h-2.5" /> Sort by
                          </p>
                          <div className="flex flex-col gap-0.5">
                            {([
                              { val: 'default', label: 'Featured' },
                              { val: 'price-asc', label: 'Price: Low → High' },
                              { val: 'price-desc', label: 'Price: High → Low' },
                              { val: 'name-asc', label: 'Name A → Z' },
                            ] as { val: SortOption; label: string }[]).map(({ val, label }) => (
                              <button
                                key={val}
                                onClick={() => setSortBy(val)}
                                className={`flex items-center gap-2 w-full px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                                  sortBy === val ? 'text-yellow-400' : 'text-white/35 hover:text-white/60'
                                }`}
                              >
                                <span className={`w-3 h-3 rounded-full border flex-none flex items-center justify-center ${sortBy === val ? 'border-yellow-400 bg-yellow-400/20' : 'border-white/20'}`}>
                                  {sortBy === val && <Check className="w-2 h-2 text-yellow-400" />}
                                </span>
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* In-stock toggle */}
                        <button
                          onClick={() => setInStockOnly(v => !v)}
                          className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            inStockOnly ? 'text-yellow-400' : 'text-white/40 hover:text-white/70'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded border flex-none flex items-center justify-center transition-all ${inStockOnly ? 'bg-yellow-500/20 border-yellow-500/50' : 'border-white/20'}`}>
                            {inStockOnly && <Check className="w-2.5 h-2.5 text-yellow-400" />}
                          </span>
                          In Stock Only
                        </button>
                      </div>

                    </div>
                  </motion.aside>
                )}
              </AnimatePresence>

              {/* Main content area */}
              <div className="flex-1 min-w-0">
                {/* Search bar (non-ROBUX) */}
                {activeCategory !== 'ROBUX' && (
                  <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder={
                        activeCategory === 'INGAME CURRENCIES'
                          ? ingameSubcat !== 'All' ? `Search in ${ingameSubcat}…` : 'Search in-game currencies…'
                          : `Search ${activeCategory.toLowerCase()}…`
                      }
                      className="w-full bg-zinc-900/60 border border-white/[0.07] hover:border-white/12 focus:border-yellow-500/40 rounded-2xl pl-11 pr-10 py-3.5 text-white/90 text-sm placeholder-white/25 outline-none transition-all"
                      style={{ backdropFilter: 'blur(8px)' }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors p-0.5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCategory + limitedSubcat + ingameSubcat + ingameType + sortBy + inStockOnly}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                  >
                    {activeCategory === 'ROBUX' ? (
                      <RobuxSelector onAddToCart={addToCart} />
                    ) : (
                      <ProductGrid
                        products={filteredProducts}
                        onAddToCart={addToCart}
                        searchQuery={searchQuery}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      <Footer onNavigate={(section) => { setShowShop(true); handleCategoryChange(section as Category); }} />

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        total={cartTotal}
        onCheckoutComplete={() => setCartItems([])}
      />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <UserDashboard isOpen={isDashboardOpen} onClose={() => setIsDashboardOpen(false)} />
      <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      <ChatWidget isCartOpen={isCartOpen} />
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <LanguageProvider>
        <CurrencyProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </SettingsProvider>
  );
}
