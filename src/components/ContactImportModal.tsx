import React, { useState, useRef } from 'react';
import { 
  X, 
  Smartphone, 
  Upload, 
  FileSpreadsheet, 
  Users, 
  Check, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2,
  Trash2,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  BookOpen
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { parseVCardContacts, parseCsvContacts } from '../utils/ledgerUtils';

interface DraftContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  openingAmount: number;
  openingType: 'none' | 'receivable' | 'payable';
  selected: boolean;
}

export const ContactImportModal: React.FC = () => {
  const { 
    isContactImportModalOpen, 
    setIsContactImportModalOpen, 
    importCustomersBatch,
    settings
  } = useShop();

  const [activeTab, setActiveTab] = useState<'device' | 'vcard' | 'paste'>('device');
  const [draftContacts, setDraftContacts] = useState<DraftContact[]>([]);
  const [pasteText, setPasteText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isContactImportModalOpen) return null;

  // Check if browser supports Contact Picker API
  const isContactPickerSupported = typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window;

  // 1. Native Device Contact Picker
  const handleDeviceContactPicker = async () => {
    setStatusMessage(null);
    try {
      if (!isContactPickerSupported) {
        setStatusMessage({
          type: 'info',
          text: 'Native Contact Picker is supported on Mobile Chrome/Edge/Android. You can also upload a .VCF vCard contact file or paste contacts below.'
        });
        return;
      }

      setIsProcessing(true);
      const props = ['name', 'tel', 'email'];
      const opts = { multiple: true };
      const contacts = await (navigator as any).contacts.select(props, opts);

      if (contacts && contacts.length > 0) {
        const newDrafts: DraftContact[] = contacts.map((c: any, idx: number) => ({
          id: `draft-${Date.now()}-${idx}`,
          name: Array.isArray(c.name) ? c.name[0] : (c.name || `Contact ${idx + 1}`),
          phone: Array.isArray(c.tel) ? c.tel[0] : (c.tel || ''),
          email: Array.isArray(c.email) ? c.email[0] : (c.email || undefined),
          openingAmount: 0,
          openingType: 'none',
          selected: true,
        })).filter((c: DraftContact) => c.name || c.phone);

        setDraftContacts(newDrafts);
        setStatusMessage({
          type: 'success',
          text: `Fetched ${newDrafts.length} contact(s) from your device. Review and set credit/debit balances below.`
        });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setStatusMessage({
          type: 'error',
          text: err?.message || 'Could not access device contacts.'
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. vCard (.vcf) File Upload
  const handleVCardFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStatusMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseVCardContacts(text);
        if (parsed.length === 0) {
          setStatusMessage({
            type: 'error',
            text: 'No valid contacts could be read from this vCard file.'
          });
          return;
        }

        const newDrafts: DraftContact[] = parsed.map((c, idx) => ({
          id: `draft-vcf-${Date.now()}-${idx}`,
          name: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address,
          openingAmount: 0,
          openingType: 'none',
          selected: true,
        }));

        setDraftContacts(newDrafts);
        setStatusMessage({
          type: 'success',
          text: `Parsed ${newDrafts.length} contact(s) from ${file.name}. Review them below.`
        });
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: 'Failed to read vCard file: ' + err?.message
        });
      }
    };
    reader.readAsText(file);
  };

  // 3. Parse Pasted / CSV List
  const handleParsePasteText = () => {
    if (!pasteText.trim()) {
      setStatusMessage({ type: 'error', text: 'Please paste or type contact lines first.' });
      return;
    }

    const parsed = parseCsvContacts(pasteText);
    if (parsed.length === 0) {
      setStatusMessage({
        type: 'error',
        text: 'Could not detect valid contact records. Use format: Name, Phone, Email, Amount, receivable/payable'
      });
      return;
    }

    const newDrafts: DraftContact[] = parsed.map((c, idx) => ({
      id: `draft-paste-${Date.now()}-${idx}`,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      openingAmount: c.openingAmount || 0,
      openingType: c.openingType || 'none',
      selected: true,
    }));

    setDraftContacts(newDrafts);
    setStatusMessage({
      type: 'success',
      text: `Successfully parsed ${newDrafts.length} contact(s).`
    });
  };

  // Selection & Update helpers
  const toggleSelectAll = () => {
    const allSelected = draftContacts.every((c) => c.selected);
    setDraftContacts(draftContacts.map((c) => ({ ...c, selected: !allSelected })));
  };

  const updateDraft = (id: string, updates: Partial<DraftContact>) => {
    setDraftContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const removeDraft = (id: string) => {
    setDraftContacts((prev) => prev.filter((c) => c.id !== id));
  };

  // Submit batch import to ShopContext
  const handleFinalImport = () => {
    const selected = draftContacts.filter((c) => c.selected && (c.name.trim() || c.phone.trim()));
    if (selected.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one contact to import.' });
      return;
    }

    const payload = selected.map((d) => {
      const now = new Date().toISOString();
      const hasBalance = d.openingAmount > 0 && d.openingType !== 'none';
      return {
        name: d.name.trim() || 'Unnamed Contact',
        phone: d.phone.trim(),
        email: d.email?.trim() || undefined,
        address: d.address?.trim() || undefined,
        tags: ['Imported Contact'],
        preferences: {
          preferredBrands: [],
          whatsappAlerts: true,
        },
        openingBalance: hasBalance
          ? {
              amount: d.openingAmount,
              type: d.openingType,
              date: now,
              notes: `Opening balance during contact import`,
            }
          : undefined,
        manualPurchases: [],
        ledgerEntries: hasBalance
          ? [
              {
                id: `LED-IMP-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase(),
                type: d.openingType === 'receivable' ? ('debit' as const) : ('credit' as const),
                transactionType: d.openingType === 'receivable' ? ('receivable_given' as const) : ('payable_owed' as const),
                amount: d.openingAmount,
                date: now,
                description: `Opening ${d.openingType === 'receivable' ? 'Receivable (Lene Hain)' : 'Payable (Dene Hain)'} balance`,
                paymentMethod: 'Other',
                notes: 'Imported with contact record',
                createdAt: now,
              },
            ]
          : [],
      };
    });

    const count = importCustomersBatch(payload);
    setIsContactImportModalOpen(false);
    setDraftContacts([]);
    setPasteText('');
    setStatusMessage(null);
  };

  const filteredDrafts = draftContacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const selectedCount = draftContacts.filter((c) => c.selected).length;

  return (
    <div id="contact-import-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        id="contact-import-modal-container"
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6 animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Import Phone Contacts & Khata
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Access phone address book, upload vCards (.vcf), or bulk paste customers with receivable/payable balances
              </p>
            </div>
          </div>
          <button
            id="close-contact-import-modal"
            onClick={() => {
              setIsContactImportModalOpen(false);
              setDraftContacts([]);
            }}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Mode Tabs */}
        <div className="px-6 pt-4 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2">
          <button
            type="button"
            id="tab-source-device"
            onClick={() => setActiveTab('device')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'device'
                ? 'border-blue-500 text-blue-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>1-Tap Phone Contact Access</span>
          </button>

          <button
            type="button"
            id="tab-source-vcard"
            onClick={() => setActiveTab('vcard')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'vcard'
                ? 'border-blue-500 text-blue-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload vCard / .VCF File</span>
          </button>

          <button
            type="button"
            id="tab-source-paste"
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'paste'
                ? 'border-blue-500 text-blue-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Paste CSV / Text List</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="p-6 space-y-6">
          {statusMessage && (
            <div className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-sm ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                : 'bg-blue-950/40 border-blue-800/60 text-blue-300'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: Device Contact Picker */}
          {activeTab === 'device' && (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                <Smartphone className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-bold text-slate-100">
                  Select Contacts Directly from Your Phone
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Access your Android, iPhone (via PWA), or mobile browser contacts to instantly import names and phone numbers into your Mobile Shop CRM & Khata.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  id="btn-trigger-device-contacts"
                  onClick={handleDeviceContactPicker}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2.5 px-6 py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all"
                >
                  <Users className="w-4 h-4" />
                  <span>{isProcessing ? 'Opening Address Book...' : 'Open Phone Contacts Picker'}</span>
                </button>
              </div>

              {!isContactPickerSupported && (
                <p className="text-[11px] text-amber-400/80 max-w-lg mx-auto bg-amber-950/20 border border-amber-800/30 p-2.5 rounded-lg">
                  💡 Tip: If you are on desktop, you can export your Google Contacts or iCloud Contacts as a <b>.VCF</b> or <b>CSV</b> file and upload it in the next tab!
                </p>
              )}
            </div>
          )}

          {/* TAB 2: vCard File Upload */}
          {activeTab === 'vcard' && (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 text-center space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                accept=".vcf,text/vcard,text/x-vcard"
                onChange={handleVCardFileUpload}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-bold text-slate-100">
                  Upload .VCF / vCard Contact File
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Export your contacts from Google Contacts (contacts.google.com) or Apple iCloud Contacts, then drop the .vcf file here.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  id="btn-select-vcf-file"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose .VCF File to Import</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Paste CSV / Text */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Paste Contact Records (1 per line)
                </label>
                <span className="text-[11px] text-slate-500">
                  Format: Name, Phone, Email, Amount, receivable / payable
                </span>
              </div>
              <textarea
                id="paste-contacts-textarea"
                rows={4}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Example:&#10;Muhammad Ali, +923001234567, ali@gmail.com, 450, receivable&#10;Usman Traders, +923219876543, usman@store.com, 120, payable&#10;Sara Khan, +923331122334"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                id="btn-parse-pasted-contacts"
                onClick={handleParsePasteText}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Parse Contacts from Text</span>
              </button>
            </div>
          )}

          {/* Contact Preview & Debt/Credit Configuration Table */}
          {draftContacts.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      draftContacts.every((c) => c.selected)
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'border-slate-600'
                    }`}>
                      {draftContacts.every((c) => c.selected) && <Check className="w-3 h-3" />}
                    </div>
                    <span>Select All ({draftContacts.length})</span>
                  </button>
                  <span className="text-xs text-slate-400">
                    Selected: <b className="text-slate-200">{selectedCount}</b>
                  </span>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search parsed contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="max-h-72 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/40">
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead className="sticky top-0 bg-slate-900 text-slate-400 border-b border-slate-800 font-semibold">
                    <tr>
                      <th className="p-3 w-10 text-center">✓</th>
                      <th className="p-3">Customer Name</th>
                      <th className="p-3">Phone Number</th>
                      <th className="p-3">Opening Balance ({settings.currencySymbol || 'PKR '})</th>
                      <th className="p-3">Balance Nature</th>
                      <th className="p-3 w-12 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredDrafts.map((draft) => (
                      <tr key={draft.id} className={`hover:bg-slate-800/30 transition-colors ${draft.selected ? 'bg-slate-900/40' : 'opacity-60'}`}>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={draft.selected}
                            onChange={(e) => updateDraft(draft.id, { selected: e.target.checked })}
                            className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={draft.name}
                            onChange={(e) => updateDraft(draft.id, { name: e.target.value })}
                            className="w-full px-2 py-1 bg-slate-900/80 border border-slate-700 rounded text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={draft.phone}
                            onChange={(e) => updateDraft(draft.id, { phone: e.target.value })}
                            className="w-full px-2 py-1 bg-slate-900/80 border border-slate-700 rounded text-slate-200 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0.00"
                            value={draft.openingAmount || ''}
                            onChange={(e) => updateDraft(draft.id, { openingAmount: parseFloat(e.target.value) || 0 })}
                            className="w-28 px-2 py-1 bg-slate-900/80 border border-slate-700 rounded text-slate-100 font-bold focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={draft.openingType}
                            onChange={(e) => updateDraft(draft.id, { openingType: e.target.value as any })}
                            className={`px-2 py-1 rounded text-[11px] font-semibold border bg-slate-900 focus:outline-none ${
                              draft.openingType === 'receivable'
                                ? 'text-amber-300 border-amber-500/50'
                                : draft.openingType === 'payable'
                                ? 'text-blue-300 border-blue-500/50'
                                : 'text-slate-400 border-slate-700'
                            }`}
                          >
                            <option value="none">Settled ($0)</option>
                            <option value="receivable">Receivable (Lene Hain)</option>
                            <option value="payable">Payable (Dene Hain)</option>
                          </select>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeDraft(draft.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-400">
              {draftContacts.length > 0 ? (
                <span>Ready to import <b className="text-slate-200">{selectedCount}</b> of {draftContacts.length} contacts</span>
              ) : (
                <span>No contacts loaded yet</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsContactImportModalOpen(false);
                  setDraftContacts([]);
                }}
                className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                id="btn-confirm-import-customers"
                onClick={handleFinalImport}
                disabled={selectedCount === 0}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Import {selectedCount} Contact(s) to Shop</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
