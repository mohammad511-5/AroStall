import { createContext, useContext, useState, ReactNode } from 'react';

export type Lang = 'en' | 'bn';

export const translations = {
  en: {
    login: 'Login',
    cart: 'Cart',
    exploreShop: 'Explore Shop',
    trustedBadge: '#1 Trusted Roblox Marketplace',
    heroTitle1: 'Premium',
    heroTitle2: 'Items',
    heroSubtitle: 'Unbeatable Prices',
    heroDesc: 'The safest and fastest marketplace for Robux, Limited Items, and Game Bundles. Join 300+ happy gamers getting the best deals today.',
    trustedBy: 'Trusted by 300+',
    selectRobux: 'Select Robux Amount',
    selectRobuxSub: 'Choose how many Robux you want to purchase',
    robuxAmount: 'Robux Amount',
    price: 'Price',
    rate: 'Rate: ৳850 per 1,000 Robux',
    customAmount: 'Or enter custom amount:',
    addToCart: 'Add to Cart',
    comingSoon: 'COMING SOON',
    shoppingCart: 'Shopping Cart',
    cartEmpty: 'Your cart is empty',
    total: 'Total:',
    checkout: 'Checkout',
    loginToCheckout: 'Login to Checkout',
    accountDashboard: 'Account Dashboard',
    profileInfo: 'Profile Information',
    name: 'Name',
    email: 'Email',
    memberSince: 'Member Since',
    logout: 'Logout',
    transactionHistory: 'Transaction History',
    noTransactions: 'No transactions yet',
    signUp: 'Sign Up',
    checkEmail: 'Check your email',
    checkEmailDesc: 'Click the link in the email to activate your account, then come back and log in.',
    gotIt: 'Got it',
    password: 'Password',
    dontHaveAccount: "Don't have an account? Sign up",
    haveAccount: 'Already have an account? Login',
  },
  bn: {
    login: 'লগইন',
    cart: 'কার্ট',
    exploreShop: 'দোকান দেখুন',
    trustedBadge: '#১ বিশ্বস্ত রোবলক্স মার্কেটপ্লেস',
    heroTitle1: 'প্রিমিয়াম',
    heroTitle2: 'আইটেম',
    heroSubtitle: 'অতুলনীয় মূল্য',
    heroDesc: 'রোবাক্স, লিমিটেড আইটেম ও গেম বান্ডেলের জন্য সবচেয়ে নিরাপদ ও দ্রুত মার্কেটপ্লেস। ৩০০+ সন্তুষ্ট গেমারের সাথে যোগ দিন।',
    trustedBy: '৩০০+ জনের বিশ্বাস',
    selectRobux: 'রোবাক্স পরিমাণ নির্বাচন করুন',
    selectRobuxSub: 'আপনি কত রোবাক্স কিনতে চান তা বেছে নিন',
    robuxAmount: 'রোবাক্স পরিমাণ',
    price: 'মূল্য',
    rate: 'হার: প্রতি ১,০০০ রোবাক্সে ৳৮৫০',
    customAmount: 'বা কাস্টম পরিমাণ লিখুন:',
    addToCart: 'কার্টে যোগ করুন',
    comingSoon: 'শীঘ্রই আসছে',
    shoppingCart: 'শপিং কার্ট',
    cartEmpty: 'আপনার কার্ট খালি',
    total: 'মোট:',
    checkout: 'চেকআউট',
    loginToCheckout: 'চেকআউটের জন্য লগইন করুন',
    accountDashboard: 'অ্যাকাউন্ট ড্যাশবোর্ড',
    profileInfo: 'প্রোফাইল তথ্য',
    name: 'নাম',
    email: 'ইমেইল',
    memberSince: 'সদস্যপদের তারিখ',
    logout: 'লগআউট',
    transactionHistory: 'লেনদেনের ইতিহাস',
    noTransactions: 'এখনো কোনো লেনদেন নেই',
    signUp: 'নিবন্ধন করুন',
    checkEmail: 'আপনার ইমেইল চেক করুন',
    checkEmailDesc: 'ইমেইলের লিংকে ক্লিক করে অ্যাকাউন্ট সক্রিয় করুন, তারপর ফিরে এসে লগইন করুন।',
    gotIt: 'ঠিক আছে',
    password: 'পাসওয়ার্ড',
    dontHaveAccount: 'অ্যাকাউন্ট নেই? নিবন্ধন করুন',
    haveAccount: 'অ্যাকাউন্ট আছে? লগইন করুন',
  },
};

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: typeof translations['en'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
