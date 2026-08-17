import { useState, useEffect, useRef } from 'react';
import { Star, Send, ChevronDown, ChevronUp, MessageSquarePlus, Shield, Zap, Package, Tag, ArrowRight, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../contexts/SettingsContext';

interface Review {
  id: string;
  name: string;
  rating: number;
  content: string;
  created_at: string;
}

const MOCK_REVIEWS: Review[] = [
  { id: 'm1', name: 'xBlazeFire', rating: 5, content: 'Got my Robux in under 5 minutes. Most trusted shop out there fr 🔥', created_at: '2026-08-10T10:00:00Z' },
  { id: 'm2', name: 'LimitedKing99', rating: 5, content: 'Bought a Royal Crown limited here. Super smooth, legit seller. 10/10 would buy again!', created_at: '2026-08-08T14:30:00Z' },
  { id: 'm3', name: 'AdoptMeFan', rating: 5, content: 'Ordered Adopt Me bucks and received them instantly. Amazing service!', created_at: '2026-08-05T09:15:00Z' },
  { id: 'm4', name: 'FischMaster', rating: 4, content: 'Good prices, quick Discord response. Reliable for in-game currencies.', created_at: '2026-07-30T16:00:00Z' },
  { id: 'm5', name: 'ProGamer_BD', rating: 5, content: 'bKash payment worked perfectly. Got my account within minutes. Highly recommend!', created_at: '2026-07-25T11:45:00Z' },
];

const AVATAR_COLORS = [
  'from-yellow-400 to-amber-600',
  'from-indigo-400 to-purple-600',
  'from-green-400 to-emerald-600',
  'from-pink-400 to-rose-600',
  'from-blue-400 to-cyan-600',
  'from-orange-400 to-red-500',
];

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHovered(n)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            className={`w-4 h-4 transition-colors ${
              n <= (hovered || value) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const date = new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return (
    <div className="flex-none w-64 sm:w-72 bg-zinc-900/60 border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${color} flex items-center justify-center flex-none`}>
          <span className="text-white font-black text-sm">{review.name[0].toUpperCase()}</span>
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold truncate">{review.name}</p>
          <p className="text-white/30 text-[10px]">{date}</p>
        </div>
        <div className="ml-auto flex-none">
          <StarRating value={review.rating} />
        </div>
      </div>
      <p className="text-white/60 text-xs leading-relaxed line-clamp-3">{review.content}</p>
    </div>
  );
}

const GUIDES = [
  {
    id: 'sell',
    label: 'How to Sell',
    icon: Tag,
    color: 'text-green-400',
    steps: [
      'Join our Discord server using the "Sell Your Items" button.',
      'Open a ticket in the #sell-items channel.',
      'Provide your item name, screenshots, and asking price.',
      'Our team will verify and list your item on the marketplace.',
      'Once sold, you receive payment via bKash, Nagad, or crypto.',
    ],
  },
  {
    id: 'limiteds',
    label: 'Buy Limiteds',
    icon: Package,
    color: 'text-yellow-400',
    steps: [
      'Browse the Limiteds section using the top navigation.',
      'Filter by type (Hats, Faces, Hair, etc.) from the left sidebar.',
      'Click "Add to Cart" on the limited you want.',
      'Proceed to checkout and choose your payment method.',
      'After payment, provide your Roblox username.',
      'Item will be transferred to your account within 24 hours.',
    ],
  },
  {
    id: 'ingame',
    label: 'Buy In-Game Items',
    icon: Zap,
    color: 'text-blue-400',
    steps: [
      'Go to the In-Game section and pick your game from the sidebar.',
      'Filter by type: Currency, Items, or Gamepass.',
      'Add items to cart and checkout.',
      'Choose bKash, Nagad, or crypto as payment.',
      'Share your Roblox username and in-game details.',
      'Delivery is instant to a few minutes depending on item.',
    ],
  },
];

