import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Tag, 
  Sliders, 
  Sparkles, 
  Save, 
  Check,
  Plus,
  BookOpen,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Customer, CustomerPreferences } from '../types/mobile';

interface AddEditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
}

const COMMON_BRANDS = [
  'Apple',
  'Samsung',
  'Google',
  'OnePlus',
  'Xiaomi',
  'Oppo',
  'Vivo',
  'Realme',
  'Infinix',
  'Tecno',
  'Motorola',
  'Sony',
];

const COMMON_TAGS = [
  'VIP Buyer',
  'Repeat Buyer',
  'Trade-in Regular',
  'Credit / Khata Account',
  'Dealer / Wholesale',
  'New Customer',
  'Priority Lead',
];

const COMMON_CATEGORIES = [
  'Flagship Phones',
  'Budget Daily Driver',
  'Gaming Phones',
  'Trade-in Upgrades',
  'Smartwatches & Buds',
  'Original Accessories',
  'Repairs & Screens',
];

const BUDGET_OPTIONS = [
  'Under $200',
  '$200 - $400',
  '$400 - $700',
  '$700 - $1,000',
  '$1,000+',
  'Flexible / Open',
];

const STORAGE_OPTIONS = [
  '64GB',
  '128GB',
  '256GB+',
  '512GB',
  '1TB',
  'Any Storage',
];

