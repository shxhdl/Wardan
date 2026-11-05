import { Order, Language } from '../types';

/**
 * Calculates how many minutes remain until the order's scheduled pickup/delivery time.
 * Returns null if the order has no parseable time.
 */
export function getMinutesUntilOrder(
  order: Order,
  now: Date = new Date()
): number | null {
  if (order.isCompleted) return null;

  let targetYear = now.getFullYear();
  let targetMonth = now.getMonth();
  let targetDay = now.getDate();

  // 1. Parse date if available (YYYY-MM-DD)
  if (order.pickupDate) {
    const parts = order.pickupDate.split('-').map((n) => parseInt(n, 10));
    if (parts.length === 3 && !parts.some(isNaN)) {
      targetYear = parts[0];
      targetMonth = parts[1] - 1;
      targetDay = parts[2];
    }
  }

  let hours: number | null = null;
  let minutes: number | null = null;

  // 2. Parse 24h time if available (HH:mm)
  if (order.pickupTime) {
    const [hh, mm] = order.pickupTime.split(':').map((n) => parseInt(n, 10));
    if (!isNaN(hh) && !isNaN(mm)) {
      hours = hh;
      minutes = mm;
    }
  } else if (order.deliveryTimeAr) {
    // Fallback: parse strings like "اليوم - 4:30 م" or "اليوم - 5:00 م"
    const match = order.deliveryTimeAr.match(/(\d{1,2}):(\d{2})\s*([مص])/);
    if (match) {
      let hh = parseInt(match[1], 10);
      const mm = parseInt(match[2], 10);
      const period = match[3];
      if (period === 'م' && hh < 12) hh += 12;
      if (period === 'ص' && hh === 12) hh = 0;
      hours = hh;
      minutes = mm;
    }
  }

  if (hours === null || minutes === null) {
    return null;
  }

  const targetDate = new Date(
    targetYear,
    targetMonth,
    targetDay,
    hours,
    minutes,
    0,
    0
  );

  const diffMs = targetDate.getTime() - now.getTime();
  return Math.ceil(diffMs / 60000);
}

/**
 * An order is urgent if it is NOT completed and has <= 30 minutes left until pickup/delivery
 * (down to -60 minutes if it just passed and hasn't been marked completed yet).
 */
export function isOrderUrgent(order: Order, now: Date = new Date()): boolean {
  if (order.isCompleted) return false;
  const mins = getMinutesUntilOrder(order, now);
  if (mins === null) return false;
  return mins <= 30 && mins >= -60;
}

/**
 * Formats a human-readable remaining time badge for an urgent order.
 */
export function formatRemainingMinutes(
  minutesLeft: number,
  lang: Language
): string {
  const isAr = lang === 'ar';
  if (minutesLeft > 0) {
    return isAr
      ? `باقي ${minutesLeft} دقيقة`
      : `${minutesLeft} min left`;
  }
  if (minutesLeft === 0) {
    return isAr ? 'موعد الاستلام الآن!' : 'Due right now!';
  }
  return isAr
    ? `تجاوز الموعد بـ ${Math.abs(minutesLeft)} د`
    : `Overdue by ${Math.abs(minutesLeft)}m`;
}

/**
 * Plays a clear, resonant 3-tone alert chime using the Web Audio API.
 * Works offline without external audio files.
 */
let sharedAudioCtx: AudioContext | null = null;

export function playUrgentAlertSound(): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;

    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }

    const now = sharedAudioCtx.currentTime;
    const notes = [
      { freq: 880, start: 0, duration: 0.18 }, // A5
      { freq: 1174.66, start: 0.2, duration: 0.18 }, // D6
      { freq: 1318.51, start: 0.4, duration: 0.35 }, // E6
    ];

    notes.forEach(({ freq, start, duration }) => {
      if (!sharedAudioCtx) return;
      const osc = sharedAudioCtx.createOscillator();
      const gain = sharedAudioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.28, now + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

      osc.connect(gain);
      gain.connect(sharedAudioCtx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration + 0.02);
    });
  } catch {
    // Ignore if audio is blocked by browser autoplay policy before user interaction
  }
}

/**
 * Requests browser Notification permission and sends a system notification for an urgent order.
 */
export async function sendBrowserUrgentNotification(
  order: Order,
  minutesLeft: number,
  lang: Language
): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  try {
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    if (Notification.permission === 'granted') {
      const isAr = lang === 'ar';
      const title = isAr
        ? `⏰ طلب عاجل (${order.id}) — وردان`
        : `⏰ Urgent Order (${order.id}) — WARDAN`;
      const timeText = formatRemainingMinutes(minutesLeft, lang);
      const body = isAr
        ? `${order.customerNameAr} • ${order.orderTypeAr} (${timeText})`
        : `${order.customerNameEn} • ${order.orderTypeEn} (${timeText})`;

      new Notification(title, {
        body,
        icon: '/favicon.png',
        tag: `wardan-urgent-${order.id}`,
      });
    }
  } catch {
    // Ignore notification errors on unsupported browsers
  }
}

/**
 * Plays a pleasant, warm 2-note chime when a new order is added.
 */
export function playNewOrderNotificationSound(): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;

    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }

    const now = sharedAudioCtx.currentTime;
    const notes = [
      { freq: 587.33, start: 0, duration: 0.16 }, // D5
      { freq: 880, start: 0.16, duration: 0.32 }, // A5
    ];

    notes.forEach(({ freq, start, duration }) => {
      if (!sharedAudioCtx) return;
      const osc = sharedAudioCtx.createOscillator();
      const gain = sharedAudioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.24, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

      osc.connect(gain);
      gain.connect(sharedAudioCtx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration + 0.02);
    });
  } catch {
    // Ignore if blocked by browser autoplay policy
  }
}

/**
 * Sends a browser notification when a new order is added.
 */
export async function sendBrowserNewOrderNotification(
  order: Order,
  lang: Language
): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  try {
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    if (Notification.permission === 'granted') {
      const isAr = lang === 'ar';
      const title = isAr
        ? `🌸 طلب جديد (${order.id}) — وردان`
        : `🌸 New Order (${order.id}) — WARDAN`;
      const body = isAr
        ? `العميل: ${order.customerNameAr} • ${order.orderTypeAr} (${order.deliveryTimeAr})`
        : `Customer: ${order.customerNameEn} • ${order.orderTypeEn} (${order.deliveryTimeEn})`;

      new Notification(title, {
        body,
        icon: '/favicon.png',
        tag: `wardan-new-order-${order.id}`,
      });
    }
  } catch {
    // Ignore notification errors
  }
}

