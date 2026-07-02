import { useState, useEffect } from 'react';
import { X, User, LogOut, Package, Clock, CheckCircle, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { projectId } from '/utils/supabase/info';

interface Order {
  orderId: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  total: number;
  paymentMethod: string;
  robloxUser: string;
  txId: string;
  status: 'pending' | 'delivered';
  createdAt: string;
  deliveredAt?: string;
}

interface UserDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserDashboard({ isOpen, onClose }: UserDashboardProps) {
  const { user, logout, accessToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && accessToken) {
      fetchOrders();
    }
  }, [isOpen, accessToken]);

  async function fetchOrders() {
    if (!accessToken) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f343f1a0/orders`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders ?? []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    onClose();
  }

  return (
    <AnimatePresence>
    {isOpen && (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-black shadow-2xl shadow-yellow-500/10 z-50 overflow-y-auto border-l border-yellow-500/30">
        <div className="p-6 border-b border-yellow-500/20 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="w-6 h-6 text-yellow-400" />
            Account Dashboard
          </h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-yellow-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Profile */}
          <div className="bg-white/5 rounded-xl p-6 border border-yellow-500/20">
            <h3 className="text-xl font-semibold text-yellow-400 mb-4">Profile Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-white/50 text-sm">Name</p>
                <p className="text-white text-lg font-medium">{user?.name}</p>
              </div>
              <div>
                <p className="text-white/50 text-sm">Email</p>
                <p className="text-white text-lg">{user?.email}</p>
              </div>
              <div>
                <p className="text-white/50 text-sm">Member Since</p>
                <p className="text-white/80">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-6 w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 text-red-400 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>

          {/* Order History */}
          <div className="bg-white/5 rounded-xl p-6 border border-yellow-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-yellow-400 flex items-center gap-2">
                <Package className="w-6 h-6" />
                My Orders
              </h3>
              <button onClick={fetchOrders} className="text-white/30 hover:text-yellow-400 text-xs transition-colors">
                ↻ Refresh
              </button>
            </div>

            {loading ? (
              <p className="text-white/40 text-center py-8">Loading orders...</p>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/40">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <motion.div
                    key={order.orderId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl p-4 border transition-colors ${
                      order.status === 'delivered'
                        ? 'bg-green-500/5 border-green-500/30'
                        : 'bg-white/5 border-yellow-500/20'
                    }`}
                  >
                    {/* Order header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-yellow-400 font-black text-sm tracking-wider">{order.orderId}</p>
                        <p className="text-white/40 text-xs flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                      {order.status === 'delivered' ? (
                        <div className="flex items-center gap-1.5 text-green-400 text-xs bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-full font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Delivered
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-yellow-400 text-xs bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-full font-semibold animate-pulse">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </div>
                      )}
                    </div>

                    {/* Items */}
                    <div className="space-y-1 mb-3">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-white/60">{item.name} ×{item.quantity}</span>
                          <span className="text-white/80 font-medium">৳{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-white/30">
                        <Truck className="w-3.5 h-3.5" />
                        {order.paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} • {order.robloxUser}
                      </div>
                      <span className="text-yellow-400 font-bold">৳{order.total.toLocaleString()}</span>
                    </div>

                    {order.status === 'delivered' && order.deliveredAt && (
                      <p className="text-green-400/60 text-xs mt-2 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Delivered on {new Date(order.deliveredAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
    )}
    </AnimatePresence>
  );
}
