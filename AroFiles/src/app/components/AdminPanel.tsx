import { useState, useEffect } from 'react';
import { X, CheckCircle, Clock, RefreshCw, Package, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';

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

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'delivered'>('all');

  useEffect(() => {
    if (isOpen) fetchOrders();
  }, [isOpen]);

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

  const filtered = orders.filter(o => filter === 'all' || o.status === filter);
  const pendingCount = orders.filter(o => o.status === 'pending').length;

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
                <h2 className="text-xl font-bold text-white">Admin Panel</h2>
                {pendingCount > 0 && (
                  <span className="bg-yellow-500 text-black text-xs font-black px-2 py-0.5 rounded-full">
                    {pendingCount} pending
                  </span>
                )}
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-yellow-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Orders screen */}
            <div className="flex-1 flex flex-col overflow-hidden">
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
                              <span>💳 {order.paymentMethod === 'bkash' ? 'bKash' : 'Nagad'}</span>
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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
