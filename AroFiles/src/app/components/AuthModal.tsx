import { useState, useRef } from 'react';
import { X, Lock, Mail, User, AlertCircle, ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { SecurityBadge } from './SecurityBadge';

type Screen = 'login' | 'signup' | 'verify-signup' | 'forgot-email' | 'forgot-otp' | 'forgot-newpass';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const inputCls = "w-full bg-white/5 border border-yellow-500/30 rounded-lg pl-11 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30 transition-all";
const btnPrimary = "w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black font-bold py-3 rounded-lg transition-all shadow-lg shadow-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed";

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(8, '').split('').slice(0, 8);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handleChange = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = d;
    const joined = next.join('').replace(/ /g, '');
    onChange(joined);
    if (d && i < 5) setTimeout(() => inputs.current[i + 1]?.focus(), 0);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8);
    onChange(pasted);
    const last = Math.min(pasted.length, 5);
    setTimeout(() => inputs.current[last]?.focus(), 0);
    e.preventDefault();
  };

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] === ' ' ? '' : digits[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          whileFocus={{ scale: 1.08, borderColor: '#facc15' }}
          className="w-9 h-12 text-center text-lg font-bold text-white bg-white/5 border border-yellow-500/30 rounded-xl focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30 transition-all caret-yellow-400"
        />
      ))}
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-500/10 border border-red-500/40 rounded-lg p-3 flex items-start gap-2"
    >
      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
      <p className="text-red-300 text-sm">{msg}</p>
    </motion.div>
  );
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [screen, setScreen] = useState<Screen>('login');
  const [dir, setDir] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup, verifyOtp, sendForgotOtp, updatePassword } = useAuth();

  const go = (s: Screen, d = 1) => { setDir(d); setError(''); setOtp(''); setScreen(s); };

  const reset = () => {
    setScreen('login'); setDir(1);
    setEmail(''); setPassword(''); setName('');
    setOtp(''); setNewPass(''); setConfirmPass(''); setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  const wrap = async (fn: () => Promise<void>) => {
    setError(''); setLoading(true);
    try { await fn(); } catch { setError('An unexpected error occurred'); }
    finally { setLoading(false); }
  };

  // ── Login ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    wrap(async () => {
      const r = await login(email, password);
      if (r.success) handleClose();
      else setError(r.error || 'Login failed');
    });
  };

  // ── Signup ──
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    wrap(async () => {
      const r = await signup(email, password, name);
      if (r.success) go('verify-signup');
      else setError(r.error || 'Signup failed');
    });
  };

  // ── Verify signup OTP ──
  const handleVerifySignup = async () => {
    if (otp.length < 8) { setError('Enter the full 8-digit code'); return; }
    wrap(async () => {
      const r = await verifyOtp(email, otp, 'signup');
      if (r.success) handleClose();
      else setError(r.error || 'Invalid code');
    });
  };

  // ── Forgot — send OTP ──
  const handleForgotSend = async (e: React.FormEvent) => {
    e.preventDefault();
    wrap(async () => {
      const r = await sendForgotOtp(email);
      if (r.success) go('forgot-otp');
      else setError(r.error || 'Failed to send code');
    });
  };

  // ── Forgot — verify OTP ──
  const handleForgotOtp = async () => {
    if (otp.length < 8) { setError('Enter the full 8-digit code'); return; }
    wrap(async () => {
      const r = await verifyOtp(email, otp, 'email');
      if (r.success) go('forgot-newpass');
      else setError(r.error || 'Invalid code');
    });
  };

  // ── Forgot — set new password ──
  const handleNewPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPass !== confirmPass) { setError('Passwords do not match'); return; }
    wrap(async () => {
      const r = await updatePassword(newPass);
      if (r.success) handleClose();
      else setError(r.error || 'Failed to update password');
    });
  };

  const screenTitle: Record<Screen, string> = {
    login: 'Login',
    signup: 'Sign Up',
    'verify-signup': 'Verify Email',
    'forgot-email': 'Forgot Password',
    'forgot-otp': 'Enter Code',
    'forgot-newpass': 'New Password',
  };

  const canGoBack: Partial<Record<Screen, Screen>> = {
    signup: 'login',
    'forgot-email': 'login',
    'forgot-otp': 'forgot-email',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 px-4"
          >
            <div className="bg-black rounded-2xl shadow-2xl border border-yellow-500/30 overflow-hidden">
              {/* Top bar */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <div className="flex items-center gap-2">
                  {canGoBack[screen] && (
                    <button onClick={() => go(canGoBack[screen]!, -1)} className="text-white/40 hover:text-yellow-400 transition-colors mr-1">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  <h2 className="text-2xl font-bold text-white">{screenTitle[screen]}</h2>
                </div>
                <button onClick={handleClose} className="text-white/40 hover:text-yellow-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Screens */}
              <div className="px-6 pb-6 overflow-hidden">
                <AnimatePresence mode="wait" custom={dir}>
                  <motion.div
                    key={screen}
                    custom={dir}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  >

                    {/* ── LOGIN ── */}
                    {screen === 'login' && (
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-500/60" />
                          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                            className={inputCls} placeholder="your@email.com" required />
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-500/60" />
                          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                            className={inputCls} placeholder="••••••••" required minLength={6} />
                        </div>
                        <div className="text-right -mt-1">
                          <button type="button" onClick={() => go('forgot-email')}
                            className="text-yellow-400/70 hover:text-yellow-400 text-xs transition-colors">
                            Forgot password?
                          </button>
                        </div>
                        {error && <ErrorBox msg={error} />}
                        <button type="submit" disabled={loading} className={btnPrimary}>
                          {loading ? 'Logging in...' : 'Login'}
                        </button>
                        <p className="text-center text-sm text-white/40 pt-1">
                          No account?{' '}
                          <button type="button" onClick={() => go('signup')} className="text-yellow-400 hover:text-yellow-300 transition-colors">
                            Sign up
                          </button>
                        </p>
                        <SecurityBadge />
                      </form>
                    )}

                    {/* ── SIGNUP ── */}
                    {screen === 'signup' && (
                      <form onSubmit={handleSignup} className="space-y-4">
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-500/60" />
                          <input type="text" value={name} onChange={e => setName(e.target.value)}
                            className={inputCls} placeholder="Your name" required />
                        </div>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-500/60" />
                          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                            className={inputCls} placeholder="your@email.com" required />
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-500/60" />
                          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                            className={inputCls} placeholder="••••••••" required minLength={6} />
                        </div>
                        {error && <ErrorBox msg={error} />}
                        <button type="submit" disabled={loading} className={btnPrimary}>
                          {loading ? 'Creating account...' : 'Sign Up'}
                        </button>
                        <p className="text-center text-sm text-white/40 pt-1">
                          Have an account?{' '}
                          <button type="button" onClick={() => go('login', -1)} className="text-yellow-400 hover:text-yellow-300 transition-colors">
                            Login
                          </button>
                        </p>
                        <SecurityBadge />
                      </form>
                    )}

                    {/* ── VERIFY SIGNUP OTP ── */}
                    {screen === 'verify-signup' && (
                      <div className="space-y-6">
                        <div className="text-center">
                          <div className="w-14 h-14 bg-yellow-500/10 border border-yellow-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                            <ShieldCheck className="w-7 h-7 text-yellow-400" />
                          </div>
                          <p className="text-white/50 text-sm">We sent a 8-digit code to</p>
                          <p className="text-yellow-400 font-semibold">{email}</p>
                        </div>
                        <OtpInput value={otp} onChange={setOtp} />
                        {error && <ErrorBox msg={error} />}
                        <button onClick={handleVerifySignup} disabled={loading} className={btnPrimary}>
                          {loading ? 'Verifying...' : 'Verify & Create Account'}
                        </button>
                        <p className="text-center text-xs text-white/30">
                          Didn't receive it?{' '}
                          <button type="button" onClick={() => go('signup', -1)} className="text-yellow-400/70 hover:text-yellow-400 transition-colors">
                            Go back
                          </button>
                        </p>
                      </div>
                    )}

                    {/* ── FORGOT — ENTER EMAIL ── */}
                    {screen === 'forgot-email' && (
                      <form onSubmit={handleForgotSend} className="space-y-4">
                        <p className="text-white/50 text-sm pb-1">Enter your email and we'll send you a 8-digit reset code.</p>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-500/60" />
                          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                            className={inputCls} placeholder="your@email.com" required />
                        </div>
                        {error && <ErrorBox msg={error} />}
                        <button type="submit" disabled={loading} className={btnPrimary}>
                          {loading ? 'Sending code...' : 'Send Reset Code'}
                        </button>
                      </form>
                    )}

                    {/* ── FORGOT — ENTER OTP ── */}
                    {screen === 'forgot-otp' && (
                      <div className="space-y-6">
                        <div className="text-center">
                          <div className="w-14 h-14 bg-yellow-500/10 border border-yellow-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                            <KeyRound className="w-7 h-7 text-yellow-400" />
                          </div>
                          <p className="text-white/50 text-sm">Enter the 8-digit code sent to</p>
                          <p className="text-yellow-400 font-semibold">{email}</p>
                        </div>
                        <OtpInput value={otp} onChange={setOtp} />
                        {error && <ErrorBox msg={error} />}
                        <button onClick={handleForgotOtp} disabled={loading} className={btnPrimary}>
                          {loading ? 'Verifying...' : 'Verify Code'}
                        </button>
                        <p className="text-center text-xs text-white/30">
                          Didn't receive it?{' '}
                          <button type="button" onClick={() => go('forgot-email', -1)} className="text-yellow-400/70 hover:text-yellow-400 transition-colors">
                            Resend
                          </button>
                        </p>
                      </div>
                    )}

                    {/* ── FORGOT — NEW PASSWORD ── */}
                    {screen === 'forgot-newpass' && (
                      <form onSubmit={handleNewPass} className="space-y-4">
                        <p className="text-white/50 text-sm pb-1">Choose a new password for your account.</p>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-500/60" />
                          <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)}
                            className={inputCls} placeholder="New password" required minLength={6} />
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-500/60" />
                          <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                            className={inputCls} placeholder="Confirm password" required minLength={6} />
                        </div>
                        {error && <ErrorBox msg={error} />}
                        <button type="submit" disabled={loading} className={btnPrimary}>
                          {loading ? 'Saving...' : 'Set New Password'}
                        </button>
                      </form>
                    )}

                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
