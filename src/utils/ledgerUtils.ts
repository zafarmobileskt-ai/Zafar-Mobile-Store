import { Customer, CustomerLedgerEntry, CustomerLedgerSummary } from '../types/mobile';

/**
 * Computes customer credit/debit totals, net balance, and overdue counts
 */
export function computeCustomerLedger(customer: Customer): CustomerLedgerSummary {
  let totalDebit = 0; // Money shop gave / charged (Receivables +)
  let totalCredit = 0; // Money customer paid / shop credited (Payables / Payments +)
  let overdueCount = 0;
  let lastDate: string | undefined = undefined;

  const now = new Date();

  // Opening Balance
  if (customer.openingBalance && customer.openingBalance.amount > 0) {
    if (customer.openingBalance.type === 'receivable') {
      totalDebit += customer.openingBalance.amount;
      if (customer.openingBalance.dueDate && new Date(customer.openingBalance.dueDate) < now) {
        overdueCount++;
      }
    } else if (customer.openingBalance.type === 'payable') {
      totalCredit += customer.openingBalance.amount;
    }
    if (customer.openingBalance.date) {
      lastDate = customer.openingBalance.date;
    }
  }

  // Ledger Entries
  (customer.ledgerEntries || []).forEach((entry) => {
    if (entry.type === 'debit') {
      totalDebit += Number(entry.amount || 0);
      if (entry.dueDate && new Date(entry.dueDate) < now) {
        overdueCount++;
      }
    } else if (entry.type === 'credit') {
      totalCredit += Number(entry.amount || 0);
    }
    if (!lastDate || new Date(entry.date) > new Date(lastDate)) {
      lastDate = entry.date;
    }
  });

  const netBalance = Math.round((totalDebit - totalCredit) * 100) / 100;
  let balanceType: 'receivable' | 'payable' | 'settled' = 'settled';
  
  if (netBalance > 0.01) {
    balanceType = 'receivable'; // Customer owes shop (Lene Hain)
  } else if (netBalance < -0.01) {
    balanceType = 'payable'; // Shop owes customer (Dene Hain / Advance)
  }

  return {
    totalDebit,
    totalCredit,
    netBalance,
    balanceType,
    pendingReceivable: balanceType === 'receivable' ? netBalance : 0,
    pendingPayable: balanceType === 'payable' ? Math.abs(netBalance) : 0,
    overdueCount,
    lastTransactionDate: lastDate || customer.createdAt,
  };
}

/**
 * Returns clean formatting metadata for UI display
 */
export function formatLedgerStatus(
  summary: CustomerLedgerSummary,
  currencySymbol = 'PKR '
) {
  if (summary.balanceType === 'receivable') {
    return {
      statusText: `${currencySymbol}${summary.pendingReceivable.toLocaleString()} Receivable`,
      subText: 'Customer owes shop (Lene Hain)',
      shortBadge: `${currencySymbol}${summary.pendingReceivable.toLocaleString()} Due`,
      colorClass: 'text-amber-400',
      bgClass: 'bg-amber-950/40 border-amber-800/60',
      pillClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
      accentColor: '#F59E0B',
    };
  }
  
  if (summary.balanceType === 'payable') {
    return {
      statusText: `${currencySymbol}${summary.pendingPayable.toLocaleString()} Payable`,
      subText: 'Shop owes customer (Dene Hain)',
      shortBadge: `${currencySymbol}${summary.pendingPayable.toLocaleString()} Advance`,
      colorClass: 'text-blue-400',
      bgClass: 'bg-blue-950/40 border-blue-800/60',
      pillClass: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
      accentColor: '#3B82F6',
    };
  }

  return {
    statusText: 'Settled (PKR 0)',
    subText: 'Zero pending balance',
    shortBadge: 'Settled',
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-950/20 border-emerald-800/40',
    pillClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    accentColor: '#10B981',
  };
}

/**
 * Generates WhatsApp reminder link & formatted text for customer payment recovery
 */
