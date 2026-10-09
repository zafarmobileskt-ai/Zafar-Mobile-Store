import React, { useState, useMemo, useRef } from 'react';
import { 
  X, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Phone,
  Clock,
  Sparkles,
  Wallet,
  Search,
  UserPlus,
  ArrowLeft,
  ArrowLeftRight,
  BookOpen,
  Smartphone,
  Upload,
  Users,
  ClipboardList,
  Calendar,
  RotateCcw,
  Check,
  Edit3
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Customer, LedgerEntryType, LedgerTransactionType } from '../types/mobile';
import { computeCustomerLedger, formatLedgerStatus, parseVCardContacts } from '../utils/ledgerUtils';

interface ParsedContactItem {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export const AddLedgerEntryModal: React.FC = () => {
  const { 
    isAddLedgerModalOpen, 
    setIsAddLedgerModalOpen, 
    selectedCustomerForLedger, 
    setSelectedCustomerForLedger,
    ledgerInitialType,
    addCustomerLedgerEntry,
    updateCustomerLedgerEntry,
    ledgerEntryToEdit,
    setLedgerEntryToEdit,
    addCustomer,
    customers,
    settings
  } = useShop();

  const isEditing = Boolean(ledgerEntryToEdit);
  const customer = selectedCustomerForLedger;

  // Mode state: whether user is changing/selecting a customer or browsing contacts
  const [isChangingCustomer, setIsChangingCustomer] = useState<boolean>(false);
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState<boolean>(false);
  const [isContactListAccessOpen, setIsContactListAccessOpen] = useState<boolean>(false);

