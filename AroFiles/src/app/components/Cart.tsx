import { useState } from 'react';
import { X, Minus, Plus, Trash2, ShoppingBag, CreditCard, CheckCircle, AlertCircle, Copy, Check, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { CartItem } from '../App';

type PaymentMethod = 'bkash' | 'nagad';
type Step = 'cart' | 'confirm' | 'method' | 'payment' | 'done';

const PAYMENT_NUMBERS: Record<PaymentMethod, string> = {
  bkash: '01XXXXXXXXX',   // ← replace with your real Bkash number
  nagad: '01XXXXXXXXX',   // ← replace with your real Nagad number
};


function generateOrderId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'ARO-';
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  total: number;
  onCheckoutComplete: () => void;
}

const inputCls = "w-full bg-white/5 border border-yellow-500/30 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all text-sm";

export function Cart({ isOpen, onClose, items, onUpdateQuantity, onRemoveItem, total, onCheckoutComplete }: CartProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('cart');
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [copied, setCopied] = useState(false);
  const [txId, setTxId] = useState('');
  const [phone, setPhone] = useState('');
  const [robloxUser, setRobloxUser] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [orderId] = useState(() => generateOrderId());
  const [showUsernameConfirm, setShowUsernameConfirm] = useState(false);
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);

  // Detect if any Robux item exceeds 500
  const hasHighRobux = items.some(i => i.category === 'ROBUX' && Number(i.name.replace(/,/g, '').split(' ')[0]) > 500);

  const paymentNumber = method ? PAYMENT_NUMBERS[method] : '';

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep('cart'); setMethod(null); setCopied(false);
      setTxId(''); setPhone(''); setRobloxUser(''); setError('');
    }, 400);
  };

  const copyNumber = () => {
    navigator.clipboard.writeText(paymentNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectMethod = (m: PaymentMethod) => {
    setMethod(m);
    setStep('payment');
  };

  const handleSubmit = async () => {
    if (!txId.trim()) { setError('Transaction ID is required'); return; }
    if (!phone.trim()) { setError('Phone number is required'); return; }
    if (!robloxUser.trim()) { setError('Roblox username is required'); return; }

    setSending(true);
    setError('');

    try {
      const { error: dbError } = await supabase.from('orders').insert({
        order_id: orderId,
        user_id: user?.id,
        user_email: user?.email,
        user_name: user?.name,
        items,
        total,
        payment_method: method,
        tx_id: txId,
        phone,
        roblox_user: robloxUser,
        status: 'pending',
      });

      if (dbError) {
        setError('Failed to submit order: ' + dbError.message);
      } else {
        setStep('done');
        onCheckoutComplete();
      }
    } catch (e: any) {
      setError('Unexpected error: ' + (e?.message ?? 'Please try again.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-black shadow-2xl shadow-yellow-500/10 z-50 flex flex-col border-l border-yellow-500/30"
          >
            {/* Header */}
            <div className="p-5 border-b border-yellow-500/20 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                {step !== 'cart' && step !== 'done' && (
                  <button onClick={() => {
                    if (step === 'confirm') setStep('cart');
                    else if (step === 'method') setStep('confirm');
                    else if (step === 'payment') setStep('method');
                  }} className="text-white/40 hover:text-yellow-400 transition-colors mr-1">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <ShoppingBag className="w-5 h-5 text-yellow-400" />
                <h2 className="text-xl font-bold text-white">
                  {step === 'cart' && 'Shopping Cart'}
                  {step === 'confirm' && 'Confirmation'}
                  {step === 'method' && 'Select Payment'}
                  {step === 'payment' && (method === 'bkash' ? 'Pay via bKash' : 'Pay via Nagad')}
                  {step === 'done' && 'Order Placed!'}
                </h2>
              </div>
              <button onClick={handleClose} className="text-white/40 hover:text-yellow-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">

                {/* ── CART ── */}
                {step === 'cart' && (
                  <motion.div key="cart" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }} className="p-5 space-y-4">
                    {items.length === 0 ? (
                      <div className="text-center py-16">
                        <ShoppingBag className="w-14 h-14 text-white/20 mx-auto mb-3" />
                        <p className="text-white/40">Your cart is empty</p>
                      </div>
                    ) : (
                      items.map((item) => (
                        <div key={item.id} className="bg-white/5 rounded-xl p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition-colors">
                          <div className="flex gap-3">
                            <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-contain bg-white/5 flex-shrink-0 p-1" />
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-semibold text-sm mb-1 truncate">{item.name}</h3>
                              <p className="text-yellow-400 text-sm font-medium mb-2">৳{item.price.toLocaleString()}</p>
                              <div className="flex items-center gap-2">
                                <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className="bg-white/10 hover:bg-yellow-500/20 text-white hover:text-yellow-400 w-7 h-7 rounded flex items-center justify-center transition-colors">
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-white w-6 text-center text-sm">{item.quantity}</span>
                                <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="bg-white/10 hover:bg-yellow-500/20 text-white hover:text-yellow-400 w-7 h-7 rounded flex items-center justify-center transition-colors">
                                  <Plus className="w-3 h-3" />
                                </button>
                                <button onClick={() => onRemoveItem(item.id)} className="ml-auto text-red-400 hover:text-red-300 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}

                {/* ── CONFIRM ── */}
                {step === 'confirm' && (
                  <motion.div key="confirm" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }} className="p-5 space-y-5">
                    <p className="text-white/50 text-sm leading-relaxed">Please confirm the following before proceeding to payment:</p>

                    {/* Checkbox 1 — always shown */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCheck1(!check1)}
                      className={`w-full text-left flex items-start gap-4 p-4 rounded-xl border transition-all ${check1 ? 'bg-green-500/10 border-green-500/40' : 'bg-white/5 border-yellow-500/20 hover:border-yellow-500/40'}`}
                    >
                      <div className={`w-6 h-6 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${check1 ? 'bg-green-500 border-green-500' : 'border-yellow-500/50'}`}>
                        {check1 && <Check className="w-4 h-4 text-black" strokeWidth={3} />}
                      </div>
                      <p className="text-white/80 text-sm font-semibold leading-snug uppercase tracking-wide">
                        I CONFIRM THAT MY ACCOUNT DID NOT HIT ROBLOX PLUS TRANSFER LIMIT THIS MONTH
                      </p>
                    </motion.button>

                    {/* Checkbox 2 — only for >500 Robux */}
                    {hasHighRobux && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setCheck2(!check2)}
                        className={`w-full text-left flex items-start gap-4 p-4 rounded-xl border transition-all ${check2 ? 'bg-green-500/10 border-green-500/40' : 'bg-white/5 border-yellow-500/20 hover:border-yellow-500/40'}`}
                      >
                        <div className={`w-6 h-6 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${check2 ? 'bg-green-500 border-green-500' : 'border-yellow-500/50'}`}>
                          {check2 && <Check className="w-4 h-4 text-black" strokeWidth={3} />}
                        </div>
                        <p className="text-white/80 text-sm font-semibold leading-snug uppercase tracking-wide">
                          I HAVE TURNED ON 2FA / ENHANCED PROTECTION AND MY ACCOUNT HAS EXTENDED ROBLOX PLUS SEND LIMIT OF 5000/d
                        </p>
                      </motion.button>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => { if (check1 && (!hasHighRobux || check2)) setStep('method'); }}
                      disabled={!check1 || (hasHighRobux && !check2)}
                      className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-yellow-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Continue to Payment
                    </motion.button>
                  </motion.div>
                )}

                {/* ── METHOD SELECT ── */}
                {step === 'method' && (
                  <motion.div key="method" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }} className="p-5 space-y-4">
                    <p className="text-white/50 text-sm mb-2">Choose your payment method:</p>
                    {(['bkash', 'nagad'] as PaymentMethod[]).map((m) => (
                      <motion.button
                        key={m}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => selectMethod(m)}
                        className="w-full bg-white/5 hover:bg-white/10 border border-yellow-500/20 hover:border-yellow-500/50 rounded-xl p-5 flex items-center gap-4 transition-all"
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${m === 'bkash' ? 'bg-pink-600 text-white' : 'bg-orange-500 text-white'}`}>
                          {m === 'bkash' ? 'bK' : 'N'}
                        </div>
                        <div className="text-left">
                          <p className="text-white font-bold">{m === 'bkash' ? 'bKash' : 'Nagad'}</p>
                          <p className="text-white/40 text-xs">Send to: {PAYMENT_NUMBERS[m]}</p>
                        </div>
                        <div className="ml-auto text-yellow-400/50">→</div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}

                {/* ── PAYMENT FORM ── */}
                {step === 'payment' && method && (
                  <motion.div key="payment" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }} className="p-5 space-y-5">
                    {/* Amount & number */}
                    <div className="bg-yellow-500/5 border border-yellow-500/30 rounded-xl p-5 space-y-4">
                      <div className="text-center">
                        <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Send exactly</p>
                        <p className="text-4xl font-black text-yellow-400">৳{total.toLocaleString()}</p>
                      </div>
                      <div className="h-px bg-yellow-500/20" />
                      <div>
                        <p className="text-white/50 text-xs uppercase tracking-wider mb-2">
                          {method === 'bkash' ? 'bKash' : 'Nagad'} Number
                        </p>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3 border border-yellow-500/20">
                          <span className="text-white font-bold text-lg flex-1 tracking-wider">{paymentNumber}</span>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={copyNumber}
                            className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${copied ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 hover:bg-yellow-500/30'}`}
                          >
                            {copied ? <><Check className="w-3.5 h-3.5" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-xs text-white/50 space-y-1">
                      <p>1. Open {method === 'bkash' ? 'bKash' : 'Nagad'} app → Send Money</p>
                      <p>2. Enter the number above and send <span className="text-yellow-400 font-semibold">৳{total.toLocaleString()}</span></p>
                      <p>3. Copy your <span className="text-white/80">Transaction ID</span> from the confirmation</p>
                      <p>4. Fill in the details below and submit</p>
                    </div>

                    {/* Fields */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Transaction ID</label>
                        <input value={txId} onChange={e => setTxId(e.target.value)} className={inputCls} placeholder="e.g. 8N7A2KQX1P" />
                      </div>
                      <div>
                        <label className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Phone Number (sent from)</label>
                        <input value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="e.g. 01712345678" />
                      </div>
                      <div>
                        <label className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Your Roblox Username</label>
                        <input value={robloxUser} onChange={e => setRobloxUser(e.target.value)} className={inputCls} placeholder="e.g. CoolPlayer123" />
                      </div>
                    </div>

                    {error && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/40 rounded-lg p-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <p className="text-red-300 text-sm">{error}</p>
                      </motion.div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => { if (!robloxUser.trim()) { setError('Roblox username is required'); return; } setShowUsernameConfirm(true); }}
                      disabled={sending}
                      className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black font-black py-4 rounded-xl transition-all shadow-xl shadow-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide uppercase"
                    >
                      {sending ? 'Sending...' : '✅ I Have Sent The Money'}
                    </motion.button>

                    {/* Username confirmation popup */}
                    <AnimatePresence>
                      {showUsernameConfirm && (
                        <>
                          <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70]"
                            onClick={() => setShowUsernameConfirm(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 16 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-[70] px-4"
                          >
                            <div className="bg-zinc-950 border border-yellow-500/40 rounded-2xl overflow-hidden shadow-2xl shadow-yellow-500/10">
                              <div className="px-6 pt-6 pb-4 text-center">
                                <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <span className="text-2xl">⚠️</span>
                                </div>
                                <h3 className="text-white font-bold text-lg mb-2">Confirm Username</h3>
                                <p className="text-white/60 text-sm leading-relaxed">
                                  Are you sure you have typed your username
                                </p>
                                <p className="text-yellow-400 font-black text-xl my-2 tracking-wide break-all">
                                  "{robloxUser}"
                                </p>
                                <p className="text-white/60 text-sm">correctly?</p>
                              </div>
                              <div className="px-6 pb-6 flex gap-3">
                                <button
                                  onClick={() => setShowUsernameConfirm(false)}
                                  className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 py-3 rounded-xl font-semibold transition-colors"
                                >
                                  Go Back
                                </button>
                                <motion.button
                                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                  onClick={() => { setShowUsernameConfirm(false); handleSubmit(); }}
                                  disabled={sending}
                                  className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black py-3 rounded-xl transition-all shadow-lg shadow-yellow-500/20"
                                >
                                  Yes, Confirm
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* ── DONE ── */}
                {step === 'done' && (
                  <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 text-center flex flex-col items-center justify-center h-full">
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                      className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mb-6"
                    >
                      <CheckCircle className="w-10 h-10 text-green-400" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-2">Order Submitted!</h3>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-5 py-3 mb-4">
                      <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Your Order ID</p>
                      <p className="text-yellow-400 font-black text-xl tracking-widest">{orderId}</p>
                    </div>
                    <p className="text-white/50 text-sm mb-2">Your payment details have been sent to us.</p>
                    <p className="text-white/40 text-xs mb-8">We'll deliver to <span className="text-yellow-400">{robloxUser}</span> shortly. Track status in your dashboard.</p>
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={handleClose}
                      className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold px-8 py-3 rounded-xl shadow-lg shadow-yellow-500/20"
                    >
                      Close
                    </motion.button>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Footer — only on cart step */}
            {step === 'cart' && items.length > 0 && (
              <div className="p-5 border-t border-yellow-500/20 bg-white/5 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white/60">Total:</span>
                  <span className="text-yellow-400 text-2xl font-bold">৳{total.toLocaleString()}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { if (!user) return; setCheck1(false); setCheck2(false); setStep('confirm'); }}
                  disabled={!user}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black py-3 rounded-xl font-bold transition-all shadow-lg shadow-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  {user ? 'Checkout' : 'Login to Checkout'}
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