export function generateWhatsAppDebtReminder(
  customer: Customer,
  summary: CustomerLedgerSummary,
  shopName: string,
  currencySymbol = 'PKR '
) {
  const cleanPhone = (customer.phone || '').replace(/\D/g, '');
  const amountStr = `${currencySymbol}${summary.pendingReceivable.toLocaleString()}`;

  const message = `Assalam-o-Alaikum / Dear ${customer.name},

This is a gentle payment reminder from *${shopName}*.

Your current pending balance is *${amountStr}*.

Kindly arrange to clear the outstanding dues at your earliest convenience. If you have already made this payment, please disregard this reminder.

Thank you for your valued business with *${shopName}*!`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodedMessage}`
    : `https://api.whatsapp.com/send?text=${encodedMessage}`;

  return {
    message,
    whatsappUrl,
  };
}

/**
 * Parse standard vCard (.vcf) formatted contact text
 */
export function parseVCardContacts(vcfText: string) {
  const contacts: Array<{ name: string; phone: string; email?: string; address?: string }> = [];
  const cards = vcfText.split(/BEGIN:VCARD/i);

  for (const card of cards) {
    if (!card.trim()) continue;
    
    // Name extraction
    let name = '';
    const fnMatch = card.match(/FN:(.+)/i);
    if (fnMatch) {
      name = fnMatch[1].trim();
    } else {
      const nMatch = card.match(/N:([^;\n]+);?([^;\n]+)?/i);
      if (nMatch) {
        name = [nMatch[2], nMatch[1]].filter(Boolean).join(' ').trim();
      }
    }

    // Phone extraction
    let phone = '';
    const telMatch = card.match(/TEL[^:]*:(.+)/i);
    if (telMatch) {
      phone = telMatch[1].trim().replace(/[^\d+]/g, '');
    }

    // Email extraction
    let email = '';
    const emailMatch = card.match(/EMAIL[^:]*:(.+)/i);
    if (emailMatch) {
      email = emailMatch[1].trim();
    }

    // Address extraction
    let address = '';
    const adrMatch = card.match(/ADR[^:]*:(.+)/i);
    if (adrMatch) {
      address = adrMatch[1].split(';').filter(Boolean).join(', ').trim();
    }

    if (name || phone) {
      contacts.push({
        name: name || 'Contact ' + (contacts.length + 1),
        phone: phone || '',
        email: email || undefined,
        address: address || undefined,
      });
    }
  }

  return contacts;
}

/**
 * Parse CSV or plain text line contacts (Name, Phone, Email, Amount, Type)
 */
export function parseCsvContacts(csvText: string) {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const contacts: Array<{
    name: string;
    phone: string;
    email?: string;
    address?: string;
    openingAmount?: number;
    openingType?: 'receivable' | 'payable' | 'none';
  }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip header line if detected
    if (i === 0 && (line.toLowerCase().includes('name') || line.toLowerCase().includes('phone'))) {
      continue;
    }

    const parts = line.split(/[,\t|]/).map((p) => p.trim().replace(/^["']|["']$/g, ''));
    if (parts.length >= 2) {
      const name = parts[0];
      const phone = parts[1];
      const email = parts[2] && parts[2].includes('@') ? parts[2] : undefined;
      const maybeAmount = parts.find((p) => /^\d+(\.\d+)?$/.test(p));
      const amount = maybeAmount ? parseFloat(maybeAmount) : undefined;
      
      let openingType: 'receivable' | 'payable' | 'none' = 'none';
      const typeStr = line.toLowerCase();
      if (typeStr.includes('receivable') || typeStr.includes('lene') || typeStr.includes('udhaar') || typeStr.includes('due') || typeStr.includes('debit')) {
        openingType = 'receivable';
      } else if (typeStr.includes('payable') || typeStr.includes('dene') || typeStr.includes('advance') || typeStr.includes('credit')) {
        openingType = 'payable';
      } else if (amount && amount > 0) {
        openingType = 'receivable'; // Default positive balance to receivable
      }

      if (name && phone) {
        contacts.push({
          name,
          phone,
          email,
          openingAmount: amount,
          openingType,
        });
      }
    }
  }

  return contacts;
}
