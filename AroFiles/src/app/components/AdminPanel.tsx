import { useState, useEffect, useRef } from 'react';
import {
  X, CheckCircle, Clock, RefreshCw, Package, Truck, Lock, Plus, Trash2, Edit2,
  BarChart2, Search, Eye, EyeOff, Upload, MessageSquare, Send, ChevronLeft,
  Settings, Save, ToggleLeft, ToggleRight, Megaphone, Wallet, Link, Percent,
  LayoutGrid, Star, Gamepad2, Minus, Image as ImageIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { useSettings, SETTING_DEFAULTS } from '../../contexts/SettingsContext';

const ADMIN_PASSWORD = 'ARO_ADMIN_9f3k2p';
const CATEGORIES = ['ROBUX', 'INGAME CURRENCIES', 'ACCOUNTS', 'LIMITEDS'] as const;
const INGAME_TYPES_FIXED = ['Items', 'Currency', 'Gamepass'];
const DEFAULT_INGAME_GAMES = ['Fisch', 'Murder Mystery 2', 'Blade Ball', 'Adopt Me', 'Steal a Brainrot', 'Blox Fruit', 'Grow A Garden'];
const DEFAULT_LIMITED_SUBCATS = ['Hats', 'Faces', 'Hair', 'Neck', 'Shoulder', 'Back'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function sanitizeText(val: string, maxLen = 200): string {
  return val.replace(/<[^>]*>/g, '').replace(/[<>"'`;]/g, '').trim().slice(0, maxLen);
}
function sanitizeId(val: string): string {
  return val.replace(/[^a-zA-Z0-9\-_]/g, '').slice(0, 50);
}
function safeNum(val: any): number | null {
  const n = Number(val);
  return isNaN(n) || n < 0 ? null : Math.round(n * 100) / 100;
}
function isValidUrl(url: string): boolean {
  try { const u = new URL(url); return ['http:', 'https:'].includes(u.protocol); } catch { return false; }
}

interface GameEntry { name: string; icon: string; }

interface Order {
  orderId: string;
  userName: string;
  userEmail: string;
  robloxUser: string;
  phone: string;
  txId: string;
  paymentMethod: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  total: number;
  status: 'pending' | 'delivered';
  createdAt: string;
  deliveredAt?: string;
}

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/25 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all text-sm";
const selectCls = inputCls + " bg-zinc-900";
const emptyProduct = {
  id: '', name: '', category: 'LIMITEDS', price_bdt: '', price_usd: '',
  description: '', stock_label: 'In Stock', stock: '', active: true,
  image: '', subcategory: '', product_type: '',
};

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const { settings, refreshSettings } = useSettings();

  // Auth
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [activeTab, setActiveTab] = useState<'stats' | 'orders' | 'products' | 'categories' | 'reviews' | 'messages' | 'settings'>('orders');

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'delivered'>('all');
  const [orderSearch, setOrderSearch] = useState('');

  // Products
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ ...emptyProduct });
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState<string>('all');
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [quickStock, setQuickStock] = useState('');

  // Categories
  const [ingameGames, setIngameGames] = useState<GameEntry[]>([]);
  const [limitedSubcats, setLimitedSubcats] = useState<string[]>([]);
  const [newGameName, setNewGameName] = useState('');
  const [newLimitedSubcat, setNewLimitedSubcat] = useState('');
  const [iconTarget, setIconTarget] = useState<string | null>(null);
  const [uploadingGameIcon, setUploadingGameIcon] = useState<string | null>(null);
  const [categoriesSaving, setCategoriesSaving] = useState(false);
  const [categoriesSaved, setCategoriesSaved] = useState(false);
  const gameIconFileRef = useRef<HTMLInputElement>(null);

  // Reviews
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Messages
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [convoMessages, setConvoMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [unreadConvos, setUnreadConvos] = useState(0);
  const msgBottomRef = useRef<HTMLDivElement>(null);

  // Settings
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({ ...SETTING_DEFAULTS });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Sync categories from settings
  useEffect(() => {
    try {
      const games = JSON.parse(settings.ingame_games_json || '[]');
      setIngameGames(
        Array.isArray(games)
          ? games.map((g: any) => (typeof g === 'string' ? { name: g, icon: '' } : g))
          : DEFAULT_INGAME_GAMES.map(n => ({ name: n, icon: '' }))
      );
    } catch {
      setIngameGames(DEFAULT_INGAME_GAMES.map(n => ({ name: n, icon: '' })));
    }
  }, [settings.ingame_games_json]);

  useEffect(() => {
    try {
      const subcats = JSON.parse(settings.limited_subcats_json || '[]');
      setLimitedSubcats(Array.isArray(subcats) ? subcats : [...DEFAULT_LIMITED_SUBCATS]);
    } catch {
      setLimitedSubcats([...DEFAULT_LIMITED_SUBCATS]);
    }
  }, [settings.limited_subcats_json]);

  useEffect(() => {
    if (isOpen && authed) {
      fetchOrders();
      fetchProducts();
      fetchConversations();
      fetchReviews();
    }
    if (!isOpen) {
      setAuthed(false); setPwInput(''); setPwError('');
      setActiveTab('orders'); setOrderSearch(''); setProductSearch('');
      setActiveConvo(null); setSettingsSaved(false); setCategoriesSaved(false);
    }
  }, [isOpen, authed]);

  useEffect(() => {
    if (activeTab === 'settings') setLocalSettings({ ...settings } as Record<string, string>);
  }, [activeTab, settings]);

  const handleAuth = () => {
    if (pwInput === ADMIN_PASSWORD) { setAuthed(true); setPwError(''); }
    else { setPwError('Incorrect password'); setPwInput(''); }
  };

  // ── Orders ──
  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      setOrders((data ?? []).map(mapOrder));
    } finally { setOrdersLoading(false); }
  };

  const mapOrder = (r: any): Order => ({
    orderId: r.order_id, userName: r.user_name, userEmail: r.user_email,
    robloxUser: r.roblox_user, phone: r.phone, txId: r.tx_id,
    paymentMethod: r.payment_method, items: r.items ?? [],
    total: r.total, status: r.status, createdAt: r.created_at, deliveredAt: r.delivered_at,
  });

  const completeOrder = async (orderId: string) => {
    setCompleting(orderId);
    const deliveredAt = new Date().toISOString();
    await supabase.from('orders').update({ status: 'delivered', delivered_at: deliveredAt }).eq('order_id', orderId);
    setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: 'delivered', deliveredAt } : o));
    setCompleting(null);
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm(`Delete order ${orderId}?`)) return;
    await supabase.from('orders').delete().eq('order_id', orderId);
    setOrders(prev => prev.filter(o => o.orderId !== orderId));
  };

  const revertOrder = async (orderId: string) => {
    await supabase.from('orders').update({ status: 'pending', delivered_at: null }).eq('order_id', orderId);
    setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: 'pending', deliveredAt: undefined } : o));
  };

  // ── Products ──
  const fetchProducts = async () => {
    setProductsLoading(true);
    const { data } = await supabase.from('products').select('*').order('category');
    if (data) setProducts(data);
    setProductsLoading(false);
  };

  const uploadImage = async (file: File, onSuccess: (url: string) => void) => {
    setUploadError('');
    if (!ALLOWED_TYPES.includes(file.type)) { setUploadError('Only JPG, PNG, WebP and GIF images allowed.'); return; }
    if (file.size > MAX_FILE_SIZE) { setUploadError('File too large (max 5MB).'); return; }
    setUploadingImage(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage.from('product-images').upload(safeName, file, { cacheControl: '3600', upsert: false });
      if (error) { setUploadError('Upload failed: ' + error.message); return; }
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(data.path);
      onSuccess(publicUrl);
    } catch { setUploadError('Upload failed. Check your connection.'); }
    finally { setUploadingImage(false); }
  };

  const saveProduct = async (product: any) => {
    const cleanId = sanitizeId(product.id);
    const cleanName = sanitizeText(product.name, 100);
    if (!cleanId || !cleanName) { alert('ID and Name are required.'); return; }
    const imageUrl = product.image;
    if (imageUrl && !isValidUrl(imageUrl)) { alert('Image URL must start with https://'); return; }
    const priceBdt = safeNum(product.price_bdt);
    if (priceBdt === null) { alert('BDT price must be a positive number.'); return; }
    setSavingProduct(true);
    try {
      const { error } = await supabase.from('products').upsert({
        id: cleanId,
        name: cleanName,
        category: CATEGORIES.includes(product.category) ? product.category : 'LIMITEDS',
        price_bdt: priceBdt,
        price_usd: safeNum(product.price_usd),
        description: sanitizeText(product.description ?? '', 500),
        stock_label: sanitizeText(product.stock_label ?? 'In Stock', 50),
        stock: safeNum(product.stock) ?? null,
        active: !!product.active,
        image: imageUrl ?? '',
        subcategory: (product.category === 'LIMITEDS' || product.category === 'INGAME CURRENCIES')
          ? (sanitizeText(product.subcategory ?? '', 50) || null)
          : null,
        product_type: product.category === 'INGAME CURRENCIES'
          ? (sanitizeText(product.product_type ?? '', 50) || null)
          : null,
      });
      if (error) { alert('Error saving: ' + error.message); return; }
      await fetchProducts();
      setEditingProduct(null); setShowAddProduct(false); setNewProduct({ ...emptyProduct });
    } finally { setSavingProduct(false); }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('products').update({ active: !current }).eq('id', id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, active: !current } : p));
  };

  const quickUpdateStock = async (id: string, val: string) => {
    const n = safeNum(val);
    if (n === null) return;
    await supabase.from('products').update({ stock: n }).eq('id', id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: n } : p));
    setEditingStock(null);
  };

  const adjustStock = async (id: string, current: number | null, delta: number) => {
    const next = Math.max(0, (current ?? 0) + delta);
    await supabase.from('products').update({ stock: next }).eq('id', id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: next } : p));
  };

  // ── Categories ──
  const uploadGameIcon = async (gameName: string, file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) { alert('Only JPG, PNG, WebP and GIF allowed.'); return; }
    if (file.size > MAX_FILE_SIZE) { alert('File too large (max 5MB).'); return; }
    setUploadingGameIcon(gameName);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const safeName = `game-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage.from('product-images').upload(safeName, file, { cacheControl: '3600', upsert: false });
      if (error) { alert('Upload failed: ' + error.message); return; }
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(data.path);
      setIngameGames(prev => prev.map(g => g.name === gameName ? { ...g, icon: publicUrl } : g));
    } catch { alert('Upload failed.'); }
    finally { setUploadingGameIcon(null); }
  };

  const addGame = () => {
    const name = newGameName.trim();
    if (!name || ingameGames.some(g => g.name === name)) return;
    setIngameGames(prev => [...prev, { name, icon: '' }]);
    setNewGameName('');
  };

  const removeGame = (name: string) => setIngameGames(prev => prev.filter(g => g.name !== name));

  const addLimitedSubcat = () => {
    const name = newLimitedSubcat.trim();
    if (!name || limitedSubcats.includes(name)) return;
    setLimitedSubcats(prev => [...prev, name]);
    setNewLimitedSubcat('');
  };

  const removeLimitedSubcat = (name: string) => setLimitedSubcats(prev => prev.filter(s => s !== name));

  const saveCategories = async () => {
    setCategoriesSaving(true);
    try {
      const pairs = [
        { key: 'ingame_games_json', value: JSON.stringify(ingameGames), updated_at: new Date().toISOString() },
        { key: 'limited_subcats_json', value: JSON.stringify(limitedSubcats), updated_at: new Date().toISOString() },
      ];
      const { error } = await supabase.from('site_settings').upsert(pairs, { onConflict: 'key' });
      if (error) { alert('Error: ' + error.message); return; }
      await refreshSettings();
      setCategoriesSaved(true);
      setTimeout(() => setCategoriesSaved(false), 3000);
    } finally { setCategoriesSaving(false); }
  };

  // ── Reviews ──
  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const { data } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (data) setReviews(data);
    } catch { /* table may not exist yet */ }
    finally { setReviewsLoading(false); }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    await supabase.from('reviews').delete().eq('id', id);
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  // ── Messages ──
  const fetchConversations = async () => {
    const { data } = await supabase.from('messages').select('session_id, user_name, user_email, content, created_at, sender').order('created_at', { ascending: false });
    if (!data) return;
    const map = new Map<string, any>();
    data.forEach(m => { if (!map.has(m.session_id)) map.set(m.session_id, m); });
    const convos = Array.from(map.values());
    setConversations(convos);
    setUnreadConvos(convos.filter(c => c.sender === 'user').length);
  };

  const fetchConvoMessages = async (sessionId: string) => {
    const { data } = await supabase.from('messages').select('*').eq('session_id', sessionId).order('created_at', { ascending: true });
    if (data) setConvoMessages(data);
    setTimeout(() => msgBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !activeConvo || sendingReply) return;
    setSendingReply(true);
    await supabase.from('messages').insert({ session_id: activeConvo, user_name: 'AroStall Admin', content: replyText.trim(), sender: 'admin' });
    setReplyText('');
    await fetchConvoMessages(activeConvo);
    setSendingReply(false);
  };

  useEffect(() => {
    if (activeConvo) msgBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [convoMessages]);

  // ── Settings ──
  const saveSettings = async () => {
    setSettingsSaving(true);
    try {
      const pairs = Object.entries(localSettings).map(([key, value]) => ({
        key, value: String(value), updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase.from('site_settings').upsert(pairs, { onConflict: 'key' });
      if (error) { alert('Error saving settings: ' + error.message); return; }
      await refreshSettings();
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } finally { setSettingsSaving(false); }
  };

  // ── Derived ──
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const totalRevenueBdt = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.total ?? 0), 0);
  const filteredOrders = orders.filter(o => {
    const matchFilter = orderFilter === 'all' || o.status === orderFilter;
    const q = orderSearch.toLowerCase();
    const matchSearch = !q || o.orderId.toLowerCase().includes(q) || o.robloxUser?.toLowerCase().includes(q) || o.userName?.toLowerCase().includes(q) || o.txId?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });
  const filteredProducts = products.filter(p => {
    const matchCat = productCatFilter === 'all' || p.category === productCatFilter;
    const q = productSearch.toLowerCase();
    const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.id?.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  // ── Product Form ──
  const ProductForm = ({ data, onChange, onSave, onCancel, isNew }: any) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const subcatOptions = data.category === 'LIMITEDS'
      ? ['', ...limitedSubcats]
      : data.category === 'INGAME CURRENCIES'
      ? ['', ...ingameGames.map((g: GameEntry) => g.name)]
      : [];

    return (
      <div className="space-y-3 p-4 bg-white/[0.03] border border-yellow-500/20 rounded-2xl">
        <h4 className="text-yellow-400 font-bold text-sm">{isNew ? '+ New Product' : 'Editing: ' + data.name}</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-white/35 text-xs mb-1 block">ID {isNew ? '(e.g. LMTD-5)' : '(locked)'}</label>
            <input className={inputCls + (isNew ? '' : ' opacity-40 cursor-not-allowed')} placeholder="e.g. LMTD-5" value={data.id}
              onChange={e => isNew && onChange({ ...data, id: e.target.value })} readOnly={!isNew} />
          </div>
          <div>
            <label className="text-white/35 text-xs mb-1 block">Category</label>
            <select className={selectCls} value={data.category}
              onChange={e => onChange({ ...data, category: e.target.value, subcategory: '', product_type: '' })}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-white/35 text-xs mb-1 block">Price (BDT ৳)</label>
            <input className={inputCls} type="number" placeholder="45000" value={data.price_bdt}
              onChange={e => onChange({ ...data, price_bdt: e.target.value })} />
          </div>
          <div>
            <label className="text-white/35 text-xs mb-1 block">Price (USD $) — optional</label>
            <input className={inputCls} type="number" placeholder="385" value={data.price_usd ?? ''}
              onChange={e => onChange({ ...data, price_usd: e.target.value })} />
          </div>
          <div>
            <label className="text-white/35 text-xs mb-1 block">Stock Label</label>
            <input className={inputCls} placeholder="5 in Stock / Out of Stock" value={data.stock_label ?? ''}
              onChange={e => onChange({ ...data, stock_label: e.target.value })} />
          </div>
          <div>
            <label className="text-white/35 text-xs mb-1 block">Stock (number)</label>
            <input className={inputCls} type="number" min="0" placeholder="0" value={data.stock ?? ''}
              onChange={e => onChange({ ...data, stock: e.target.value })} />
          </div>
          {(data.category === 'LIMITEDS' || data.category === 'INGAME CURRENCIES') && (
            <div>
              <label className="text-white/35 text-xs mb-1 block">
                {data.category === 'LIMITEDS' ? 'Item Type' : 'Game'}
              </label>
              <select className={selectCls} value={data.subcategory ?? ''}
                onChange={e => onChange({ ...data, subcategory: e.target.value })}>
                {subcatOptions.map(s => <option key={s} value={s}>{s || '— None —'}</option>)}
              </select>
            </div>
          )}
          {data.category === 'INGAME CURRENCIES' && (
            <div>
              <label className="text-white/35 text-xs mb-1 block">Item Type</label>
              <select className={selectCls} value={data.product_type ?? ''}
                onChange={e => onChange({ ...data, product_type: e.target.value })}>
                <option value="">— None —</option>
                {INGAME_TYPES_FIXED.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
          <div className="col-span-2">
            <label className="flex items-center gap-2 text-white/50 text-sm cursor-pointer mt-1">
              <input type="checkbox" checked={data.active ?? true}
                onChange={e => onChange({ ...data, active: e.target.checked })} className="accent-yellow-500 w-4 h-4" />
              Active (visible in shop)
            </label>
          </div>
        </div>

        <div>
          <label className="text-white/35 text-xs mb-1 block">Name</label>
          <input className={inputCls} placeholder="Product name" value={data.name}
            onChange={e => onChange({ ...data, name: e.target.value })} />
        </div>
        <div>
          <label className="text-white/35 text-xs mb-1 block">Description</label>
          <input className={inputCls} placeholder="Short description" value={data.description ?? ''}
            onChange={e => onChange({ ...data, description: e.target.value })} />
        </div>

        <div>
          <label className="text-white/35 text-xs mb-1 block">Image</label>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, url => onChange({ ...data, image: url })); e.target.value = ''; }} />
          <div className="flex gap-2 mb-2">
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}
              className="flex items-center gap-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50">
              <Upload className="w-3.5 h-3.5" />
              {uploadingImage ? 'Uploading...' : 'Upload image'}
            </button>
            <span className="text-white/20 text-xs self-center">or paste URL below</span>
          </div>
          {uploadError && <p className="text-red-400 text-xs mb-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{uploadError}</p>}
          <input className={inputCls} placeholder="https://..." value={data.image ?? ''}
            onChange={e => onChange({ ...data, image: e.target.value })} />
          {data.image && (
            <div className="mt-2 flex items-center gap-3">
              <img src={data.image} alt="preview" className="h-16 w-16 rounded-xl object-cover bg-white/5 p-0.5 border border-yellow-500/20"
                onError={(e: any) => { e.target.style.display = 'none'; }} />
              <button onClick={() => onChange({ ...data, image: '' })} className="text-red-400 hover:text-red-300 text-xs">Remove</button>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onCancel}
            className="flex-1 bg-white/5 hover:bg-white/10 text-white/50 border border-white/10 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            Cancel
          </button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => onSave(data)} disabled={savingProduct || uploadingImage}
            className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold py-2.5 rounded-xl text-sm transition-colors">
            {savingProduct ? 'Saving...' : 'Save Product'}
          </motion.button>
        </div>
      </div>
    );
  };

  // ── Settings helpers ──
  const SettingsSection = ({ title, icon: Icon, children }: any) => (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-yellow-500/15 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-yellow-400" />
        </div>
        <p className="text-white/80 font-semibold text-sm">{title}</p>
      </div>
      {children}
    </div>
  );

  const SettingsField = ({ label, settingKey, type = 'text', placeholder = '' }: { label: string; settingKey: string; type?: string; placeholder?: string }) => (
    <div>
      <label className="text-white/35 text-xs mb-1.5 block">{label}</label>
      <input type={type} className={inputCls} placeholder={placeholder}
        value={localSettings[settingKey] ?? ''}
        onChange={e => setLocalSettings(prev => ({ ...prev, [settingKey]: e.target.value }))} />
    </div>
  );

  const SettingsToggle = ({ label, desc, settingKey }: { label: string; desc?: string; settingKey: string }) => {
    const isOn = localSettings[settingKey] === 'true';
    return (
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-white/70 text-sm font-medium">{label}</p>
          {desc && <p className="text-white/30 text-xs">{desc}</p>}
        </div>
        <button
          onClick={() => setLocalSettings(prev => ({ ...prev, [settingKey]: isOn ? 'false' : 'true' }))}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isOn ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-white/5 text-white/40 border-white/10'}`}>
          {isOn ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          {isOn ? 'ON' : 'OFF'}
        </button>
      </div>
    );
  };

  const tabs = [
    { id: 'stats', label: 'Stats', icon: BarChart2 },
    { id: 'orders', label: pendingCount ? `Orders (${pendingCount})` : 'Orders', icon: Package },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: LayoutGrid },
    { id: 'reviews', label: reviews.length ? `Reviews (${reviews.length})` : 'Reviews', icon: Star },
    { id: 'messages', label: unreadConvos ? `Chats (${unreadConvos})` : 'Chats', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="fixed inset-3 sm:inset-6 bg-gradient-to-b from-zinc-950 to-black border border-white/[0.08] rounded-2xl z-[60] flex flex-col shadow-2xl shadow-black/60 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 border-b border-white/[0.07]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-yellow-500/15 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-yellow-400" />
                </div>
                <h2 className="text-lg font-bold text-white">AroStall Admin</h2>
                {authed && pendingCount > 0 && (
                  <span className="bg-yellow-500 text-black text-xs font-black px-2 py-0.5 rounded-full animate-pulse">
                    {pendingCount} pending
                  </span>
                )}
              </div>
              <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!authed ? (
              /* Auth screen */
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-xs space-y-4">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-7 h-7 text-yellow-400" />
                    </div>
                    <p className="text-white font-semibold">Admin Access</p>
                    <p className="text-white/35 text-sm mt-1">Enter your admin password to continue</p>
                  </div>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={pwInput}
                      onChange={e => setPwInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAuth()}
                      autoFocus
                      className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3.5 pr-12 text-white placeholder-white/20 focus:outline-none focus:border-yellow-500/40 focus:ring-1 focus:ring-yellow-500/20 text-center tracking-widest text-xl"
                      placeholder="••••••••••••"
                    />
                    <button onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-yellow-400 transition-colors">
                      {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {pwError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm text-center">{pwError}</motion.p>}
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleAuth}
                    className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold py-3.5 rounded-2xl shadow-lg shadow-yellow-500/20">
                    Enter Admin Panel
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">

                {/* Tab bar */}
                <div className="flex border-b border-white/[0.07] flex-shrink-0 bg-black/30 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                  {tabs.map(tab => (
                    <button key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        if (tab.id === 'messages') { fetchConversations(); setActiveConvo(null); }
                        if (tab.id === 'reviews') fetchReviews();
                      }}
                      className={`flex items-center gap-1.5 flex-none px-4 py-3 text-xs font-semibold transition-colors whitespace-nowrap ${activeTab === tab.id ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-white/35 hover:text-white/70'}`}>
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* ── STATS ── */}
                {activeTab === 'stats' && (
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { label: 'Total Orders', value: orders.length, color: 'text-white' },
                        { label: 'Pending', value: pendingCount, color: 'text-yellow-400' },
                        { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, color: 'text-green-400' },
                        { label: 'Revenue (BDT)', value: '৳' + totalRevenueBdt.toLocaleString(), color: 'text-yellow-400' },
                        { label: 'Total Products', value: products.length, color: 'text-white' },
                        { label: 'Active Products', value: products.filter(p => p.active).length, color: 'text-green-400' },
                      ].map(stat => (
                        <div key={stat.label} className="bg-white/[0.04] border border-white/[0.07] hover:border-yellow-500/25 transition-colors rounded-2xl p-4 text-center">
                          <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                          <p className="text-white/35 text-xs mt-1">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4">
                      <h3 className="text-white/70 font-semibold text-sm mb-3">Recent Orders</h3>
                      <div className="space-y-2">
                        {orders.slice(0, 5).map(o => (
                          <div key={o.orderId} className="flex items-center justify-between text-xs gap-2">
                            <span className="text-yellow-400 font-mono flex-none">{o.orderId}</span>
                            <span className="text-white/50 truncate">{o.robloxUser}</span>
                            <span className="text-white/50 flex-none">৳{o.total?.toLocaleString()}</span>
                            <span className={`flex-none font-semibold ${o.status === 'delivered' ? 'text-green-400' : 'text-yellow-400'}`}>{o.status}</span>
                          </div>
                        ))}
                        {orders.length === 0 && <p className="text-white/25 text-center py-4 text-xs">No orders yet</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── ORDERS ── */}
                {activeTab === 'orders' && (
                  <>
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] flex-shrink-0 flex-wrap">
                      <div className="flex bg-white/[0.04] rounded-xl overflow-hidden border border-white/[0.07]">
                        {(['all', 'pending', 'delivered'] as const).map(f => (
                          <button key={f} onClick={() => setOrderFilter(f)}
                            className={`px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${orderFilter === f ? 'bg-yellow-500 text-black' : 'text-white/40 hover:text-white'}`}>
                            {f}
                          </button>
                        ))}
                      </div>
                      <div className="flex-1 relative min-w-[120px]">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                        <input value={orderSearch} onChange={e => setOrderSearch(e.target.value)}
                          placeholder="Search order, username..."
                          className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl pl-8 pr-3 py-1.5 text-white text-xs placeholder-white/25 focus:outline-none focus:border-yellow-500/40" />
                      </div>
                      <button onClick={fetchOrders} className="text-white/30 hover:text-yellow-400 transition-colors p-1.5">
                        <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {ordersLoading ? (
                        <p className="text-white/25 text-center py-12 text-sm">Loading...</p>
                      ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-14">
                          <Package className="w-10 h-10 text-white/15 mx-auto mb-2" />
                          <p className="text-white/25 text-sm">No orders found</p>
                        </div>
                      ) : filteredOrders.map(order => (
                        <motion.div key={order.orderId} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          className={`rounded-2xl border p-4 ${order.status === 'delivered' ? 'bg-green-500/[0.04] border-green-500/20' : 'bg-white/[0.03] border-yellow-500/25'}`}>
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="space-y-1.5 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-yellow-400 font-black text-sm tracking-wide font-mono">{order.orderId}</span>
                                {order.status === 'delivered' ? (
                                  <span className="flex items-center gap-1 text-green-400 text-xs bg-green-500/10 border border-green-500/25 px-2 py-0.5 rounded-full">
                                    <CheckCircle className="w-3 h-3" /> Delivered
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-yellow-400 text-xs bg-yellow-500/10 border border-yellow-500/25 px-2 py-0.5 rounded-full animate-pulse">
                                    <Clock className="w-3 h-3" /> Pending
                                  </span>
                                )}
                              </div>
                              <p className="text-white/90 text-sm font-semibold">{order.userName} <span className="text-white/35 font-normal text-xs">({order.userEmail})</span></p>
                              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-white/40">
                                <span>🎮 <span className="text-white/70">{order.robloxUser}</span></span>
                                <span>💳 {order.paymentMethod}</span>
                                <span>📱 {order.phone}</span>
                                <span>🔖 <span className="text-white/70 font-mono">{order.txId}</span></span>
                              </div>
                              <div className="text-xs text-white/30">
                                {order.items?.map((i, idx) => <span key={idx}>{i.name} ×{i.quantity}{idx < order.items.length - 1 ? ', ' : ''}</span>)}
                              </div>
                              <p className="text-xs text-white/20">{new Date(order.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              <p className="text-yellow-400 font-black text-xl">৳{order.total?.toLocaleString()}</p>
                              <div className="flex gap-1.5">
                                {order.status === 'pending' ? (
                                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={() => completeOrder(order.orderId)} disabled={completing === order.orderId}
                                    className="flex items-center gap-1.5 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold text-xs px-3 py-2 rounded-xl transition-colors">
                                    <Truck className="w-3.5 h-3.5" />
                                    {completing === order.orderId ? '...' : 'Deliver'}
                                  </motion.button>
                                ) : (
                                  <button onClick={() => revertOrder(order.orderId)}
                                    className="text-white/30 hover:text-yellow-400 text-xs border border-white/10 hover:border-yellow-500/30 px-2.5 py-1.5 rounded-xl transition-colors">
                                    Revert
                                  </button>
                                )}
                                <button onClick={() => deleteOrder(order.orderId)}
                                  className="text-white/25 hover:text-red-400 border border-white/[0.07] hover:border-red-500/30 p-1.5 rounded-xl transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}

                {/* ── PRODUCTS ── */}
                {activeTab === 'products' && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] flex-shrink-0 flex-wrap">
                      <button onClick={() => { setShowAddProduct(true); setEditingProduct(null); setNewProduct({ ...emptyProduct }); }}
                        className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs px-3 py-2 rounded-xl transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Add Product
                      </button>
                      <select value={productCatFilter} onChange={e => setProductCatFilter(e.target.value)}
                        className="bg-zinc-900 border border-white/[0.07] rounded-xl px-2.5 py-1.5 text-white/60 text-xs focus:outline-none">
                        <option value="all">All categories</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="flex-1 relative min-w-[100px]">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                        <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search products..."
                          className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl pl-8 pr-3 py-1.5 text-white text-xs placeholder-white/25 focus:outline-none focus:border-yellow-500/40" />
                      </div>
                      <button onClick={fetchProducts} className="text-white/30 hover:text-yellow-400 p-1.5 transition-colors">
                        <RefreshCw className={`w-4 h-4 ${productsLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      <AnimatePresence>
                        {showAddProduct && (
                          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                            <ProductForm data={newProduct} onChange={setNewProduct}
                              onSave={saveProduct} onCancel={() => setShowAddProduct(false)} isNew={true} />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {productsLoading ? (
                        <p className="text-white/25 text-center py-12 text-sm">Loading...</p>
                      ) : filteredProducts.length === 0 ? (
                        <p className="text-white/25 text-center py-12 text-sm">No products found</p>
                      ) : filteredProducts.map(product => (
                        <div key={product.id}>
                          <AnimatePresence>
                            {editingProduct?.id === product.id && (
                              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <ProductForm data={editingProduct} onChange={setEditingProduct}
                                  onSave={saveProduct} onCancel={() => setEditingProduct(null)} isNew={false} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                          {editingProduct?.id !== product.id && (
                            <div className="bg-white/[0.03] border border-white/[0.07] hover:border-yellow-500/20 rounded-2xl p-3 flex items-start gap-3 transition-colors">
                              {product.image ? (
                                <img src={product.image} alt={product.name}
                                  className="w-12 h-12 rounded-xl object-cover bg-white/5 border border-white/10 flex-shrink-0 mt-0.5"
                                  onError={(e: any) => { e.target.style.display = 'none'; }} />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Package className="w-5 h-5 text-white/20" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-white/90 font-semibold text-sm truncate">{product.name}</p>
                                <div className="flex gap-2 flex-wrap text-xs text-white/35 mt-0.5">
                                  <span className="text-yellow-400/70">{product.category}</span>
                                  {product.subcategory && <span>· {product.subcategory}</span>}
                                  {product.product_type && <span className="text-blue-400/70">· {product.product_type}</span>}
                                  <span>৳{Number(product.price_bdt).toLocaleString()}</span>
                                  {product.price_usd && <span>${product.price_usd}</span>}
                                  {product.stock_label && (
                                    <span className={product.stock_label.toLowerCase().includes('out') ? 'text-red-400' : 'text-green-400'}>
                                      {product.stock_label}
                                    </span>
                                  )}
                                </div>
                                {/* Quick stock editor */}
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-white/20 text-[10px] font-semibold uppercase tracking-wide">Stock:</span>
                                  {editingStock === product.id ? (
                                    <div className="flex items-center gap-1">
                                      <input type="number" value={quickStock} onChange={e => setQuickStock(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') quickUpdateStock(product.id, quickStock); if (e.key === 'Escape') setEditingStock(null); }}
                                        autoFocus
                                        className="w-16 bg-white/[0.07] border border-yellow-500/40 rounded-lg px-2 py-0.5 text-white text-xs focus:outline-none" />
                                      <button onClick={() => quickUpdateStock(product.id, quickStock)} className="text-green-400 hover:text-green-300 text-xs font-bold px-1">✓</button>
                                      <button onClick={() => setEditingStock(null)} className="text-white/30 hover:text-white/60 text-xs px-1">✕</button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => adjustStock(product.id, product.stock, -1)}
                                        className="w-5 h-5 rounded bg-white/[0.05] hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 flex items-center justify-center text-white/30 hover:text-red-400 transition-all">
                                        <Minus className="w-2.5 h-2.5" />
                                      </button>
                                      <button onClick={() => { setEditingStock(product.id); setQuickStock(String(product.stock ?? 0)); }}
                                        className="text-[11px] font-mono font-bold text-yellow-400/80 hover:text-yellow-400 min-w-[28px] text-center border-b border-yellow-500/20 hover:border-yellow-500/50 transition-all">
                                        {product.stock ?? '—'}
                                      </button>
                                      <button onClick={() => adjustStock(product.id, product.stock, 1)}
                                        className="w-5 h-5 rounded bg-white/[0.05] hover:bg-green-500/15 border border-white/10 hover:border-green-500/30 flex items-center justify-center text-white/30 hover:text-green-400 transition-all">
                                        <Plus className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col gap-1 flex-shrink-0 items-end">
                                <button onClick={() => toggleActive(product.id, product.active)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${product.active ? 'text-green-400 border-green-500/25 bg-green-500/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/25' : 'text-red-400 border-red-500/25 bg-red-500/10 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/25'}`}>
                                  {product.active ? 'Live' : 'Hidden'}
                                </button>
                                <div className="flex gap-0.5">
                                  <button onClick={() => setEditingProduct({ ...product, stock: product.stock ?? '', product_type: product.product_type ?? '' })}
                                    className="text-white/30 hover:text-yellow-400 transition-colors p-1.5">
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => deleteProduct(product.id)}
                                    className="text-white/30 hover:text-red-400 transition-colors p-1.5">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── CATEGORIES ── */}
                {activeTab === 'categories' && (
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Hidden file input shared by all game icon upload buttons */}
                    <input
                      ref={gameIconFileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file && iconTarget) uploadGameIcon(iconTarget, file);
                        e.target.value = '';
                        setIconTarget(null);
                      }}
                    />

                    {/* INGAME Games */}
                    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center flex-none">
                          <Gamepad2 className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/80 font-semibold text-sm">In-Game: Game List</p>
                          <p className="text-white/25 text-[11px]">Games appear in sidebar filters and the product form</p>
                        </div>
                        <span className="text-white/25 text-xs flex-none">{ingameGames.length} games</span>
                      </div>

                      <div className="space-y-1.5">
                        {ingameGames.map((game, idx) => (
                          <div key={game.name} className="flex items-center gap-2 bg-white/[0.03] rounded-xl p-2 border border-white/[0.05]">
                            <span className="text-white/20 text-[10px] w-4 text-center flex-none">{idx + 1}</span>
                            {game.icon ? (
                              <img src={game.icon} alt={game.name} className="w-8 h-8 rounded-lg object-cover border border-white/10 flex-none" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/10 flex-none flex items-center justify-center">
                                <ImageIcon className="w-3.5 h-3.5 text-white/20" />
                              </div>
                            )}
                            <span className="flex-1 text-white/80 text-sm font-medium truncate">{game.name}</span>
                            <button
                              onClick={() => { setIconTarget(game.name); gameIconFileRef.current?.click(); }}
                              disabled={uploadingGameIcon === game.name}
                              className="flex items-center gap-1 bg-white/[0.05] hover:bg-blue-500/15 border border-white/10 hover:border-blue-500/30 text-white/30 hover:text-blue-400 text-[10px] font-semibold px-2 py-1 rounded-lg transition-all disabled:opacity-50 flex-none">
                              <Upload className="w-2.5 h-2.5" />
                              {uploadingGameIcon === game.name ? '...' : 'Icon'}
                            </button>
                            {game.icon && (
                              <button onClick={() => setIngameGames(prev => prev.map(g => g.name === game.name ? { ...g, icon: '' } : g))}
                                className="text-white/20 hover:text-red-400 transition-colors flex-none p-0.5" title="Remove icon">
                                <X className="w-3 h-3" />
                              </button>
                            )}
                            <button onClick={() => removeGame(game.name)}
                              className="text-white/20 hover:text-red-400 transition-colors flex-none p-1">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        {ingameGames.length === 0 && (
                          <p className="text-white/25 text-xs text-center py-4">No games yet. Add one below.</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input value={newGameName} onChange={e => setNewGameName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addGame()}
                          placeholder="New game name (e.g. Anime Adventures)..."
                          className="flex-1 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2 text-white text-xs placeholder-white/25 focus:outline-none focus:border-blue-500/40" />
                        <button onClick={addGame}
                          className="flex items-center gap-1.5 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/25 hover:border-blue-500/50 text-blue-400 text-xs font-bold px-3 py-2 rounded-xl transition-all flex-none">
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      </div>
                    </div>

                    {/* LIMITED Subcategories */}
                    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center flex-none">
                          <LayoutGrid className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/80 font-semibold text-sm">Limiteds: Item Types</p>
                          <p className="text-white/25 text-[11px]">Filter tags shown in the Limiteds sidebar</p>
                        </div>
                        <span className="text-white/25 text-xs flex-none">{limitedSubcats.length} types</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {limitedSubcats.map(subcat => (
                          <div key={subcat} className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-1.5">
                            <span className="text-purple-300 text-xs font-semibold">{subcat}</span>
                            <button onClick={() => removeLimitedSubcat(subcat)}
                              className="text-purple-400/40 hover:text-red-400 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {limitedSubcats.length === 0 && <p className="text-white/25 text-xs">No types yet</p>}
                      </div>

                      <div className="flex gap-2">
                        <input value={newLimitedSubcat} onChange={e => setNewLimitedSubcat(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addLimitedSubcat()}
                          placeholder="e.g. Wings, Suits, Faces..."
                          className="flex-1 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2 text-white text-xs placeholder-white/25 focus:outline-none focus:border-purple-500/40" />
                        <button onClick={addLimitedSubcat}
                          className="flex items-center gap-1.5 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/25 hover:border-purple-500/50 text-purple-400 text-xs font-bold px-3 py-2 rounded-xl transition-all flex-none">
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      </div>
                    </div>

                    {/* INGAME Types (fixed) */}
                    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-yellow-500/15 flex items-center justify-center flex-none">
                          <Star className="w-3.5 h-3.5 text-yellow-400" />
                        </div>
                        <p className="text-white/80 font-semibold text-sm">In-Game: Item Types</p>
                      </div>
                      <div className="flex gap-2 flex-wrap mb-2">
                        {INGAME_TYPES_FIXED.map(t => (
                          <span key={t} className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold px-3 py-1.5 rounded-xl">{t}</span>
                        ))}
                      </div>
                      <p className="text-white/25 text-xs">Assign these to individual products in the Products tab via the "Item Type" dropdown.</p>
                    </div>

                    {/* Save */}
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={saveCategories} disabled={categoriesSaving}
                      className={`w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg text-sm ${
                        categoriesSaved
                          ? 'bg-green-500 text-black shadow-green-500/20'
                          : 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-yellow-500/20 disabled:opacity-60'
                      }`}>
                      {categoriesSaving ? <RefreshCw className="w-4 h-4 animate-spin" />
                        : categoriesSaved ? <><CheckCircle className="w-4 h-4" /> Saved! Site updated.</>
                        : <><Save className="w-4 h-4" /> Save Categories</>}
                    </motion.button>
                  </div>
                )}

                {/* ── REVIEWS ── */}
                {activeTab === 'reviews' && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
                      <p className="text-white/35 text-xs">{reviews.length} review{reviews.length !== 1 ? 's' : ''} from customers</p>
                      <button onClick={fetchReviews} className="text-white/30 hover:text-yellow-400 transition-colors">
                        <RefreshCw className={`w-4 h-4 ${reviewsLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {reviewsLoading ? (
                        <p className="text-white/25 text-center py-12 text-sm">Loading...</p>
                      ) : reviews.length === 0 ? (
                        <div className="text-center py-16">
                          <Star className="w-10 h-10 text-white/15 mx-auto mb-2" />
                          <p className="text-white/25 text-sm">No reviews yet</p>
                        </div>
                      ) : reviews.map(review => (
                        <div key={review.id} className="bg-white/[0.03] border border-white/[0.07] hover:border-yellow-500/20 rounded-2xl p-4 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-9 h-9 rounded-full bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center flex-none text-yellow-400 font-bold text-sm">
                                {(review.name ?? 'A')[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-white/90 font-semibold text-sm">{review.name}</p>
                                <div className="flex gap-0.5 mt-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/15'}`} />
                                  ))}
                                  <span className="text-white/30 text-xs ml-1">{review.rating}/5</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <p className="text-white/25 text-xs">{new Date(review.created_at).toLocaleDateString()}</p>
                              <button onClick={() => deleteReview(review.id)}
                                className="text-white/25 hover:text-red-400 border border-white/[0.07] hover:border-red-500/30 p-1.5 rounded-xl transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-white/55 text-sm mt-3 leading-relaxed">{review.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── MESSAGES ── */}
                {activeTab === 'messages' && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {activeConvo ? (
                      <>
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
                          <button onClick={() => { setActiveConvo(null); fetchConversations(); }} className="text-white/30 hover:text-yellow-400 transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <div>
                            <p className="text-white/90 font-semibold text-sm">{conversations.find(c => c.session_id === activeConvo)?.user_name ?? 'Guest'}</p>
                            <p className="text-white/30 text-xs">{conversations.find(c => c.session_id === activeConvo)?.user_email ?? 'No email'}</p>
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                          {convoMessages.map((msg: any) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${msg.sender === 'admin' ? 'bg-yellow-500/15 text-white rounded-br-sm' : 'bg-white/[0.07] text-white/90 rounded-bl-sm'}`}>
                                <p className="text-xs text-white/35 mb-0.5">{msg.sender === 'admin' ? 'You' : msg.user_name}</p>
                                <p>{msg.content}</p>
                                <p className="text-xs text-white/20 mt-0.5">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </div>
                          ))}
                          <div ref={msgBottomRef} />
                        </div>
                        <div className="p-3 border-t border-white/[0.07] flex gap-2 flex-shrink-0">
                          <input value={replyText} onChange={e => setReplyText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendReply()}
                            placeholder="Type a reply..."
                            className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white placeholder-white/25 text-sm focus:outline-none focus:border-yellow-500/40" />
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={sendReply} disabled={!replyText.trim() || sendingReply}
                            className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black p-2.5 rounded-xl transition-colors">
                            <Send className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
                          <p className="text-white/35 text-xs">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
                          <button onClick={fetchConversations} className="text-white/30 hover:text-yellow-400 transition-colors">
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                          {conversations.length === 0 ? (
                            <div className="text-center py-16">
                              <MessageSquare className="w-10 h-10 text-white/15 mx-auto mb-2" />
                              <p className="text-white/25 text-sm">No messages yet</p>
                            </div>
                          ) : conversations.map((convo: any) => (
                            <button key={convo.session_id}
                              onClick={() => { setActiveConvo(convo.session_id); fetchConvoMessages(convo.session_id); }}
                              className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors border-b border-white/[0.05] text-left">
                              <div className="w-9 h-9 rounded-full bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center flex-shrink-0 text-yellow-400 font-bold text-sm">
                                {(convo.user_name ?? 'G')[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                  <p className="text-white/90 font-semibold text-sm">{convo.user_name ?? 'Guest'}</p>
                                  <p className="text-white/20 text-xs">{new Date(convo.created_at).toLocaleDateString()}</p>
                                </div>
                                <p className="text-white/35 text-xs truncate">{convo.content}</p>
                                {convo.user_email && <p className="text-white/20 text-xs">{convo.user_email}</p>}
                              </div>
                              {convo.sender === 'user' && <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0 mt-1.5" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── SETTINGS ── */}
                {activeTab === 'settings' && (
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <SettingsSection title="Payment Methods" icon={Wallet}>
                      <SettingsField label="bKash Number" settingKey="bkash_number" placeholder="01712345678" />
                      <SettingsToggle label="Enable Nagad" desc="Show Nagad as a working payment option" settingKey="nagad_enabled" />
                    </SettingsSection>

                    <SettingsSection title="Robux Pricing Rates" icon={Percent}>
                      <div className="grid grid-cols-2 gap-3">
                        <SettingsField label="BDT per 1,000 Robux" settingKey="robux_rate_bdt" type="number" placeholder="850" />
                        <SettingsField label="USD per 1,000 Robux" settingKey="robux_rate_usd" type="number" placeholder="6.89" />
                      </div>
                    </SettingsSection>

                    <SettingsSection title="Crypto Wallet Addresses (USD)" icon={Wallet}>
                      <SettingsField label="USDT — BEP20 Address" settingKey="wallet_usdt_bep20" placeholder="0x..." />
                      <SettingsField label="USDT — ERC20 Address" settingKey="wallet_usdt_erc20" placeholder="0x..." />
                      <SettingsField label="USDT — TRC20 Address" settingKey="wallet_usdt_trc20" placeholder="T..." />
                      <SettingsField label="Bitcoin (BTC) Address" settingKey="wallet_btc" placeholder="1..." />
                      <SettingsField label="Litecoin (LTC) Address" settingKey="wallet_ltc" placeholder="L..." />
                      <SettingsField label="Ethereum (ETH) ERC20 Address" settingKey="wallet_eth" placeholder="0x..." />
                    </SettingsSection>

                    <SettingsSection title="Social & Contact" icon={Link}>
                      <SettingsField label="Discord Server URL" settingKey="discord_url" placeholder="https://discord.gg/..." />
                      <SettingsField label="WhatsApp Number (with country code)" settingKey="whatsapp_number" placeholder="8801710000000" />
                    </SettingsSection>

                    <SettingsSection title="Homepage" icon={Megaphone}>
                      <SettingsField label="Trusted By Count (shown on hero)" settingKey="trusted_count" placeholder="300+" />
                      <SettingsToggle label="Announcement Banner" desc="Show a banner below the header" settingKey="announcement_enabled" />
                      {localSettings.announcement_enabled === 'true' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                          <label className="text-white/35 text-xs mb-1.5 block">Banner Text</label>
                          <input className={inputCls} placeholder="e.g. 🎉 Black Friday sale — 20% off all items!"
                            value={localSettings.announcement_text ?? ''}
                            onChange={e => setLocalSettings(prev => ({ ...prev, announcement_text: e.target.value }))} />
                        </motion.div>
                      )}
                    </SettingsSection>

                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={saveSettings} disabled={settingsSaving}
                      className={`w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg text-sm ${
                        settingsSaved
                          ? 'bg-green-500 text-black shadow-green-500/20'
                          : 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-yellow-500/20 disabled:opacity-60'
                      }`}>
                      {settingsSaving ? <RefreshCw className="w-4 h-4 animate-spin" />
                        : settingsSaved ? <><CheckCircle className="w-4 h-4" /> Settings Saved!</>
                        : <><Save className="w-4 h-4" /> Save All Settings</>}
                    </motion.button>

                    <div className="bg-yellow-500/[0.06] border border-yellow-500/15 rounded-2xl p-3 text-xs text-yellow-400/60 leading-relaxed">
                      <strong className="text-yellow-400/90">Run this SQL in Supabase to enable all features:</strong>
                      <code className="block mt-2 bg-black/30 rounded-lg px-3 py-2 text-white/40 text-[11px] font-mono leading-relaxed whitespace-pre">
{`create table if not exists site_settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);
alter table site_settings enable row level security;
create policy "all_access" on site_settings
  for all using (true) with check (true);

alter table products
  add column if not exists subcategory text,
  add column if not exists product_type text,
  add column if not exists stock integer;

create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  rating int not null,
  content text not null,
  created_at timestamptz default now()
);
alter table reviews enable row level security;
create policy "public_read" on reviews
  for select using (true);
create policy "public_insert" on reviews
  for insert with check (true);`}
                      </code>
                    </div>
                  </div>
                )}

              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