export const AddEditCustomerModal: React.FC<AddEditCustomerModalProps> = ({
  isOpen,
  onClose,
  customerToEdit,
}) => {
  const { addCustomer, updateCustomer, setSelectedCustomerForModal, settings } = useShop();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cnicOrGovId, setCnicOrGovId] = useState('');
  const [address, setAddress] = useState('');
  const [tags, setTags] = useState<string[]>(['New Customer']);
  const [customTag, setCustomTag] = useState('');

  // Opening Balance & Credit/Debit
  const [openingAmount, setOpeningAmount] = useState('');
  const [openingType, setOpeningType] = useState<'none' | 'receivable' | 'payable'>('none');
  const [openingDueDate, setOpeningDueDate] = useState('');
  const [openingNotes, setOpeningNotes] = useState('');

  // Preferences
  const [preferredBrands, setPreferredBrands] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState('$400 - $700');
  const [storagePreference, setStoragePreference] = useState('256GB+');
  const [conditionPreference, setConditionPreference] = useState<'New Only' | 'Certified Used / Pre-Owned' | 'Both New & Used'>('Both New & Used');
  const [interestedCategories, setInterestedCategories] = useState<string[]>(['Flagship Phones']);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [prefNotes, setPrefNotes] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name || '');
      setPhone(customerToEdit.phone || '');
      setEmail(customerToEdit.email || '');
      setCnicOrGovId(customerToEdit.cnicOrGovId || '');
      setAddress(customerToEdit.address || '');
      setTags(customerToEdit.tags?.length ? customerToEdit.tags : ['New Customer']);
      
      if (customerToEdit.openingBalance && customerToEdit.openingBalance.amount > 0) {
        setOpeningAmount(customerToEdit.openingBalance.amount.toString());
        setOpeningType(customerToEdit.openingBalance.type || 'none');
        setOpeningDueDate(customerToEdit.openingBalance.dueDate?.split('T')[0] || '');
        setOpeningNotes(customerToEdit.openingBalance.notes || '');
      } else {
        setOpeningAmount('');
        setOpeningType('none');
        setOpeningDueDate('');
        setOpeningNotes('');
      }

      const pref = customerToEdit.preferences || { preferredBrands: [] };
      setPreferredBrands(pref.preferredBrands || []);
      setBudgetRange(pref.budgetRange || '$400 - $700');
      setStoragePreference(pref.storagePreference || '256GB+');
      setConditionPreference(pref.conditionPreference || 'Both New & Used');
      setInterestedCategories(pref.interestedCategories || []);
      setWhatsappAlerts(pref.whatsappAlerts ?? true);
      setPrefNotes(pref.notes || '');
      setGeneralNotes(customerToEdit.notes || '');
    } else {
      // Reset form for fresh customer
      setName('');
      setPhone('');
      setEmail('');
      setCnicOrGovId('');
      setAddress('');
      setTags(['New Customer']);
      setOpeningAmount('');
      setOpeningType('none');
      setOpeningDueDate('');
      setOpeningNotes('');
      setPreferredBrands(['Apple', 'Samsung']);
      setBudgetRange('$400 - $700');
      setStoragePreference('256GB+');
      setConditionPreference('Both New & Used');
      setInterestedCategories(['Flagship Phones', 'Original Accessories']);
      setWhatsappAlerts(true);
      setPrefNotes('');
      setGeneralNotes('');
    }
  }, [customerToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleBrand = (brand: string) => {
    if (preferredBrands.includes(brand)) {
      setPreferredBrands(preferredBrands.filter((b) => b !== brand));
    } else {
      setPreferredBrands([...preferredBrands, brand]);
    }
  };

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const toggleCategory = (cat: string) => {
    if (interestedCategories.includes(cat)) {
      setInterestedCategories(interestedCategories.filter((c) => c !== cat));
    } else {
      setInterestedCategories([...interestedCategories, cat]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (customTag.trim() && !tags.includes(customTag.trim())) {
      setTags([...tags, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const preferences: CustomerPreferences = {
      preferredBrands,
      budgetRange,
      storagePreference,
      conditionPreference,
      interestedCategories,
      notes: prefNotes.trim() || undefined,
      whatsappAlerts,
    };

    const numOpeningAmount = parseFloat(openingAmount) || 0;
    const hasOpeningBalance = numOpeningAmount > 0 && openingType !== 'none';
    const nowIso = new Date().toISOString();

    const openingBalanceObj = hasOpeningBalance
      ? {
          amount: numOpeningAmount,
          type: openingType,
          date: nowIso,
          dueDate: openingDueDate ? new Date(openingDueDate).toISOString() : undefined,
          notes: openingNotes.trim() || undefined,
        }
      : undefined;

    if (customerToEdit) {
      updateCustomer(customerToEdit.id, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        cnicOrGovId: cnicOrGovId.trim() || undefined,
        address: address.trim() || undefined,
        tags: tags.length ? tags : ['New Customer'],
        openingBalance: openingBalanceObj,
        preferences,
        notes: generalNotes.trim() || undefined,
      });
    } else {
      const initialLedgerEntries = hasOpeningBalance
        ? [
            {
              id: `LED-OPN-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`,
              type: openingType === 'receivable' ? ('debit' as const) : ('credit' as const),
              transactionType: openingType === 'receivable' ? ('receivable_given' as const) : ('payable_owed' as const),
              amount: numOpeningAmount,
              date: nowIso,
              dueDate: openingDueDate ? new Date(openingDueDate).toISOString() : undefined,
              description: `Opening Balance (${openingType === 'receivable' ? 'Receivable / Lene Hain' : 'Payable / Dene Hain'})`,
              paymentMethod: 'Cash',
              notes: openingNotes.trim() || 'Initial opening balance',
              createdAt: nowIso,
            },
          ]
        : [];

      const created = addCustomer({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        cnicOrGovId: cnicOrGovId.trim() || undefined,
        address: address.trim() || undefined,
        tags: tags.length ? tags : ['New Customer'],
        openingBalance: openingBalanceObj,
        preferences,
        manualPurchases: [],
        ledgerEntries: initialLedgerEntries,
        notes: generalNotes.trim() || undefined,
      });
      setSelectedCustomerForModal(created);
    }

    onClose();
  };

  return (
    <div id="add-edit-customer-modal" className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-200 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">
                {customerToEdit ? `Edit Customer: ${customerToEdit.name}` : 'Add New Customer Profile'}
              </h2>
              <p className="text-xs text-slate-300">
                Capture contact info, opening credit/debit balances (Khata), and device preferences
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-indigo-500" />
              <span>1. Contact & Identity Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Emily Davis"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number (Mobile / WhatsApp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +1 (555) 777-1234 or +92 300 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="e.g. customer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CNIC / National ID / Driving License (For Legal Verification)
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. ID-99210-NY or 42101-..."
                    value={cnicOrGovId}
                    onChange={(e) => setCnicOrGovId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Physical / Delivery Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. 104 Hudson Street, New York, NY"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Loyalty Tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Customer Category & Loyalty Tags
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {COMMON_TAGS.map((tag) => {
                  const isSelected = tags.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom tag input */}
              <div className="flex gap-2 max-w-xs">
                <input
                  type="text"
                  placeholder="Add custom tag..."
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={handleAddCustomTag}
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Credit / Debit Opening Balance (Khata Initial State) */}
          <div className="space-y-4 pt-3 border-t border-slate-200 bg-amber-50/40 p-4 rounded-2xl border border-amber-200/80">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>2. Opening Credit / Debit Balance (Khata / Udhar)</span>
              </h3>
              <span className="text-[11px] text-amber-800 font-medium">Optional initial balance</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Balance Nature
                </label>
                <select
                  value={openingType}
                  onChange={(e) => setOpeningType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  <option value="none">No Initial Balance ($0 Settled)</option>
                  <option value="receivable">Receivable (Lene Hain - Customer Owes Us)</option>
                  <option value="payable">Payable (Dene Hain - We Owe Customer / Advance)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Opening Amount ({settings.currencySymbol || '$'})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  disabled={openingType === 'none'}
                  placeholder="0.00"
                  value={openingAmount}
                  onChange={(e) => setOpeningAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Payment Due Date
                </label>
                <input
                  type="date"
                  disabled={openingType !== 'receivable'}
                  value={openingDueDate}
                  onChange={(e) => setOpeningDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>
            </div>

            {openingType !== 'none' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Opening Balance Note / Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Previous manual register Udhar balance, or advance security deposit"
                  value={openingNotes}
                  onChange={(e) => setOpeningNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            )}
          </div>

          {/* Section 3: Customer Preferences & Wishlist */}
          <div className="space-y-4 pt-3 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <span>3. Device Preferences & Purchasing Habits</span>
            </h3>

            {/* Preferred Brands Chips */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Preferred Mobile Brands
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_BRANDS.map((brand) => {
                  const isSelected = preferredBrands.includes(brand);
                  return (
                    <button
                      type="button"
                      key={brand}
                      onClick={() => toggleBrand(brand)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                      <span>{brand}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Budget & Storage */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Budget Range
                </label>
                <select
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                >
                  {BUDGET_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Storage Preference
                </label>
                <select
                  value={storagePreference}
                  onChange={(e) => setStoragePreference(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                >
                  {STORAGE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Condition Preference
                </label>
                <select
                  value={conditionPreference}
                  onChange={(e) => setConditionPreference(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                >
                  <option value="Both New & Used">Both New & Used</option>
                  <option value="New Only">Brand New (Box Pack Only)</option>
                  <option value="Certified Used / Pre-Owned">Certified Used / Pre-Owned</option>
                </select>
              </div>
            </div>

            {/* Categories of Interest */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Categories & Accessories of Interest
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_CATEGORIES.map((cat) => {
                  const isSelected = interestedCategories.includes(cat);
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-indigo-100 text-indigo-900 border border-indigo-300 font-semibold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Wishlist & Specific Requests */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Specific Wishlist & Model Target</span>
                <span className="text-[11px] text-slate-400 font-normal">e.g. Colors, PTA status, battery health target</span>
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Looking for iPhone 15 Pro Natural Titanium 256GB with 90%+ battery health. Waiting for trade-in discount."
                value={prefNotes}
                onChange={(e) => setPrefNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* WhatsApp Opt-in Checkbox */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-3">
              <input
                type="checkbox"
                id="whatsapp-alerts"
                checked={whatsappAlerts}
                onChange={(e) => setWhatsappAlerts(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
              />
              <label htmlFor="whatsapp-alerts" className="text-xs text-emerald-950 font-medium cursor-pointer">
                <strong>WhatsApp Stock Alert Opt-in:</strong> Customer wishes to receive WhatsApp notifications when requested models or trade-in deals arrive in stock.
              </label>
            </div>

            {/* Internal Staff Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Internal Staff Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Trusted repeat client, referred by Ali, pays cash."
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{customerToEdit ? 'Save Changes' : 'Save Customer Profile'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