function GuideAccordion() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      {GUIDES.map(({ id, label, icon: Icon, color, steps }) => (
        <div key={id} className="bg-zinc-900/50 border border-white/[0.07] rounded-xl overflow-hidden">
          <button
            onClick={() => setOpen(open === id ? null : id)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <span className="flex items-center gap-2.5 text-sm font-semibold text-white/80">
              <Icon className={`w-4 h-4 ${color}`} />
              {label}
            </span>
            {open === id ? (
              <ChevronUp className="w-4 h-4 text-white/30" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/30" />
            )}
          </button>
          <AnimatePresence initial={false}>
            {open === id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <ol className="px-4 pb-4 space-y-2">
                  {steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-xs text-white/50 leading-relaxed">
                      <span className={`flex-none w-5 h-5 rounded-full border ${color.replace('text-', 'border-')}/40 ${color.replace('text-', 'bg-')}/10 flex items-center justify-center font-bold text-[10px] ${color} mt-0.5`}>
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

export function Footer({ onNavigate }: { onNavigate?: (section: string) => void }) {
  const { settings } = useSettings();
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => { if (data && data.length > 0) setReviews(data as Review[]); })
      .catch(() => {});
  }, []);

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 5;

  const submitReview = async () => {
    if (!name.trim() || !content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from('reviews').insert({
        name: name.trim(), rating, content: content.trim(),
      }).select().single();
      if (!error && data) {
        setReviews(prev => [data as Review, ...prev]);
        setSubmitted(true);
        setName(''); setContent(''); setRating(5);
        setTimeout(() => { setSubmitted(false); setShowForm(false); }, 2500);
      }
    } catch {}
    setSubmitting(false);
  };

  return (
    <footer className="border-t border-white/[0.06] bg-gradient-to-b from-zinc-950 to-black mt-8">

      {/* ── Reviews Section ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-white font-bold text-xl">Player Reviews</h2>
              <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-full">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span className="text-yellow-400 font-bold text-sm">{avgRating.toFixed(1)}</span>
                <span className="text-white/30 text-xs">({reviews.length})</span>
              </div>
            </div>
            <p className="text-white/35 text-xs">Real feedback from the community</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 bg-yellow-500/10 hover:bg-yellow-500/15 border border-yellow-500/30 hover:border-yellow-500/50 text-yellow-400 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all"
          >
            <MessageSquarePlus className="w-4 h-4" />
            Drop a Review
          </motion.button>
        </div>

        {/* Review Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-zinc-900/60 border border-yellow-500/20 rounded-2xl p-5">
                {submitted ? (
                  <div className="text-center py-4">
                    <div className="text-3xl mb-2">🎉</div>
                    <p className="text-yellow-400 font-bold">Thanks for your review!</p>
                    <p className="text-white/40 text-sm mt-1">It's now live for everyone to see.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-white font-semibold text-sm">Share your experience</p>
                    <div className="flex items-center gap-3">
                      <span className="text-white/40 text-xs">Rating:</span>
                      <StarRating value={rating} onChange={setRating} />
                    </div>
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your Roblox username..."
                      className="w-full bg-white/5 border border-white/10 focus:border-yellow-500/40 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/25 outline-none transition-all"
                    />
                    <textarea
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      placeholder="Tell others about your experience..."
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 focus:border-yellow-500/40 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/25 outline-none transition-all resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setShowForm(false)}
                        className="px-4 py-2 text-white/40 hover:text-white/70 text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={submitReview}
                        disabled={!name.trim() || !content.trim() || submitting}
                        className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 disabled:opacity-40 text-black font-bold text-sm px-5 py-2 rounded-xl transition-all shadow-md shadow-yellow-500/20"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {submitting ? 'Posting…' : 'Post Review'}
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reviews carousel */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          {reviews.map((review, i) => (
            <ReviewCard key={review.id} review={review} index={i} />
          ))}
        </div>
      </div>

      {/* ── Info + Links grid ── */}
      <div className="border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-xl flex items-center justify-center shadow-md shadow-yellow-500/30">
                <span className="text-black font-black text-xs">AR</span>
              </div>
              <span className="font-bold text-lg text-yellow-400" style={{ fontFamily: "'Cinzel', serif" }}>AroStall</span>
            </div>
            <p className="text-white/35 text-xs leading-relaxed mb-4">
              The most trusted Roblox marketplace in Bangladesh. Buy Robux, Limiteds, accounts, and in-game items safely.
            </p>
            <div className="flex items-center gap-1 text-xs text-white/25">
              <Shield className="w-3 h-3 text-green-400" />
              <span className="text-green-400/70">Verified &amp; Trusted Seller</span>
            </div>
          </div>

          {/* Guides accordion */}
          <div className="lg:col-span-2">
            <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest mb-3">Guides</p>
            <GuideAccordion />
          </div>

          {/* Links column */}
          <div>
            <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest mb-3">Quick Links</p>
            <ul className="space-y-2 mb-6">
              {[
                { label: 'Buy Robux', section: 'ROBUX' },
                { label: 'Buy Limiteds', section: 'LIMITEDS' },
                { label: 'In-Game Items', section: 'INGAME CURRENCIES' },
                { label: 'Accounts', section: 'ACCOUNTS' },
              ].map(({ label, section }) => (
                <li key={section}>
                  <button
                    onClick={() => onNavigate?.(section)}
                    className="flex items-center gap-1.5 text-white/40 hover:text-yellow-400 text-xs font-medium transition-colors group"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>

            <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest mb-3">Contact Us</p>
            <div className="space-y-2">
              <a
                href={settings.discord_url || 'https://discord.gg/c5wrvVcKem'}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-indigo-400/70 hover:text-indigo-400 text-xs font-medium transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current flex-none">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                </svg>
                Discord Server
                <ExternalLink className="w-2.5 h-2.5 opacity-50" />
              </a>
              <a
                href={`https://wa.me/${settings.whatsapp_number || '8801410340055'}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-green-400/70 hover:text-green-400 text-xs font-medium transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current flex-none">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                </svg>
                WhatsApp
                <ExternalLink className="w-2.5 h-2.5 opacity-50" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Copyright bar ── */}
      <div className="border-t border-white/[0.04] bg-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/20 text-xs">
            © {new Date().getFullYear()} AroStall. All rights reserved. Not affiliated with Roblox Corporation.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-white/15 text-xs">arostall.xyz</span>
            <span className="text-white/10 text-xs">|</span>
            <span className="text-white/15 text-xs">Made with ❤️ in Bangladesh</span>
          </div>
        </div>
      </div>

    </footer>
  );
}
