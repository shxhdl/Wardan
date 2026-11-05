import React, { useState } from 'react';
import { Language, Order, StaffProfile } from '../types';
import {
  getMinutesUntilOrder,
  isOrderUrgent,
  formatRemainingMinutes,
  playUrgentAlertSound,
} from '../utils/urgentAlerts';
import {
  ShoppingBag,
  Package,
  CheckCircle,
  Truck,
  Plus,
  ClipboardList,
  Check,
  Clock,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Pencil,
  Trash2,
  Volume2,
  VolumeX,
  UserPlus,
  UserCheck,
  UserX,
} from 'lucide-react';

interface DashboardViewProps {
  lang: Language;
  orders: Order[];
  currentTime: Date;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSelectOrder: (order: Order) => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onToggleOrderCompleted: (orderId: string) => void;
  onTogglePaymentStatus: (orderId: string) => void;
  onOpenNewOrder: () => void;
  onNavigateOrders: () => void;
  isAdmin?: boolean;
  pendingStaff?: StaffProfile[];
  onApproveStaff?: (staffId: string) => void;
  onRejectStaff?: (staffId: string) => void;
}

/* Custom 6-Petal Floral Icon matching "طلبيات اليوم" card in V2 mockup */
const FloralBloomIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="18" cy="18" r="3.5" stroke="currentColor" strokeWidth="1.6" />
    <ellipse cx="18" cy="8.5" rx="3.2" ry="4.5" stroke="currentColor" strokeWidth="1.5" />
    <ellipse cx="18" cy="27.5" rx="3.2" ry="4.5" stroke="currentColor" strokeWidth="1.5" />
    <ellipse
      cx="9.8"
      cy="13.2"
      rx="3.2"
      ry="4.5"
      transform="rotate(-60 9.8 13.2)"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <ellipse
      cx="26.2"
      cy="22.8"
      rx="3.2"
      ry="4.5"
      transform="rotate(-60 26.2 22.8)"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <ellipse
      cx="26.2"
      cy="13.2"
      rx="3.2"
      ry="4.5"
      transform="rotate(60 26.2 13.2)"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <ellipse
      cx="9.8"
      cy="22.8"
      rx="3.2"
      ry="4.5"
      transform="rotate(60 9.8 22.8)"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

/* Custom Envelope with Heart Icon matching "بطاقة الإهداء" column in V2 mockup */
const GiftCardEnvelopeIcon: React.FC<{ className?: string }> = ({
  className = 'w-5 h-5',
}) => (
  <svg
    viewBox="0 0 24 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect
      x="1.5"
      y="2"
      width="21"
      height="16"
      rx="2.5"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M2.5 3L12 10.5L21.5 3"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 13.2C12 13.2 9.5 11.4 9.5 9.9C9.5 9.1 10.1 8.5 10.9 8.5C11.4 8.5 11.8 8.8 12 9.2C12.2 8.8 12.6 8.5 13.1 8.5C13.9 8.5 14.5 9.1 14.5 9.9C14.5 11.4 12 13.2 12 13.2Z"
      fill="currentColor"
    />
  </svg>
);

