import React, { useState } from 'react';
import { Language, StaffProfile } from '../types';
import { WardanLogo } from './WardanLogo';
import {
  isSupabaseConfigured,
  signInWithSupabaseAuth,
  signUpWithSupabaseAuth,
} from '../lib/supabase';
import {
  Lock,
  Globe,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Clock,
  UserPlus,
  LogIn,
  Mail,
  User,
  Eye,
  EyeOff,
} from 'lucide-react';

interface LoginPageProps {
  lang: Language;
  onToggleLang: () => void;
  onLogin: (staff: StaffProfile) => void;
  staffList: StaffProfile[];
  onRegisterStaff: (newStaff: StaffProfile) => void;
}

export const validatePasswordPolicy = (password: string) => {
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return {
    minLength,
    hasUppercase,
    hasNumber,
    isValid: minLength && hasUppercase && hasNumber,
  };
};

export const LoginPage: React.FC<LoginPageProps> = ({
  lang,
  onToggleLang,
  onLogin,
  staffList,
  onRegisterStaff,
}) => {
  const isAr = lang === 'ar';
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  // Sign In state (empty, no placeholder examples)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // New Staff Registration state (direct sign-up & login without system manager approval)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const loginPolicy = validatePasswordPolicy(password);
  const regPolicy = validatePasswordPolicy(regPassword);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) {
      setError(
        isAr
          ? 'يرجى إدخال البريد الإلكتروني أو اسم الموظف'
          : 'Please enter your email or staff name'
      );
      return;
    }

    if (!loginPolicy.isValid) {
      setError(
        isAr
          ? 'كلمة المرور يجب أن تكون 8 خانات على الأقل وتحتوي على أحرف كبيرة وأرقام'
          : 'Password must be at least 8 characters and contain uppercase letters and numbers'
      );
      return;
    }

    setLoading(true);
    try {
      // 1. If Supabase Auth is configured and identifier is an email, try Supabase Auth first
      if (isSupabaseConfigured() && cleanId.includes('@')) {
        const { staff, error: sbError } = await signInWithSupabaseAuth(
          cleanId,
          password
        );
        if (staff) {
          onLogin(staff);
          return;
        }
        // If not found in Supabase yet, check local staffList fallback before showing error
        const localMatch = staffList.find(
          (s) =>
            (s.email.toLowerCase() === cleanId ||
              s.nameAr.trim() === identifier.trim() ||
              s.nameEn.toLowerCase() === cleanId) &&
            s.password === password
        );
        if (localMatch) {
          onLogin(localMatch);
          return;
        }
        setError(
          isAr
            ? 'بيانات الدخول غير صحيحة، يرجى التأكد من البريد الإلكتروني وكلمة المرور'
            : sbError || 'Invalid credentials'
        );
        return;
      }

      // 2. Local / Hybrid Staff Authentication
      const matchedStaff = staffList.find(
        (s) =>
          s.email.toLowerCase() === cleanId ||
          s.nameAr.trim() === identifier.trim() ||
          s.nameEn.toLowerCase() === cleanId
      );

      if (!matchedStaff || matchedStaff.password !== password) {
        setError(
          isAr
            ? 'بيانات الدخول غير صحيحة، يرجى التأكد من البريد الإلكتروني وكلمة المرور'
            : 'Invalid credentials, please check your email and password'
        );
        return;
      }

      onLogin(matchedStaff);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanName = regName.trim();
    const cleanRole = '';
    const cleanEmail = regEmail.trim().toLowerCase();

    if (!cleanName || !cleanEmail) {
      setError(
        isAr
          ? 'يرجى تعبئة اسم الموظف والبريد الإلكتروني'
          : 'Please fill in your name and email'
      );
      return;
    }

    if (!regPolicy.isValid) {
      setError(
        isAr
          ? 'كلمة المرور يجب أن تكون 8 خانات على الأقل وتحتوي على أحرف كبيرة وأرقام'
          : 'Password must be at least 8 characters and contain uppercase letters and numbers'
      );
      return;
    }

    setLoading(true);
    try {
      // If Supabase Auth is configured, register in Supabase Auth & staff_profiles table
      if (isSupabaseConfigured()) {
        const { staff, error: sbError } = await signUpWithSupabaseAuth(
          cleanEmail,
          regPassword,
          cleanName,
          cleanRole
        );
        if (sbError && sbError !== 'SUPABASE_NOT_CONFIGURED') {
          setError(
            isAr
              ? `تعذر إنشاء الحساب: ${sbError}`
              : `Could not create account: ${sbError}`
          );
          return;
        }
        if (staff) {
          const staffWithPass: StaffProfile = {
            ...staff,
            password: regPassword,
            status: 'approved',
          };
          onRegisterStaff(staffWithPass);
          onLogin(staffWithPass);
          return;
        }
      }

      const exists = staffList.some(
        (s) =>
          s.email.toLowerCase() === cleanEmail ||
          s.nameAr.trim() === cleanName
      );
      if (exists) {
        setError(
          isAr
            ? 'هذا الحساب مسجل مسبقاً، يمكنك تسجيل الدخول مباشرة'
            : 'This account is already registered. Please sign in.'
        );
        return;
      }

      const newStaff: StaffProfile = {
        id: `staff-${Date.now()}`,
        nameAr: cleanName,
        nameEn: cleanName,
        roleAr: cleanRole,
        roleEn: cleanRole,
        email: cleanEmail,
        pin: '1234',
        password: regPassword,
        status: 'approved',
        isAdmin: false,
        createdAt: new Date().toLocaleDateString(isAr ? 'ar-OM' : 'en-US'),
      };

      onRegisterStaff(newStaff);
      onLogin(newStaff);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#F6F3EC] text-[#2B2F21] flex flex-col lg:flex-row overflow-hidden relative"
    >
      {/* Top Floating Language Switcher for iPhone/iPad convenience */}
      <div className="absolute top-5 left-5 right-5 z-30 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#434931]/90 backdrop-blur-md text-[#D5B895] text-xs font-medium border border-[#D5B895]/25 shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>
            {isAr
              ? 'نظام داخلي خاص — وردان'
              : 'Private Internal System — WARDAN'}
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleLang}
          className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 hover:bg-white text-[#434931] text-xs font-semibold shadow-sm border border-[#E2DDD2] transition cursor-pointer active:scale-95"
        >
          <Globe className="w-3.5 h-3.5 text-[#848871]" />
          <span>{isAr ? 'English' : 'العربية'}</span>
        </button>
      </div>

      {/* Brand Visual Showcase Panel */}
      <div className="lg:w-7/12 relative bg-[#434931] text-[#F6F3EC] flex flex-col justify-between p-8 sm:p-12 lg:p-16 min-h-[360px] lg:min-h-screen overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/brand/wardan-entrance.jpg"
            alt="WARDAN"
            className="w-full h-full object-cover object-center opacity-35 scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#333824] via-[#434931]/80 to-[#434931]/65" />
        </div>

        {/* Top Spacer */}
        <div className="relative z-10 pt-8 lg:pt-6">
          <WardanLogo variant="gold" size="xl" />
          <p className="mt-3 text-xs tracking-[0.28em] uppercase text-[#D5B895]/80 font-medium">
            {isAr ? 'مسقط • سلطنة عُمان' : 'MUSCAT • SULTANATE OF OMAN'}
          </p>
        </div>

        {/* Center Editorial Heading */}
        <div className="relative z-10 my-8 max-w-xl">
          <h1
            className={`text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight text-[#FAF8F4] ${
              !isAr ? 'font-editorial tracking-wide' : ''
            }`}
          >
            {isAr
              ? 'مرحباً بك في نظام إدارة وردان'
              : 'Welcome to the WARDAN Management System'}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#E6E1D6]/85 leading-relaxed">
            {isAr
              ? 'منصة داخلية متكاملة لإدارة الطلبات اليومية، تنسيقات المناسبات، المخزون، والتوصيل بتجربة مصممة خصيصاً لفريق وردان.'
              : 'Private internal management workspace crafted exclusively for WARDAN to orchestrate daily bouquets, event installations, and deliveries.'}
          </p>
        </div>

        {/* Bottom Storefront Opening Hours Card */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-[#D5B895]/20 text-xs text-[#E6E1D6]/85">
          <div className="flex items-center gap-3">
            <img
              src="/brand/wardan-sign.jpg"
              alt="WARDAN Sign"
              className="w-12 h-12 rounded-xl object-cover border border-[#D5B895]/40 shadow-sm"
            />
            <div>
              <div className="font-semibold text-[#D5B895] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{isAr ? 'ساعات عمل وردان' : 'WARDAN Opening Hours'}</span>
              </div>
              <p className="mt-0.5 text-[#FAF8F4]/90">
                {isAr
                  ? 'السبت – الخميس: 10:00 صباحاً – 10:00 مساءً | الجمعة والإجازات: مغلق'
                  : 'Saturday – Thursday: 10:00 AM – 10:00 PM | Friday & Holidays: Closed'}
              </p>
            </div>
          </div>

          <span className="text-[#D5B895]/75 font-mono text-[11px]">
            @wardan.oman
          </span>
        </div>
      </div>

      {/* Left / Form Login & Registration Area */}
      <div className="lg:w-5/12 flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-[#F6F3EC]">
        <div className="w-full max-w-md bg-[#FAF8F4] rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(67,73,49,0.08)] border border-[#E6E1D5]">
          {/* Header with WARDAN Logo */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-18 h-18 rounded-2xl bg-[#434931] flex items-center justify-center shadow-md mb-3.5 border border-[#D5B895]/30">
              <WardanLogo variant="gold" size="sm" showSubtitle={false} className="w-14" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#2B2F21]">
              {isAr ? 'تسجيل دخول الموظفين' : 'Staff Portal Access'}
            </h2>
          </div>

          {/* Mode Switcher Tabs: تسجيل الدخول | حساب موظف جديد */}
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#EFECE5] border border-[#E0DBD0] mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#434931] text-[#FAF8F4] shadow-xs'
                  : 'text-[#5A5E4D] hover:text-[#2B2F21]'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#434931] text-[#FAF8F4] shadow-xs'
                  : 'text-[#5A5E4D] hover:text-[#2B2F21]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isAr ? 'حساب موظف جديد' : 'New Staff Account'}</span>
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Email or Username (No placeholder example) */}
              <div>
                <label className="block text-xs font-semibold text-[#5A5E4D] mb-1.5">
                  {isAr
                    ? 'البريد الإلكتروني أو اسم الموظف'
                    : 'Email or Staff Name'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#848871] absolute top-1/2 -translate-y-1/2 start-3.5" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setError('');
                    }}
                    className="w-full ps-10 pe-4 py-3 rounded-2xl bg-[#EFECE5] border border-[#DED9CD] text-[#2B2F21] text-xs sm:text-sm focus:outline-none focus:border-[#434931] transition"
                  />
                </div>
              </div>

              {/* Password (No example, no password conditions shown) */}
              <div>
                <label className="block text-xs font-semibold text-[#5A5E4D] mb-1.5">
                  {isAr ? 'كلمة المرور' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#848871] absolute top-1/2 -translate-y-1/2 start-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    dir="ltr"
                    className="w-full ps-10 pe-10 py-3 rounded-2xl bg-[#EFECE5] border border-[#DED9CD] text-[#2B2F21] text-sm font-mono focus:outline-none focus:border-[#434931] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 -translate-y-1/2 end-3.5 text-[#848871] hover:text-[#2B2F21] cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#434931] hover:bg-[#373C28] disabled:opacity-60 text-[#FAF8F4] font-bold text-sm flex items-center justify-center gap-2.5 shadow-md transition cursor-pointer active:scale-[0.99]"
              >
                <span>
                  {loading
                    ? isAr
                      ? 'جاري تسجيل الدخول...'
                      : 'Signing in...'
                    : isAr
                    ? 'تسجيل الدخول إلى النظام'
                    : 'Sign In to WARDAN'}
                </span>
                {isAr ? (
                  <ArrowLeft className="w-4 h-4 text-[#D5B895]" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-[#D5B895]" />
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Employee Full Name (No example) */}
              <div>
                <label className="block text-xs font-semibold text-[#5A5E4D] mb-1">
                  {isAr ? 'اسم الموظف' : 'Employee Name'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#848871] absolute top-1/2 -translate-y-1/2 start-3.5" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => {
                      setRegName(e.target.value);
                      setError('');
                    }}
                    className="w-full ps-10 pe-4 py-2.5 rounded-2xl bg-[#EFECE5] border border-[#DED9CD] text-[#2B2F21] text-xs sm:text-sm focus:outline-none focus:border-[#434931]"
                  />
                </div>
              </div>

              {/* Email / Username (No example) */}
              <div>
                <label className="block text-xs font-semibold text-[#5A5E4D] mb-1">
                  {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#848871] absolute top-1/2 -translate-y-1/2 start-3.5" />
                  <input
                    type="email"
                    dir="ltr"
                    value={regEmail}
                    onChange={(e) => {
                      setRegEmail(e.target.value);
                      setError('');
                    }}
                    className="w-full ps-10 pe-4 py-2.5 rounded-2xl bg-[#EFECE5] border border-[#DED9CD] text-[#2B2F21] text-xs sm:text-sm focus:outline-none focus:border-[#434931]"
                  />
                </div>
              </div>

              {/* Password (No example, no password conditions shown) */}
              <div>
                <label className="block text-xs font-semibold text-[#5A5E4D] mb-1">
                  {isAr ? 'كلمة المرور' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#848871] absolute top-1/2 -translate-y-1/2 start-3.5" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      setError('');
                    }}
                    className="w-full ps-10 pe-10 py-2.5 rounded-2xl bg-[#EFECE5] border border-[#DED9CD] text-[#2B2F21] text-sm font-mono focus:outline-none focus:border-[#434931]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute top-1/2 -translate-y-1/2 end-3.5 text-[#848871] hover:text-[#2B2F21] cursor-pointer"
                  >
                    {showRegPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#434931] hover:bg-[#373C28] disabled:opacity-60 text-[#FAF8F4] font-bold text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer active:scale-[0.99]"
              >
                <UserPlus className="w-4 h-4 text-[#D5B895]" />
                <span>
                  {loading
                    ? isAr
                      ? 'جاري إنشاء الحساب...'
                      : 'Creating account...'
                    : isAr
                    ? 'إنشاء الحساب وتسجيل الدخول'
                    : 'Create Account & Sign In'}
                </span>
              </button>
            </form>
          )}

          {/* Footer Note */}
          <div className="mt-5 pt-4 border-t border-[#EAE5DA] text-center">
            <p className="text-[11px] text-[#7D8071]">
              {isAr
                ? 'نظام وردان الخاص • مصمم للاستخدام السلس على أجهزة iPhone و iPad'
                : 'WARDAN Private System • Optimized for iPhone & iPad Touch'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
