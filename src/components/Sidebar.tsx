import React from 'react';
import { Language, NavSection } from '../types';
import { WardanLogo } from './WardanLogo';
import {
  Home,
  ClipboardList,
  CheckCircle2,
  Users,
  BarChart3,
  Settings,
  X,
} from 'lucide-react';

interface SidebarProps {
  lang: Language;
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const NAV_ITEMS: {
  id: NavSection;
  labelAr: string;
  labelEn: string;
  shortAr: string;
  shortEn: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: 'dashboard',
    labelAr: 'الرئيسية',
    labelEn: 'Dashboard',
    shortAr: 'الرئيسية',
    shortEn: 'Home',
    icon: Home,
  },
  {
    id: 'orders',
    labelAr: 'الطلبيات',
    labelEn: 'Orders',
    shortAr: 'الطلبيات',
    shortEn: 'Orders',
    icon: ClipboardList,
  },
  {
    id: 'completed',
    labelAr: 'اكتملت',
    labelEn: 'Completed',
    shortAr: 'اكتملت',
    shortEn: 'Done',
    icon: CheckCircle2,
  },
  {
    id: 'customers',
    labelAr: 'العملاء',
    labelEn: 'Customers',
    shortAr: 'العملاء',
    shortEn: 'Clients',
    icon: Users,
  },
  {
    id: 'reports',
    labelAr: 'التقارير',
    labelEn: 'Reports',
    shortAr: 'التقارير',
    shortEn: 'Reports',
    icon: BarChart3,
  },
  {
    id: 'settings',
    labelAr: 'الإعدادات',
    labelEn: 'Settings',
    shortAr: 'الإعدادات',
    shortEn: 'Settings',
    icon: Settings,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  lang,
  activeSection,
  onSelectSection,
  mobileOpen,
  onCloseMobile,
}) => {
  const isAr = lang === 'ar';

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-[#4A5035] text-[#FAF8F4] select-none justify-between overflow-hidden">
      {/* Top WARDAN Brand Mark & Navigation */}
      <div className="px-3.5 pt-5 pb-2">
        <div className="flex items-center justify-between lg:justify-center mb-5 px-2">
          <button
            type="button"
            onClick={() => {
              onSelectSection('dashboard');
              onCloseMobile();
            }}
            className="mx-auto focus:outline-none cursor-pointer group"
          >
            <WardanLogo
              variant="gold"
              size="md"
              className="transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </button>

          {mobileOpen && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-2 rounded-xl text-[#D5B895] hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Exact 6 Navigation Links from V2 Interface */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectSection(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#868A70] text-[#FAF8F4] font-bold shadow-xs'
                    : 'text-[#EAE5DA]/90 hover:bg-white/8 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 ${
                    isActive ? 'text-[#FAF8F4]' : 'text-[#D5B895]'
                  }`}
                />
                <span className="truncate">
                  {isAr ? item.labelAr : item.labelEn}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Porcelain Vase Floral Bouquet on Pedestal — Seamlessly Blended into Sidebar */}
      <div className="relative mt-auto pt-4 overflow-hidden pointer-events-none">
        <div className="relative">
          {/* Top & Side Soft Feathering Overlays so Photo Melts into #4A5035 Sidebar */}
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#4A5035] via-[#4A5035]/65 to-transparent z-10" />
          <div className="absolute inset-y-0 inset-x-0 bg-gradient-to-t from-[#3E432C]/35 via-transparent to-transparent z-10" />
          <img
            src="/brand/v2-sidebar-vase.png"
            alt="WARDAN Floral Vase"
            style={{
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.65) 24%, black 48%)',
              maskImage:
                'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.65) 24%, black 48%)',
            }}
            className="w-full h-60 object-cover object-bottom opacity-95 brightness-95 contrast-102"
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop & iPad Landscape Fixed Sidebar */}
      <aside className="hidden lg:block w-[195px] xl:w-[215px] shrink-0 min-h-screen sticky top-0 h-screen z-20 shadow-xl">
        {renderSidebarContent()}
      </aside>

      {/* Mobile / iPad Portrait Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-[250px] max-w-[80vw] h-full z-10 shadow-2xl">
            {renderSidebarContent()}
          </div>
        </div>
      )}

      {/* iPhone / iPad Touch Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#4A5035]/98 backdrop-blur-md border-t border-[#D5B895]/20 px-2 pt-1.5 pb-safe flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition cursor-pointer ${
                isActive
                  ? 'bg-[#868A70] text-[#FAF8F4]'
                  : 'text-[#D5B895]/80 hover:text-[#FAF8F4]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-0.5">
                {isAr ? item.shortAr : item.shortEn}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
