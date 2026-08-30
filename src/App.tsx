import React, { useEffect } from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { Header } from './components/Header';
import { InventoryView } from './components/InventoryView';
import { BuyUsedMobileView } from './components/BuyUsedMobileView';
import { InvoicesView } from './components/InvoicesView';
import { CustomersView } from './components/CustomersView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { DeviceDetailModal } from './components/DeviceDetailModal';
import { AddDeviceModal } from './components/AddDeviceModal';
import { PosCheckoutModal } from './components/PosCheckoutModal';
import { InvoiceModal } from './components/InvoiceModal';
import { ImeiLookupModal } from './components/ImeiLookupModal';
import { BackupExportModal } from './components/BackupExportModal';
import { InstallAppModal } from './components/InstallAppModal';
import { PoliceCertificateModal } from './components/PoliceCertificateModal';
import { CustomerDetailModal } from './components/CustomerDetailModal';
import { AddEditCustomerModal } from './components/AddEditCustomerModal';
import { AddLedgerEntryModal } from './components/AddLedgerEntryModal';
import { ContactImportModal } from './components/ContactImportModal';

const ShopContent: React.FC = () => {
  const { 
    activeTab, 
    setIsImeiSearchOpen, 
    settings,
    isAddCustomerModalOpen,
    setIsAddCustomerModalOpen,
    customerToEdit,
    setCustomerToEdit
  } = useShop();

  // Global Keyboard Shortcuts (e.g. Cmd+K or Ctrl+K for IMEI scanner/search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsImeiSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsImeiSearchOpen]);

  return (
    <div className="min-h-screen bg-[#0A0B0E] flex flex-col font-sans text-slate-200 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Shop Header & Navigation */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'intake' && <BuyUsedMobileView />}
        {activeTab === 'invoices' && <InvoicesView />}
        {activeTab === 'customers' && <CustomersView />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Footer */}
      <footer className="bg-[#10121A] border-t border-slate-800/80 text-slate-400 text-xs py-4 px-4 sm:px-6 lg:px-8 mt-auto print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">{settings.shopName || 'ZAFAR MOBILE STORE'}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Mobile Inventory & POS Record System</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Press <kbd className="px-1.5 py-0.5 bg-[#161922] rounded border border-slate-700 text-slate-300">⌘K</kbd> to quick search IMEI</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-medium">● Local Secure Storage</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DeviceDetailModal />
      <AddDeviceModal />
      <PosCheckoutModal />
      <InvoiceModal />
      <ImeiLookupModal />
      <BackupExportModal />
      <InstallAppModal />
      <PoliceCertificateModal />
      <CustomerDetailModal />
      <AddEditCustomerModal 
        isOpen={isAddCustomerModalOpen}
        onClose={() => {
          setIsAddCustomerModalOpen(false);
          setCustomerToEdit(null);
        }}
        customerToEdit={customerToEdit}
      />
      <AddLedgerEntryModal />
      <ContactImportModal />
    </div>
  );
};

export default function App() {
  return (
    <ShopProvider>
      <ShopContent />
    </ShopProvider>
  );
}
