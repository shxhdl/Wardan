import { Order, StaffProfile } from '../types';

const LS_SUPABASE_URL = 'wardan_supabase_url';
const LS_SUPABASE_KEY = 'wardan_supabase_anon_key';
const LS_SUPABASE_TOKEN = 'wardan_supabase_access_token';

const DEFAULT_SUPABASE_URL = 'https://pubyvzeaexyljnavcmzl.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_9JrqzMC4gzYw7M4aKZMOLg_2LEtma0w';

export function getSupabaseConfig(): { url: string; anonKey: string } {
  const envUrl =
    (import.meta as unknown as { env?: Record<string, string> }).env
      ?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const envKey =
    (import.meta as unknown as { env?: Record<string, string> }).env
      ?.VITE_SUPABASE_PUBLISHABLE_KEY ||
    (import.meta as unknown as { env?: Record<string, string> }).env
      ?.VITE_SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_KEY;

  const savedUrl =
    typeof window !== 'undefined'
      ? localStorage.getItem(LS_SUPABASE_URL) || ''
      : '';
  const savedKey =
    typeof window !== 'undefined'
      ? localStorage.getItem(LS_SUPABASE_KEY) || ''
      : '';

  return {
    url: (savedUrl || envUrl).trim().replace(/\/+$/, ''),
    anonKey: (savedKey || envKey).trim(),
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return (
    Boolean(url && anonKey) &&
    url.startsWith('http') &&
    !url.includes('your-project-id')
  );
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem(LS_SUPABASE_URL, url.trim().replace(/\/+$/, ''));
  localStorage.setItem(LS_SUPABASE_KEY, anonKey.trim());
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(LS_SUPABASE_URL);
  localStorage.removeItem(LS_SUPABASE_KEY);
  localStorage.removeItem(LS_SUPABASE_TOKEN);
}

function getHeaders(extra?: Record<string, string>): Record<string, string> {
  const { anonKey } = getSupabaseConfig();
  const token =
    (typeof window !== 'undefined' &&
      localStorage.getItem(LS_SUPABASE_TOKEN)) ||
    anonKey;

  return {
    'Content-Type': 'application/json',
    apikey: anonKey,
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

/* ============================================================================
   Row Mappers between DB snake_case and App camelCase Order
   ============================================================================ */
interface DbOrderRow {
  id: string;
  customer_name_ar: string;
  customer_name_en: string;
  customer_phone: string;
  order_type_ar: string;
  order_type_en: string;
  thumbnail: string;
  status: 'preparing' | 'delivering' | 'completed';
  payment_status: 'paid' | 'unpaid';
  has_gift_card: boolean;
  is_completed: boolean;
  is_urgent: boolean;
  fulfillment_type: 'pickup' | 'delivery';
  pickup_date: string | null;
  pickup_time: string | null;
  delivery_time_ar: string;
  delivery_time_en: string;
  delivery_area_ar: string;
  delivery_area_en: string;
  amount_omr: number;
  card_message_ar: string | null;
  card_message_en: string | null;
  notes_ar: string | null;
  notes_en: string | null;
  florist_ar: string;
  florist_en: string;
}

export function mapDbRowToOrder(row: DbOrderRow): Order {
  return {
    id: row.id,
    customerNameAr: row.customer_name_ar,
    customerNameEn: row.customer_name_en,
    customerPhone: row.customer_phone,
    orderTypeAr: row.order_type_ar,
    orderTypeEn: row.order_type_en,
    thumbnail: row.thumbnail,
    status: row.status,
    paymentStatus: row.payment_status,
    hasGiftCard: row.has_gift_card,
    isCompleted: row.is_completed,
    isUrgent: row.is_urgent,
    fulfillmentType: row.fulfillment_type,
    pickupDate: row.pickup_date || undefined,
    pickupTime: row.pickup_time || undefined,
    deliveryTimeAr: row.delivery_time_ar,
    deliveryTimeEn: row.delivery_time_en,
    deliveryAreaAr: row.delivery_area_ar,
    deliveryAreaEn: row.delivery_area_en,
    amountOmr: Number(row.amount_omr) || 0,
    cardMessageAr: row.card_message_ar || undefined,
    cardMessageEn: row.card_message_en || undefined,
    notesAr: row.notes_ar || undefined,
    notesEn: row.notes_en || undefined,
    floristAr: row.florist_ar || 'شهد',
    floristEn: row.florist_en || 'Shahad',
  };
}

export function mapOrderToDbRow(order: Order): DbOrderRow {
  return {
    id: order.id,
    customer_name_ar: order.customerNameAr,
    customer_name_en: order.customerNameEn,
    customer_phone: order.customerPhone,
    order_type_ar: order.orderTypeAr,
    order_type_en: order.orderTypeEn,
    thumbnail: order.thumbnail,
    status: order.status,
    payment_status: order.paymentStatus,
    has_gift_card: order.hasGiftCard,
    is_completed: order.isCompleted,
    is_urgent: Boolean(order.isUrgent),
    fulfillment_type: order.fulfillmentType,
    pickup_date: order.pickupDate ?? null,
    pickup_time: order.pickupTime ?? null,
    delivery_time_ar: order.deliveryTimeAr,
    delivery_time_en: order.deliveryTimeEn,
    delivery_area_ar: order.deliveryAreaAr,
    delivery_area_en: order.deliveryAreaEn,
    amount_omr: order.amountOmr,
    card_message_ar: order.cardMessageAr ?? null,
    card_message_en: order.cardMessageEn ?? null,
    notes_ar: order.notesAr ?? null,
    notes_en: order.notesEn ?? null,
    florist_ar: order.floristAr,
    florist_en: order.floristEn,
  };
}

/* ============================================================================
   Database Operations for Orders via Supabase REST API (/rest/v1/orders)
   ============================================================================ */
export async function fetchOrdersFromSupabase(): Promise<Order[] | null> {
  if (!isSupabaseConfigured()) return null;
  const { url } = getSupabaseConfig();

  try {
    const res = await fetch(
      `${url}/rest/v1/orders?select=*&order=created_at.desc`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as DbOrderRow[];
    if (!Array.isArray(data)) return null;
    return data.map(mapDbRowToOrder);
  } catch {
    return null;
  }
}

export async function upsertOrderInSupabase(order: Order): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { url } = getSupabaseConfig();

  try {
    const row = mapOrderToDbRow(order);
    const res = await fetch(`${url}/rest/v1/orders?on_conflict=id`, {
      method: 'POST',
      headers: getHeaders({
        Prefer: 'resolution=merge-duplicates,return=minimal',
      }),
      body: JSON.stringify(row),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteOrderFromSupabase(orderId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { url } = getSupabaseConfig();

  try {
    const encodedId = encodeURIComponent(orderId);
    const res = await fetch(`${url}/rest/v1/orders?id=eq.${encodedId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/* ============================================================================
   Supabase Auth Operations via REST API (/auth/v1/...)
   ============================================================================ */
export async function signInWithSupabaseAuth(
  email: string,
  password: string
): Promise<{ staff: StaffProfile | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { staff: null, error: 'SUPABASE_NOT_CONFIGURED' };
  }
  const { url } = getSupabaseConfig();

  try {
    const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok || !data.user) {
      return {
        staff: null,
        error: data?.error_description || data?.msg || 'Invalid login credentials',
      };
    }

    if (data.access_token) {
      localStorage.setItem(LS_SUPABASE_TOKEN, data.access_token);
    }

    const user = data.user;
    const meta = user.user_metadata || {};
    const staff: StaffProfile = {
      id: user.id,
      email: user.email || email,
      nameAr: meta.name_ar || meta.full_name || email.split('@')[0],
      nameEn: meta.name_en || meta.full_name || email.split('@')[0],
      roleAr: meta.role_ar || 'موظف',
      roleEn: meta.role_en || 'Staff',
      pin: '1234',
      password: '',
      status: 'approved',
      isAdmin: false,
    };

    return { staff, error: null };
  } catch {
    return { staff: null, error: 'NETWORK_ERROR' };
  }
}

export async function signUpWithSupabaseAuth(
  email: string,
  password: string,
  name: string,
  role: string
): Promise<{ staff: StaffProfile | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { staff: null, error: 'SUPABASE_NOT_CONFIGURED' };
  }
  const { url } = getSupabaseConfig();

  try {
    const res = await fetch(`${url}/auth/v1/signup`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        email,
        password,
        data: {
          full_name: name,
          name_ar: name,
          name_en: name,
          role_ar: role,
          role_en: role,
        },
      }),
    });

    const data = await res.json();
    const user = data?.user || (data?.id ? data : null);
    if (!res.ok || !user) {
      return {
        staff: null,
        error: data?.error_description || data?.msg || 'Registration failed',
      };
    }

    if (data.access_token) {
      localStorage.setItem(LS_SUPABASE_TOKEN, data.access_token);
    }

    // Best-effort insert into staff_profiles table if it exists
    try {
      await fetch(`${url}/rest/v1/staff_profiles?on_conflict=id`, {
        method: 'POST',
        headers: getHeaders({
          Prefer: 'resolution=merge-duplicates,return=minimal',
        }),
        body: JSON.stringify({
          id: user.id,
          email,
          name_ar: name,
          name_en: name,
          is_admin: false,
        }),
      });
    } catch {
      // Ignore if table hasn't been created yet
    }

    const staff: StaffProfile = {
      id: user.id,
      email,
      nameAr: name,
      nameEn: name,
      roleAr: role,
      roleEn: role,
      pin: '1234',
      password: '',
      status: 'approved',
      isAdmin: false,
    };

    return { staff, error: null };
  } catch {
    return { staff: null, error: 'NETWORK_ERROR' };
  }
}

export async function signOutFromSupabaseAuth(): Promise<void> {
  localStorage.removeItem(LS_SUPABASE_TOKEN);
}
