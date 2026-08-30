import * as XLSX from 'xlsx';
import { MobileItem, SaleRecord, ShopSettings, Customer } from '../types/mobile';

/**
 * Format date for spreadsheet output
 */
const formatDate = (isoString?: string): string => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoString;
  }
};

/**
 * Exports all shop data into a comprehensive multi-sheet Excel Workbook (.xlsx)
 * Sheets included:
 *  1. Inventory Stock
 *  2. Sales & Invoices
 *  3. Customers & CRM
 *  4. Used Phones & Trade-Ins
 *  5. Financial Summary
 */
export const exportCompleteShopWorkbook = (
  inventory: MobileItem[],
  sales: SaleRecord[],
  settings: ShopSettings,
  customers: Customer[] = []
) => {
  const wb = XLSX.utils.book_new();

  // 1. INVENTORY SHEET
  const inventoryRows = inventory.map((item, idx) => ({
    '#': idx + 1,
    'Device ID': item.id,
    'Type': item.deviceType === 'new' ? 'Brand New' : 'Used / Pre-Owned',
    'Brand': item.brand,
    'Model': item.model,
    'Storage': item.storage,
    'Color': item.color,
    'Condition Grade': item.conditionGrade || (item.deviceType === 'new' ? 'Brand New (Box Pack)' : 'Used'),
    'Battery Health (%)': item.batteryHealth ? `${item.batteryHealth}%` : (item.deviceType === 'new' ? '100%' : 'N/A'),
    'Screen Condition': item.screenCondition || 'Original',
    'Primary IMEI 1': item.imei1,
    'Secondary IMEI 2': item.imei2 || '',
    'Serial Number': item.serialNumber || '',
    'Network / PTA Status': item.networkStatus,
    'Purchase Cost': item.purchaseCost,
    'Target Selling Price': item.sellingPriceTarget,
    'Min Price': item.minPrice,
    'Stock Status': item.status.toUpperCase(),
    'Supplier / Seller Name': item.supplierOrSeller?.name || '',
    'Supplier / Seller Phone': item.supplierOrSeller?.phone || '',
    'Seller CNIC / ID': item.supplierOrSeller?.cnicOrGovId || '',
    'Seller Type': item.supplierOrSeller?.type || '',
    'Accessories Included': (item.accessories || []).join(', '),
    'Purchase Date': formatDate(item.purchaseDate),
    'Notes': item.notes || '',
  }));

  const wsInventory = XLSX.utils.json_to_sheet(inventoryRows);
  XLSX.utils.book_append_sheet(wb, wsInventory, 'Current Inventory');

  // 2. SALES & INVOICES SHEET
  const salesRows = sales.map((s, idx) => ({
    '#': idx + 1,
    'Invoice Number': s.invoiceNumber,
    'Sale Date': formatDate(s.saleDate),
    'Device Description': s.deviceTitle,
    'Device Type': s.deviceType === 'new' ? 'Brand New' : 'Used',
    'Primary IMEI 1': s.imei1,
    'Secondary IMEI 2': s.imei2 || '',
    'Customer Name': s.customer?.name || 'Walk-in Customer',
    'Customer Phone': s.customer?.phone || '',
    'Customer CNIC / ID': s.customer?.cnicOrGovId || '',
    'Customer Email': s.customer?.email || '',
    'Customer Address': s.customer?.address || '',
    'Original Cost': s.purchaseCost,
    'Sold Price': s.soldPrice,
    'Discount Given': s.discount,
    'Trade-In Deduction': s.tradeInItem ? s.tradeInItem.agreedValue : 0,
    'Final Paid Amount': s.finalAmount,
    'Net Profit': s.profit,
    'Profit Margin (%)': s.soldPrice > 0 ? `${((s.profit / s.soldPrice) * 100).toFixed(1)}%` : '0%',
    'Payment Method': s.paymentMethod,
    'Warranty Type': s.warranty?.type || 'Shop Warranty',
    'Warranty Duration (Days)': s.warranty?.durationDays || 0,
    'Warranty Expiry': s.warranty?.warrantyExpiry ? new Date(s.warranty.warrantyExpiry).toLocaleDateString() : 'N/A',
    'Sold By Staff': s.soldBy,
    'Trade-in Exchange Device': s.tradeInItem ? `${s.tradeInItem.brand} ${s.tradeInItem.model} (IMEI: ${s.tradeInItem.imei})` : 'None',
    'Invoice Notes': s.notes || '',
  }));

  const wsSales = XLSX.utils.json_to_sheet(salesRows);
  XLSX.utils.book_append_sheet(wb, wsSales, 'Sales & Invoices');

  // 3. CUSTOMERS & CRM SHEET
  if (customers.length > 0) {
    const customerRows = customers.map((c, idx) => {
      const linkedSales = sales.filter(
        (s) => (s.customer?.phone && s.customer.phone === c.phone) || (s.customer?.name && s.customer.name.toLowerCase() === c.name.toLowerCase())
      );
      const totalInvoicedSpend = linkedSales.reduce((acc, s) => acc + (s.finalAmount || 0), 0);
      const manualSpend = (c.manualPurchases || []).reduce((acc, m) => acc + (m.amount || 0), 0);
      const totalSpend = totalInvoicedSpend + manualSpend;

      return {
        '#': idx + 1,
        'Customer ID': c.id,
        'Full Name': c.name,
        'Phone Number': c.phone,
        'Email Address': c.email || '',
        'CNIC / National ID': c.cnicOrGovId || '',
        'Address': c.address || '',
        'Loyalty Tags': (c.tags || []).join(', '),
        'Preferred Brands': (c.preferences?.preferredBrands || []).join(', '),
        'Budget Range': c.preferences?.budgetRange || '',
        'Storage Preference': c.preferences?.storagePreference || '',
        'Condition Preference': c.preferences?.conditionPreference || 'Both',
        'Interested Categories': (c.preferences?.interestedCategories || []).join(', '),
        'WhatsApp Alerts Opt-in': c.preferences?.whatsappAlerts ? 'YES' : 'NO',
        'Preference Notes': c.preferences?.notes || '',
        'Total Device Invoices': linkedSales.length,
        'Total Spend Valuation': totalSpend,
        'Registered Date': formatDate(c.createdAt),
        'General Notes': c.notes || '',
      };
    });

    const wsCustomers = XLSX.utils.json_to_sheet(customerRows);
    XLSX.utils.book_append_sheet(wb, wsCustomers, 'Customers & CRM');
  }

  // 4. USED PHONE INTAKES & TRADE-INS SHEET
  const usedPhones = inventory.filter((i) => i.deviceType === 'used' || i.supplierOrSeller?.type === 'Trade-in Exchange');
  const usedRows = usedPhones.map((u, idx) => ({
    '#': idx + 1,
    'Device ID': u.id,
    'Brand': u.brand,
    'Model': u.model,
    'Storage': u.storage,
    'Color': u.color,
    'Condition Grade': u.conditionGrade || 'Used',
    'Battery Health (%)': u.batteryHealth ? `${u.batteryHealth}%` : 'N/A',
    'Screen Condition': u.screenCondition || 'Original',
    'IMEI 1': u.imei1,
    'IMEI 2': u.imei2 || '',
    'Purchase / Trade-in Cost': u.purchaseCost,
    'Intake Date': formatDate(u.purchaseDate),
    'Intake Source': u.supplierOrSeller?.type || 'Customer Intake',
    'Previous Owner Name': u.supplierOrSeller?.name || '',
    'Previous Owner Phone': u.supplierOrSeller?.phone || '',
    'Previous Owner CNIC/Gov ID': u.supplierOrSeller?.cnicOrGovId || '',
    'Current Status': u.status.toUpperCase(),
    'Functional Checks Passed': u.diagnostics ? Object.entries(u.diagnostics).filter(([_, v]) => v).map(([k]) => k).join(', ') : 'All Passed',
  }));

  const wsUsed = XLSX.utils.json_to_sheet(usedRows);
  XLSX.utils.book_append_sheet(wb, wsUsed, 'Used Phones & Trade-Ins');

  // 4. FINANCIAL & BUSINESS SUMMARY SHEET
  const totalStockCount = inventory.filter((i) => i.status === 'in_stock').length;
  const totalStockCost = inventory.filter((i) => i.status === 'in_stock').reduce((acc, i) => acc + (i.purchaseCost || 0), 0);
  const totalTargetValue = inventory.filter((i) => i.status === 'in_stock').reduce((acc, i) => acc + (i.sellingPriceTarget || 0), 0);
  const totalRevenue = sales.reduce((acc, s) => acc + (s.finalAmount || 0), 0);
  const totalProfit = sales.reduce((acc, s) => acc + (s.profit || 0), 0);
  const totalSoldUnits = sales.length;

  const summaryRows = [
    { 'Metric': 'Shop Name', 'Value': settings.shopName },
    { 'Metric': 'Owner / Manager', 'Value': settings.ownerName },
    { 'Metric': 'Contact Phone', 'Value': settings.phone },
    { 'Metric': 'Export Generated At', 'Value': new Date().toLocaleString() },
    { 'Metric': 'Currency', 'Value': settings.currency },
    { 'Metric': '', 'Value': '' },
    { 'Metric': '=== CURRENT INVENTORY ===', 'Value': '' },
    { 'Metric': 'Total In-Stock Units', 'Value': totalStockCount },
    { 'Metric': 'Total In-Stock Cost Valuation', 'Value': totalStockCost },
    { 'Metric': 'Total Expected Retail Valuation', 'Value': totalTargetValue },
    { 'Metric': 'Projected Inventory Profit', 'Value': totalTargetValue - totalStockCost },
    { 'Metric': '', 'Value': '' },
    { 'Metric': '=== SALES PERFORMANCE ===', 'Value': '' },
    { 'Metric': 'Total Invoices Generated', 'Value': totalSoldUnits },
    { 'Metric': 'Total Sales Revenue Collected', 'Value': totalRevenue },
    { 'Metric': 'Total Net Profit Earned', 'Value': totalProfit },
    { 'Metric': 'Overall Net Profit Margin', 'Value': totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}%` : '0%' },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Shop Summary');

  // Generate filename
  const dateStr = new Date().toISOString().split('T')[0];
  const cleanShopName = (settings.shopName || 'Mobile_Shop').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${cleanShopName}_Complete_Data_${dateStr}.xlsx`;

  XLSX.writeFile(wb, filename);
};

/**
 * Export Inventory Only (CSV or XLSX)
 */
export const exportInventorySheet = (
  inventory: MobileItem[],
  format: 'xlsx' | 'csv' = 'xlsx'
) => {
  const rows = inventory.map((item, idx) => ({
    '#': idx + 1,
    'ID': item.id,
    'Type': item.deviceType === 'new' ? 'New' : 'Used',
    'Brand': item.brand,
    'Model': item.model,
    'Storage': item.storage,
    'Color': item.color,
    'Condition': item.conditionGrade || (item.deviceType === 'new' ? 'Brand New' : 'Used'),
    'Battery Health': item.batteryHealth ? `${item.batteryHealth}%` : (item.deviceType === 'new' ? '100%' : ''),
    'IMEI 1': item.imei1,
    'IMEI 2': item.imei2 || '',
    'Serial Number': item.serialNumber || '',
    'Network/PTA': item.networkStatus,
    'Cost Price': item.purchaseCost,
    'Sale Price Target': item.sellingPriceTarget,
    'Status': item.status.toUpperCase(),
    'Supplier/Seller': item.supplierOrSeller?.name || '',
    'Supplier Phone': item.supplierOrSeller?.phone || '',
    'Purchase Date': formatDate(item.purchaseDate),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventory');

  const dateStr = new Date().toISOString().split('T')[0];
  if (format === 'csv') {
    XLSX.writeFile(wb, `Mobile_Inventory_${dateStr}.csv`, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, `Mobile_Inventory_${dateStr}.xlsx`);
  }
};

/**
 * Export Sales & Invoices Only (CSV or XLSX)
 */
export const exportSalesSheet = (
  sales: SaleRecord[],
  format: 'xlsx' | 'csv' = 'xlsx'
) => {
  const rows = sales.map((s, idx) => ({
    '#': idx + 1,
    'Invoice #': s.invoiceNumber,
    'Date': formatDate(s.saleDate),
    'Device': s.deviceTitle,
    'IMEI 1': s.imei1,
    'IMEI 2': s.imei2 || '',
    'Customer Name': s.customer?.name || 'Walk-in',
    'Customer Phone': s.customer?.phone || '',
    'Customer CNIC': s.customer?.cnicOrGovId || '',
    'Purchase Cost': s.purchaseCost,
    'Sold Price': s.soldPrice,
    'Discount': s.discount,
    'Trade-In Credit': s.tradeInItem ? s.tradeInItem.agreedValue : 0,
    'Final Paid': s.finalAmount,
    'Net Profit': s.profit,
    'Payment Method': s.paymentMethod,
    'Warranty Type': s.warranty?.type || '',
    'Warranty Expiry': s.warranty?.warrantyExpiry ? new Date(s.warranty.warrantyExpiry).toLocaleDateString() : '',
    'Sold By': s.soldBy,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sales Invoices');

  const dateStr = new Date().toISOString().split('T')[0];
  if (format === 'csv') {
    XLSX.writeFile(wb, `Mobile_Sales_Invoices_${dateStr}.csv`, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, `Mobile_Sales_Invoices_${dateStr}.xlsx`);
  }
};

/**
 * Export Customers & Preferences Only (CSV or XLSX)
 */
export const exportCustomersSheet = (
  customers: Customer[],
  sales: SaleRecord[] = [],
  format: 'xlsx' | 'csv' = 'xlsx'
) => {
  const rows = customers.map((c, idx) => {
    const linkedSales = sales.filter(
      (s) => (s.customer?.phone && s.customer.phone === c.phone) || (s.customer?.name && s.customer.name.toLowerCase() === c.name.toLowerCase())
    );
    const totalInvoicedSpend = linkedSales.reduce((acc, s) => acc + (s.finalAmount || 0), 0);
    const manualSpend = (c.manualPurchases || []).reduce((acc, m) => acc + (m.amount || 0), 0);
    const totalSpend = totalInvoicedSpend + manualSpend;

    return {
      '#': idx + 1,
      'Customer ID': c.id,
      'Full Name': c.name,
      'Phone Number': c.phone,
      'Email Address': c.email || '',
      'CNIC / ID': c.cnicOrGovId || '',
      'Address': c.address || '',
      'Tags': (c.tags || []).join(', '),
      'Preferred Brands': (c.preferences?.preferredBrands || []).join(', '),
      'Budget Range': c.preferences?.budgetRange || '',
      'Storage Preference': c.preferences?.storagePreference || '',
      'Condition Preference': c.preferences?.conditionPreference || 'Both',
      'Categories': (c.preferences?.interestedCategories || []).join(', '),
      'WhatsApp Alerts': c.preferences?.whatsappAlerts ? 'Yes' : 'No',
      'Preference Notes': c.preferences?.notes || '',
      'Total Invoices': linkedSales.length,
      'Total Spend': totalSpend,
      'Registered Date': formatDate(c.createdAt),
      'Notes': c.notes || '',
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Customers');

  const dateStr = new Date().toISOString().split('T')[0];
  if (format === 'csv') {
    XLSX.writeFile(wb, `Customers_Directory_${dateStr}.csv`, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, `Customers_Directory_${dateStr}.xlsx`);
  }
};

/**
 * Generates an Email/Gmail formatted backup draft link and clipboard text
 */
export const generateGmailBackupDraft = (
  emailId: string,
  inventory: MobileItem[],
  sales: SaleRecord[],
  settings: ShopSettings
) => {
  const dateStr = new Date().toLocaleDateString();
  const timeStr = new Date().toLocaleTimeString();
  const inStockCount = inventory.filter((i) => i.status === 'in_stock').length;
  const inStockValuation = inventory
    .filter((i) => i.status === 'in_stock')
    .reduce((acc, i) => acc + (i.purchaseCost || 0), 0);
  const totalSales = sales.length;
  const totalProfit = sales.reduce((acc, s) => acc + (s.profit || 0), 0);
  const totalRevenue = sales.reduce((acc, s) => acc + (s.finalAmount || 0), 0);

  const subject = encodeURIComponent(
    `[DATA BACKUP] ${settings.shopName} - ${dateStr} (${inStockCount} Phones in Stock)`
  );

  const bodyText = `MOBILE SHOP DATA BACKUP & SUMMARY
Shop: ${settings.shopName}
Owner: ${settings.ownerName}
Date: ${dateStr} at ${timeStr}
--------------------------------------------------
KEY BUSINESS STATS:
• Active Inventory: ${inStockCount} mobile units
• Stock Cost Valuation: ${settings.currencySymbol}${inStockValuation.toLocaleString()}
• Total Sales Records: ${totalSales} invoices
• Total Revenue: ${settings.currencySymbol}${totalRevenue.toLocaleString()}
• Total Net Profit: ${settings.currencySymbol}${totalProfit.toLocaleString()}

--------------------------------------------------
HOW TO RESTORE OR VIEW IN SHEETS:
1. You can export complete Excel/Sheets spreadsheets (.xlsx) from the shop dashboard.
2. Complete raw backup data is attached below. You can copy-paste the JSON into the Settings > Restore Data tab anytime.

--------------------------------------------------
FULL RAW BACKUP JSON:
${JSON.stringify({ exportDate: new Date().toISOString(), shop: settings, inventory, sales, version: '1.0.0' })}
`;

  const mailtoUrl = `mailto:${encodeURIComponent(emailId)}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
  
  // Gmail Web Compose direct URL
  const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    emailId
  )}&su=${subject}&body=${encodeURIComponent(bodyText)}`;

  return {
    mailtoUrl,
    gmailWebUrl,
    summaryText: bodyText,
    subjectDecoded: `[DATA BACKUP] ${settings.shopName} - ${dateStr}`,
  };
};
