import { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, ChevronDown, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type View = 'menu' | 'chat';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'admin';
  created_at: string;
}

function getSessionId() {
  let id = localStorage.getItem('aro_chat_session');
  if (!id) {
    id = 'guest_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('aro_chat_session', id);
  }
  return id;
}

const CONTACTS = [
  {
    id: 'discord',
    label: 'Discord Server',
    sub: 'Join our community',
    href: 'https://discord.gg/c5wrvVcKem',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
      </svg>
    ),
    bg: 'from-indigo-600 to-indigo-700',
    glow: 'shadow-indigo-500/30',
    dot: 'bg-indigo-400',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    sub: '+880 1410-340055',
    href: 'https://wa.me/8801410340055',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
      </svg>
    ),
    bg: 'from-green-600 to-green-700',
    glow: 'shadow-green-500/30',
    dot: 'bg-green-400',
  },
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('menu');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [guestName, setGuestName] = useState('');
  const [nameSet, setNameSet] = useState(false);
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const sessionId = user?.id ?? getSessionId();
  const displayName = user?.name ?? guestName;

  useEffect(() => { if (user) setNameSet(true); }, [user]);

  useEffect(() => {
    if (!open || view !== 'chat') return;
    fetchMessages();
    const channel = supabase.channel('chat_' + sessionId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_id=eq.${sessionId}` }, payload => {
        const m = payload.new as any;
        setMessages(prev => [...prev, { id: m.id, content: m.content, sender: m.sender, created_at: m.created_at }]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [open, view, sessionId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (open) setUnread(0); }, [open]);

  async function fetchMessages() {
    const { data } = await supabase.from('messages').select('id,content,sender,created_at')
      .eq('session_id', sessionId).order('created_at', { ascending: true });
    if (data) setMessages(data as Message[]);
  }

  async function sendMessage() {
    if (!input.trim() || sending) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    await supabase.from('messages').insert({
      session_id: sessionId, user_name: displayName || 'Guest',
      user_email: user?.email ?? null, content: text, sender: 'user',
    });
    setSending(false);
  }

  const handleClose = () => { setOpen(false); setTimeout(() => setView('menu'), 300); };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-24 right-6 z-50 w-[340px] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden border border-white/10"
          >
            {/* ── Header ── */}
            <div className="bg-gradient-to-r from-zinc-900 to-black px-4 py-3.5 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                {view === 'chat' && (
                  <button onClick={() => setView('menu')} className="text-white/40 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-yellow-500/20">
                  <span className="text-black font-black text-xs">AS</span>
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-none">AroStall Support</p>
                  <p className="text-green-400 text-xs flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-pulse" />
                    Online
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="text-white/30 hover:text-white transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {/* ── MENU VIEW ── */}
              {view === 'menu' && (
                <motion.div key="menu" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                  className="bg-zinc-950 p-4 space-y-3">

                  <p className="text-white/50 text-xs text-center pb-1">Choose how you'd like to reach us</p>

                  {/* Discord & WhatsApp */}
                  {CONTACTS.map(c => (
                    <motion.a key={c.id} href={c.href} target="_blank" rel="noopener noreferrer"
                      whileHover={{ scale: 1.02, x: 2 }} whileTap={{ scale: 0.98 }}
                      className={`flex items-center gap-3 bg-gradient-to-r ${c.bg} p-3.5 rounded-xl shadow-lg ${c.glow} group cursor-pointer`}
                    >
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                        {c.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-bold text-sm">{c.label}</p>
                        <p className="text-white/70 text-xs">{c.sub}</p>
                      </div>
                      <div className={`w-2 h-2 ${c.dot} rounded-full animate-pulse`} />
                    </motion.a>
                  ))}

                  {/* Divider */}
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-white/30 text-xs">or</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  {/* Live chat button */}
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setView('chat')}
                    className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-yellow-500/40 p-3.5 rounded-xl transition-all group"
                  >
                    <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-500/20 transition-colors">
                      <MessageCircle className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-white font-bold text-sm">Live Chat</p>
                      <p className="text-white/40 text-xs">Chat directly with us</p>
                    </div>
                    <span className="text-white/20 group-hover:text-yellow-400 transition-colors text-lg">→</span>
                  </motion.button>
                </motion.div>
              )}

              {/* ── CHAT VIEW ── */}
              {view === 'chat' && (
                <motion.div key="chat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                  className="bg-zinc-950 flex flex-col" style={{ height: 360 }}>

                  {!nameSet ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
                      <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/30 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-yellow-400" />
                      </div>
                      <p className="text-white/60 text-sm text-center">What should we call you?</p>
                      <input
                        autoFocus
                        className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20"
                        placeholder="Your name..."
                        value={guestName}
                        onChange={e => setGuestName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && guestName.trim() && setNameSet(true)}
                      />
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => guestName.trim() && setNameSet(true)}
                        className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-yellow-500/20"
                      >
                        Start Chat
                      </motion.button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 && (
                          <div className="text-center py-10">
                            <p className="text-white/25 text-xs leading-relaxed">
                              👋 Hey {displayName}! Send us a message and we'll reply shortly.
                            </p>
                          </div>
                        )}
                        {messages.map(msg => (
                          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'admin' && (
                              <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mr-2 flex-shrink-0 self-end mb-1">
                                <span className="text-black text-xs font-black">A</span>
                              </div>
                            )}
                            <div className={`max-w-[72%] px-3 py-2 rounded-2xl text-sm ${
                              msg.sender === 'user'
                                ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black rounded-br-sm font-medium'
                                : 'bg-white/10 text-white/90 rounded-bl-sm'
                            }`}>
                              <p>{msg.content}</p>
                              <p className={`text-xs mt-0.5 ${msg.sender === 'user' ? 'text-black/40' : 'text-white/30'}`}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={bottomRef} />
                      </div>

                      <div className="p-3 border-t border-white/10 flex gap-2 flex-shrink-0 bg-black/30">
                        <input
                          value={input}
                          onChange={e => setInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && sendMessage()}
                          placeholder="Type a message..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20"
                        />
                        <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                          onClick={sendMessage} disabled={!input.trim() || sending}
                          className="bg-gradient-to-br from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 disabled:opacity-40 text-black p-2.5 rounded-xl transition-colors shadow-md shadow-yellow-500/20"
                        >
                          <Send className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white rounded-full shadow-2xl shadow-green-500/40 flex items-center gap-2 px-4 py-3 transition-all"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="w-5 h-5" />
            </motion.span>
          ) : (
            <motion.span key="msg" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageCircle className="w-5 h-5" />
            </motion.span>
          )}
        </AnimatePresence>
        <span className="font-bold text-sm">Support</span>
        {unread > 0 && !open && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center animate-bounce">
            {unread}
          </span>
        )}
      </motion.button>
    </>
  );
}
