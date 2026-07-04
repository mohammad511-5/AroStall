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
    password: 'Password',
    dontHaveAccount: "Don't have an account? Sign up",
    haveAccount: 'Already have an account? Login',
    nagadComingSoon: 'Nagad — Coming Soon',
    confirmStep: 'Please confirm before proceeding:',
    confirmTransfer: 'I CONFIRM THAT MY ACCOUNT DID NOT HIT ROBLOX PLUS TRANSFER LIMIT THIS MONTH',
    confirm2FA: 'I HAVE TURNED ON 2FA / ENHANCED PROTECTION AND MY ACCOUNT HAS EXTENDED ROBLOX PLUS SEND LIMIT OF 5000/d',
    confirmLimited: 'I CONFIRM THAT I HAVE ROBLOX PLUS AND A SMALL LIMITED TO TRADE OFFHOLD',
    continuePayment: 'Continue to Payment',
    selectPayment: 'Select Payment Method',
    payViaBkash: 'Pay via bKash',
    sendExactly: 'Send exactly',
    robuxAmount2: 'Robux Amount',
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
    password: 'পাসওয়ার্ড',
    dontHaveAccount: 'অ্যাকাউন্ট নেই? নিবন্ধন করুন',
    haveAccount: 'অ্যাকাউন্ট আছে? লগইন করুন',
    nagadComingSoon: 'নগদ — শীঘ্রই আসছে',
    confirmStep: 'এগিয়ে যাওয়ার আগে নিশ্চিত করুন:',
    confirmTransfer: 'আমি নিশ্চিত করছি যে আমার অ্যাকাউন্ট এই মাসে রোবলক্স প্লাস ট্রান্সফার সীমা ছাড়িয়ে যায়নি',
    confirm2FA: 'আমি ২এফএ / উন্নত সুরক্ষা চালু করেছি এবং আমার অ্যাকাউন্টে ৫০০০/দিন রোবলক্স প্লাস সেন্ড সীমা রয়েছে',
    confirmLimited: 'আমি নিশ্চিত করছি যে আমার রোবলক্স প্লাস আছে এবং ট্রেড অফহোল্ডের জন্য একটি ছোট লিমিটেড আছে',
    continuePayment: 'পেমেন্টে এগিয়ে যান',
    selectPayment: 'পেমেন্ট পদ্ধতি নির্বাচন করুন',
    payViaBkash: 'বিকাশে পেমেন্ট করুন',
    sendExactly: 'ঠিক এই পরিমাণ পাঠান',
    robuxAmount2: 'রোবাক্স পরিমাণ',
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
  if (!ctx) return { lang: 'en' as Lang, setLang: () => {}, t: translations['en'] };
  return ctx;
}