export const DashboardView: React.FC<DashboardViewProps> = ({
  lang,
  orders,
  currentTime,
  soundEnabled,
  onToggleSound,
  onSelectOrder,
  onEditOrder,
  onDeleteOrder,
  onToggleOrderCompleted,
  onTogglePaymentStatus,
  onOpenNewOrder,
  isAdmin = false,
  pendingStaff = [],
  onApproveStaff,
  onRejectStaff,
}) => {
  const isAr = lang === 'ar';
  const [filterMode, setFilterMode] = useState<
    'all' | 'preparing' | 'completed' | 'pickup' | 'delivery' | 'urgent'
  >('all');

  // Dynamic live counts calculated directly from the actual orders list
  const totalOrdersCount = orders.length;
  const preparingCount = orders.filter((o) => !o.isCompleted).length;
  const completedCount = orders.filter((o) => o.isCompleted).length;
  const pickupCount = orders.filter((o) => o.fulfillmentType === 'pickup').length;
  const deliveryCount = orders.filter((o) => o.fulfillmentType === 'delivery').length;

  // Urgent orders = uncompleted orders with <= 30 minutes left until pickup/delivery
  const urgentOrders = orders.filter((o) => isOrderUrgent(o, currentTime));
  const urgentCount = urgentOrders.length;

  const visibleOrders = orders.filter((o) => {
    if (filterMode === 'preparing') return !o.isCompleted;
    if (filterMode === 'completed') return o.isCompleted;
    if (filterMode === 'pickup') return o.fulfillmentType === 'pickup';
    if (filterMode === 'delivery') return o.fulfillmentType === 'delivery';
    if (filterMode === 'urgent') return isOrderUrgent(o, currentTime);
    return true;
  });

  return (
    <div className="space-y-4">
      {/* 1. Hero Banner (Clean High-Res Photo + Exact Same Banner Dimensions) */}
      <div className="relative rounded-2xl overflow-hidden bg-[#3D3A29] h-[146px] sm:h-[162px] flex items-center shadow-xs border border-[#DFD9CC]">
        <img
          src="./brand/wardan-hero-clean.jpg"
          alt="WARDAN Oman"
          className={`absolute inset-0 w-full h-full object-cover object-[center_26%] pointer-events-none ${
            !isAr ? '-scale-x-100' : ''
          }`}
        />

        <div
          className={`absolute inset-0 ${
            isAr
              ? 'bg-gradient-to-l from-[#323622]/90 via-[#3B3E28]/60 via-42% to-black/10'
              : 'bg-gradient-to-r from-[#323622]/90 via-[#3B3E28]/60 via-42% to-black/10'
          }`}
        />

        <div className="relative z-10 px-6 sm:px-10 py-6 w-full sm:w-[46%] flex flex-col items-center text-center">
          <h1
            className={`text-2xl sm:text-4xl font-bold text-[#FAF8F4] tracking-tight drop-shadow-xs ${
              !isAr ? 'font-editorial text-3xl sm:text-4xl' : ''
            }`}
          >
            {isAr ? 'مرحباً في وردان' : 'Welcome to WARDAN'}
          </h1>
          <p className="mt-1.5 text-xs sm:text-base text-[#E6DFD3] font-medium drop-shadow-2xs">
            {isAr
              ? 'نظام إدارة الطلبات والتجهيز'
              : 'Order & Floral Preparation System'}
          </p>
          <div className="w-16 h-[1.5px] bg-[#D5B895]/85 mt-3 rounded-full" />
        </div>
      </div>

      {/* Pending Staff Approval Banner for System Manager (شهد - مديرة النظام) */}
      {isAdmin && pendingStaff.length > 0 && (
        <div className="bg-[#FAF8F4] rounded-2xl p-4 border-2 border-[#D5B895] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4A5035] text-[#D5B895] flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-[#2B2F21]">
                {isAr
                  ? `طلبات تسجيل حسابات موظفين جدد (${pendingStaff.length}) بانتظار موافقتك`
                  : `New Staff Account Requests (${pendingStaff.length}) Awaiting Your Approval`}
              </div>
              <div className="text-xs text-[#6E7162]">
                {isAr
                  ? 'بصفتك مديرة النظام، يمكنك قبول أو رفض طلبات انضمام الموظفين الجدد مباشرة:'
                  : 'As System Manager, you can approve or reject new employee accounts below:'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {pendingStaff.map((ps) => (
              <div
                key={ps.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#EFECE5] border border-[#DCD6C8] text-xs"
              >
                <div>
                  <span className="font-bold text-[#2B2F21]">
                    {isAr ? ps.nameAr : ps.nameEn}
                  </span>
                  <span className="text-[#6E7162] mx-1">•</span>
                  <span className="text-[11px] text-[#5A5E4D]">
                    {isAr ? ps.roleAr : ps.roleEn} ({ps.email})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onApproveStaff?.(ps.id)}
                  className="px-2.5 py-1 rounded-lg bg-[#4A5035] hover:bg-[#373C28] text-[#FAF8F4] font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#D5B895]" />
                  <span>{isAr ? 'قبول' : 'Approve'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRejectStaff?.(ps.id)}
                  className="px-2.5 py-1 rounded-lg bg-[#F7E1DD] hover:bg-[#F0CEC8] text-[#A8382B] font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>{isAr ? 'رفض' : 'Reject'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Five KPI Summary Cards Row (Live Dynamic Counts) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: طلبيات اليوم */}
        <button
          type="button"
          onClick={() => setFilterMode('all')}
          className={`rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between text-start transition cursor-pointer shadow-xs ${
            filterMode === 'all'
              ? 'bg-[#52583C] text-[#FAF8F4] ring-2 ring-[#4A5035]/30'
              : 'bg-[#52583C]/95 hover:bg-[#52583C] text-[#FAF8F4]'
          }`}
        >
          <div>
            <div className="text-xs sm:text-sm font-bold text-[#F3EFE6]">
              {isAr ? 'طلبيات اليوم' : "Today's Orders"}
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold mt-0.5 text-white">
              {totalOrdersCount}
            </div>
          </div>
          <div className="text-[#D5B895]">
            <FloralBloomIcon className="w-8 h-8 sm:w-9 sm:h-9" />
          </div>
        </button>

        {/* Card 2: قيد التجهيز */}
        <button
          type="button"
          onClick={() =>
            setFilterMode(filterMode === 'preparing' ? 'all' : 'preparing')
          }
          className={`rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between text-start bg-[#F4F1EA] hover:bg-[#ECE8DF] border transition cursor-pointer ${
            filterMode === 'preparing'
              ? 'border-[#52583C] ring-2 ring-[#52583C]/20'
              : 'border-[#E5E0D4]'
          }`}
        >
          <div>
            <div className="text-xs sm:text-sm font-bold text-[#2B2F21]">
              {isAr ? 'قيد التجهيز' : 'In Preparation'}
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold mt-0.5 text-[#2B2F21]">
              {preparingCount}
            </div>
          </div>
          <div className="text-[#5C5A48]">
            <Package className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.5]" />
          </div>
        </button>

        {/* Card 3: اكتملت */}
        <button
          type="button"
          onClick={() =>
            setFilterMode(filterMode === 'completed' ? 'all' : 'completed')
          }
          className={`rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between text-start bg-[#F4F1EA] hover:bg-[#ECE8DF] border transition cursor-pointer ${
            filterMode === 'completed'
              ? 'border-[#52583C] ring-2 ring-[#52583C]/20'
              : 'border-[#E5E0D4]'
          }`}
        >
          <div>
            <div className="text-xs sm:text-sm font-bold text-[#2B2F21]">
              {isAr ? 'اكتملت' : 'Completed'}
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold mt-0.5 text-[#2B2F21]">
              {completedCount}
            </div>
          </div>
          <div className="text-[#5C5A48]">
            <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.5]" />
          </div>
        </button>

        {/* Card 4: الاستلام من المحل */}
        <button
          type="button"
          onClick={() =>
            setFilterMode(filterMode === 'pickup' ? 'all' : 'pickup')
          }
          className={`rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between text-start bg-[#F4F1EA] hover:bg-[#ECE8DF] border transition cursor-pointer ${
            filterMode === 'pickup'
              ? 'border-[#52583C] ring-2 ring-[#52583C]/20'
              : 'border-[#E5E0D4]'
          }`}
        >
          <div>
            <div className="text-xs sm:text-sm font-bold text-[#2B2F21] whitespace-nowrap">
              {isAr ? 'الاستلام من المحل' : 'Store Pickup'}
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold mt-0.5 text-[#2B2F21]">
              {pickupCount}
            </div>
          </div>
          <div className="text-[#5C5A48]">
            <ShoppingBag className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.5]" />
          </div>
        </button>

        {/* Card 5: التوصيل */}
        <button
          type="button"
          onClick={() =>
            setFilterMode(filterMode === 'delivery' ? 'all' : 'delivery')
          }
          className={`rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between text-start bg-[#F4F1EA] hover:bg-[#ECE8DF] border transition cursor-pointer col-span-2 sm:col-span-1 ${
            filterMode === 'delivery'
              ? 'border-[#52583C] ring-2 ring-[#52583C]/20'
              : 'border-[#E5E0D4]'
          }`}
        >
          <div>
            <div className="text-xs sm:text-sm font-bold text-[#2B2F21]">
              {isAr ? 'التوصيل' : 'Delivery'}
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold mt-0.5 text-[#2B2F21]">
              {deliveryCount}
            </div>
          </div>
          <div className="text-[#5C5A48]">
            <Truck className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.5]" />
          </div>
        </button>
      </div>

      {/* 3. Lower Main Content Grid: Active Orders Table + Urgent Alert & Floral Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Main Active Orders Table Card (9 columns on desktop) */}
        <div className="lg:col-span-9 bg-[#FAF8F4] rounded-2xl p-4 sm:p-5 border border-[#E6E1D6] shadow-2xs flex flex-col justify-between">
          <div>
            {/* Card Header: الطلبيات النشطة + طلب جديد */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#EFECE5] border border-[#D8D1C2] flex items-center justify-center text-[#4A5035]">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#2B2F21]">
                  {isAr ? 'الطلبيات النشطة' : 'Active Orders'}
                </h2>
                {filterMode !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setFilterMode('all')}
                    className="text-xs px-2.5 py-0.5 rounded-full bg-[#EFECE5] text-[#4A5035] font-bold cursor-pointer"
                  >
                    {isAr ? 'عرض الكل' : 'Show All'}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onOpenNewOrder}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#52583C] hover:bg-[#41462F] text-[#FAF8F4] text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'طلب جديد' : 'New Order'}</span>
              </button>
            </div>

            {/* Active Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-[#EFECE4] text-[#4E5242] border-y border-[#E4DFD3]">
                    <th className="py-2.5 px-3 text-start font-bold rounded-s-lg">
                      {isAr ? 'رقم الطلب' : 'Order ID'}
                    </th>
                    <th className="py-2.5 px-3 text-start font-bold">
                      {isAr ? 'اسم العميل' : 'Customer Name'}
                    </th>
                    <th className="py-2.5 px-3 text-center font-bold">
                      {isAr ? 'الطلب' : 'Order'}
                    </th>
                    <th className="py-2.5 px-3 text-center font-bold">
                      {isAr ? 'وقت الاستلام' : 'Pickup Time'}
                    </th>
                    <th className="py-2.5 px-3 text-center font-bold">
                      {isAr ? 'حالة الدفع' : 'Payment Status'}
                    </th>
                    <th className="py-2.5 px-3 text-center font-bold">
                      {isAr ? 'بطاقة الإهداء' : 'Gift Card'}
                    </th>
                    <th className="py-2.5 px-3 text-center font-bold rounded-e-lg">
                      {isAr ? 'تم الإنجاز' : 'Done'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECE7DC]">
                  {visibleOrders.map((order) => {
                    const minsLeft = getMinutesUntilOrder(order, currentTime);
                    const urgent = isOrderUrgent(order, currentTime);

                    return (
                      <tr
                        key={order.id}
                        className={`transition group ${
                          urgent
                            ? 'bg-[#FDF4F2] hover:bg-[#FAE9E5]'
                            : 'hover:bg-[#F3F0E8]/75'
                        }`}
                      >
                        {/* 1. رقم الطلب */}
                        <td
                          onClick={() => onSelectOrder(order)}
                          className="py-3 px-3 font-bold text-[#2B2F21] whitespace-nowrap cursor-pointer hover:text-[#52583C]"
                        >
                          <div className="flex items-center gap-1.5">
                            <span dir="ltr">{order.id}</span>
                            {urgent && (
                              <span
                                className="w-2 h-2 rounded-full bg-[#A8382B] animate-ping"
                                title={isAr ? 'طلب عاجل (أقل من 30 دقيقة)' : 'Urgent (<30m)'}
                              />
                            )}
                          </div>
                        </td>

                        {/* 2. اسم العميل + رقم الهاتف وطريقة الاستلام */}
                        <td
                          onClick={() => onSelectOrder(order)}
                          className="py-2.5 px-3 whitespace-nowrap cursor-pointer"
                        >
                          <div className="font-bold text-[#2B2F21]">
                            {isAr ? order.customerNameAr : order.customerNameEn}
                          </div>
                          <div className="text-[11px] text-[#6E7162] flex items-center gap-1.5 mt-0.5">
                            <span dir="ltr" className="font-mono">
                              {order.customerPhone}
                            </span>
                            <span>•</span>
                            <span className="font-semibold text-[#52583C]">
                              {order.fulfillmentType === 'pickup'
                                ? isAr
                                  ? 'استلام من المحل'
                                  : 'Pickup'
                                : isAr
                                ? 'توصيل'
                                : 'Delivery'}
                            </span>
                          </div>
                        </td>

                        {/* 3. الطلب (Thumbnail + Title + Note) */}
                        <td
                          onClick={() => onSelectOrder(order)}
                          className="py-2.5 px-3 cursor-pointer"
                        >
                          <div className="flex items-center justify-start gap-3">
                            <img
                              src={order.thumbnail}
                              alt={isAr ? order.orderTypeAr : order.orderTypeEn}
                              className="w-13 h-8.5 rounded-lg object-cover border border-[#DFD9CC] bg-white shrink-0"
                            />
                            <div className="text-start min-w-0">
                              <div className="font-bold text-[#2B2F21] whitespace-nowrap">
                                {isAr ? order.orderTypeAr : order.orderTypeEn}
                              </div>
                              {(order.notesAr || order.notesEn) && (
                                <div className="text-[11px] text-[#6E7162] truncate max-w-[170px]">
                                  {isAr ? order.notesAr : order.notesEn}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 4. وقت الاستلام + شارة العد التنازلي للطلبات العاجلة (<=30 دقيقة) */}
                        <td className="py-3 px-3 text-center font-semibold text-[#2B2F21] whitespace-nowrap">
                          <div>{isAr ? order.deliveryTimeAr : order.deliveryTimeEn}</div>
                          {urgent && minsLeft !== null && (
                            <div className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full bg-[#F7E1DD] text-[#A8382B] text-[10px] font-extrabold">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{formatRemainingMinutes(minsLeft, lang)}</span>
                            </div>
                          )}
                        </td>

                        {/* 5. حالة الدفع (مدفوع / غير مدفوع) */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {order.paymentStatus === 'paid' ? (
                            <button
                              type="button"
                              onClick={() => onTogglePaymentStatus(order.id)}
                              title={
                                isAr
                                  ? 'اضغط لتبديل حالة الدفع'
                                  : 'Tap to toggle payment status'
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5ECD9] text-[#4E673B] text-xs font-bold cursor-pointer hover:brightness-95 transition"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>{isAr ? 'مدفوع' : 'Paid'}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onTogglePaymentStatus(order.id)}
                              title={
                                isAr
                                  ? 'اضغط لتبديل حالة الدفع'
                                  : 'Tap to toggle payment status'
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F7E1DD] text-[#B84A47] text-xs font-bold cursor-pointer hover:brightness-95 transition"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>{isAr ? 'غير مدفوع' : 'Unpaid'}</span>
                            </button>
                          )}
                        </td>

                        {/* 6. بطاقة الإهداء */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {order.hasGiftCard ? (
                            <button
                              type="button"
                              onClick={() => onSelectOrder(order)}
                              title={
                                isAr
                                  ? 'عرض بطاقة الإهداء'
                                  : 'View Gift Card Message'
                              }
                              className="inline-flex items-center justify-center p-1.5 rounded-lg text-[#7E654E] hover:bg-[#EFECE5] transition cursor-pointer"
                            >
                              <GiftCardEnvelopeIcon className="w-5 h-4" />
                            </button>
                          ) : (
                            <span className="text-[#9A9689] font-bold select-none">
                              —
                            </span>
                          )}
                        </td>

                        {/* 7. تم الإنجاز + تعديل وحذف الطلب */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => onToggleOrderCompleted(order.id)}
                              aria-label={isAr ? 'تم الإنجاز' : 'Mark Completed'}
                              className={`w-5 h-5 rounded-md border inline-flex items-center justify-center transition cursor-pointer ${
                                order.isCompleted
                                  ? 'bg-[#52583C] border-[#52583C] text-white shadow-2xs'
                                  : 'bg-white border-[#B5AF9F] hover:border-[#52583C]'
                              }`}
                            >
                              {order.isCompleted && (
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => onEditOrder(order)}
                              title={isAr ? 'تعديل الطلب' : 'Edit Order'}
                              className="p-1 rounded-lg text-[#6E7162] hover:text-[#2B2F21] hover:bg-[#EFECE5] transition cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onDeleteOrder(order.id)}
                              title={isAr ? 'حذف الطلب' : 'Delete Order'}
                              className="p-1 rounded-lg text-[#B84A47]/80 hover:text-[#B84A47] hover:bg-[#F7E1DD]/60 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Left Column (3 columns on desktop): Urgent Order Alert Card + Floral Arrangement Photo */}
        <div className="lg:col-span-3 flex flex-col justify-between gap-4">
          {/* Card A: طلب عاجل (Urgent Orders <= 30 mins to pickup) */}
          <div
            className={`rounded-2xl p-5 border shadow-2xs text-center flex flex-col items-center justify-center relative transition ${
              urgentCount > 0
                ? 'bg-[#F4EAE6] border-[#E3B8AD] ring-1 ring-[#A8382B]/15'
                : 'bg-[#F4EAE6] border-[#E7D4CD]'
            }`}
          >
            {/* Sound Alert Toggle / Test Button in Top Corner */}
            <button
              type="button"
              onClick={() => {
                onToggleSound();
                if (!soundEnabled) {
                  playUrgentAlertSound();
                }
              }}
              title={
                soundEnabled
                  ? isAr
                    ? 'التنبيه الصوتي مفعل (اضغط للكتم)'
                    : 'Audio alert ON (tap to mute)'
                  : isAr
                  ? 'التنبيه الصوتي مكتوم (اضغط للتفعيل)'
                  : 'Audio alert muted (tap to enable)'
              }
              className={`absolute top-3 end-3 p-1.5 rounded-lg text-xs transition cursor-pointer ${
                soundEnabled
                  ? 'bg-[#A8382B]/12 text-[#A8382B] hover:bg-[#A8382B]/20'
                  : 'bg-black/5 text-[#6E7162] hover:bg-black/10'
              }`}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>

            <div className="inline-flex items-center gap-1.5 text-[#A8382B] font-extrabold text-base sm:text-lg mb-2">
              <Clock
                className={`w-5 h-5 stroke-[2.2] ${
                  urgentCount > 0 ? 'animate-pulse' : ''
                }`}
              />
              <span>{isAr ? 'طلب عاجل' : 'Urgent Order'}</span>
            </div>

            <p className="text-xs sm:text-sm text-[#3B3330] font-medium leading-relaxed max-w-[215px]">
              {urgentCount === 0 ? (
                isAr ? (
                  <>
                    لا توجد طلبات باقي عليها{' '}
                    <span className="font-extrabold">30 دقيقة</span> حالياً
                  </>
                ) : (
                  <>
                    No orders with{' '}
                    <span className="font-extrabold">30 minutes</span> left right
                    now
                  </>
                )
              ) : isAr ? (
                <>
                  يوجد{' '}
                  <span className="font-extrabold text-[#A8382B]">
                    {urgentCount} طلبات
                  </span>{' '}
                  باقي على استلامها{' '}
                  <span className="font-extrabold">30 دقيقة</span> أو أقل
                </>
              ) : (
                <>
                  There are{' '}
                  <span className="font-extrabold text-[#A8382B]">
                    {urgentCount} orders
                  </span>{' '}
                  with <span className="font-extrabold">30 minutes</span> or less
                  until pickup
                </>
              )}
            </p>

            <button
              type="button"
              onClick={() => {
                setFilterMode(filterMode === 'urgent' ? 'all' : 'urgent');
              }}
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-[#52583C] hover:bg-[#41462F] text-[#FAF8F4] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer active:scale-95"
            >
              <span>
                {filterMode === 'urgent'
                  ? isAr
                    ? 'عرض جميع الطلبات'
                    : 'Show All Orders'
                  : isAr
                  ? 'عرض الطلبات'
                  : 'View Orders'}
              </span>
              {isAr ? (
                <ArrowLeft className="w-4 h-4" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Card B: Sunlit Brown Ceramic Pot Floral Arrangement Photo */}
          <div className="rounded-2xl overflow-hidden border border-[#E2DDD2] shadow-2xs bg-[#EFECE5] flex-1 min-h-[155px]">
            <img
              src="./brand/v2-bottom-left-floral.png"
              alt="WARDAN Floral Arrangement"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
