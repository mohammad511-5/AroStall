import { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, Clock, RefreshCw, Package, Truck, Lock, Plus, Trash2, Edit2, BarChart2, Search, Eye, EyeOff, Upload, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';

const ADMIN_PASSWORD = 'ARO_ADMIN_9f3k2p';
const CATEGORIES = ['ROBUX', 'INGAME CURRENCIES', 'ACCOUNTS', 'LIMITEDS'] as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// ── Security helpers ──────────────────────────────────────────
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
  try {
    const u = new URL(url);
    return ['http:', 'https:'].includes(u.protocol);
  } catch { return false; }
}

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

const inputCls = "w-full bg-white/5 border border-yellow-500/30 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20 transition-all text-sm";
const selectCls = inputCls + " bg-zinc-900";

const emptyProduct = { id: '', name: '', category: 'LIMITEDS', price_bdt: '', price_usd: '', description: '', stock_label: 'In Stock', active: true, image: '' };

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [activeTab, setActiveTab] = useState<'stats' | 'orders' | 'products'>('orders');

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'delivered'>('all');
  const [orderSearch, setOrderSearch] = useState('');

  // Products state
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

  useEffect(() => {
    if (isOpen && authed) {
      fetchOrders();
      fetchProducts();
    }
    if (!isOpen) {
      setAuthed(false); setPwInput(''); setPwError('');
      setActiveTab('orders'); setOrderSearch(''); setProductSearch('');
    }
  }, [isOpen, authed]);

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

    // Client-side validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Only JPG, PNG, WebP and GIF images are allowed.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File is too large. Maximum size is 5MB.');
      return;
    }

    setUploadingImage(true);
    try {
      // Safe filename: timestamp + sanitized name
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(safeName, file, { cacheControl: '3600', upsert: false });

      if (error) { setUploadError('Upload failed: ' + error.message); return; }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path);

      onSuccess(publicUrl);
    } catch {
      setUploadError('Upload failed. Check your internet connection.');
    } finally {
      setUploadingImage(false);
    }
  };

  const saveProduct = async (product: any) => {
    const cleanId = sanitizeId(product.id);
    const cleanName = sanitizeText(product.name, 100);

    if (!cleanId || !cleanName) {
      alert('ID and Name are required and must contain only safe characters.');
      return;
    }

    const imageUrl = product.image;
    if (imageUrl && !isValidUrl(imageUrl)) {
      alert('Image URL must start with https://');
      return;
    }

    const priceBdt = safeNum(product.price_bdt);
    if (priceBdt === null) { alert('Price BDT must be a positive number.'); return; }

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
        active: !!product.active,
        image: imageUrl ?? '',
      });
      if (error) { alert('Error saving: ' + error.message); return; }
      await fetchProducts();
      setEditingProduct(null);
      setShowAddProduct(false);
      setNewProduct({ ...emptyProduct });
    } finally { setSavingProduct(false); }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product from the shop?')) return;
    await supabase.from('products').delete().eq('id', id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('products').update({ active: !current }).eq('id', id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, active: !current } : p));
  };

  // ── Derived ──
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.total ?? 0), 0);
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

  const ProductForm = ({ data, onChange, onSave, onCancel, isNew }: any) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    return (
    <div className="space-y-3 p-4 bg-white/5 border border-yellow-500/20 rounded-xl">
      <h4 className="text-yellow-400 font-bold text-sm">{isNew ? '➕ Add New Product' : '✏️ Editing: ' + data.name}</h4>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-white/40 text-xs mb-1 block">ID {isNew ? '(unique, e.g. LMTD-5)' : '(cannot change)'}</label>
          <input className={inputCls + (isNew ? '' : ' opacity-50')} placeholder="e.g. LMTD-5" value={data.id}
            onChange={e => isNew && onChange({ ...data, id: e.target.value })}
            readOnly={!isNew} />
        </div>
        <div>
          <label className="text-white/40 text-xs mb-1 block">Category</label>
          <select className={selectCls} value={data.category} onChange={e => onChange({ ...data, category: e.target.value })}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-white/40 text-xs mb-1 block">Price (BDT ৳)</label>
          <input className={inputCls} type="number" placeholder="e.g. 45000" value={data.price_bdt}
            onChange={e => onChange({ ...data, price_bdt: e.target.value })} />
        </div>
        <div>
          <label className="text-white/40 text-xs mb-1 block">Price (USD $) — optional</label>
          <input className={inputCls} type="number" placeholder="e.g. 385" value={data.price_usd ?? ''}
            onChange={e => onChange({ ...data, price_usd: e.target.value })} />
        </div>
        <div>
          <label className="text-white/40 text-xs mb-1 block">Stock Label</label>
          <input className={inputCls} placeholder="e.g. 5 in Stock / Out of Stock" value={data.stock_label ?? ''}
            onChange={e => onChange({ ...data, stock_label: e.target.value })} />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-white/60 text-sm cursor-pointer pb-2">
            <input type="checkbox" checked={data.active ?? true}
              onChange={e => onChange({ ...data, active: e.target.checked })} className="accent-yellow-500 w-4 h-4" />
            Active (visible in shop)
          </label>
        </div>
      </div>

      <div>
        <label className="text-white/40 text-xs mb-1 block">Name</label>
        <input className={inputCls} placeholder="Product name" value={data.name}
          onChange={e => onChange({ ...data, name: e.target.value })} />
      </div>

      <div>
        <label className="text-white/40 text-xs mb-1 block">Description</label>
        <input className={inputCls} placeholder="Short description" value={data.description ?? ''}
          onChange={e => onChange({ ...data, description: e.target.value })} />
      </div>

      <div>
        <label className="text-white/40 text-xs mb-1 block">Image</label>

        {/* Upload from device */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) uploadImage(file, url => onChange({ ...data, image: url }));
            e.target.value = '';
          }}
        />
        <div className="flex gap-2 mb-2">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="flex items-center gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploadingImage ? 'Uploading...' : 'Upload from device'}
          </motion.button>
          <span className="text-white/25 text-xs self-center">or paste URL below</span>
        </div>

        {uploadError && (
          <p className="text-red-400 text-xs mb-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{uploadError}</p>
        )}

        <input className={inputCls} placeholder="https://images.unsplash.com/photo-xxx?w=400&h=300&fit=crop"
          value={data.image ?? ''} onChange={e => onChange({ ...data, image: e.target.value })} />

        {data.image && (
          <div className="mt-2 flex items-center gap-3">
            <img src={data.image} alt="preview" className="h-20 w-20 rounded-lg object-contain bg-white/5 p-1 border border-yellow-500/20"
              onError={(e: any) => { e.target.style.display = 'none'; }} />
            <div className="text-xs text-white/30">
              <p>Image preview</p>
              <button onClick={() => onChange({ ...data, image: '' })} className="text-red-400 hover:text-red-300 mt-1">Remove</button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 py-2 rounded-lg text-sm font-semibold transition-colors">
          Cancel
        </button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => onSave(data)} disabled={savingProduct || uploadingImage}
          className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold py-2 rounded-lg text-sm transition-colors">
          {savingProduct ? 'Saving...' : '✅ Save Product'}
        </motion.button>
      </div>
    </div>
  );};

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="fixed inset-4 sm:inset-8 bg-zinc-950 border border-yellow-500/30 rounded-2xl z-[60] flex flex-col shadow-2xl shadow-yellow-500/10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-yellow-500/20 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-yellow-400" />
                <h2 className="text-xl font-bold text-white">Admin Panel</h2>
                {authed && pendingCount > 0 && (
                  <span className="bg-yellow-500 text-black text-xs font-black px-2 py-0.5 rounded-full animate-pulse">
                    {pendingCount} pending
                  </span>
                )}
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-yellow-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!authed ? (
              /* ── Password gate ── */
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-xs space-y-4">
                  <div className="text-center mb-2">
                    <div className="w-14 h-14 bg-yellow-500/10 border border-yellow-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Lock className="w-6 h-6 text-yellow-400" />
                    </div>
                    <p className="text-white/50 text-sm">Enter admin password</p>
                  </div>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={pwInput}
                      onChange={e => setPwInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAuth()}
                      autoFocus
                      className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 pr-11 text-white placeholder-white/30 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-center tracking-widest text-lg"
                      placeholder="••••••••••••"
                    />
                    <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-yellow-400 transition-colors">
                      {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {pwError && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-sm text-center">{pwError}</motion.p>}
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleAuth}
                    className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold py-3 rounded-xl shadow-lg shadow-yellow-500/20">
                    Enter
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">

                {/* ── Tab bar ── */}
                <div className="flex border-b border-yellow-500/20 flex-shrink-0">
                  {([
                    { id: 'stats', label: '📊 Stats', icon: BarChart2 },
                    { id: 'orders', label: '🛒 Orders' + (pendingCount ? ` (${pendingCount})` : ''), icon: Package },
                    { id: 'products', label: '📦 Products', icon: Package },
                  ] as any[]).map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 py-3 text-xs sm:text-sm font-semibold transition-colors ${activeTab === tab.id ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-white/40 hover:text-white'}`}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* ── STATS TAB ── */}
                {activeTab === 'stats' && (
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Total Orders', value: orders.length, color: 'text-white' },
                        { label: 'Pending', value: pendingCount, color: 'text-yellow-400' },
                        { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, color: 'text-green-400' },
                        { label: 'Revenue (BDT)', value: '৳' + totalRevenue.toLocaleString(), color: 'text-yellow-400' },
                        { label: 'Products', value: products.length, color: 'text-white' },
                        { label: 'Active Products', value: products.filter(p => p.active).length, color: 'text-green-400' },
                      ].map(stat => (
                        <div key={stat.label} className="bg-white/5 border border-yellow-500/20 rounded-xl p-4 text-center">
                          <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                          <p className="text-white/40 text-xs mt-1">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-white/5 border border-yellow-500/20 rounded-xl p-4">
                      <h3 className="text-yellow-400 font-semibold text-sm mb-3">Recent Orders</h3>
                      <div className="space-y-2">
                        {orders.slice(0, 5).map(o => (
                          <div key={o.orderId} className="flex items-center justify-between text-xs">
                            <span className="text-yellow-400 font-mono">{o.orderId}</span>
                            <span className="text-white/60">{o.robloxUser}</span>
                            <span className="text-white/60">৳{o.total?.toLocaleString()}</span>
                            <span className={o.status === 'delivered' ? 'text-green-400' : 'text-yellow-400'}>{o.status}</span>
                          </div>
                        ))}
                        {orders.length === 0 && <p className="text-white/30 text-center py-4 text-xs">No orders yet</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── ORDERS TAB ── */}
                {activeTab === 'orders' && (
                  <>
                    {/* Toolbar */}
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 flex-shrink-0 flex-wrap">
                      <div className="flex bg-white/5 rounded-lg overflow-hidden border border-white/10">
                        {(['all', 'pending', 'delivered'] as const).map(f => (
                          <button key={f} onClick={() => setOrderFilter(f)}
                            className={`px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${orderFilter === f ? 'bg-yellow-500 text-black' : 'text-white/50 hover:text-white'}`}>
                            {f}
                          </button>
                        ))}
                      </div>
                      <div className="flex-1 relative min-w-[120px]">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                        <input value={orderSearch} onChange={e => setOrderSearch(e.target.value)}
                          placeholder="Search order ID, username..."
                          className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-white text-xs placeholder-white/30 focus:outline-none focus:border-yellow-400" />
                      </div>
                      <button onClick={fetchOrders} className="text-white/40 hover:text-yellow-400 transition-colors p-1.5">
                        <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {ordersLoading ? (
                        <p className="text-white/30 text-center py-12 text-sm">Loading...</p>
                      ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-12">
                          <Package className="w-10 h-10 text-white/20 mx-auto mb-2" />
                          <p className="text-white/30 text-sm">No orders found</p>
                        </div>
                      ) : filteredOrders.map(order => (
                        <motion.div key={order.orderId} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          className={`rounded-xl border p-4 ${order.status === 'delivered' ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-yellow-500/20'}`}>
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-yellow-400 font-black text-sm tracking-wider">{order.orderId}</span>
                                {order.status === 'delivered' ? (
                                  <span className="flex items-center gap-1 text-green-400 text-xs bg-green-500/10 border border-green-500/30 px-2 py-0.5 rounded-full">
                                    <CheckCircle className="w-3 h-3" /> Delivered
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-yellow-400 text-xs bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 rounded-full animate-pulse">
                                    <Clock className="w-3 h-3" /> Pending
                                  </span>
                                )}
                              </div>
                              <p className="text-white text-sm font-semibold">{order.userName} <span className="text-white/40 font-normal text-xs">({order.userEmail})</span></p>
                              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-white/50">
                                <span>🎮 <span className="text-white/80">{order.robloxUser}</span></span>
                                <span>💳 {order.paymentMethod}</span>
                                <span>📱 {order.phone}</span>
                                <span>🔖 <span className="text-white/80 font-mono">{order.txId}</span></span>
                              </div>
                              <div className="text-xs text-white/40">
                                {order.items?.map((i, idx) => <span key={idx}>{i.name} ×{i.quantity}{idx < order.items.length - 1 ? ', ' : ''}</span>)}
                              </div>
                              <p className="text-xs text-white/25">{new Date(order.createdAt).toLocaleString()}</p>
                            </div>

                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              <p className="text-yellow-400 font-black text-lg">৳{order.total?.toLocaleString()}</p>
                              <div className="flex gap-1.5">
                                {order.status === 'pending' ? (
                                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={() => completeOrder(order.orderId)}
                                    disabled={completing === order.orderId}
                                    className="flex items-center gap-1.5 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold text-xs px-3 py-2 rounded-lg transition-colors">
                                    <Truck className="w-3.5 h-3.5" />
                                    {completing === order.orderId ? '...' : 'Deliver'}
                                  </motion.button>
                                ) : (
                                  <button onClick={() => revertOrder(order.orderId)}
                                    className="text-white/30 hover:text-yellow-400 text-xs border border-white/10 hover:border-yellow-500/30 px-2 py-1 rounded-lg transition-colors">
                                    Revert
                                  </button>
                                )}
                                <button onClick={() => deleteOrder(order.orderId)}
                                  className="text-white/30 hover:text-red-400 border border-white/10 hover:border-red-500/30 p-1.5 rounded-lg transition-colors">
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

                {/* ── PRODUCTS TAB ── */}
                {activeTab === 'products' && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 flex-shrink-0 flex-wrap">
                      <button
                        onClick={() => { setShowAddProduct(true); setEditingProduct(null); setNewProduct({ ...emptyProduct }); }}
                        className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs px-3 py-2 rounded-lg transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Add Product
                      </button>
                      <select value={productCatFilter} onChange={e => setProductCatFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white/70 text-xs focus:outline-none">
                        <option value="all">All categories</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="flex-1 relative min-w-[100px]">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                        <input value={productSearch} onChange={e => setProductSearch(e.target.value)}
                          placeholder="Search products..."
                          className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-white text-xs placeholder-white/30 focus:outline-none focus:border-yellow-400" />
                      </div>
                      <button onClick={fetchProducts} className="text-white/40 hover:text-yellow-400 p-1.5">
                        <RefreshCw className={`w-4 h-4 ${productsLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {/* Add product form */}
                      <AnimatePresence>
                        {showAddProduct && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <ProductForm data={newProduct} onChange={setNewProduct}
                              onSave={saveProduct} onCancel={() => setShowAddProduct(false)} isNew={true} />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {productsLoading ? (
                        <p className="text-white/30 text-center py-12 text-sm">Loading products...</p>
                      ) : filteredProducts.length === 0 ? (
                        <p className="text-white/30 text-center py-12 text-sm">No products found</p>
                      ) : filteredProducts.map(product => (
                        <div key={product.id}>
                          <AnimatePresence>
                            {editingProduct?.id === product.id && (
                              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <ProductForm data={editingProduct} onChange={setEditingProduct}
                                  onSave={saveProduct} onCancel={() => setEditingProduct(null)} isNew={false} />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {editingProduct?.id !== product.id && (
                            <div className="bg-white/5 border border-yellow-500/20 rounded-xl p-3 flex items-center gap-3">
                              {product.image ? (
                                <img src={product.image} alt={product.name}
                                  className="w-12 h-12 rounded-lg object-contain bg-white/5 p-0.5 flex-shrink-0"
                                  onError={(e: any) => { e.target.style.display = 'none'; }} />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                                  <Package className="w-5 h-5 text-white/20" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold text-sm truncate">{product.name}</p>
                                <div className="flex gap-2 flex-wrap text-xs text-white/40 mt-0.5">
                                  <span className="text-yellow-400/70">{product.category}</span>
                                  <span>৳{Number(product.price_bdt).toLocaleString()}</span>
                                  {product.price_usd && <span>${product.price_usd}</span>}
                                  {product.stock_label && (
                                    <span className={product.stock_label === 'Out of Stock' ? 'text-red-400' : 'text-green-400'}>
                                      {product.stock_label}
                                    </span>
                                  )}
                                  <span className="font-mono opacity-50">{product.id}</span>
                                </div>
                              </div>
                              <div className="flex gap-1 flex-shrink-0 items-center">
                                {/* Active toggle */}
                                <button onClick={() => toggleActive(product.id, product.active)}
                                  title={product.active ? 'Click to hide from shop' : 'Click to show in shop'}
                                  className={`px-2 py-1 rounded text-xs font-semibold transition-colors border ${product.active ? 'text-green-400 border-green-500/30 bg-green-500/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30' : 'text-red-400 border-red-500/30 bg-red-500/10 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/30'}`}>
                                  {product.active ? 'Live' : 'Hidden'}
                                </button>
                                <button onClick={() => setEditingProduct({ ...product })}
                                  className="text-white/40 hover:text-yellow-400 transition-colors p-1.5">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => deleteProduct(product.id)}
                                  className="text-white/40 hover:text-red-400 transition-colors p-1.5">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
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
