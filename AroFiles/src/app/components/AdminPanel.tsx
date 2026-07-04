import { useState, useEffect } from 'react';
import { X, CheckCircle, Clock, RefreshCw, Package, Truck, Lock, Plus, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';

const ADMIN_PASSWORD = 'ARO_ADMIN_9f3k2p';

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

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'delivered'>('all');
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
  const [products, setProducts] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    id: '', name: '', category: 'ROBUX', price_bdt: '', price_usd: '', description: '', stock_label: 'In Stock', active: true, image: ''
  });

  useEffect(() => {
    if (isOpen && authed) fetchOrders();
    if (!isOpen) { setAuthed(false); setPwInput(''); setPwError(''); setActiveTab('orders'); }
  }, [isOpen, authed]);

  const handleAuth = () => {
    if (pwInput === ADMIN_PASSWORD) { setAuthed(true); setPwError(''); }
    else { setPwError('Incorrect password'); setPwInput(''); }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setOrders((data ?? []).map(mapRow));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('category');
    if (data) setProducts(data);
  };

  const mapRow = (r: any): Order => ({
    orderId: r.order_id,
    userName: r.user_name,
    userEmail: r.user_email,
    robloxUser: r.roblox_user,
    phone: r.phone,
    txId: r.tx_id,
    paymentMethod: r.payment_method,
    items: r.items ?? [],
    total: r.total,
    status: r.status,
    createdAt: r.created_at,
    deliveredAt: r.delivered_at,
  });

  const completeOrder = async (orderId: string) => {
    setCompleting(orderId);
    try {
      const deliveredAt = new Date().toISOString();
      const { error } = await supabase
        .from('orders')
        .update({ status: 'delivered', delivered_at: deliveredAt })
        .eq('order_id', orderId);
      if (!error) {
        setOrders(prev => prev.map(o =>
          o.orderId === orderId ? { ...o, status: 'delivered', deliveredAt } : o
        ));
      }
    } catch {
      // silent
    } finally {
      setCompleting(null);
    }
  };

  const saveProduct = async (product: any) => {
    setSavingProduct(true);
    try {
      await supabase.from('products').upsert({
        id: product.id,
        name: product.name,
        category: product.category,
        price_bdt: Number(product.price_bdt),
        price_usd: Number(product.price_usd) || null,
        description: product.description,
        stock_label: product.stock_label,
        active: product.active,
        image: product.image,
      });
      await fetchProducts();
      setEditingProduct(null);
      setShowAddProduct(false);
    } finally {
      setSavingProduct(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    await fetchProducts();
  };

  const filtered = orders.filter(o => filter === 'all' || o.status === filter);
  const pendingCount = orders.filter(o => o.status === 'pending').length;

  const SQL_NOTE = `create table products (id text primary key, name text, price_bdt numeric, price_usd numeric, description text, category text, image text, stock_label text default 'In Stock', active boolean default true); alter table products enable row level security; create policy "public reads" on products for select using (true); create policy "auth manages" on products for all to authenticated using (true);`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />
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
                  <span className="bg-yellow-500 text-black text-xs font-black px-2 py-0.5 rounded-full">
                    {pendingCount} pending
                  </span>
                )}
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-yellow-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!authed ? (
              /* Password gate */
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-xs space-y-4">
                  <div className="text-center mb-2">
                    <div className="w-14 h-14 bg-yellow-500/10 border border-yellow-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Lock className="w-6 h-6 text-yellow-400" />
                    </div>
                    <p className="text-white/50 text-sm">Enter admin password to continue</p>
                  </div>
                  <input
                    type="password"
                    value={pwInput}
                    onChange={e => setPwInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAuth()}
                    autoFocus
                    className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-center tracking-widest text-lg"
                    placeholder="••••••••••••"
                  />
                  {pwError && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-sm text-center">
                      {pwError}
                    </motion.p>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={handleAuth}
                    className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold py-3 rounded-xl shadow-lg shadow-yellow-500/20"
                  >
                    Enter
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Tab switcher */}
                <div className="flex border-b border-yellow-500/20 flex-shrink-0">
                  {(['orders', 'products'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => { setActiveTab(tab); if (tab === 'products') fetchProducts(); }}
                      className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${
                        activeTab === tab ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-white/40 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* ── ORDERS TAB ── */}
                {activeTab === 'orders' && (
                  <>
                    {/* Toolbar */}
                    <div className="flex items-center gap-3 px-6 py-3 border-b border-white/5 flex-shrink-0">
                      <div className="flex bg-white/5 rounded-lg overflow-hidden border border-white/10">
                        {(['all', 'pending', 'delivered'] as const).map(f => (
                          <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${filter === f ? 'bg-yellow-500 text-black' : 'text-white/50 hover:text-white'}`}
                          >
                            {f} {f === 'pending' && pendingCount > 0 ? `(${pendingCount})` : ''}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={fetchOrders}
                        className="ml-auto text-white/40 hover:text-yellow-400 transition-colors"
                        title="Refresh"
                      >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    {/* Order list */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {loading ? (
                        <p className="text-white/30 text-center py-12">Loading orders...</p>
                      ) : filtered.length === 0 ? (
                        <div className="text-center py-12">
                          <Package className="w-10 h-10 text-white/20 mx-auto mb-2" />
                          <p className="text-white/30 text-sm">No {filter === 'all' ? '' : filter} orders</p>
                        </div>
                      ) : (
                        filtered.map(order => (
                          <motion.div
                            key={order.orderId}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`rounded-xl border p-4 ${order.status === 'delivered' ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-yellow-500/20'}`}
                          >
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                              {/* Left info */}
                              <div className="space-y-1 min-w-0">
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
                                <p className="text-white text-sm font-semibold">{order.userName} <span className="text-white/40 font-normal">({order.userEmail})</span></p>
                                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-white/50">
                                  <span>🎮 <span className="text-white/80">{order.robloxUser}</span></span>
                                  <span>💳 {order.paymentMethod}</span>
                                  <span>📱 {order.phone}</span>
                                  <span>🔖 <span className="text-white/80">{order.txId}</span></span>
                                </div>
                                <div className="text-xs text-white/40 mt-1">
                                  {order.items.map((i, idx) => (
                                    <span key={idx}>{i.name} ×{i.quantity}{idx < order.items.length - 1 ? ', ' : ''}</span>
                                  ))}
                                </div>
                                <p className="text-xs text-white/30">{new Date(order.createdAt).toLocaleString()}</p>
                              </div>

                              {/* Right — amount + action */}
                              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                <p className="text-yellow-400 font-black text-lg">৳{order.total.toLocaleString()}</p>
                                {order.status === 'pending' ? (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={() => completeOrder(order.orderId)}
                                    disabled={completing === order.orderId}
                                    className="flex items-center gap-1.5 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold text-xs px-4 py-2 rounded-lg transition-colors"
                                  >
                                    <Truck className="w-3.5 h-3.5" />
                                    {completing === order.orderId ? 'Saving...' : 'Mark Delivered'}
                                  </motion.button>
                                ) : (
                                  <p className="text-green-400/60 text-xs">
                                    ✓ {order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : 'Done'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </>
                )}

                {/* ── PRODUCTS TAB ── */}
                {activeTab === 'products' && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* SQL note */}
                    <div className="mx-4 mt-4 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex-shrink-0">
                      <p className="text-blue-300 text-xs font-semibold mb-1">Run this SQL in Supabase to enable product management:</p>
                      <code className="text-blue-200/70 text-[10px] break-all leading-relaxed">{SQL_NOTE}</code>
                    </div>

                    {/* Toolbar */}
                    <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0">
                      <button
                        onClick={() => { setShowAddProduct(true); setEditingProduct(null); setNewProduct({ id: '', name: '', category: 'ROBUX', price_bdt: '', price_usd: '', description: '', stock_label: 'In Stock', active: true, image: '' }); }}
                        className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm px-4 py-2 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Add New Product
                      </button>
                      <button onClick={fetchProducts} className="ml-auto text-white/40 hover:text-yellow-400 transition-colors">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Add Product Form */}
                    <AnimatePresence>
                      {showAddProduct && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mx-4 mb-3 bg-white/5 border border-yellow-500/20 rounded-xl p-4 flex-shrink-0 space-y-3"
                        >
                          <p className="text-yellow-400 font-bold text-sm">Add New Product</p>
                          <div className="grid grid-cols-2 gap-2">
                            <input className={inputCls} placeholder="ID (e.g. LMTD-5)" value={newProduct.id} onChange={e => setNewProduct(p => ({ ...p, id: e.target.value }))} />
                            <input className={inputCls} placeholder="Name" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} />
                            <select className={inputCls} value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))}>
                              <option value="ROBUX">ROBUX</option>
                              <option value="INGAME CURRENCIES">INGAME CURRENCIES</option>
                              <option value="ACCOUNTS">ACCOUNTS</option>
                              <option value="LIMITEDS">LIMITEDS</option>
                            </select>
                            <input className={inputCls} placeholder="Stock Label (e.g. 5 in Stock)" value={newProduct.stock_label} onChange={e => setNewProduct(p => ({ ...p, stock_label: e.target.value }))} />
                            <input className={inputCls} type="number" placeholder="Price BDT" value={newProduct.price_bdt} onChange={e => setNewProduct(p => ({ ...p, price_bdt: e.target.value }))} />
                            <input className={inputCls} type="number" placeholder="Price USD (optional)" value={newProduct.price_usd} onChange={e => setNewProduct(p => ({ ...p, price_usd: e.target.value }))} />
                          </div>
                          <input className={inputCls} placeholder="Description" value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} />
                          <input className={inputCls} placeholder="Image URL" value={newProduct.image} onChange={e => setNewProduct(p => ({ ...p, image: e.target.value }))} />
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 text-white/60 text-sm cursor-pointer">
                              <input type="checkbox" checked={newProduct.active} onChange={e => setNewProduct(p => ({ ...p, active: e.target.checked }))} className="accent-yellow-500" />
                              Active
                            </label>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setShowAddProduct(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 py-2 rounded-lg text-sm font-semibold transition-colors">Cancel</button>
                            <button onClick={() => saveProduct(newProduct)} disabled={savingProduct} className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold py-2 rounded-lg text-sm transition-colors">
                              {savingProduct ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Products List */}
                    <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                      {products.length === 0 ? (
                        <p className="text-white/30 text-center py-12 text-sm">No products found. Make sure the Supabase table exists.</p>
                      ) : products.map(product => (
                        <div key={product.id} className="bg-white/5 border border-yellow-500/20 rounded-xl p-3">
                          {editingProduct?.id === product.id ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <input className={inputCls} placeholder="Name" value={editingProduct.name} onChange={e => setEditingProduct((p: any) => ({ ...p, name: e.target.value }))} />
                                <select className={inputCls} value={editingProduct.category} onChange={e => setEditingProduct((p: any) => ({ ...p, category: e.target.value }))}>
                                  <option value="ROBUX">ROBUX</option>
                                  <option value="INGAME CURRENCIES">INGAME CURRENCIES</option>
                                  <option value="ACCOUNTS">ACCOUNTS</option>
                                  <option value="LIMITEDS">LIMITEDS</option>
                                </select>
                                <input className={inputCls} type="number" placeholder="Price BDT" value={editingProduct.price_bdt ?? ''} onChange={e => setEditingProduct((p: any) => ({ ...p, price_bdt: e.target.value }))} />
                                <input className={inputCls} type="number" placeholder="Price USD" value={editingProduct.price_usd ?? ''} onChange={e => setEditingProduct((p: any) => ({ ...p, price_usd: e.target.value }))} />
                                <input className={inputCls} placeholder="Stock Label" value={editingProduct.stock_label ?? ''} onChange={e => setEditingProduct((p: any) => ({ ...p, stock_label: e.target.value }))} />
                              </div>
                              <input className={inputCls} placeholder="Description" value={editingProduct.description ?? ''} onChange={e => setEditingProduct((p: any) => ({ ...p, description: e.target.value }))} />
                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 text-white/60 text-sm cursor-pointer">
                                  <input type="checkbox" checked={editingProduct.active ?? true} onChange={e => setEditingProduct((p: any) => ({ ...p, active: e.target.checked }))} className="accent-yellow-500" />
                                  Active
                                </label>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => setEditingProduct(null)} className="flex-1 bg-white/5 text-white/60 border border-white/10 py-1.5 rounded-lg text-xs font-semibold">Cancel</button>
                                <button onClick={() => saveProduct(editingProduct)} disabled={savingProduct} className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold py-1.5 rounded-lg text-xs">
                                  {savingProduct ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              {product.image && <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold text-sm truncate">{product.name}</p>
                                <div className="flex gap-2 flex-wrap text-xs text-white/40 mt-0.5">
                                  <span className="text-yellow-400/70">{product.category}</span>
                                  <span>৳{product.price_bdt?.toLocaleString()}</span>
                                  {product.price_usd && <span>${product.price_usd}</span>}
                                  {product.stock_label && <span className={product.stock_label === 'Out of Stock' ? 'text-red-400' : 'text-green-400'}>{product.stock_label}</span>}
                                  {!product.active && <span className="text-red-400/70">Inactive</span>}
                                </div>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <button onClick={() => setEditingProduct({ ...product })} className="text-white/40 hover:text-yellow-400 transition-colors p-1.5">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => deleteProduct(product.id)} className="text-white/40 hover:text-red-400 transition-colors p-1.5">
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
