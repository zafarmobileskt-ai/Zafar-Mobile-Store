import React from 'react';
import { useShop } from '../context/ShopContext';
import { 
  Boxes, 
  ReceiptText, 
  Smartphone, 
  Users, 
  TrendingUp, 
  SlidersHorizontal 
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    inventory, 
    sales, 
    customers 
  } = useShop();

  const inStockCount = inventory.filter((i) => i.status === 'in_stock').length;

  const mobileNavItems = [
    { 
      id: 'inventory', 
      label: 'Stock', 
      icon: Boxes, 
      badge: inStockCount,
      activeColor: 'text-sky-400 bg-sky-500/15' 
    },
    { 
      id: 'invoices', 
      label: 'POS Sale', 
      icon: ReceiptText, 
      badge: sales.length,
      activeColor: 'text-emerald-400 bg-emerald-500/15' 
    },
    { 
      id: 'intake', 
      label: 'Buy Used', 
      icon: Smartphone,
      activeColor: 'text-amber-400 bg-amber-500/15' 
    },
    { 
      id: 'customers', 
      label: 'Khata', 
      icon: Users, 
      badge: customers.length,
      activeColor: 'text-purple-400 bg-purple-500/15' 
    },
    { 
      id: 'analytics', 
      label: 'Reports', 
      icon: TrendingUp,
      activeColor: 'text-rose-400 bg-rose-500/15' 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: SlidersHorizontal,
      activeColor: 'text-slate-300 bg-slate-700/30' 
    },
  ];

  return (
    <aside 
      id="mobile-bottom-navigation-dock"
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0c0e15]/95 backdrop-blur-xl border-t border-slate-800/90 shadow-2xl py-1.5 px-2 print:hidden"
    >
      <div className="grid grid-cols-6 items-center max-w-md mx-auto">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`relative p-1.5 rounded-xl transition-all ${
                isActive ? item.activeColor : 'hover:bg-slate-800/40'
              }`}>
                <Icon className="w-4 h-4" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[15px] h-[15px] flex items-center justify-center text-[9px] font-bold px-1 rounded-full bg-blue-600 text-white border border-slate-900 shadow-xs">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium tracking-tight mt-0.5 ${
                isActive ? 'font-bold text-white' : 'text-slate-400'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-white mt-0.5 shadow-sm shadow-white"></span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