  // Search state in standard picker (does NOT dump all contacts by default)
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Contact list access states
  const [contactListTab, setContactListTab] = useState<'device' | 'directory' | 'vcard' | 'paste'>('device');
  const [contactListSearch, setContactListSearch] = useState<string>('');
  const [vcfContacts, setVcfContacts] = useState<ParsedContactItem[]>([]);
  const [pasteText, setPasteText] = useState<string>('');
  const [contactAccessMessage, setContactAccessMessage] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inline Add New Customer Form State
  const [newName, setNewName] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newCnic, setNewCnic] = useState<string>('');
  const [newOpeningAmount, setNewOpeningAmount] = useState<string>('');
  const [newOpeningType, setNewOpeningType] = useState<'none' | 'receivable' | 'payable'>('none');
  const [newOpeningDate, setNewOpeningDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [addCustomerError, setAddCustomerError] = useState<string>('');

  // Form State for the Ledger Entry
  const [entryType, setEntryType] = useState<LedgerEntryType>(ledgerInitialType || 'debit');
  const [transactionType, setTransactionType] = useState<LedgerTransactionType>(
    ledgerInitialType === 'credit' ? 'payment_received' : 'receivable_given'
  );
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [description, setDescription] = useState<string>('');
  const [referenceInvoiceOrBill, setReferenceInvoiceOrBill] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Helper to reset the ledger entry inputs completely
  const resetEntryForm = () => {
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setPaymentMethod('Cash');
    setDescription('');
    setReferenceInvoiceOrBill('');
    setNotes('');
    setError('');
  };

  // Helper to reset inline customer form
  const resetInlineCustomerForm = () => {
    setNewName('');
    setNewPhone('');
    setNewCnic('');
    setNewOpeningAmount('');
    setNewOpeningType('none');
    setNewOpeningDate(new Date().toISOString().split('T')[0]);
    setAddCustomerError('');
  };

  // Reset or populate form whenever modal opens or item to edit changes
  React.useEffect(() => {
    if (isAddLedgerModalOpen) {
      if (ledgerEntryToEdit) {
        const foundCustomer = customers.find((c) => c.id === ledgerEntryToEdit.customerId);
        if (foundCustomer) {
          setSelectedCustomerForLedger(foundCustomer);
        }
        setEntryType(ledgerEntryToEdit.entry.type);
        setTransactionType(ledgerEntryToEdit.entry.transactionType);
        setAmount(ledgerEntryToEdit.entry.amount.toString());
        setDate(ledgerEntryToEdit.entry.date ? ledgerEntryToEdit.entry.date.split('T')[0] : new Date().toISOString().split('T')[0]);
        setDueDate(ledgerEntryToEdit.entry.dueDate ? ledgerEntryToEdit.entry.dueDate.split('T')[0] : '');
        setPaymentMethod(ledgerEntryToEdit.entry.paymentMethod || 'Cash');
        setDescription(ledgerEntryToEdit.entry.description || '');
        setReferenceInvoiceOrBill(ledgerEntryToEdit.entry.referenceInvoiceOrBill || '');
        setNotes(ledgerEntryToEdit.entry.notes || '');
        setError('');
      } else {
        resetEntryForm();
        resetInlineCustomerForm();
        setSearchQuery('');
        setPasteText('');
        setContactAccessMessage(null);
      }
    }
  }, [isAddLedgerModalOpen, ledgerEntryToEdit]);

  // Sync initial type when not editing
  React.useEffect(() => {
    if (!ledgerEntryToEdit && ledgerInitialType) {
      setEntryType(ledgerInitialType);
      setTransactionType(ledgerInitialType === 'credit' ? 'payment_received' : 'receivable_given');
    }
  }, [ledgerInitialType, ledgerEntryToEdit]);

  // Handle entry type toggle
  const handleTypeChange = (type: LedgerEntryType) => {
    setEntryType(type);
    if (type === 'debit') {
      setTransactionType('receivable_given');
    } else {
      setTransactionType('payment_received');
    }
  };

  // Close modal and reset temporary states
  const handleClose = () => {
    setIsAddLedgerModalOpen(false);
    setLedgerEntryToEdit(null);
    setSelectedCustomerForLedger(null);
    setIsChangingCustomer(false);
    setIsAddingNewCustomer(false);
    setIsContactListAccessOpen(false);
    setSearchQuery('');
    setContactListSearch('');
    setContactAccessMessage(null);
    resetEntryForm();
    resetInlineCustomerForm();
  };

  // Filter existing customers matching search query in standard view (max 5)
  const matchingCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    
    return customers
      .filter((c) => {
        const matchesName = c.name?.toLowerCase().includes(q);
        const matchesPhone = c.phone?.toLowerCase().includes(q);
        const matchesCnic = c.cnicOrGovId?.toLowerCase().includes(q);
        return matchesName || matchesPhone || matchesCnic;
      })
      .slice(0, 5); // strictly max 5 to prevent visual clutter
  }, [customers, searchQuery]);

  // Quick recent debtors (only top 3 with pending receivable balances)
  const recentDebtors = useMemo(() => {
    if (searchQuery.trim()) return [];
    return customers
      .filter((c) => {
        const led = computeCustomerLedger(c);
        return led.balanceType === 'receivable' && led.pendingReceivable > 0;
      })
      .slice(0, 3);
  }, [customers, searchQuery]);

  // Combined contacts for the Contact Directory view (from stored customers and any uploaded vcf)
  const directoryContacts = useMemo(() => {
    const q = contactListSearch.trim().toLowerCase();
    const list: Array<{ id?: string; name: string; phone: string; source: string }> = [];

    // Add stored customers
    customers.forEach((c) => {
      list.push({ id: c.id, name: c.name, phone: c.phone, source: 'Store Account' });
    });

    // Add any vcf contacts
    vcfContacts.forEach((vc) => {
      if (!list.some((existing) => existing.phone.replace(/\D/g, '') === vc.phone.replace(/\D/g, ''))) {
        list.push({ name: vc.name, phone: vc.phone, source: 'vCard Contact' });
      }
    });

    if (!q) return list;

    return list.filter((c) => 
      c.name.toLowerCase().includes(q) || 
      c.phone.includes(q)
    );
  }, [customers, vcfContacts, contactListSearch]);

  // Central contact selection handler: selects existing customer or auto-creates one
  const handleSelectContactForKhata = (contact: { name: string; phone: string; id?: string }) => {
    const cleanPhone = contact.phone.replace(/\D/g, '');
    let targetCustomer: Customer | undefined;

    if (contact.id) {
      targetCustomer = customers.find((c) => c.id === contact.id);
    }

    if (!targetCustomer && cleanPhone) {
      targetCustomer = customers.find((c) => c.phone.replace(/\D/g, '') === cleanPhone);
    }

    if (!targetCustomer) {
      targetCustomer = customers.find((c) => c.name.trim().toLowerCase() === contact.name.trim().toLowerCase());
    }

    if (targetCustomer) {
      // Existing customer found, select immediately
      setSelectedCustomerForLedger(targetCustomer);
      setIsChangingCustomer(false);
      setIsAddingNewCustomer(false);
      setIsContactListAccessOpen(false);
    } else {
      // Create new customer directly with this contact's name & phone
      const now = new Date().toISOString();
      const created = addCustomer({
        name: contact.name.trim() || 'Valued Customer',
        phone: contact.phone.trim(),
        tags: ['Phone Contact', 'Credit / Khata Account'],
        preferences: { preferredBrands: [], whatsappAlerts: true },
        ledgerEntries: [],
      });

      setSelectedCustomerForLedger(created);
      setIsChangingCustomer(false);
      setIsAddingNewCustomer(false);
      setIsContactListAccessOpen(false);
    }
  };

  // 1. Native Mobile Contact Picker API
  const isContactPickerSupported = typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window;

  const handlePickFromDeviceContacts = async (autofillOnly: boolean = false) => {
    setContactAccessMessage(null);
    if (!isContactPickerSupported) {
      // Open Contact List modal so they can upload or browse
      setIsContactListAccessOpen(true);
      setContactListTab('device');
      return;
    }

    try {
      const props = ['name', 'tel', 'email'];
      const opts = { multiple: false };
      const picked = await (navigator as any).contacts.select(props, opts);

      if (picked && picked.length > 0) {
        const item = picked[0];
        const rawName = Array.isArray(item.name) ? item.name[0] : (item.name || '');
        const rawPhone = Array.isArray(item.tel) ? item.tel[0] : (item.tel || '');

        if (autofillOnly) {
          // Just autofill the new customer form
          if (rawName) setNewName(rawName);
          if (rawPhone) setNewPhone(rawPhone);
          setIsContactListAccessOpen(false);
        } else {
          // Select or create immediately for Khata
          handleSelectContactForKhata({ name: rawName || 'Contact', phone: rawPhone });
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setContactAccessMessage({
          type: 'error',
          text: err?.message || 'Could not open device contacts directly. You can upload a .vcf file or search contacts below.'
        });
        setIsContactListAccessOpen(true);
      }
    }
  };

  // 2. Handle vCard (.vcf) File Upload
  const handleVcfFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = parseVCardContacts(content);

        if (parsed.length === 0) {
          setContactAccessMessage({
            type: 'error',
            text: 'No contacts found in this file. Please ensure it is a valid .vcf vCard file.'
          });
          return;
        }

        setVcfContacts(parsed);
        setContactListTab('vcard');
        setContactAccessMessage({
          type: 'success',
          text: `Found ${parsed.length} contact(s) in "${file.name}". Tap any contact to select for Khata entry.`
        });
      } catch (err) {
        setContactAccessMessage({
          type: 'error',
          text: 'Failed to read contacts from file.'
        });
      }
    };
    reader.readAsText(file);
  };

  // 3. Handle Pasted Contacts (e.g. from WhatsApp)
  const handleApplyPastedContact = () => {
    if (!pasteText.trim()) return;
    const lines = pasteText.split('\n').map((l) => l.trim()).filter(Boolean);
    const line = lines[0]; // pick first
    const matchPhone = line.match(/[\d+\s-]{7,18}/);
    const phone = matchPhone ? matchPhone[0].trim() : '';
    const name = line.replace(phone, '').replace(/[:,\-]/g, '').trim() || 'WhatsApp Customer';

    if (phone || name) {
      handleSelectContactForKhata({ name, phone });
    }
  };

  // Handle creating and selecting a new customer inline via form
  const handleCreateNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setAddCustomerError('');

    if (!newName.trim()) {
      setAddCustomerError('Customer full name is required.');
      return;
    }
    if (!newPhone.trim()) {
      setAddCustomerError('Customer phone number is required.');
      return;
    }

    try {
      const now = new Date().toISOString();
      const numOpening = parseFloat(newOpeningAmount) || 0;
      const hasOpening = numOpening > 0 && newOpeningType !== 'none';

      const created = addCustomer({
        name: newName.trim(),
        phone: newPhone.trim(),
        cnicOrGovId: newCnic.trim() || undefined,
        tags: ['Credit / Khata Account'],
        openingBalance: hasOpening ? {
          amount: numOpening,
          type: newOpeningType as 'receivable' | 'payable',
          date: newOpeningDate ? new Date(newOpeningDate).toISOString() : now,
          notes: 'Opening balance created during Khata Entry',
        } : undefined,
        ledgerEntries: hasOpening ? [
          {
            id: `LED-OP-${Date.now().toString(36)}`,
            type: newOpeningType === 'receivable' ? 'debit' : 'credit',
            transactionType: newOpeningType === 'receivable' ? 'receivable_given' : 'payable_owed',
            amount: numOpening,
            date: newOpeningDate ? new Date(newOpeningDate).toISOString() : now,
            description: `Opening Balance (${newOpeningType === 'receivable' ? 'Lene Hain' : 'Dene Hain'})`,
            paymentMethod: 'Other',
            notes: 'Initial opening balance',
            createdAt: now,
          }
        ] : [],
        preferences: { preferredBrands: [], whatsappAlerts: true },
      });

      setSelectedCustomerForLedger(created);
      setIsAddingNewCustomer(false);
      setIsChangingCustomer(false);
      setSearchQuery('');
      resetInlineCustomerForm();
    } catch (err: any) {
      setAddCustomerError(err?.message || 'Failed to create customer');
    }
  };

  if (!isAddLedgerModalOpen) return null;

  // --- SUB-VIEW: Contact List Access Drawer / Modal ---
  if (isContactListAccessOpen) {
    return (
      <div id="contact-list-access-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
        <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden my-6 animate-scale-in">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                  Access Contact List
                </h2>
                <p className="text-xs text-slate-400">
                  Pick a contact from your phone or address book for Khata entry
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsContactListAccessOpen(false)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".vcf,text/vcard"
            onChange={handleVcfFileUpload}
            className="hidden"
          />

          {/* Navigation Tabs */}
          <div className="grid grid-cols-4 p-2 bg-slate-950/80 border-b border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setContactListTab('device')}
              className={`py-2 px-1 text-center font-semibold rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                contactListTab === 'device'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Phone</span>
            </button>
            <button
              type="button"
              onClick={() => setContactListTab('directory')}
              className={`py-2 px-1 text-center font-semibold rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                contactListTab === 'directory'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Contacts ({customers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setContactListTab('vcard')}
              className={`py-2 px-1 text-center font-semibold rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                contactListTab === 'vcard'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>.VCF File</span>
            </button>
            <button
              type="button"
              onClick={() => setContactListTab('paste')}
              className={`py-2 px-1 text-center font-semibold rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                contactListTab === 'paste'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Paste</span>
            </button>
          </div>

          {/* Status Message */}
          {contactAccessMessage && (
            <div className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-center gap-2 border ${
              contactAccessMessage.type === 'error'
                ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                : contactAccessMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                : 'bg-blue-950/40 border-blue-800 text-blue-300'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{contactAccessMessage.text}</span>
            </div>
          )}

          {/* TAB 1: Device Contact Picker */}
          {contactListTab === 'device' && (
            <div className="p-6 space-y-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Smartphone className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-100">
                  Direct Mobile Phone Contacts
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Access your phone&apos;s native address book to choose a customer with one tap for instant Khata recording.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2.5 max-w-xs mx-auto">
                <button
                  type="button"
                  id="btn-open-phone-address-book"
                  onClick={() => handlePickFromDeviceContacts(false)}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Open Phone Contact Book</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Or Upload Contacts (.vcf file)</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500 pt-2">
                Works directly on Chrome for Android, Edge, and installed PWA apps.
              </p>
            </div>
          )}

          {/* TAB 2: Search Contact Book Directory */}
          {contactListTab === 'directory' && (
            <div className="p-6 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search contact by name or phone..."
                  value={contactListSearch}
                  onChange={(e) => setContactListSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {directoryContacts.length > 0 ? (
                  directoryContacts.map((c, idx) => (
                    <div
                      key={c.id || `dir-${idx}`}
                      onClick={() => handleSelectContactForKhata(c)}
                      className="p-2.5 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-xl flex items-center justify-between cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200 text-xs group-hover:text-white">
                            {c.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {c.phone}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                        Select
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">
                    No contacts found. You can add one or import a .vcf file.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Upload .VCF Contact File */}
          {contactListTab === 'vcard' && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-semibold">
                  Select Contact from File ({vcfContacts.length} loaded)
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose File</span>
                </button>
              </div>

              {vcfContacts.length > 0 ? (
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {vcfContacts.map((c, idx) => (
                    <div
                      key={`vcf-${idx}`}
                      onClick={() => handleSelectContactForKhata(c)}
                      className="p-2.5 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-slate-200 text-xs">
                          {c.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {c.phone}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                        + Khata Entry
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-8 border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl text-center space-y-2 cursor-pointer bg-slate-950/40 hover:bg-slate-950/60 transition-all"
                >
                  <Upload className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-300 font-semibold">
                    Click to browse your phone contacts backup (.vcf)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Exported from Google Contacts, iPhone, Samsung, or WhatsApp
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Paste Contact from WhatsApp / SMS */}
          {contactListTab === 'paste' && (
            <div className="p-6 space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Paste Contact Info (Name & Phone)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Tariq Mehmood 0301-7654321&#10;or paste a shared contact card from WhatsApp"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleApplyPastedContact}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Select for Khata Entry</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Tap any contact to start recording credit or payment
            </span>
            <button
              type="button"
              onClick={() => setIsContactListAccessOpen(false)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              Back
            </button>
          </div>

        </div>
      </div>
    );
  }

  // If customer is not selected or user requested to change customer, render Customer Selection / Add View
  if (!customer || isChangingCustomer) {
    return (
      <div id="add-ledger-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
        <div 
          id="add-ledger-modal-container"
          className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6 animate-scale-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl border bg-amber-500/10 border-amber-500/30 text-amber-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                  Khata Entry • {isAddingNewCustomer ? 'Add Customer' : 'Select Customer'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isAddingNewCustomer 
                    ? 'Create a new customer account to record credit or payment' 
                    : 'Search customer, open contact list, or create a new profile'}
                </p>
              </div>
            </div>
            <button
              id="close-add-ledger-modal"
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* VIEW A: Inline Add New Customer Form */}
          {isAddingNewCustomer ? (
            <form onSubmit={handleCreateNewCustomer} className="p-6 space-y-4">
              {addCustomerError && (
                <div className="flex items-center gap-2 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{addCustomerError}</span>
                </div>
              )}

              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" />
                  <span>New Customer Details</span>
                </span>
                
                {/* Direct Contact List Access button in form */}
                <button
                  type="button"
                  id="autofill-from-contacts-btn"
                  onClick={() => handlePickFromDeviceContacts(true)}
                  className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pick from Contacts</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  id="new-cust-name-input"
                  placeholder="e.g. Muhammad Ali, Tariq Khan"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Phone Number (WhatsApp) *
                </label>
                <input
                  type="tel"
                  required
                  id="new-cust-phone-input"
                  placeholder="e.g. 0300 1234567"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  CNIC / National ID (Optional)
                </label>
                <input
                  type="text"
                  id="new-cust-cnic-input"
                  placeholder="e.g. 35201-1234567-1"
                  value={newCnic}
                  onChange={(e) => setNewCnic(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Optional Opening Balance */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Initial Opening Balance (Optional)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewOpeningType('none')}
                    className={`py-1.5 px-2 text-xs rounded-lg font-medium transition-colors ${
                      newOpeningType === 'none'
                        ? 'bg-slate-700 text-white font-bold'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    No Balance ($0)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewOpeningType('receivable')}
                    className={`py-1.5 px-2 text-xs rounded-lg font-medium transition-colors ${
                      newOpeningType === 'receivable'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Lene Hain (Debit)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewOpeningType('payable')}
                    className={`py-1.5 px-2 text-xs rounded-lg font-medium transition-colors ${
                      newOpeningType === 'payable'
                        ? 'bg-blue-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Dene Hain (Credit)
                  </button>
                </div>

                {newOpeningType !== 'none' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        placeholder={`Opening amount (${settings.currencySymbol || 'PKR '})`}
                        value={newOpeningAmount}
                        onChange={(e) => setNewOpeningAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="date"
                        value={newOpeningDate}
                        onChange={(e) => setNewOpeningDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                        title="Date of Opening Balance"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingNewCustomer(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Back to Search
                </button>
                <button
                  type="submit"
                  id="save-new-customer-for-khata-btn"
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/20 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save & Select Customer</span>
                </button>
              </div>
            </form>
          ) : (
            /* VIEW B: Search Customer (Does NOT show all contacts by default) + Actions */
            <div className="p-6 space-y-4">
              
              {/* Search Bar */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="search-customer-khata-input"
                    placeholder="Type name or phone to search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Primary Dual Actions: Add Customer & Contact List Access */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    id="btn-access-contact-list-option"
                    onClick={() => {
                      if (isContactPickerSupported) {
                        handlePickFromDeviceContacts(false);
                      } else {
                        setIsContactListAccessOpen(true);
                      }
                    }}
                    className="py-2.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all group cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span>Access Contact List</span>
                  </button>

                  <button
                    type="button"
                    id="btn-add-new-customer-option"
                    onClick={() => {
                      // Pre-fill name or phone if typed in search
                      if (searchQuery.trim()) {
                        if (/^\d+$/.test(searchQuery.trim().replace(/\D/g, '')) && searchQuery.trim().length >= 6) {
                          setNewPhone(searchQuery.trim());
                        } else {
                          setNewName(searchQuery.trim());
                        }
                      }
                      setIsAddingNewCustomer(true);
                    }}
                    className="py-2.5 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all group cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span>+ Add Customer</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Matching Results */}
              {searchQuery.trim() ? (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Search Results ({matchingCustomers.length})
                  </div>

                  {matchingCustomers.length > 0 ? (
                    <div className="space-y-1.5 max-h-60 overflow-y-auto">
                      {matchingCustomers.map((c) => {
                        const ledger = computeCustomerLedger(c);
                        const status = formatLedgerStatus(ledger, settings.currencySymbol);

                        return (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedCustomerForLedger(c);
                              setIsChangingCustomer(false);
                              setSearchQuery('');
                            }}
                            className="p-3 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-indigo-950 border border-indigo-800/80 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                {c.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-200 text-xs sm:text-sm group-hover:text-white transition-colors">
                                  {c.name}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {c.phone}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                                ledger.balanceType === 'receivable'
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                  : ledger.balanceType === 'payable'
                                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                  : 'bg-slate-800 border-slate-700 text-slate-400'
                              }`}>
                                {status.statusText}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl text-center space-y-2">
                      <p className="text-xs text-slate-400">
                        No customer found matching &ldquo;<span className="text-slate-200 font-semibold">{searchQuery}</span>&rdquo;
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setNewName(searchQuery.trim());
                          setIsAddingNewCustomer(true);
                        }}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add &ldquo;{searchQuery}&rdquo; as Customer</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* When empty: Clean state with Recent Debtors & Contact Access Prompt */
                <div className="space-y-3 pt-1">
                  {recentDebtors.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Recent Active Debtors (Click to Select)</span>
                      </div>
                      <div className="space-y-1">
                        {recentDebtors.map((c) => {
                          const ledger = computeCustomerLedger(c);
                          const status = formatLedgerStatus(ledger, settings.currencySymbol);

                          return (
                            <div
                              key={c.id}
                              onClick={() => {
                                setSelectedCustomerForLedger(c);
                                setIsChangingCustomer(false);
                              }}
                              className="p-2.5 bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                                  {c.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium text-slate-200 text-xs">
                                    {c.name}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {c.phone}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                                {status.statusText}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-xl text-center space-y-1.5">
                    <User className="w-6 h-6 text-slate-500 mx-auto" />
                    <p className="text-xs text-slate-400">
                      Search above, click <strong className="text-emerald-300">Access Contact List</strong> to select from your phone, or create a new profile with <strong className="text-indigo-300">+ Add Customer</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                {customer && (
                  <button
                    type="button"
                    onClick={() => setIsChangingCustomer(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                  >
                    Keep Current Customer ({customer.name})
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    );
  }

  // --- VIEW C: Khata Entry Form for the Selected Customer ---
  const currentSummary = computeCustomerLedger(customer);
  const currentFormatted = formatLedgerStatus(currentSummary, settings.currencySymbol);

  // Calculate projected balance
  const numAmount = parseFloat(amount) || 0;
  const simulatedSummary = {
    ...currentSummary,
    totalDebit: currentSummary.totalDebit + (entryType === 'debit' ? numAmount : 0),
    totalCredit: currentSummary.totalCredit + (entryType === 'credit' ? numAmount : 0),
  };
  const simulatedNet = Math.round((simulatedSummary.totalDebit - simulatedSummary.totalCredit) * 100) / 100;
  let simulatedLabel = 'Settled (PKR 0)';
  let simulatedColor = 'text-emerald-400';
  if (simulatedNet > 0.01) {
    simulatedLabel = `${settings.currencySymbol || 'PKR '}${simulatedNet.toLocaleString()} Receivable (Customer Owes)`;
    simulatedColor = 'text-amber-400';
  } else if (simulatedNet < -0.01) {
    simulatedLabel = `${settings.currencySymbol || 'PKR '}${Math.abs(simulatedNet).toLocaleString()} Payable (Shop Owes)`;
    simulatedColor = 'text-blue-400';
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) {
      setError('Please select or specify a customer for this ledger entry.');
      return;
    }
    if (!amount || numAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    try {
      if (ledgerEntryToEdit) {
        updateCustomerLedgerEntry(ledgerEntryToEdit.customerId, ledgerEntryToEdit.entry.id, {
          type: entryType,
          transactionType,
          amount: numAmount,
          date: new Date(date).toISOString(),
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          paymentMethod,
          description: description.trim() || (entryType === 'debit' ? 'Credit Given / Sale Debit' : 'Payment Received'),
          referenceInvoiceOrBill: referenceInvoiceOrBill.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      } else {
        addCustomerLedgerEntry(customer.id, {
          type: entryType,
          transactionType,
          amount: numAmount,
          date: new Date(date).toISOString(),
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          paymentMethod,
          description: description.trim() || (entryType === 'debit' ? 'Credit Given / Sale Debit' : 'Payment Received'),
          referenceInvoiceOrBill: referenceInvoiceOrBill.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      }

      // Close & reset
      handleClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record entry');
    }
  };

  return (
    <div id="add-ledger-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        id="add-ledger-modal-container"
        className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6 animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isEditing 
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                : entryType === 'debit' 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              {isEditing ? <Edit3 className="w-5 h-5" /> : entryType === 'debit' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">
                  {isEditing ? 'Edit Saved Khata Entry' : entryType === 'debit' ? 'Give Credit / Add Debit' : 'Receive Payment / Add Credit'}
                </h2>
                {isEditing && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {ledgerEntryToEdit?.entry.id}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-300 font-semibold flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>{customer?.name || 'Customer'}</span>
                </span>
                {customer?.phone && (
                  <span className="text-[11px] text-slate-400">({customer.phone})</span>
                )}
                {/* Option to change customer or switch to contact list */}
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsChangingCustomer(true)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium ml-1 flex items-center gap-1 cursor-pointer"
                    title="Change customer or add a different customer"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    <span>Change</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          <button
            id="close-add-ledger-modal"
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance Ribbon */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">Current Balance:</span>
            <span className={`text-xs font-semibold ${currentFormatted.colorClass}`}>
              {currentFormatted.statusText}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">
              {currentFormatted.subText}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsChangingCustomer(true);
                setIsContactListAccessOpen(true);
              }}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold bg-emerald-950/60 hover:bg-emerald-900 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Smartphone className="w-3 h-3" />
              <span>Contact List</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Transaction Type Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Entry Type
            </label>
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-950/80 border border-slate-800 rounded-xl">
              <button
                type="button"
                id="tab-debit-receivable"
                onClick={() => handleTypeChange('debit')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-medium text-sm transition-all cursor-pointer ${
                  entryType === 'debit'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Maine Diye / Lene Hain (Debit)</span>
              </button>

              <button
                type="button"
                id="tab-credit-payment"
                onClick={() => handleTypeChange('credit')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-medium text-sm transition-all cursor-pointer ${
                  entryType === 'credit'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Mujhe Mile / Jama (Credit)</span>
              </button>
            </div>
          </div>

          {/* Specific Subcategory */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Transaction Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {entryType === 'debit' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setTransactionType('receivable_given')}
                    className={`p-2.5 text-left rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      transactionType === 'receivable_given'
                        ? 'border-amber-500/60 bg-amber-500/10 text-amber-300'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-slate-200">Goods / Phone on Credit</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Increases customer debt</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionType('payment_paid')}
                    className={`p-2.5 text-left rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      transactionType === 'payment_paid'
                        ? 'border-amber-500/60 bg-amber-500/10 text-amber-300'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-slate-200">Cash Paid to Customer</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Settles shop payable debt</div>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setTransactionType('payment_received')}
                    className={`p-2.5 text-left rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      transactionType === 'payment_received'
                        ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-slate-200">Payment Recovery Received</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Reduces customer debt</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionType('payable_owed')}
                    className={`p-2.5 text-left rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      transactionType === 'payable_owed'
                        ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-slate-200">Advance / Shop Credit Owed</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Customer deposit / return credit</div>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Amount ({settings.currencySymbol || 'PKR '}) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                  {settings.currencySymbol || 'PKR '}
                </span>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  id="ledger-amount-input"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-lg font-bold placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>Transaction Date *</span>
                </label>
                <button
                  type="button"
                  onClick={() => setDate(new Date().toISOString().split('T')[0])}
                  className="text-[10px] text-blue-400 hover:text-blue-300 underline cursor-pointer"
                >
                  Today
                </button>
              </div>
              <div className="relative">
                <input
                  type="date"
                  required
                  id="ledger-date-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Payment Method & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Payment Method / Channel
              </label>
              <select
                id="ledger-payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="Cash">Cash In Hand</option>
                <option value="Bank Transfer">Bank Transfer / Raast</option>
                <option value="JazzCash / Easypaisa">JazzCash / Easypaisa</option>
                <option value="Debit/Credit Card">Debit / Credit Card</option>
                <option value="Online UPI / Wallet">Online Wallet</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Expected Recovery Due Date (Optional)</span>
              </label>
              <input
                type="date"
                id="ledger-due-date-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Description & Invoice Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Item / Purpose Description
              </label>
              <input
                type="text"
                id="ledger-description-input"
                placeholder={entryType === 'debit' ? 'e.g., iPhone 14 Pro sale credit, Screen repair' : 'e.g., Cash installment paid, Raast partial payment'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Invoice / Bill Ref #
              </label>
              <input
                type="text"
                id="ledger-ref-input"
                placeholder="e.g., INV-2026-901"
                value={referenceInvoiceOrBill}
                onChange={(e) => setReferenceInvoiceOrBill(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Projected Balance Preview */}
          {numAmount > 0 && (
            <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-slate-300 font-medium">Projected New Balance:</span>
              </div>
              <span className={`text-sm font-bold ${simulatedColor}`}>
                {simulatedLabel}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={resetEntryForm}
              className="px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              title="Clear entry form fields"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Form</span>
            </button>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit-add-ledger-entry"
                className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-slate-950 rounded-xl transition-all shadow-lg cursor-pointer ${
                  isEditing
                    ? 'bg-amber-400 hover:bg-amber-300 shadow-amber-500/30'
                    : entryType === 'debit'
                      ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/20'
                      : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20'
                }`}
              >
                {isEditing ? <Check className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{isEditing ? 'Save Changes to Entry' : `Record ${entryType === 'debit' ? 'Debit (Lene Hain)' : 'Credit (Jama)'}`}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
