import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Language,
  ThemeMode,
  NavSection,
  Order,
  StaffProfile,
  NewOrderNotification,
} from './types';
import {
  INITIAL_ORDERS,
  STAFF_PROFILES,
} from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardView } from './components/DashboardView';
import {
  OrdersView,
  CustomersView,
  ReportsView,
  SettingsView,
} from './components/ModuleViews';
import { OrderDetailModal, NewOrderModal } from './components/OrderModals';
import { LoginPage } from './components/LoginPage';
import {
  getMinutesUntilOrder,
  isOrderUrgent,
  formatRemainingMinutes,
  playUrgentAlertSound,
  sendBrowserUrgentNotification,
  playNewOrderNotificationSound,
  sendBrowserNewOrderNotification,
} from './utils/urgentAlerts';
import {
  isSupabaseConfigured,
  fetchOrdersFromSupabase,
  upsertOrderInSupabase,
  deleteOrderFromSupabase,
  signOutFromSupabaseAuth,
} from './lib/supabase';
import { BellRing, X, Eye, Sparkles } from 'lucide-react';

export function App() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('wardan_v2_lang');
    return saved === 'en' || saved === 'ar' ? saved : 'ar';
  });

  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('wardan_v3_theme');
    return saved === 'dark' || saved === 'light' ? saved : 'light';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('wardan_v2_auth');
    return saved ? JSON.parse(saved) : true;
  });

  const [staffList, setStaffList] = useState<StaffProfile[]>(() => {
    const saved = localStorage.getItem('wardan_v3_staff_list');
    if (saved) {
      try {
        const parsed = (JSON.parse(saved) as StaffProfile[]).filter(
          (s) => s.id !== 'staff-1' && s.email !== 'shahad@wardan.om'
        );
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        return [];
      }
    }
    return [];
  });

  const [currentStaff, setCurrentStaff] = useState<StaffProfile>(() => {
    const savedListRaw = localStorage.getItem('wardan_v3_staff_list');
    if (savedListRaw) {
      try {
        const list = (JSON.parse(savedListRaw) as StaffProfile[]).filter(
          (s) => s.id !== 'staff-1' && s.email !== 'shahad@wardan.om'
        );
        if (list.length > 0) {
          // Use the most recently registered/logged-in account (e.g. yousef)
          return list[list.length - 1];
        }
      } catch {
        // ignore
      }
    }
    const saved = localStorage.getItem('wardan_v3_current_staff');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return STAFF_PROFILES[0];
      }
    }
    return STAFF_PROFILES[0];
  });

  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('wardan_v2_orders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_ORDERS;
      }
    }
    return INITIAL_ORDERS;
  });

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Notification preferences
  const [notifyNewOrder, setNotifyNewOrder] = useState<boolean>(() => {
    const saved = localStorage.getItem('wardan_v3_notify_new_order');
    return saved ? JSON.parse(saved) : true;
  });

  const [notifyUrgentOrder, setNotifyUrgentOrder] = useState<boolean>(() => {
    const saved = localStorage.getItem('wardan_v3_notify_urgent_order');
    return saved ? JSON.parse(saved) : true;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('wardan_v3_sound_enabled');
    return saved ? JSON.parse(saved) : true;
  });

  // Real-time clock for urgent order monitoring (<= 30 minutes until pickup)
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [activeToastOrder, setActiveToastOrder] = useState<Order | null>(null);
  const [activeNewOrderToast, setActiveNewOrderToast] = useState<Order | null>(
    null
  );
  const [newOrderNotifications, setNewOrderNotifications] = useState<
    NewOrderNotification[]
  >([]);
  const alertedOrderIdsRef = useRef<Set<string>>(
    new Set(
      (() => {
        try {
          const saved = localStorage.getItem('wardan_v3_alerted_urgent_orders');
          return saved ? (JSON.parse(saved) as string[]) : [];
        } catch {
          return [];
        }
      })()
    )
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!activeToastOrder) return;
    const dismissTimer = setTimeout(() => {
      setActiveToastOrder(null);
    }, 6000);
    return () => clearTimeout(dismissTimer);
  }, [activeToastOrder]);

  // Monitor orders entering the <= 30 minutes urgent window and trigger audio + notification ONCE per order
  useEffect(() => {
    if (!notifyUrgentOrder) return;
    const now = currentTime;
    let updated = false;

    orders.forEach((order) => {
      if (order.isCompleted) {
        return;
      }
      const minsLeft = getMinutesUntilOrder(order, now);
      if (minsLeft !== null && minsLeft <= 30 && minsLeft >= -60) {
        if (!alertedOrderIdsRef.current.has(order.id)) {
          alertedOrderIdsRef.current.add(order.id);
          updated = true;
          setActiveToastOrder(order);
          if (soundEnabled) {
            playUrgentAlertSound();
          }
          void sendBrowserUrgentNotification(order, minsLeft, lang);
        }
      }
    });

    if (updated) {
      try {
        localStorage.setItem(
          'wardan_v3_alerted_urgent_orders',
          JSON.stringify(Array.from(alertedOrderIdsRef.current))
        );
      } catch {
        // ignore storage errors
      }
    }
  }, [orders, currentTime, notifyUrgentOrder, soundEnabled, lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title =
      lang === 'ar'
        ? 'WARDAN | نظام وردان لإدارة الطلبات والتجهيز'
        : 'WARDAN | Order & Floral Preparation System';
    localStorage.setItem('wardan_v2_lang', lang);
  }, [lang]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('wardan_v3_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('wardan_v2_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('wardan_v3_staff_list', JSON.stringify(staffList));
  }, [staffList]);

  useEffect(() => {
    localStorage.setItem(
      'wardan_v3_notify_new_order',
      JSON.stringify(notifyNewOrder)
    );
  }, [notifyNewOrder]);

  useEffect(() => {
    localStorage.setItem(
      'wardan_v3_notify_urgent_order',
      JSON.stringify(notifyUrgentOrder)
    );
  }, [notifyUrgentOrder]);

  useEffect(() => {
    localStorage.setItem('wardan_v3_sound_enabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  // Sync with Supabase Auth session and Orders table when Supabase is configured
  const syncFromSupabase = async () => {
    if (!isSupabaseConfigured()) return;
    const dbOrders = await fetchOrdersFromSupabase();
    if (dbOrders && dbOrders.length > 0) {
      setOrders(dbOrders);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    void syncFromSupabase();
  }, []);

  const toggleLang = () => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const handleLogin = (staff: StaffProfile) => {
    setCurrentStaff(staff);
    setIsAuthenticated(true);
    localStorage.setItem('wardan_v3_current_staff', JSON.stringify(staff));
    localStorage.setItem('wardan_v2_auth', 'true');
    setStaffList((prev) => {
      const withoutCurrent = prev.filter(
        (s) => s.id !== staff.id && s.email.toLowerCase() !== staff.email.toLowerCase()
      );
      return [...withoutCurrent, { ...staff, status: 'approved' }];
    });
  };

  const handleRegisterStaff = (newStaff: StaffProfile) => {
    const approvedStaff: StaffProfile = { ...newStaff, status: 'approved' };
    setCurrentStaff(approvedStaff);
    localStorage.setItem(
      'wardan_v3_current_staff',
      JSON.stringify(approvedStaff)
    );
    setStaffList((prev) => [
      ...prev.filter(
        (s) =>
          s.id !== approvedStaff.id &&
          s.email.toLowerCase() !== approvedStaff.email.toLowerCase()
      ),
      approvedStaff,
    ]);
  };

  const handleUpdateStaffAvatar = (avatarDataUrl: string | undefined) => {
    const updatedStaff: StaffProfile = {
      ...currentStaff,
      avatar: avatarDataUrl,
    };
    setCurrentStaff(updatedStaff);
    localStorage.setItem('wardan_v3_current_staff', JSON.stringify(updatedStaff));
    setStaffList((prev) =>
      prev.map((s) => (s.id === currentStaff.id ? updatedStaff : s))
    );
  };

  const handleLogout = async () => {
    await signOutFromSupabaseAuth();
    setIsAuthenticated(false);
    localStorage.setItem('wardan_v2_auth', 'false');
  };

  const handleToggleOrderCompleted = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const nextCompleted = !o.isCompleted;
        if (nextCompleted && activeToastOrder?.id === orderId) {
          setActiveToastOrder(null);
        }
        const updated: Order = {
          ...o,
          isCompleted: nextCompleted,
          status: nextCompleted ? 'completed' : 'preparing',
        };
        void upsertOrderInSupabase(updated);
        return updated;
      })
    );
  };

  const handleTogglePaymentStatus = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const updated: Order = {
          ...o,
          paymentStatus: o.paymentStatus === 'paid' ? 'unpaid' : 'paid',
        };
        void upsertOrderInSupabase(updated);
        return updated;
      })
    );
  };

  const handleSaveOrder = (savedOrder: Order, isEdit: boolean) => {
    // Allow re-alerting if an order's time was updated into the urgent <=30m window
    alertedOrderIdsRef.current.delete(savedOrder.id);
    setCurrentTime(new Date());

    void upsertOrderInSupabase(savedOrder);

    if (isEdit) {
      setOrders((prev) =>
        prev.map((o) => (o.id === savedOrder.id ? savedOrder : o))
      );
    } else {
      setOrders((prev) => [savedOrder, ...prev]);

      // Trigger New Order Notification (اشعار عند اضافة طلب جديد)
      const nowTimeStr = new Date().toLocaleTimeString(
        lang === 'ar' ? 'ar-OM' : 'en-US',
        { hour: '2-digit', minute: '2-digit' }
      );
      setNewOrderNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          order: savedOrder,
          createdAt: nowTimeStr,
          read: false,
        },
        ...prev,
      ]);

      if (notifyNewOrder) {
        setActiveNewOrderToast(savedOrder);
        if (soundEnabled) {
          playNewOrderNotificationSound();
        }
        void sendBrowserNewOrderNotification(savedOrder, lang);
      }
    }
    setEditingOrder(null);
  };

  const handleDeleteOrder = (orderId: string) => {
    alertedOrderIdsRef.current.delete(orderId);
    if (activeToastOrder?.id === orderId) {
      setActiveToastOrder(null);
    }
    if (activeNewOrderToast?.id === orderId) {
      setActiveNewOrderToast(null);
    }
    void deleteOrderFromSupabase(orderId);
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    setSelectedOrder((prev) => (prev && prev.id === orderId ? null : prev));
  };

  const handleOpenNewOrder = () => {
    setEditingOrder(null);
    setIsOrderFormOpen(true);
  };

  const handleOpenEditOrder = (order: Order) => {
    setEditingOrder(order);
    setIsOrderFormOpen(true);
  };

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customerNameAr.toLowerCase().includes(q) ||
        o.customerNameEn.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q) ||
        o.orderTypeAr.toLowerCase().includes(q) ||
        o.orderTypeEn.toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  const urgentOrders = useMemo(
    () => orders.filter((o) => isOrderUrgent(o, currentTime)),
    [orders, currentTime]
  );

  const nextOrderNumber = useMemo(() => {
    const nums = orders
      .map((o) => parseInt(o.id.replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n));
    return nums.length > 0 ? Math.max(...nums) + 1 : 1287;
  }, [orders]);

  // Derive live customer statistics directly from the actual orders list
  const liveCustomers = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        nameAr: string;
        nameEn: string;
        phone: string;
        areaAr: string;
        areaEn: string;
        totalOrders: number;
        totalSpentOmr: number;
        tier: 'VIP' | 'Signature' | 'Regular';
        favoriteStyleAr: string;
        favoriteStyleEn: string;
        lastOrderDateAr: string;
        lastOrderDateEn: string;
      }
    >();

    orders.forEach((o, idx) => {
      const key = o.customerNameAr.trim();
      const existing = map.get(key);
      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpentOmr += o.amountOmr;
      } else {
        map.set(key, {
          id: `cust-${idx + 1}`,
          nameAr: o.customerNameAr,
          nameEn: o.customerNameEn,
          phone: o.customerPhone,
          areaAr: o.deliveryAreaAr,
          areaEn: o.deliveryAreaEn,
          totalOrders: 1,
          totalSpentOmr: o.amountOmr,
          tier: o.amountOmr >= 70 ? 'VIP' : 'Signature',
          favoriteStyleAr: o.orderTypeAr,
          favoriteStyleEn: o.orderTypeEn,
          lastOrderDateAr: o.deliveryTimeAr,
          lastOrderDateEn: o.deliveryTimeEn,
        });
      }
    });

    return Array.from(map.values());
  }, [orders]);

  if (!isAuthenticated) {
    return (
      <LoginPage
        lang={lang}
        onToggleLang={toggleLang}
        onLogin={handleLogin}
        staffList={staffList}
        onRegisterStaff={handleRegisterStaff}
      />
    );
  }

  const isAr = lang === 'ar';
  const toastMinsLeft = activeToastOrder
    ? getMinutesUntilOrder(activeToastOrder, currentTime)
    : null;

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#F6F3EC] text-[#2B2F21] flex relative"
    >
      {/* Floating New Order Added Notification Toast Banner */}
      {activeNewOrderToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-md bg-[#4A5035] text-[#FAF8F4] rounded-2xl p-4 shadow-2xl border-2 border-[#D5B895] animate-in fade-in slide-in-from-top-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D5B895] text-[#2B2F21] flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-[#D5B895]">
                  {isAr ? '🌸 إشعار إضافة طلب جديد!' : '🌸 New Order Added!'}
                </div>
                <div className="font-bold text-sm mt-0.5">
                  <span dir="ltr">{activeNewOrderToast.id}</span> —{' '}
                  {isAr
                    ? activeNewOrderToast.customerNameAr
                    : activeNewOrderToast.customerNameEn}
                </div>
                <div className="text-xs text-[#E6DFD3] mt-0.5">
                  {isAr
                    ? activeNewOrderToast.orderTypeAr
                    : activeNewOrderToast.orderTypeEn}{' '}
                  •{' '}
                  {isAr
                    ? activeNewOrderToast.deliveryTimeAr
                    : activeNewOrderToast.deliveryTimeEn}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveNewOrderToast(null)}
              className="p-1 rounded-lg text-[#D5B895] hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setSelectedOrder(activeNewOrderToast);
                setActiveNewOrderToast(null);
              }}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#D5B895] text-[#2B2F21] font-bold cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isAr ? 'عرض الطلب' : 'View Order'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Urgent Order Audio & Visual Alert Toast Banner */}
      {activeToastOrder && !activeNewOrderToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-md bg-[#4A5035] text-[#FAF8F4] rounded-2xl p-4 shadow-2xl border-2 border-[#D5B895] animate-in fade-in slide-in-from-top-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#A8382B] text-white flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-[#D5B895]">
                    {isAr ? 'تنبيه طلب عاجل!' : 'Urgent Order Alert!'}
                  </span>
                  {toastMinsLeft !== null && (
                    <span className="px-2 py-0.5 rounded-full bg-[#A8382B] text-white text-[10px] font-bold">
                      {formatRemainingMinutes(toastMinsLeft, lang)}
                    </span>
                  )}
                </div>
                <div className="font-bold text-sm mt-0.5">
                  <span dir="ltr">{activeToastOrder.id}</span> —{' '}
                  {isAr
                    ? activeToastOrder.customerNameAr
                    : activeToastOrder.customerNameEn}
                </div>
                <div className="text-xs text-[#E6DFD3] mt-0.5">
                  {isAr
                    ? activeToastOrder.orderTypeAr
                    : activeToastOrder.orderTypeEn}{' '}
                  •{' '}
                  {isAr
                    ? activeToastOrder.deliveryTimeAr
                    : activeToastOrder.deliveryTimeEn}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveToastOrder(null)}
              className="p-1 rounded-lg text-[#D5B895] hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setSelectedOrder(activeToastOrder);
                setActiveToastOrder(null);
              }}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#D5B895] text-[#2B2F21] font-bold cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isAr ? 'عرض الطلب' : 'View Order'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        lang={lang}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-5">
        <TopBar
          lang={lang}
          onSetLang={setLang}
          onToggleLang={toggleLang}
          currentStaff={currentStaff}
          staffList={staffList}
          onChangeStaff={(s) => {
            setCurrentStaff(s);
            localStorage.setItem('wardan_v3_current_staff', JSON.stringify(s));
          }}
          onLogout={handleLogout}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          urgentOrders={urgentOrders}
          newOrderNotifications={newOrderNotifications}
          onClearNewOrderNotifications={() => setNewOrderNotifications([])}
          currentTime={currentTime}
          onSelectOrder={setSelectedOrder}
        />

        <main className="flex-1 px-4 sm:px-6 pt-0.5">
          {activeSection === 'dashboard' && (
            <DashboardView
              lang={lang}
              orders={filteredOrders}
              currentTime={currentTime}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled((prev) => !prev)}
              onSelectOrder={setSelectedOrder}
              onEditOrder={handleOpenEditOrder}
              onDeleteOrder={handleDeleteOrder}
              onToggleOrderCompleted={handleToggleOrderCompleted}
              onTogglePaymentStatus={handleTogglePaymentStatus}
              onOpenNewOrder={handleOpenNewOrder}
              onNavigateOrders={() => setActiveSection('orders')}
            />
          )}

          {activeSection === 'orders' && (
            <OrdersView
              lang={lang}
              orders={filteredOrders}
              onSelectOrder={setSelectedOrder}
              onEditOrder={handleOpenEditOrder}
              onDeleteOrder={handleDeleteOrder}
              onToggleCompleted={handleToggleOrderCompleted}
              onOpenNewOrder={handleOpenNewOrder}
            />
          )}

          {activeSection === 'completed' && (
            <OrdersView
              lang={lang}
              orders={filteredOrders.filter((o) => o.isCompleted)}
              onSelectOrder={setSelectedOrder}
              onEditOrder={handleOpenEditOrder}
              onDeleteOrder={handleDeleteOrder}
              onToggleCompleted={handleToggleOrderCompleted}
              onOpenNewOrder={handleOpenNewOrder}
            />
          )}

          {activeSection === 'customers' && (
            <CustomersView lang={lang} customers={liveCustomers} />
          )}

          {activeSection === 'reports' && (
            <ReportsView lang={lang} orders={orders} />
          )}

          {activeSection === 'settings' && (
            <SettingsView
              lang={lang}
              onSetLang={setLang}
              theme={theme}
              onSetTheme={setTheme}
              currentStaff={currentStaff}
              onUpdateStaffAvatar={handleUpdateStaffAvatar}
              notifyNewOrder={notifyNewOrder}
              onToggleNotifyNewOrder={() => setNotifyNewOrder((prev) => !prev)}
              notifyUrgentOrder={notifyUrgentOrder}
              onToggleNotifyUrgentOrder={() =>
                setNotifyUrgentOrder((prev) => !prev)
              }
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled((prev) => !prev)}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      {/* Order Details Modal */}
      <OrderDetailModal
        lang={lang}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onEditOrder={handleOpenEditOrder}
        onDeleteOrder={handleDeleteOrder}
      />

      {/* Create / Edit Order Modal */}
      <NewOrderModal
        lang={lang}
        isOpen={isOrderFormOpen}
        onClose={() => {
          setIsOrderFormOpen(false);
          setEditingOrder(null);
        }}
        onSaveOrder={handleSaveOrder}
        nextOrderNumber={nextOrderNumber}
        editingOrder={editingOrder}
      />
    </div>
  );
}
export default App;
