import React, { useState, useRef } from 'react';
import {
  Language,
  ThemeMode,
  Order,
  Customer,
  Product,
  InventoryItem,
  StaffProfile,
} from '../types';
import { playNewOrderNotificationSound } from '../utils/urgentAlerts';
import {
  Plus,
  Eye,
  Phone,
  MapPin,
  Crown,
  Flower2,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Globe,
  ShoppingBag,
  Truck,
  Pencil,
  Trash2,
  Check,
  Camera,
  Sun,
  Moon,
  Bell,
  LogOut,
  Volume2,
  User,
} from 'lucide-react';

/* ============================================================================
   1. ORDERS VIEW (الطلبيات — بدون حالة الطلب + مع التعديل والحذف ورقم الهاتف وطريقة التسليم)
   ============================================================================ */
interface OrdersViewProps {
  lang: Language;
  orders: Order[];
  onSelectOrder: (o: Order) => void;
  onEditOrder: (o: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onToggleCompleted: (orderId: string) => void;
  onOpenNewOrder: () => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  lang,
  orders,
  onSelectOrder,
  onEditOrder,
  onDeleteOrder,
  onToggleCompleted,
  onOpenNewOrder,
}) => {
  const isAr = lang === 'ar';
  const [filter, setFilter] = useState<'all' | 'pickup' | 'delivery'>('all');

  const filtered =
    filter === 'all'
      ? orders
      : orders.filter((o) => o.fulfillmentType === filter);

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-[#FAF8F4] rounded-2xl p-5 sm:p-6 border border-[#E6E1D6] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#2B2F21]">
            {isAr ? 'إدارة الطلبيات' : 'Orders Management'}
          </h1>
          <p className="text-xs sm:text-sm text-[#6E7162] mt-1">
            {isAr
              ? 'إضافة وتعديل وحذف الطلبات، مواعيد الاستلام من المحل أو التوصيل'
              : 'Create, edit, and manage in-store pickup and delivery orders'}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewOrder}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4A5035] hover:bg-[#3A3F29] text-[#FAF8F4] text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#D5B895]" />
          <span>{isAr ? 'طلب جديد' : 'New Order'}</span>
        </button>
      </div>

      {/* Filter Pills: الكل / استلام من المحل / توصيل */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: 'all', ar: 'جميع الطلبيات', en: 'All Orders' },
            { id: 'pickup', ar: 'استلام من المحل', en: 'In-Store Pickup' },
            { id: 'delivery', ar: 'توصيل', en: 'Delivery' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              filter === tab.id
                ? 'bg-[#4A5035] text-[#FAF8F4] shadow-xs'
                : 'bg-[#EFECE5] text-[#5A5E4D] hover:bg-[#E5E0D5]'
            }`}
          >
            {isAr ? tab.ar : tab.en}
          </button>
        ))}
      </div>

      {/* Touch-Friendly Order Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((order) => (
          <div
            key={order.id}
            className="bg-[#FAF8F4] rounded-2xl p-5 border border-[#E6E1D6] shadow-2xs flex flex-col justify-between gap-4 hover:border-[#C9C2B2] transition"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span
                    dir="ltr"
                    className="font-bold text-sm text-[#4A5035] bg-[#EFECE5] px-3 py-1 rounded-lg"
                  >
                    {order.id}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EFECE5] text-[#2B2F21] text-[11px] font-bold">
                    {order.fulfillmentType === 'pickup' ? (
                      <>
                        <ShoppingBag className="w-3 h-3 text-[#4A5035]" />
                        <span>{isAr ? 'استلام من المحل' : 'Pickup'}</span>
                      </>
                    ) : (
                      <>
                        <Truck className="w-3 h-3 text-[#4A5035]" />
                        <span>{isAr ? 'توصيل' : 'Delivery'}</span>
                      </>
                    )}
                  </span>
                </div>

                <span className="text-xs font-bold text-[#9A7B56]">
                  {order.amountOmr.toFixed(1)} {isAr ? 'ر.ع.' : 'OMR'}
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <img
                  src={order.thumbnail}
                  alt={isAr ? order.orderTypeAr : order.orderTypeEn}
                  className="w-20 h-16 rounded-xl object-cover border border-[#E2DDD2] bg-white shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-bold text-base text-[#2B2F21] truncate">
                    {isAr ? order.customerNameAr : order.customerNameEn}
                  </div>
                  <div
                    dir="ltr"
                    className="text-xs font-mono text-[#5A5E4D] flex items-center gap-1 mt-0.5"
                  >
                    <Phone className="w-3 h-3 text-[#848871]" />
                    <span>{order.customerPhone}</span>
                  </div>
                  <div className="text-xs font-bold text-[#4A5035] mt-1">
                    {isAr ? order.orderTypeAr : order.orderTypeEn}
                  </div>
                  {(order.notesAr || order.notesEn) && (
                    <div className="text-[11px] text-[#6E7162] mt-0.5 line-clamp-2">
                      {isAr ? order.notesAr : order.notesEn}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#ECE7DC] flex items-center justify-between gap-2">
              <div className="text-xs text-[#5A5E4D] flex items-center gap-1.5 font-semibold">
                <Clock className="w-3.5 h-3.5 text-[#9A7B56]" />
                <span>{isAr ? order.deliveryTimeAr : order.deliveryTimeEn}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* تم الإنجاز */}
                <button
                  type="button"
                  onClick={() => onToggleCompleted(order.id)}
                  title={isAr ? 'تم الإنجاز' : 'Mark Completed'}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 border transition cursor-pointer ${
                    order.isCompleted
                      ? 'bg-[#52583C] border-[#52583C] text-white'
                      : 'bg-white border-[#C5BFB2] text-[#2B2F21]'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تم الإنجاز' : 'Done'}</span>
                </button>

                {/* تعديل */}
                <button
                  type="button"
                  onClick={() => onEditOrder(order)}
                  className="p-2 rounded-xl bg-[#EFECE5] hover:bg-[#E2DDD2] text-[#2B2F21] transition cursor-pointer"
                  title={isAr ? 'تعديل الطلب' : 'Edit Order'}
                >
                  <Pencil className="w-4 h-4" />
                </button>

                {/* حذف */}
                <button
                  type="button"
                  onClick={() => onDeleteOrder(order.id)}
                  className="p-2 rounded-xl bg-[#F7E1DD] hover:bg-[#F0CEC8] text-[#B84A47] transition cursor-pointer"
                  title={isAr ? 'حذف الطلب' : 'Delete Order'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* عرض */}
                <button
                  type="button"
                  onClick={() => onSelectOrder(order)}
                  className="p-2 rounded-xl bg-[#4A5035] text-[#D5B895] hover:bg-[#353A26] transition cursor-pointer"
                  title={isAr ? 'عرض التفاصيل' : 'View Details'}
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
   2. CUSTOMERS VIEW (العملاء)
   ============================================================================ */
export const CustomersView: React.FC<{
  lang: Language;
  customers: Customer[];
}> = ({ lang, customers }) => {
  const isAr = lang === 'ar';

  return (
    <div className="space-y-5">
      <div className="bg-[#FAF8F4] rounded-2xl p-5 sm:p-6 border border-[#E6E1D6] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#2B2F21]">
            {isAr ? 'سجل عملاء وردان عُمان' : 'WARDAN Oman Client Directory'}
          </h1>
          <p className="text-xs sm:text-sm text-[#6E7162] mt-1">
            {isAr
              ? 'تفضيلات الزهور، سجل المناسبات، وأرقام هواتف عملاء المحل'
              : 'Floral preferences, occasion history, and phone numbers'}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#EFECE5] text-[#4A5035] text-xs font-bold">
          <Crown className="w-4 h-4 text-[#9A7B56]" />
          <span>
            {isAr
              ? `${customers.length} عميل مسجل`
              : `${customers.length} Active Clients`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((c) => (
          <div
            key={c.id}
            className="bg-[#FAF8F4] rounded-2xl p-5 border border-[#E6E1D6] shadow-2xs space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#4A5035] text-[#D5B895] font-bold flex items-center justify-center text-base">
                  {(isAr ? c.nameAr : c.nameEn).charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-base text-[#2B2F21]">
                    {isAr ? c.nameAr : c.nameEn}
                  </div>
                  <div
                    dir="ltr"
                    className="text-xs text-[#6E7162] font-mono flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3 text-[#848871]" />
                    <span>{c.phone}</span>
                  </div>
                </div>
              </div>

              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  c.tier === 'VIP'
                    ? 'bg-[#4A5035] text-[#D5B895]'
                    : 'bg-[#EFECE5] text-[#5A5E4D]'
                }`}
              >
                {c.tier}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#EFECE5]/75 text-xs space-y-1">
              <div className="text-[#6E7162]">
                {isAr ? 'التنسيق المفضل:' : 'Preferred Floral Style:'}
              </div>
              <div className="font-semibold text-[#2B2F21]">
                {isAr ? c.favoriteStyleAr : c.favoriteStyleEn}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-[#5A5E4D]">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#848871]" />
                {isAr ? c.areaAr : c.areaEn}
              </span>
              <span className="font-bold text-[#4A5035]">
                {c.totalOrders} {isAr ? 'طلبات' : 'orders'} •{' '}
                {c.totalSpentOmr.toFixed(0)} {isAr ? 'ر.ع.' : 'OMR'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
   3. PRODUCTS & BOUQUETS VIEW
   ============================================================================ */
export const ProductsView: React.FC<{
  lang: Language;
  products: Product[];
  onOrderProduct: () => void;
}> = ({ lang, products, onOrderProduct }) => {
  const isAr = lang === 'ar';

  return (
    <div className="space-y-5">
      <div className="bg-[#FAF8F4] rounded-2xl p-5 sm:p-6 border border-[#E6E1D6] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#2B2F21]">
            {isAr
              ? 'كتالوج باقات وتنسيقات وردان'
              : 'WARDAN Signature Floral Collection'}
          </h1>
        </div>

        <button
          type="button"
          onClick={onOrderProduct}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4A5035] text-[#FAF8F4] text-xs font-bold cursor-pointer"
        >
          <Flower2 className="w-4 h-4 text-[#D5B895]" />
          <span>{isAr ? 'إنشاء طلب جديد' : 'Create New Order'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((p) => (
          <div
            key={p.id}
            className="bg-[#FAF8F4] rounded-2xl overflow-hidden border border-[#E6E1D6] shadow-2xs flex flex-col justify-between group"
          >
            <div>
              <div className="relative h-52 overflow-hidden bg-[#EFECE5]">
                <img
                  src={p.image}
                  alt={isAr ? p.nameAr : p.nameEn}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 start-3 px-3 py-1 rounded-full bg-[#4A5035]/90 backdrop-blur-xs text-[#D5B895] text-[11px] font-bold">
                  {isAr ? p.categoryAr : p.categoryEn}
                </span>
                <span className="absolute bottom-3 end-3 px-3 py-1 rounded-xl bg-[#FAF8F4]/95 text-[#2B2F21] text-xs font-extrabold shadow-xs">
                  {p.priceOmr.toFixed(1)} {isAr ? 'ر.ع.' : 'OMR'}
                </span>
              </div>

              <div className="p-5">
                <div className="text-[11px] font-mono text-[#848871] mb-1">
                  {p.code}
                </div>
                <h3 className="font-bold text-base text-[#2B2F21]">
                  {isAr ? p.nameAr : p.nameEn}
                </h3>
                <p className="text-xs text-[#6E7162] mt-1.5 leading-relaxed">
                  {isAr ? p.flowersUsedAr : p.flowersUsedEn}
                </p>
              </div>
            </div>

            <div className="px-5 pb-4 pt-2 flex items-center justify-between border-t border-[#ECE7DC]">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4C6A3D]">
                <CheckCircle className="w-3.5 h-3.5" />
                {isAr ? 'متوفر للتجهيز الفوري' : 'Available Today'}
              </span>
              <button
                type="button"
                onClick={onOrderProduct}
                className="text-xs font-bold text-[#4A5035] hover:underline cursor-pointer"
              >
                {isAr ? 'اختيار للطلب ←' : 'Select →'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
   4. INVENTORY VIEW
   ============================================================================ */
export const InventoryView: React.FC<{
  lang: Language;
  inventory: InventoryItem[];
  onAdjustStock: (id: string, delta: number) => void;
}> = ({ lang, inventory, onAdjustStock }) => {
  const isAr = lang === 'ar';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventory.map((item) => {
          const isLow = item.quantity <= item.minThreshold;
          return (
            <div
              key={item.id}
              className="bg-[#FAF8F4] rounded-2xl p-5 border border-[#E6E1D6] shadow-2xs flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="px-2.5 py-1 rounded-lg bg-[#EFECE5] text-[#4A5035] font-bold">
                    {isAr ? item.categoryAr : item.categoryEn}
                  </span>
                  <span className="font-mono text-[11px] text-[#848871]">
                    {item.sku}
                  </span>
                </div>

                <h3 className="font-bold text-base text-[#2B2F21]">
                  {isAr ? item.nameAr : item.nameEn}
                </h3>
              </div>

              <div className="pt-3 border-t border-[#ECE7DC] flex items-center justify-between">
                <div>
                  <div className="text-2xl font-extrabold text-[#2B2F21]">
                    {item.quantity}{' '}
                    <span className="text-xs font-medium text-[#6E7162]">
                      {isAr ? item.unitAr : item.unitEn}
                    </span>
                  </div>
                  {isLow && (
                    <div className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-semibold">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{isAr ? 'مخزون منخفض' : 'Low Stock'}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onAdjustStock(item.id, -5)}
                    className="w-9 h-9 rounded-xl bg-[#EFECE5] hover:bg-[#E2DDD2] text-[#2B2F21] font-bold cursor-pointer"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => onAdjustStock(item.id, 5)}
                    className="w-9 h-9 rounded-xl bg-[#4A5035] hover:bg-[#363B27] text-[#FAF8F4] font-bold cursor-pointer"
                  >
                    +5
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================================
   5. REPORTS VIEW (التقارير)
   ============================================================================ */
export const ReportsView: React.FC<{ lang: Language; orders: Order[] }> = ({
  lang,
  orders,
}) => {
  const isAr = lang === 'ar';
  const totalRevenue = orders.reduce((acc, o) => acc + o.amountOmr, 0);
  const paidRevenue = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((acc, o) => acc + o.amountOmr, 0);
  const unpaidRevenue = orders
    .filter((o) => o.paymentStatus === 'unpaid')
    .reduce((acc, o) => acc + o.amountOmr, 0);
  const completedCount = orders.filter((o) => o.isCompleted).length;
  const preparingCount = orders.filter((o) => !o.isCompleted).length;
  const pickupCount = orders.filter((o) => o.fulfillmentType === 'pickup').length;
  const deliveryCount = orders.filter((o) => o.fulfillmentType === 'delivery').length;

  return (
    <div className="space-y-5">
      <div className="bg-[#FAF8F4] rounded-2xl p-5 sm:p-6 border border-[#E6E1D6] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#2B2F21]">
            {isAr
              ? 'التقارير والأداء المالي — وردان'
              : 'WARDAN Performance Reports'}
          </h1>
          <p className="text-xs sm:text-sm text-[#6E7162] mt-1">
            {isAr
              ? 'إحصائيات مباشرة ودقيقة لجميع الطلبات المسجلة حالياً في النظام'
              : 'Live accurate analytics calculated directly from active system orders'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#4A5035] text-[#FAF8F4] rounded-2xl p-6 shadow-xs">
          <div className="text-xs text-[#D5B895] flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            <span>
              {isAr ? 'إجمالي قيمة الطلبات' : 'Total Orders Value'}
            </span>
          </div>
          <div className="text-3xl font-extrabold mt-2">
            {totalRevenue.toFixed(1)} {isAr ? 'ر.ع.' : 'OMR'}
          </div>
          <div className="text-xs text-[#E6E1D6]/90 mt-1.5">
            {isAr
              ? `المدفوع: ${paidRevenue.toFixed(1)} ر.ع. • غير المدفوع: ${unpaidRevenue.toFixed(1)} ر.ع.`
              : `Paid: ${paidRevenue.toFixed(1)} OMR • Unpaid: ${unpaidRevenue.toFixed(1)} OMR`}
          </div>
        </div>

        <div className="bg-[#FAF8F4] rounded-2xl p-6 border border-[#E6E1D6]">
          <div className="text-xs text-[#6E7162]">
            {isAr ? 'إجمالي الطلبات المسجلة' : 'Total Logged Orders'}
          </div>
          <div className="text-3xl font-extrabold text-[#2B2F21] mt-2">
            {orders.length}
          </div>
          <div className="text-xs text-[#6E7162] mt-1.5 font-medium">
            {isAr
              ? `مكتملة: ${completedCount} • قيد التجهيز: ${preparingCount} | استلام من المحل: ${pickupCount} • توصيل: ${deliveryCount}`
              : `Completed: ${completedCount} • Preparing: ${preparingCount} | Store Pickup: ${pickupCount} • Delivery: ${deliveryCount}`}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   6. SETTINGS VIEW (الإعدادات: صورة البروفايل، اللغة، وضع الشاشة، الإشعارات، تسجيل الخروج)
   ============================================================================ */
export const SettingsView: React.FC<{
  lang: Language;
  onSetLang: (l: Language) => void;
  theme: ThemeMode;
  onSetTheme: (t: ThemeMode) => void;
  currentStaff: StaffProfile;
  onUpdateStaffAvatar: (avatarDataUrl: string | undefined) => void;
  notifyNewOrder: boolean;
  onToggleNotifyNewOrder: () => void;
  notifyUrgentOrder: boolean;
  onToggleNotifyUrgentOrder: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onLogout: () => void;
}> = ({
  lang,
  onSetLang,
  theme,
  onSetTheme,
  currentStaff,
  onUpdateStaffAvatar,
  notifyNewOrder,
  onToggleNotifyNewOrder,
  notifyUrgentOrder,
  onToggleNotifyUrgentOrder,
  soundEnabled,
  onToggleSound,
  onLogout,
}) => {
  const isAr = lang === 'ar';
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          onUpdateStaffAvatar(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          onUpdateStaffAvatar(ev.target?.result as string);
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-[#FAF8F4] rounded-2xl p-5 sm:p-6 border border-[#E6E1D6]">
        <h1 className="text-xl sm:text-2xl font-bold text-[#2B2F21]">
          {isAr ? 'الإعدادات' : 'Settings'}
        </h1>
        <p className="text-xs sm:text-sm text-[#6E7162] mt-1">
          {isAr
            ? 'إدارة صورة البروفايل، اللغة، مظهر الشاشة، الإشعارات، والحساب'
            : 'Manage your profile photo, language, screen appearance, notifications, and account'}
        </p>
      </div>

      {/* 1. صورة البروفايل (Profile Picture) */}
      <div className="bg-[#FAF8F4] rounded-2xl p-5 sm:p-6 border border-[#E6E1D6] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-start">
          <div className="relative group">
            {currentStaff.avatar ? (
              <img
                src={currentStaff.avatar}
                alt={isAr ? currentStaff.nameAr : currentStaff.nameEn}
                className="w-20 h-20 rounded-full object-cover border-2 border-[#D5B895] shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#4A5035] text-[#D5B895] flex items-center justify-center border-2 border-[#D5B895]/40 shadow-sm">
                <User className="w-9 h-9" />
              </div>
            )}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-0 end-0 w-7 h-7 rounded-full bg-[#4A5035] text-[#FAF8F4] border border-[#D5B895] flex items-center justify-center shadow-xs cursor-pointer"
              title={isAr ? 'تغيير صورة البروفايل' : 'Change Profile Photo'}
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          <div>
            <div className="text-xs font-bold text-[#6E7162] mb-0.5">
              {isAr ? 'صورة البروفايل' : 'Profile Picture'}
            </div>
            <div className="text-base sm:text-lg font-extrabold text-[#2B2F21]">
              {isAr ? currentStaff.nameAr : currentStaff.nameEn}
            </div>
            <div className="text-xs text-[#6E7162]">
              <span className="font-mono">{currentStaff.email}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#4A5035] hover:bg-[#3A3F29] text-[#FAF8F4] text-xs font-bold transition cursor-pointer"
          >
            <Camera className="w-4 h-4 text-[#D5B895]" />
            <span>
              {isAr ? 'اختيار صورة من الألبوم' : 'Choose from Album'}
            </span>
          </button>

          {currentStaff.avatar && (
            <button
              type="button"
              onClick={() => onUpdateStaffAvatar(undefined)}
              className="p-2.5 rounded-xl bg-[#F7E1DD] hover:bg-[#F0CEC8] text-[#B84A47] text-xs font-bold transition cursor-pointer"
              title={isAr ? 'حذف الصورة' : 'Remove Photo'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. اللغة (Language) */}
      <div className="bg-[#FAF8F4] rounded-2xl p-5 sm:p-6 border border-[#E6E1D6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFECE5] text-[#4A5035] flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#2B2F21]">
              {isAr ? 'اللغة' : 'Language'}
            </h2>
            <p className="text-xs text-[#6E7162]">
              {isAr
                ? 'اختر لغة واجهة النظام'
                : 'Select system interface language'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#EFECE5] border border-[#DCD6C8] w-full sm:w-64">
          <button
            type="button"
            onClick={() => onSetLang('ar')}
            className={`py-2 px-4 rounded-lg text-xs font-bold transition cursor-pointer ${
              isAr
                ? 'bg-[#4A5035] text-[#FAF8F4] shadow-2xs'
                : 'text-[#5A5E4D] hover:text-[#2B2F21]'
            }`}
          >
            العربية
          </button>
          <button
            type="button"
            onClick={() => onSetLang('en')}
            className={`py-2 px-4 rounded-lg text-xs font-bold transition cursor-pointer ${
              !isAr
                ? 'bg-[#4A5035] text-[#FAF8F4] shadow-2xs'
                : 'text-[#5A5E4D] hover:text-[#2B2F21]'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* 3. وضع الشاشة (Light Mode / Dark Mode) */}
      <div className="bg-[#FAF8F4] rounded-2xl p-5 sm:p-6 border border-[#E6E1D6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFECE5] text-[#4A5035] flex items-center justify-center shrink-0">
            {theme === 'dark' ? (
              <Moon className="w-5 h-5 text-[#D5B895]" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#2B2F21]">
              {isAr ? 'وضع الشاشة' : 'Screen Appearance'}
            </h2>
            <p className="text-xs text-[#6E7162]">
              {isAr
                ? 'التبديل بين الوضع الفاتح (Light Mode) والوضع الداكن (Dark Mode)'
                : 'Switch between Light Mode and Dark Mode'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#EFECE5] border border-[#DCD6C8] w-full sm:w-64">
          <button
            type="button"
            onClick={() => onSetTheme('light')}
            className={`py-2 px-3 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${
              theme === 'light'
                ? 'bg-[#4A5035] text-[#FAF8F4] shadow-2xs'
                : 'text-[#5A5E4D] hover:text-[#2B2F21]'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>{isAr ? 'لايت مود' : 'Light Mode'}</span>
          </button>
          <button
            type="button"
            onClick={() => onSetTheme('dark')}
            className={`py-2 px-3 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#4A5035] text-[#FAF8F4] shadow-2xs'
                : 'text-[#5A5E4D] hover:text-[#2B2F21]'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>{isAr ? 'دارك مود' : 'Dark Mode'}</span>
          </button>
        </div>
      </div>

      {/* 4. الإشعارات (Notifications) */}
      <div className="bg-[#FAF8F4] rounded-2xl p-5 sm:p-6 border border-[#E6E1D6] space-y-4">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#EAE5DA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFECE5] text-[#4A5035] flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-[#2B2F21]">
                {isAr ? 'الإشعارات' : 'Notifications'}
              </h2>
              <p className="text-xs text-[#6E7162]">
                {isAr
                  ? 'التحكم في إشعارات إضافة طلب جديد، الطلبات العاجلة، والأصوات'
                  : 'Manage new order notifications, urgent 30-min alerts, and sounds'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => playNewOrderNotificationSound()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EFECE5] hover:bg-[#E2DDD2] text-[#4A5035] text-xs font-bold transition cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'تجربة الصوت' : 'Test Sound'}</span>
          </button>
        </div>

        <div className="space-y-3 text-xs sm:text-sm">
          {/* Toggle 1: إشعار عند إضافة طلب جديد */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#EFECE5]/70 border border-[#E2DDD2]">
            <div>
              <div className="font-bold text-[#2B2F21]">
                {isAr
                  ? 'إشعار عند إضافة طلب جديد'
                  : 'New Order Added Notification'}
              </div>
              <div className="text-xs text-[#6E7162] mt-0.5">
                {isAr
                  ? 'إرسال إشعار وتنبيه فوري عند تسجيل أي طلبية جديدة في النظام'
                  : 'Receive an instant alert and notification whenever a new order is created'}
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleNotifyNewOrder}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                notifyNewOrder
                  ? 'bg-[#4A5035] text-[#FAF8F4]'
                  : 'bg-[#DCD6C8] text-[#5A5E4D]'
              }`}
            >
              {notifyNewOrder
                ? isAr
                  ? 'مفعل'
                  : 'Enabled'
                : isAr
                ? 'متوقف'
                : 'Off'}
            </button>
          </div>

          {/* Toggle 2: إشعار الطلبات العاجلة (باقي 30 دقيقة) */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#EFECE5]/70 border border-[#E2DDD2]">
            <div>
              <div className="font-bold text-[#2B2F21]">
                {isAr
                  ? 'إشعار الطلبات العاجلة (باقي 30 دقيقة على الاستلام)'
                  : 'Urgent Orders Notification (<= 30 mins)'}
              </div>
              <div className="text-xs text-[#6E7162] mt-0.5">
                {isAr
                  ? 'تنبيه تلقائي للطلبيات التي يتبقى على موعد استلامها 30 دقيقة أو أقل'
                  : 'Automatic alert for orders due within 30 minutes'}
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleNotifyUrgentOrder}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                notifyUrgentOrder
                  ? 'bg-[#4A5035] text-[#FAF8F4]'
                  : 'bg-[#DCD6C8] text-[#5A5E4D]'
              }`}
            >
              {notifyUrgentOrder
                ? isAr
                  ? 'مفعل'
                  : 'Enabled'
                : isAr
                ? 'متوقف'
                : 'Off'}
            </button>
          </div>

          {/* Toggle 3: الأصوات التنبيهية */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#EFECE5]/70 border border-[#E2DDD2]">
            <div>
              <div className="font-bold text-[#2B2F21]">
                {isAr ? 'التنبيه الصوتي للإشعارات' : 'Notification Audio Chime'}
              </div>
              <div className="text-xs text-[#6E7162] mt-0.5">
                {isAr
                  ? 'تشغيل نغمة تنبيه صوتية عند وصول طلب جديد أو دخول طلب في الوقت العاجل'
                  : 'Play an audio chime for new orders and urgent orders'}
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleSound}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                soundEnabled
                  ? 'bg-[#4A5035] text-[#FAF8F4]'
                  : 'bg-[#DCD6C8] text-[#5A5E4D]'
              }`}
            >
              {soundEnabled
                ? isAr
                  ? 'مفعل'
                  : 'Enabled'
                : isAr
                ? 'متوقف'
                : 'Off'}
            </button>
          </div>
        </div>
      </div>

      {/* 5. تسجيل الخروج (Sign Out) */}
      <div className="bg-[#FAF8F4] rounded-2xl p-5 sm:p-6 border border-[#E6E1D6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F7E1DD] text-[#A8382B] flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#2B2F21]">
              {isAr ? 'تسجيل الخروج' : 'Sign Out'}
            </h2>
            <p className="text-xs text-[#6E7162]">
              {isAr
                ? 'الخروج من حسابك الحالي والعودة إلى شاشة تسجيل الدخول'
                : 'Sign out of your account and return to the login screen'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#A8382B] hover:bg-[#8E2E23] text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
        </button>
      </div>
    </div>
  );
};
