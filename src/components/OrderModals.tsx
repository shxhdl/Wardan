import React, { useState, useEffect, useRef } from 'react';
import {
  Language,
  Order,
  PaymentStatus,
  FulfillmentType,
} from '../types';
import { WardanLogo } from './WardanLogo';
import {
  X,
  Phone,
  MapPin,
  Clock,
  Calendar,
  Sparkles,
  Truck,
  ShoppingBag,
  ImagePlus,
  Pencil,
  Trash2,
  Check,
} from 'lucide-react';

const SAVED_ALBUM_STORAGE_KEY = 'wardan_saved_album_photos';

/* Default clean SVG placeholder when no album photo has been chosen yet */
const DEFAULT_EMPTY_PHOTO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" fill="none">
      <rect width="160" height="120" rx="16" fill="#EFECE5"/>
      <rect x="6" y="6" width="148" height="108" rx="12" stroke="#D5B895" stroke-dasharray="4 4" stroke-width="1.5"/>
      <circle cx="80" cy="52" r="14" stroke="#4A5035" stroke-width="1.8" stroke-opacity="0.6"/>
      <path d="M56 88L72 70L84 82L94 72L106 88H56Z" fill="#4A5035" fill-opacity="0.2"/>
    </svg>`
  );

/* Helper to format optional date (YYYY-MM-DD) and time (HH:mm) into Arabic & English display strings */
export function formatDateTimeDisplay(
  dateStr?: string,
  timeStr?: string
): { ar: string; en: string } {
  const todayIso = new Date().toISOString().slice(0, 10);

  let datePartAr = '';
  let datePartEn = '';

  if (dateStr) {
    if (dateStr === todayIso) {
      datePartAr = 'اليوم';
      datePartEn = 'Today';
    } else {
      const [y, m, d] = dateStr.split('-');
      datePartAr = `${d}/${m}/${y}`;
      datePartEn = `${d}/${m}/${y}`;
    }
  }

  let timePartAr = '';
  let timePartEn = '';

  if (timeStr) {
    const [hhStr, mmStr] = timeStr.split(':');
    const hh = parseInt(hhStr, 10);
    if (!isNaN(hh)) {
      const periodAr = hh >= 12 ? 'م' : 'ص';
      const periodEn = hh >= 12 ? 'PM' : 'AM';
      const hour12 = hh % 12 === 0 ? 12 : hh % 12;
      timePartAr = `${hour12}:${mmStr || '00'} ${periodAr}`;
      timePartEn = `${hour12}:${mmStr || '00'} ${periodEn}`;
    }
  }

  if (datePartAr && timePartAr) {
    return {
      ar: `${datePartAr} - ${timePartAr}`,
      en: `${datePartEn} - ${timePartEn}`,
    };
  }
  if (datePartAr) {
    return { ar: datePartAr, en: datePartEn };
  }
  if (timePartAr) {
    return {
      ar: `اليوم - ${timePartAr}`,
      en: `Today - ${timePartEn}`,
    };
  }
  return {
    ar: 'الوقت اختياري (مرن)',
    en: 'Flexible Time',
  };
}

/* Compress uploaded photo from iPhone/iPad album so it stores smoothly in localStorage */
function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 640;
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.84));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ============================================================================
   1. ORDER DETAIL MODAL (بدون حالة الطلب + مع زر تعديل وحذف الطلب)
   ============================================================================ */
interface OrderDetailModalProps {
  lang: Language;
  order: Order | null;
  onClose: () => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  lang,
  order,
  onClose,
  onEditOrder,
  onDeleteOrder,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setConfirmDelete(false);
  }, [order]);

  if (!order) return null;
  const isAr = lang === 'ar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="bg-[#FAF8F4] w-full max-w-lg rounded-3xl shadow-2xl border border-[#E2DDD2] overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
      >
        {/* Top Olive Header with WARDAN Logo */}
        <div className="bg-[#4A5035] text-[#FAF8F4] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WardanLogo variant="gold" size="sm" showSubtitle={false} className="w-16" />
            <div className="h-6 w-px bg-[#D5B895]/25" />
            <div>
              <div className="text-xs text-[#D5B895]">
                {isAr ? 'تفاصيل الطلب' : 'Order Details'}
              </div>
              <div className="font-bold text-base tracking-wide" dir="ltr">
                {order.id}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditOrder(order);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/12 hover:bg-white/20 text-[#FAF8F4] text-xs font-bold transition cursor-pointer"
              title={isAr ? 'تعديل الطلب' : 'Edit Order'}
            >
              <Pencil className="w-3.5 h-3.5 text-[#D5B895]" />
              <span>{isAr ? 'تعديل' : 'Edit'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-[#D5B895] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Order Photo & Arrangement Summary */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#EFECE5] border border-[#E2DDD2]">
            <img
              src={order.thumbnail}
              alt={isAr ? order.orderTypeAr : order.orderTypeEn}
              className="w-24 h-20 rounded-xl object-cover border border-[#D5B895]/40 shrink-0 bg-white shadow-2xs"
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#6E7162]">
                {isAr ? 'الطلب' : 'Order Item'}
              </div>
              <div className="font-bold text-base text-[#2B2F21]">
                {isAr ? order.orderTypeAr : order.orderTypeEn}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-extrabold text-[#4A5035]">
                  {order.amountOmr.toFixed(1)} {isAr ? 'ر.ع.' : 'OMR'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-white/80 text-[#2B2F21]">
                  {order.paymentStatus === 'paid'
                    ? isAr
                      ? 'مدفوع'
                      : 'Paid'
                    : isAr
                    ? 'غير مدفوع'
                    : 'Unpaid'}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-[#4A5035] text-[#FAF8F4]">
                  {order.fulfillmentType === 'pickup' ? (
                    <>
                      <ShoppingBag className="w-3 h-3 text-[#D5B895]" />
                      <span>{isAr ? 'استلام من المحل' : 'Store Pickup'}</span>
                    </>
                  ) : (
                    <>
                      <Truck className="w-3 h-3 text-[#D5B895]" />
                      <span>{isAr ? 'توصيل' : 'Delivery'}</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Client, Phone & Pickup/Delivery Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#EFECE5]/70 border border-[#E6E1D5]">
              <div className="text-[#6E7162] mb-1">
                {isAr ? 'اسم العميل ورقم الهاتف' : 'Customer & Phone'}
              </div>
              <div className="font-bold text-sm text-[#2B2F21]">
                {isAr ? order.customerNameAr : order.customerNameEn}
              </div>
              <a
                href={`tel:${order.customerPhone}`}
                className="inline-flex items-center gap-1.5 text-[#4A5035] font-bold mt-1.5 font-mono hover:underline"
              >
                <Phone className="w-3.5 h-3.5 text-[#848871]" />
                <span dir="ltr">{order.customerPhone}</span>
              </a>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#EFECE5]/70 border border-[#E6E1D5]">
              <div className="text-[#6E7162] mb-1">
                {isAr
                  ? 'التاريخ ووقت الاستلام / التوصيل'
                  : 'Date & Pickup / Delivery Time'}
              </div>
              <div className="font-bold text-sm text-[#2B2F21] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#9A7B56]" />
                <span>{isAr ? order.deliveryTimeAr : order.deliveryTimeEn}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#5A5E4D] mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#848871]" />
                <span>
                  {order.fulfillmentType === 'pickup'
                    ? isAr
                      ? 'استلام من المحل — وردان عُمان'
                      : 'In-Store Pickup — WARDAN Oman'
                    : isAr
                    ? order.deliveryAreaAr
                    : order.deliveryAreaEn}
                </span>
              </div>
            </div>
          </div>

          {/* Order Notes (ملاحظة مع الطلب) */}
          {(order.notesAr || order.notesEn) && (
            <div className="p-4 rounded-2xl bg-[#EFECE5]/90 border border-[#DFD9CC] text-xs space-y-1">
              <div className="font-bold text-[#4A5035]">
                {isAr ? 'ملاحظة مع الطلب:' : 'Order Note:'}
              </div>
              <p className="text-[#2B2F21] font-medium leading-relaxed whitespace-pre-wrap">
                {isAr ? order.notesAr : order.notesEn}
              </p>
            </div>
          )}

          {/* WARDAN Gift Card Preview */}
          {order.hasGiftCard && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#EFECE5] to-[#E6E0D3] border border-[#D5B895]/50 text-center relative overflow-hidden">
              <div className="flex justify-center mb-2">
                <WardanLogo
                  variant="dark"
                  size="sm"
                  showSubtitle={false}
                  className="w-16 opacity-85"
                />
              </div>
              <div className="text-[11px] uppercase tracking-widest text-[#848871] mb-2 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>{isAr ? 'بطاقة الإهداء' : 'WARDAN Gift Card'}</span>
              </div>
              <p className="text-sm font-medium text-[#2B2F21] italic px-4">
                "
                {isAr
                  ? order.cardMessageAr || 'كل عام وأنتِ بخير وأجمل من الورد'
                  : order.cardMessageEn || 'Warmest wishes from WARDAN Oman'}
                "
              </p>
            </div>
          )}

          {/* Delete Confirmation Banner */}
          {confirmDelete && (
            <div className="p-4 rounded-2xl bg-[#F7E1DD] border border-[#E6B8B0] flex items-center justify-between gap-3 text-xs">
              <span className="font-bold text-[#9E3533]">
                {isAr
                  ? 'هل أنت متأكد من حذف هذا الطلب نهائياً؟'
                  : 'Are you sure you want to delete this order?'}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-lg bg-white text-[#2B2F21] font-bold cursor-pointer"
                >
                  {isAr ? 'تراجع' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteOrder(order.id);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#B84A47] text-white font-bold cursor-pointer"
                >
                  {isAr ? 'تأكيد الحذف' : 'Delete'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions: Delete, Edit, Close */}
        <div className="px-6 py-4 bg-[#EFECE5] border-t border-[#E2DDD2] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F7E1DD] hover:bg-[#F0CEC8] text-[#B84A47] text-xs font-bold transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'حذف الطلب' : 'Delete'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditOrder(order);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EFECE5] hover:bg-[#E2DDD2] border border-[#C9C2B2] text-[#2B2F21] text-xs font-bold transition cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{isAr ? 'تعديل الطلب' : 'Edit Order'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#4A5035] hover:bg-[#3A3F29] text-[#FAF8F4] text-xs font-bold transition cursor-pointer"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   2. CREATE / EDIT ORDER MODAL (معرض الصور المضافة من الألبوم فقط)
   ============================================================================ */
interface OrderFormModalProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  onSaveOrder: (order: Order, isEdit: boolean) => void;
  nextOrderNumber: number;
  editingOrder?: Order | null;
}

export const NewOrderModal: React.FC<OrderFormModalProps> = ({
  lang,
  isOpen,
  onClose,
  onSaveOrder,
  nextOrderNumber,
  editingOrder = null,
}) => {
  const isAr = lang === 'ar';
  const isEdit = Boolean(editingOrder);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const todayIso = new Date().toISOString().slice(0, 10);

  // Saved album photos uploaded by user from their device album
  const [albumPhotos, setAlbumPhotos] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_ALBUM_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+968 ');
  const [phoneError, setPhoneError] = useState('');
  const [orderTitle, setOrderTitle] = useState('');
  const [thumbnail, setThumbnail] = useState(DEFAULT_EMPTY_PHOTO);
  const [pickupDate, setPickupDate] = useState<string>(todayIso);
  const [pickupTime, setPickupTime] = useState<string>('17:00');
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('pickup');
  const [deliveryArea, setDeliveryArea] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [amountOmr, setAmountOmr] = useState('');
  const [hasGiftCard, setHasGiftCard] = useState(true);
  const [cardMessage, setCardMessage] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const formatOmanPhoneInput = (raw: string): string => {
    const western = raw.replace(/[٠-٩]/g, (d) =>
      String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    );
    let rest = '';
    if (western.startsWith('+968')) {
      rest = western.slice(4);
    } else if (/^\+?9?6?8?$/.test(western.trim())) {
      rest = '';
    } else if (western.startsWith('968') && western.replace(/\D/g, '').length > 8) {
      rest = western.slice(3);
    } else {
      rest = western;
    }
    const digits = rest.replace(/\D/g, '').slice(0, 8);
    return `+968 ${digits}`;
  };

  const saveAlbumPhotosList = (nextList: string[]) => {
    setAlbumPhotos(nextList);
    try {
      localStorage.setItem(SAVED_ALBUM_STORAGE_KEY, JSON.stringify(nextList));
    } catch {
      // Ignore storage quota errors if any
    }
  };

  useEffect(() => {
    setPhoneError('');
    if (editingOrder) {
      setCustomerName(
        isAr ? editingOrder.customerNameAr : editingOrder.customerNameEn
      );
      setCustomerPhone(formatOmanPhoneInput(editingOrder.customerPhone || '+968 '));
      setOrderTitle(isAr ? editingOrder.orderTypeAr : editingOrder.orderTypeEn);
      setThumbnail(editingOrder.thumbnail || DEFAULT_EMPTY_PHOTO);
      setPickupDate(editingOrder.pickupDate ?? todayIso);
      setPickupTime(editingOrder.pickupTime ?? '17:00');
      setFulfillmentType(editingOrder.fulfillmentType || 'pickup');
      setDeliveryArea(
        isAr ? editingOrder.deliveryAreaAr : editingOrder.deliveryAreaEn
      );
      setPaymentStatus(editingOrder.paymentStatus || 'paid');
      setAmountOmr(
        editingOrder.amountOmr !== undefined && editingOrder.amountOmr !== null
          ? String(editingOrder.amountOmr)
          : ''
      );
      setHasGiftCard(editingOrder.hasGiftCard);
      setCardMessage(
        (isAr ? editingOrder.cardMessageAr : editingOrder.cardMessageEn) || ''
      );
      setOrderNotes(
        (isAr ? editingOrder.notesAr : editingOrder.notesEn) || ''
      );
    } else {
      setCustomerName('');
      setCustomerPhone('+968 ');
      setOrderTitle('');
      setThumbnail(DEFAULT_EMPTY_PHOTO);
      setPickupDate(todayIso);
      setPickupTime('17:00');
      setFulfillmentType('pickup');
      setDeliveryArea('');
      setPaymentStatus('paid');
      setAmountOmr('');
      setHasGiftCard(true);
      setCardMessage('');
      setOrderNotes('');
    }
  }, [editingOrder, isOpen, isAr, todayIso]);

  if (!isOpen) return null;

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingPhoto(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const dataUrl = await compressImageFile(files[i]);
        uploadedUrls.push(dataUrl);
      }
      if (uploadedUrls.length > 0) {
        // Set latest uploaded photo as active thumbnail
        setThumbnail(uploadedUrls[0]);
        // Prepend new photos to the saved album list (avoiding duplicates, max 24 saved photos)
        const updatedAlbum = [
          ...uploadedUrls,
          ...albumPhotos.filter((p) => !uploadedUrls.includes(p)),
        ].slice(0, 24);
        saveAlbumPhotosList(updatedAlbum);
      }
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFromAlbum = (photoUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = albumPhotos.filter((p) => p !== photoUrl);
    saveAlbumPhotosList(updated);
    if (thumbnail === photoUrl) {
      setThumbnail(DEFAULT_EMPTY_PHOTO);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    const localDigits = customerPhone
      .replace(/^\+?968\s*/, '')
      .replace(/\D/g, '');
    if (localDigits.length !== 8) {
      setPhoneError(
        isAr
          ? 'يجب أن يتكون رقم الهاتف من 8 أرقام بعد مفتاح عُمان (+968)'
          : 'Phone number must be 8 digits after Oman code (+968)'
      );
      return;
    }

    const formattedTime = formatDateTimeDisplay(
      pickupDate || undefined,
      pickupTime || undefined
    );

    const savedOrder: Order = {
      id: editingOrder ? editingOrder.id : `#W${nextOrderNumber}`,
      customerNameAr: customerName.trim(),
      customerNameEn: customerName.trim(),
      customerPhone: `+968 ${localDigits}`,
      orderTypeAr: orderTitle.trim() || 'باقة ورد',
      orderTypeEn: orderTitle.trim() || 'Signature Bouquet',
      thumbnail: thumbnail || DEFAULT_EMPTY_PHOTO,
      status: editingOrder ? editingOrder.status : 'preparing',
      paymentStatus,
      hasGiftCard,
      isCompleted: editingOrder ? editingOrder.isCompleted : false,
      isUrgent: editingOrder ? editingOrder.isUrgent : false,
      fulfillmentType,
      pickupDate: pickupDate || undefined,
      pickupTime: pickupTime || undefined,
      deliveryTimeAr: formattedTime.ar,
      deliveryTimeEn: formattedTime.en,
      deliveryAreaAr:
        fulfillmentType === 'pickup'
          ? 'الاستلام من المحل - مسقط'
          : deliveryArea.trim() || 'مسقط',
      deliveryAreaEn:
        fulfillmentType === 'pickup'
          ? 'In-Store Pickup - Muscat'
          : deliveryArea.trim() || 'Muscat',
      amountOmr: parseFloat(amountOmr) || 0,
      cardMessageAr: hasGiftCard
        ? cardMessage || 'مع أطيب التمنيات من وردان عُمان'
        : undefined,
      cardMessageEn: hasGiftCard
        ? cardMessage || 'With warmest wishes from WARDAN Oman'
        : undefined,
      notesAr: orderNotes.trim() || undefined,
      notesEn: orderNotes.trim() || undefined,
      floristAr: 'شهد',
      floristEn: 'Shahad',
    };

    onSaveOrder(savedOrder, isEdit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="bg-[#FAF8F4] w-full max-w-xl rounded-3xl shadow-2xl border border-[#E2DDD2] overflow-hidden max-h-[93vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="bg-[#4A5035] text-[#FAF8F4] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WardanLogo variant="gold" size="sm" showSubtitle={false} className="w-16" />
            <div className="h-5 w-px bg-[#D5B895]/25" />
            <h3 className="font-bold text-base">
              {isEdit
                ? isAr
                  ? `تعديل الطلب (${editingOrder?.id})`
                  : `Edit Order (${editingOrder?.id})`
                : isAr
                ? `تسجيل طلب جديد (#W${nextOrderNumber})`
                : `New Order (#W${nextOrderNumber})`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-[#D5B895] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* 1. Order Photo Upload from Device Album + Saved Album Photos Gallery */}
          <div className="p-4 rounded-2xl bg-[#EFECE5]/80 border border-[#DFD9CC] space-y-3">
            <label className="block font-bold text-[#4A5035] text-xs">
              {isAr
                ? 'صورة الطلب (من ألبوم الصور) واسم التنسيق'
                : 'Order Photo (from Album) & Arrangement Name'}
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Photo Preview + Upload Trigger + Remove Photo */}
              <div className="relative group shrink-0 flex flex-col items-center">
                <div className="relative">
                  <img
                    src={thumbnail}
                    alt="Order preview"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-28 h-22 rounded-2xl object-cover border-2 border-[#4A5035]/30 bg-white shadow-xs cursor-pointer"
                  />
                  {thumbnail && thumbnail !== DEFAULT_EMPTY_PHOTO && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setThumbnail(DEFAULT_EMPTY_PHOTO);
                      }}
                      title={isAr ? 'حذف الصورة' : 'Remove Photo'}
                      className="absolute -top-2 -end-2 w-6 h-6 rounded-full bg-[#A8382B] hover:bg-[#8E2D22] text-white flex items-center justify-center shadow-md cursor-pointer transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4A5035] hover:bg-[#3B402A] text-[#FAF8F4] text-[11px] font-bold shadow-2xs transition cursor-pointer active:scale-95"
                >
                  <ImagePlus className="w-3.5 h-3.5 text-[#D5B895]" />
                  <span>
                    {uploadingPhoto
                      ? isAr
                        ? 'جاري الرفع...'
                        : 'Uploading...'
                      : isAr
                      ? 'إضافة من الألبوم'
                      : 'Add from Album'}
                  </span>
                </button>
                {thumbnail && thumbnail !== DEFAULT_EMPTY_PHOTO && (
                  <button
                    type="button"
                    onClick={() => setThumbnail(DEFAULT_EMPTY_PHOTO)}
                    className="mt-1.5 w-full inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl bg-[#F7E1DD] hover:bg-[#F0CEC8] text-[#A8382B] text-[11px] font-bold transition cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{isAr ? 'حذف الصورة' : 'Remove Photo'}</span>
                  </button>
                )}
              </div>

              {/* Order Name Input + User's Uploaded Album Photos Gallery */}
              <div className="flex-1 w-full space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#5A5E4D] mb-1">
                    {isAr ? 'وصف / نوع الطلب *' : 'Order Description *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={orderTitle}
                    onChange={(e) => setOrderTitle(e.target.value)}
                    placeholder={
                      isAr
                        ? 'مثال: باقة ورد حمراء / بوكس ورد...'
                        : 'e.g. Crimson Rose Bouquet...'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCD6C8] text-[#2B2F21] text-sm font-bold focus:outline-none focus:border-[#4A5035]"
                  />
                </div>

                {/* User's Uploaded Album Photos Section */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-[#5A5E4D] mb-1.5">
                    <span className="font-semibold">
                      {isAr
                        ? 'الصور المضافة من الألبوم:'
                        : 'Photos added from your album:'}
                    </span>
                    {albumPhotos.length > 0 && (
                      <span className="text-[10px] text-[#848871]">
                        {albumPhotos.length} {isAr ? 'صورة محفوظة' : 'saved'}
                      </span>
                    )}
                  </div>

                  {albumPhotos.length === 0 ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 rounded-xl border border-dashed border-[#C8C1B2] bg-white/60 text-[#6E7162] text-[11px] text-center cursor-pointer hover:bg-white transition"
                    >
                      {isAr
                        ? 'لا توجد صور مضافة بعد — اضغط «إضافة من الألبوم» وستظهر صورك هنا دائماً للاختيار السريع'
                        : 'No album photos yet — tap "Add from Album" and your photos will appear here'}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {albumPhotos.map((photoUrl, idx) => {
                        const isSelected = thumbnail === photoUrl;
                        return (
                          <div
                            key={idx}
                            onClick={() => setThumbnail(photoUrl)}
                            className={`relative group/thumb w-14 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                              isSelected
                                ? 'border-[#4A5035] ring-2 ring-[#4A5035]/25'
                                : 'border-white hover:border-[#D5B895]'
                            }`}
                          >
                            <img
                              src={photoUrl}
                              alt={`Album ${idx + 1}`}
                              className="w-full h-full object-cover bg-white"
                            />
                            <button
                              type="button"
                              onClick={(e) => handleRemoveFromAlbum(photoUrl, e)}
                              title={isAr ? 'حذف من الألبوم' : 'Remove photo'}
                              className="absolute top-0.5 end-0.5 w-4 h-4 rounded-full bg-black/70 hover:bg-[#A8382B] text-white flex items-center justify-center transition cursor-pointer"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Customer Name & Phone Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#4A5035] mb-1.5">
                {isAr ? 'اسم العميل *' : 'Customer Name *'}
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFECE5] border border-[#DCD6C8] text-[#2B2F21] text-sm font-semibold focus:outline-none focus:border-[#4A5035]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#4A5035] mb-1.5">
                {isAr ? 'رقم الهاتف' : 'Phone Number'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#848871] absolute top-1/2 -translate-y-1/2 start-3.5" />
                <input
                  type="tel"
                  dir="ltr"
                  inputMode="numeric"
                  maxLength={13}
                  value={customerPhone}
                  onChange={(e) => {
                    const formatted = formatOmanPhoneInput(e.target.value);
                    setCustomerPhone(formatted);
                    if (phoneError) {
                      const digits = formatted
                        .replace(/^\+?968\s*/, '')
                        .replace(/\D/g, '');
                      if (digits.length === 8) {
                        setPhoneError('');
                      }
                    }
                  }}
                  className={`w-full ps-10 pe-3.5 py-2.5 rounded-xl bg-[#EFECE5] border text-[#2B2F21] text-sm font-mono focus:outline-none ${
                    phoneError
                      ? 'border-[#A8382B] focus:border-[#A8382B]'
                      : 'border-[#DCD6C8] focus:border-[#4A5035]'
                  }`}
                />
              </div>
              {phoneError && (
                <p className="mt-1 text-[11px] font-bold text-[#A8382B]">
                  {phoneError}
                </p>
              )}
            </div>
          </div>

          {/* 3. Fulfillment Type: استلام من المحل vs توصيل */}
          <div>
            <label className="block font-bold text-[#4A5035] mb-1.5">
              {isAr ? 'طريقة التسليم (استلام من المحل أو توصيل)' : 'Fulfillment Method'}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setFulfillmentType('pickup')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border font-bold text-xs sm:text-sm transition cursor-pointer ${
                  fulfillmentType === 'pickup'
                    ? 'bg-[#4A5035] text-[#FAF8F4] border-[#4A5035] shadow-xs'
                    : 'bg-[#EFECE5] text-[#2B2F21] border-[#DCD6C8] hover:bg-[#E5E0D5]'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-[#D5B895]" />
                <span>{isAr ? 'استلام من المحل' : 'In-Store Pickup'}</span>
                {fulfillmentType === 'pickup' && <Check className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setFulfillmentType('delivery')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border font-bold text-xs sm:text-sm transition cursor-pointer ${
                  fulfillmentType === 'delivery'
                    ? 'bg-[#4A5035] text-[#FAF8F4] border-[#4A5035] shadow-xs'
                    : 'bg-[#EFECE5] text-[#2B2F21] border-[#DCD6C8] hover:bg-[#E5E0D5]'
                }`}
              >
                <Truck className="w-4 h-4 text-[#D5B895]" />
                <span>{isAr ? 'توصيل' : 'Delivery'}</span>
                {fulfillmentType === 'delivery' && <Check className="w-4 h-4" />}
              </button>
            </div>

            {fulfillmentType === 'delivery' && (
              <div className="mt-2.5">
                <label className="block text-[11px] font-semibold text-[#5A5E4D] mb-1">
                  {isAr ? 'منطقة / عنوان التوصيل' : 'Delivery Area / Address'}
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#848871] absolute top-1/2 -translate-y-1/2 start-3.5" />
                  <input
                    type="text"
                    value={deliveryArea}
                    onChange={(e) => setDeliveryArea(e.target.value)}
                    className="w-full ps-10 pe-3.5 py-2 rounded-xl bg-[#EFECE5] border border-[#DCD6C8] text-[#2B2F21] text-xs font-semibold focus:outline-none focus:border-[#4A5035]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Optional Calendar Date & Clock Time Picker */}
          <div className="p-3.5 rounded-2xl bg-[#EFECE5]/75 border border-[#DFD9CC] space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#4A5035] text-xs flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#9A7B56]" />
                <span>
                  {isAr
                    ? 'تاريخ ووقت الاستلام (اختياري — التقويم والساعة)'
                    : 'Pickup Date & Time (Optional — Calendar & Clock)'}
                </span>
              </label>
              {(pickupDate || pickupTime) && (
                <button
                  type="button"
                  onClick={() => {
                    setPickupDate('');
                    setPickupTime('');
                  }}
                  className="text-[11px] text-[#848871] hover:text-[#2B2F21] underline cursor-pointer"
                >
                  {isAr ? 'مسح الوقت' : 'Clear'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="block text-[11px] text-[#6E7162] mb-1">
                  {isAr ? 'التاريخ (اليوم / التقويم)' : 'Date (Calendar)'}
                </span>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCD6C8] text-[#2B2F21] text-xs font-bold focus:outline-none focus:border-[#4A5035]"
                />
              </div>

              <div>
                <span className="block text-[11px] text-[#6E7162] mb-1">
                  {isAr ? 'الوقت (الساعة)' : 'Time (Clock)'}
                </span>
                <input
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCD6C8] text-[#2B2F21] text-xs font-bold focus:outline-none focus:border-[#4A5035]"
                />
              </div>
            </div>
          </div>

          {/* 5. Payment Status, Amount (OMR) & Gift Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-[#4A5035] mb-1.5">
                {isAr ? 'حالة الدفع' : 'Payment Status'}
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#EFECE5] border border-[#DCD6C8] text-[#2B2F21] text-xs font-bold focus:outline-none"
              >
                <option value="paid">{isAr ? 'مدفوع' : 'Paid'}</option>
                <option value="unpaid">{isAr ? 'غير مدفوع' : 'Unpaid'}</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#4A5035] mb-1.5">
                {isAr ? 'المبلغ (ر.ع.)' : 'Amount (OMR)'}
              </label>
              <input
                type="number"
                step="0.5"
                value={amountOmr}
                onChange={(e) => setAmountOmr(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#EFECE5] border border-[#DCD6C8] text-[#2B2F21] text-xs font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#4A5035] mb-1.5">
                {isAr ? 'بطاقة الإهداء' : 'Gift Card'}
              </label>
              <select
                value={hasGiftCard ? 'yes' : 'no'}
                onChange={(e) => setHasGiftCard(e.target.value === 'yes')}
                className="w-full px-3 py-2.5 rounded-xl bg-[#EFECE5] border border-[#DCD6C8] text-[#2B2F21] text-xs font-bold focus:outline-none"
              >
                <option value="yes">{isAr ? 'مرفقة مع الطلب' : 'Included'}</option>
                <option value="no">{isAr ? 'بدون بطاقة (—)' : 'None (—)'}</option>
              </select>
            </div>
          </div>

          {hasGiftCard && (
            <div>
              <label className="block font-bold text-[#4A5035] mb-1.5">
                {isAr ? 'نص بطاقة الإهداء' : 'Gift Card Message'}
              </label>
              <textarea
                rows={2}
                value={cardMessage}
                onChange={(e) => setCardMessage(e.target.value)}
                placeholder={
                  isAr
                    ? 'اكتب عبارة الإهداء ليتم طباعتها على بطاقة وردان...'
                    : 'Enter message to print on the WARDAN card...'
                }
                className="w-full px-3.5 py-2 rounded-xl bg-[#EFECE5] border border-[#DCD6C8] text-[#2B2F21] text-xs focus:outline-none focus:border-[#4A5035]"
              />
            </div>
          )}

          {/* 6. Order Note (ملاحظة مع الطلب) */}
          <div>
            <label className="block font-bold text-[#4A5035] mb-1.5">
              {isAr ? 'ملاحظة مع الطلب (اختياري)' : 'Order Note (Optional)'}
            </label>
            <textarea
              rows={2}
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder={
                isAr
                  ? 'مثال: لون التغليف، نوع الشريط، أو أي تفاصيل إضافية لتجهيز الطلب...'
                  : 'e.g. Wrapping color, ribbon style, or special preparation notes...'
              }
              className="w-full px-3.5 py-2 rounded-xl bg-[#EFECE5] border border-[#DCD6C8] text-[#2B2F21] text-xs focus:outline-none focus:border-[#4A5035]"
            />
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#EFECE5] hover:bg-[#E2DDD2] text-[#2B2F21] font-bold cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#52583C] hover:bg-[#41462F] text-[#FAF8F4] font-bold shadow-sm cursor-pointer"
            >
              {isEdit
                ? isAr
                  ? 'حفظ التعديلات'
                  : 'Save Changes'
                : isAr
                ? 'حفظ الطلب'
                : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
