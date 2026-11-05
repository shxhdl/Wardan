import React, { useState } from 'react';
import { Language, Order, StaffProfile, NewOrderNotification } from '../types';
import { WardanLogo } from './WardanLogo';
import {
  getMinutesUntilOrder,
  formatRemainingMinutes,
} from '../utils/urgentAlerts';
import {
  Bell,
  Search,
  ChevronDown,
  User,
  Menu,
  LogOut,
  X,
  Clock,
  Sparkles,
  CheckCheck,
} from 'lucide-react';

interface TopBarProps {
  lang: Language;
  onSetLang?: (l: Language) => void;
  onToggleLang: () => void;
  currentStaff: StaffProfile;
  staffList: StaffProfile[];
  onChangeStaff: (staff: StaffProfile) => void;
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenMobileMenu: () => void;
  urgentOrders: Order[];
  newOrderNotifications: NewOrderNotification[];
  onClearNewOrderNotifications: () => void;
  currentTime: Date;
  onSelectOrder: (order: Order) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  lang,
  onSetLang,
  onToggleLang,
  currentStaff,
  staffList,
  onChangeStaff,
  onLogout,
  searchQuery,
  onSearchChange,
  onOpenMobileMenu,
  urgentOrders,
  newOrderNotifications,
  onClearNewOrderNotifications,
  currentTime,
  onSelectOrder,
}) => {
  const isAr = lang === 'ar';
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const selectLanguage = (target: Language) => {
    if (onSetLang) {
      onSetLang(target);
    } else if (target !== lang) {
      onToggleLang();
    }
  };

  const approvedStaff = staffList.filter((s) => s.status === 'approved');
  const unreadNewOrders = newOrderNotifications.filter((n) => !n.read);
  const totalNotifications = urgentOrders.length + unreadNewOrders.length;

  return (
    <header className="w-full px-4 sm:px-6 pt-3 pb-2 flex items-center justify-between gap-3 bg-[#F6F3EC] sticky top-0 z-30">
      {/* Start Side (Right in RTL): Segmented Language Switcher ("عربي | EN") + Mobile Menu */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-[#4A5035] text-[#D5B895] shadow-xs active:scale-95 cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Exact Segmented Pill: عربي | EN */}
        <div
          dir="rtl"
          className="inline-flex items-center bg-[#FAF8F4] border border-[#DCD6C8] rounded-xl p-0.5 shadow-2xs"
        >
          <button
            type="button"
            onClick={() => selectLanguage('ar')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              isAr
                ? 'bg-[#4D5339] text-white shadow-2xs'
                : 'text-[#3B3F2E] hover:bg-[#EFECE5]'
            }`}
          >
            عربي
          </button>
          <button
            type="button"
            onClick={() => selectLanguage('en')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              !isAr
                ? 'bg-[#4D5339] text-white shadow-2xs'
                : 'text-[#3B3F2E] hover:bg-[#EFECE5]'
            }`}
          >
            EN
          </button>
        </div>

        <div className="lg:hidden px-2 py-0.5 rounded-lg bg-[#4A5035] flex items-center">
          <WardanLogo variant="gold" size="sm" showSubtitle={false} className="w-14" />
        </div>
      </div>

      {/* End Side (Left in RTL): Search, Notification Bell, and Staff Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search Icon / Expandable Input */}
        {showSearchInput ? (
          <div className="flex items-center bg-[#EFECE5] border border-[#DCD6C8] rounded-full px-3.5 py-1 w-44 sm:w-60 transition-all">
            <Search className="w-4 h-4 text-[#6E7162] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={
                isAr ? 'بحث برقم الطلب أو العميل...' : 'Search order # or client...'
              }
              autoFocus
              className="bg-transparent text-xs text-[#2B2F21] px-2 w-full focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                setShowSearchInput(false);
              }}
              className="text-[#6E7162] hover:text-[#2B2F21] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowSearchInput(true)}
            className="p-1.5 rounded-full hover:bg-[#EAE6DC] text-[#3B3F2E] transition cursor-pointer"
            title={isAr ? 'بحث' : 'Search'}
          >
            <Search className="w-5 h-5 stroke-[1.7]" />
          </button>
        )}

        {/* Notification Bell with Badge for New Orders & Urgent Orders */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-1.5 rounded-full hover:bg-[#EAE6DC] text-[#3B3F2E] transition relative cursor-pointer"
            title={isAr ? 'الإشعارات' : 'Notifications'}
          >
            <Bell className="w-5 h-5 stroke-[1.7]" />
            {totalNotifications > 0 && (
              <span className="absolute top-1 end-1 w-2.5 h-2.5 rounded-full bg-[#C43B2B] ring-2 ring-[#F6F3EC] animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute end-0 mt-2 w-80 sm:w-96 bg-[#FAF8F4] rounded-2xl shadow-xl border border-[#E2DDD2] p-4 z-50 text-xs space-y-4">
              {/* 1. New Order Notifications Section */}
              <div>
                <div className="flex items-center justify-between font-bold text-[#2B2F21] pb-2 mb-2 border-b border-[#EAE5DA]">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#4A5035]" />
                    <span>
                      {isAr
                        ? 'إشعارات الطلبات الجديدة'
                        : 'New Order Notifications'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-[#4A5035] text-[#D5B895] text-[10px]">
                      {newOrderNotifications.length}
                    </span>
                    {newOrderNotifications.length > 0 && (
                      <button
                        type="button"
                        onClick={onClearNewOrderNotifications}
                        className="text-[10px] text-[#6E7162] hover:text-[#2B2F21] inline-flex items-center gap-0.5 cursor-pointer"
                        title={isAr ? 'مسح الإشعارات' : 'Clear all'}
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>{isAr ? 'مسح' : 'Clear'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {newOrderNotifications.length === 0 ? (
                  <div className="p-2.5 rounded-xl bg-[#EFECE5]/70 text-center text-[#5A5E4D]">
                    {isAr
                      ? 'لا توجد إشعارات طلبات جديدة حالياً'
                      : 'No new order notifications right now'}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {newOrderNotifications.map((notif) => (
                      <button
                        key={notif.id}
                        type="button"
                        onClick={() => {
                          onSelectOrder(notif.order);
                          setShowNotifications(false);
                        }}
                        className="w-full text-start p-2.5 rounded-xl bg-[#EFECE5] hover:bg-[#E2DDD2] border border-[#DCD6C8] transition cursor-pointer"
                      >
                        <div className="flex items-center justify-between font-bold text-[#4A5035]">
                          <span>
                            {isAr ? '🌸 طلب جديد' : '🌸 New Order'}{' '}
                            <span dir="ltr">{notif.order.id}</span>
                          </span>
                          <span className="text-[10px] text-[#6E7162]">
                            {notif.createdAt}
                          </span>
                        </div>
                        <div className="font-bold text-[#2B2F21] mt-1">
                          {isAr
                            ? notif.order.customerNameAr
                            : notif.order.customerNameEn}{' '}
                          —{' '}
                          {isAr
                            ? notif.order.orderTypeAr
                            : notif.order.orderTypeEn}
                        </div>
                        <div className="text-[11px] text-[#5A5E4D] mt-0.5">
                          {isAr
                            ? notif.order.deliveryTimeAr
                            : notif.order.deliveryTimeEn}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Urgent Orders Section (<= 30 minutes) */}
              <div>
                <div className="flex items-center justify-between font-bold text-[#2B2F21] pb-2 mb-2 border-b border-[#EAE5DA]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#A8382B]" />
                    <span>
                      {isAr
                        ? 'الطلبات العاجلة (باقي 30 دقيقة)'
                        : 'Urgent Orders (<= 30m)'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#A8382B] text-white text-[10px]">
                    {urgentOrders.length}
                  </span>
                </div>

                {urgentOrders.length === 0 ? (
                  <div className="p-2.5 rounded-xl bg-[#EFECE5]/70 text-center text-[#5A5E4D]">
                    {isAr
                      ? 'لا توجد طلبات باقي على استلامها 30 دقيقة حالياً'
                      : 'No orders due within 30 minutes right now'}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {urgentOrders.map((uo) => {
                      const mins = getMinutesUntilOrder(uo, currentTime);
                      return (
                        <button
                          key={uo.id}
                          type="button"
                          onClick={() => {
                            onSelectOrder(uo);
                            setShowNotifications(false);
                          }}
                          className="w-full text-start p-2.5 rounded-xl bg-[#F4EAE6] hover:bg-[#EFE0DA] border border-[#E8D5CE] transition cursor-pointer"
                        >
                          <div className="flex items-center justify-between font-bold text-[#A9382B]">
                            <span dir="ltr">{uo.id}</span>
                            {mins !== null && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/80">
                                {formatRemainingMinutes(mins, lang)}
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-[#2B2F21] mt-1">
                            {isAr ? uo.customerNameAr : uo.customerNameEn} —{' '}
                            {isAr ? uo.orderTypeAr : uo.orderTypeEn}
                          </div>
                          <div className="text-[11px] text-[#5C4B47] mt-0.5">
                            {isAr ? uo.deliveryTimeAr : uo.deliveryTimeEn}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Staff Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 py-0.5 px-1.5 rounded-2xl hover:bg-[#EAE6DC]/70 transition cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-end leading-tight">
              <div className="font-bold text-sm text-[#2B2F21]">
                {isAr ? currentStaff.nameAr : currentStaff.nameEn}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#6E7162]" />
            </div>
            {currentStaff.avatar ? (
              <img
                src={currentStaff.avatar}
                alt={isAr ? currentStaff.nameAr : currentStaff.nameEn}
                className="w-9 h-9 rounded-full object-cover shadow-2xs border border-[#75745D]"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#8A8970] text-[#FAF8F4] flex items-center justify-center shadow-2xs border border-[#75745D]">
                <User className="w-5 h-5 stroke-[1.8]" />
              </div>
            )}
          </button>

          {showProfileMenu && (
            <div className="absolute end-0 mt-2 w-60 bg-[#FAF8F4] rounded-2xl shadow-xl border border-[#E2DDD2] p-2.5 z-50 text-xs">
              <div className="px-3 py-2 border-b border-[#EAE5DA] mb-1.5">
                <div className="font-bold text-sm text-[#2B2F21]">
                  {isAr ? currentStaff.nameAr : currentStaff.nameEn}
                </div>
                <div className="text-[11px] text-[#6E7162] font-mono mt-0.5">
                  {currentStaff.email}
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-700 hover:bg-red-50 font-bold transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
