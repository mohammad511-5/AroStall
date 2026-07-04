import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import logoImg from '../imports/ChatGPT_Image_Jul_2__2026__02_14_30_AM.png';
import ogImg from '../imports/ChatGPT_Image_Jul_3__2026__12_30_52_AM.png';
import { AuthProvider } from '../contexts/AuthContext';
import { LanguageProvider, useLang } from '../contexts/LanguageContext';
import { CurrencyProvider } from '../contexts/CurrencyContext';
import { Header } from './components/Header';
import { CategoryTabs } from './components/CategoryTabs';
import { ProductGrid } from './components/ProductGrid';
import { Cart } from './components/Cart';
import { RobuxSelector } from './components/RobuxSelector';
import { AuthModal } from './components/AuthModal';
import { UserDashboard } from './components/UserDashboard';
import { AdminPanel } from './components/AdminPanel';
import { ShoppingCart, ArrowRight, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type Category = 'ROBUX' | 'INGAME CURRENCIES' | 'ACCOUNTS' | 'LIMITEDS';

export interface Product {
  id: string;
  name: string;
  price: number;     // BDT price
  priceUsd?: number; // USD price
  description: string;
  category: Category;
  image: string;
  stock?: number;
  stockLabel?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

const mockProducts: Product[] = [
  // INGAME CURRENCIES
  { id: '5', name: 'Adopt Me Bucks (10K)', price: 1799, description: '10,000 Adopt Me Bucks', category: 'INGAME CURRENCIES', image: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&fit=crop', stock: 75 },
  { id: '6', name: 'Blox Fruits Money (1M)', price: 2999, description: '1,000,000 Blox Fruits Money', category: 'INGAME CURRENCIES', image: 'https://images.unsplash.com/photo-1621570074981-ef8cf0d90d72?w=400&h=300&fit=crop', stock: 60 },
  { id: '7', name: 'Jailbreak Cash (500K)', price: 2399, description: '500,000 Jailbreak Cash', category: 'INGAME CURRENCIES', image: 'https://images.unsplash.com/photo-1511207538754-e8555f2bc187?w=400&h=300&fit=crop', stock: 80 },
  { id: '8', name: 'Tower Defense Coins (50K)', price: 1559, description: '50,000 Tower Defense Coins', category: 'INGAME CURRENCIES', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop', stock: 90 },

  // ACCOUNTS
  { id: '9', name: 'Starter Account', price: 3599, description: 'Level 50+ account with items', category: 'ACCOUNTS', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop', stock: 10 },
  { id: '10', name: 'Premium Account', price: 9599, description: 'Level 100+ with rare items', category: 'ACCOUNTS', image: 'https://images.unsplash.com/photo-1614294148960-9aa740632a87?w=400&h=300&fit=crop', stock: 5 },
  { id: '11', name: 'Pro Account', price: 17999, description: 'Level 200+ with limiteds', category: 'ACCOUNTS', image: 'https://images.unsplash.com/photo-1556438064-2d7646166914?w=400&h=300&fit=crop', stock: 3 },
  { id: '12', name: 'Elite Account', price: 35999, description: 'Max level with exclusive items', category: 'ACCOUNTS', image: 'https://images.unsplash.com/photo-1579547621309-3e0f203d9aba?w=400&h=300&fit=crop', stock: 2 },

  // LIMITEDS
  { id: 'LMTD-1', name: '8-bit Royal Crown (8BRC)', price: 45000, priceUsd: 385, description: 'Rare limited crown item', category: 'LIMITEDS', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop', stockLabel: '5 in Stock' },
  { id: 'LMTD-2', name: 'Gold Clockwork Headphones (GCWHP)', price: 38000, priceUsd: 325, description: 'Limited edition gold headphones', category: 'LIMITEDS', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop', stockLabel: '2 in Stock' },
  { id: 'LMTD-3', name: 'Perfectly Legitimate Business Hat (Legit)', price: 28000, priceUsd: 239, description: 'Classic Roblox limited item', category: 'LIMITEDS', image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400&h=300&fit=crop', stockLabel: 'Out of Stock' },
  { id: 'LMTD-4', name: 'Silver King of the Night (SKOTN)', price: 52000, priceUsd: 445, description: 'Ultra rare limited item', category: 'LIMITEDS', image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828d0a?w=400&h=300&fit=crop', stockLabel: '1 in Stock' },
];

function AppContent() {
  const { t } = useLang();

  // All useState calls must come before any useEffect
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [activeCategory, setActiveCategory] = useState<Category>('ROBUX');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [showShop, setShowShop] = useState(false);

  // Load products from Supabase (so admin stock/price changes reflect live)
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
        })));
      }
    });
  }, []);

  useEffect(() => {
    document.title = 'AroStall | One-stop roblox market';

    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = logoImg;

    const setMeta = (prop: string, content: string, attr = 'property') => {
      let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${prop}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, prop); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    setMeta('og:title', 'ALL IN ONE ROBLOX SHOP');
    setMeta('og:description', 'The #1 trusted marketplace for Robux, Limiteds, Accounts & in-game currencies.');
    setMeta('og:image', ogImg);
    setMeta('og:url', 'https://arostall.xyz');
    setMeta('twitter:card', 'summary_large_image', 'name');
    setMeta('twitter:title', 'ALL IN ONE ROBLOX SHOP', 'name');
    setMeta('twitter:image', ogImg, 'name');
  }, []);

  const filteredProducts = products.filter(p => p.category === activeCategory);

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <Header
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onDashboardClick={() => setIsDashboardOpen(true)}
        onLogoClick={() => setShowShop(false)}
        onAdminOpen={() => setIsAdminOpen(true)}
      />

      <AnimatePresence mode="wait">
        {!showShop ? (
          /* Hero Section */
          <motion.main
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
            className="container mx-auto px-4"
          >
            <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-73px)] text-center py-16">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-semibold px-4 py-2 rounded-full mb-8 tracking-wider uppercase"
              >
                <Shield className="w-3.5 h-3.5" />
                {t.trustedBadge}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-5xl lg:text-7xl font-extrabold text-white leading-tight mb-4"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {t.heroTitle1}<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-600">
                  {t.heroTitle2}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-2xl lg:text-3xl font-bold text-white/40 mb-6 tracking-wide"
              >
                {t.heroSubtitle}
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-white/50 text-lg max-w-xl mb-10 leading-relaxed"
              >
                {t.heroDesc}
              </motion.p>

              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.4, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowShop(true)}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black font-bold text-lg px-8 py-4 rounded-xl shadow-xl shadow-yellow-500/30 hover:shadow-yellow-500/50"
              >
                {t.exploreShop}
                <ArrowRight className="w-5 h-5" />
              </motion.button>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="flex items-center gap-6 mt-12"
              >
                <p className="text-white/60 text-sm font-semibold tracking-widest uppercase">{t.trustedBy}</p>
              </motion.div>
            </div>
          </motion.main>
        ) : (
          /* Shop Section */
          <motion.main
            key="shop"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.4 }}
            className="container mx-auto px-4 py-8"
          >
            <CategoryTabs
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {activeCategory === 'ROBUX' ? (
                  <RobuxSelector onAddToCart={addToCart} />
                ) : (
                  <ProductGrid
                    products={filteredProducts}
                    onAddToCart={addToCart}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.main>
        )}
      </AnimatePresence>

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        total={cartTotal}
        onCheckoutComplete={() => setCartItems([])}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <UserDashboard
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
      />

      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <CurrencyProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </CurrencyProvider>
    </LanguageProvider>
  );
}