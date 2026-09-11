import React, { useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import { 
  TrendingUp, 
  DollarSign, 
  Smartphone, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  PieChart as PieChartIcon, 
  BarChart3,
  Percent,
  CheckCircle2,
  ReceiptText,
  Boxes
} from 'lucide-react';

interface BrandStatItem {
  inStock: number;
  sold: number;
  totalCost: number;
  profit: number;
}

export const AnalyticsView: React.FC = () => {
  const { inventory, sales, formatCurrency, settings } = useShop();

  // Calculated metrics
  const analytics = useMemo(() => {
    const inStock = inventory.filter((d) => d.status === 'in_stock');
    const newInStock = inStock.filter((d) => d.deviceType === 'new');
    const usedInStock = inStock.filter((d) => d.deviceType === 'used');
    const soldItems = inventory.filter((d) => d.status === 'sold');

    const totalStockCost = inStock.reduce((acc, curr) => acc + curr.purchaseCost, 0);
    const newStockCost = newInStock.reduce((acc, curr) => acc + curr.purchaseCost, 0);
    const usedStockCost = usedInStock.reduce((acc, curr) => acc + curr.purchaseCost, 0);

    const totalTargetRevenue = inStock.reduce((acc, curr) => acc + curr.sellingPriceTarget, 0);
    const potentialProfit = totalTargetRevenue - totalStockCost;

    const totalRealizedProfit = sales.reduce((acc, curr) => acc + curr.profit, 0);
    const totalSalesRevenue = sales.reduce((acc, curr) => acc + curr.finalAmount, 0);
    const avgProfitPerUnit = sales.length > 0 ? totalRealizedProfit / sales.length : 0;
    const avgProfitMargin = totalSalesRevenue > 0 ? (totalRealizedProfit / totalSalesRevenue) * 100 : 0;

    // Brand counts
    const brandDistribution: Record<string, BrandStatItem> = {};
    inventory.forEach((item) => {
      if (!brandDistribution[item.brand]) {
        brandDistribution[item.brand] = { inStock: 0, sold: 0, totalCost: 0, profit: 0 };
      }
      if (item.status === 'in_stock') {
        brandDistribution[item.brand].inStock += 1;
        brandDistribution[item.brand].totalCost += item.purchaseCost;
      }
    });

    sales.forEach((sale) => {
      // Find brand
      const dev = inventory.find((i) => i.id === sale.deviceId);
      const brand = dev?.brand || sale.deviceTitle.split(' ')[0] || 'Other';
      if (!brandDistribution[brand]) {
        brandDistribution[brand] = { inStock: 0, sold: 0, totalCost: 0, profit: 0 };
      }
      brandDistribution[brand].sold += 1;
      brandDistribution[brand].profit += sale.profit;
    });

    // New vs Used sales split
    const newSalesCount = sales.filter((s) => s.deviceType === 'new').length;
    const usedSalesCount = sales.filter((s) => s.deviceType === 'used').length;

    const newSalesProfit = sales.filter((s) => s.deviceType === 'new').reduce((acc, curr) => acc + curr.profit, 0);
    const usedSalesProfit = sales.filter((s) => s.deviceType === 'used').reduce((acc, curr) => acc + curr.profit, 0);

    return {
      inStockCount: inStock.length,
      newInStockCount: newInStock.length,
      usedInStockCount: usedInStock.length,
      totalStockCost,
      newStockCost,
      usedStockCost,
      totalTargetRevenue,
      potentialProfit,
      totalSalesCount: sales.length,
      totalRealizedProfit,
      totalSalesRevenue,
      avgProfitPerUnit,
      avgProfitMargin,
      brandDistribution,
      newSalesCount,
      usedSalesCount,
      newSalesProfit,
      usedSalesProfit,
    };
  }, [inventory, sales]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#121520] via-[#161B2E] to-[#121520] text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white uppercase tracking-wider">
              Financial Intelligence
            </span>
            <span className="text-xs text-slate-400 font-mono">Mobile Shop Analytics</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5">
            Profit, Stock Valuation & Performance
          </h2>
          <p className="text-xs text-slate-300 max-w-xl mt-1">
            Real-time calculation of realized profit margins, capital invested in new vs used stock, and brand profitability.
          </p>
        </div>

        <div className="bg-[#181D2E] p-3.5 rounded-xl border border-slate-700/60 text-right">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Total Realized Net Profit</span>
          <span className="text-2xl font-black text-emerald-400 block mt-0.5">+{formatCurrency(analytics.totalRealizedProfit)}</span>
          <span className="text-[11px] text-slate-400">Across {analytics.totalSalesCount} sold units</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Stock Cost */}
        <div className="bg-[#12151E] p-4 rounded-xl border border-slate-800/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Physical Stock Cost</span>
              <div className="p-1.5 rounded-lg bg-blue-950/60 border border-blue-800/40 text-blue-400">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-white">{formatCurrency(analytics.totalStockCost)}</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-400 flex justify-between border-t border-slate-800 pt-1.5">
            <span>New: <strong className="text-emerald-400">{formatCurrency(analytics.newStockCost)}</strong></span>
            <span>Used: <strong className="text-indigo-400">{formatCurrency(analytics.usedStockCost)}</strong></span>
          </div>
        </div>

        {/* Potential Profit */}
        <div className="bg-[#12151E] p-4 rounded-xl border border-slate-800/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Target Potential Margin</span>
              <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-emerald-400">+{formatCurrency(analytics.potentialProfit)}</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-400 border-t border-slate-800 pt-1.5">
            Target Valuation: <strong className="text-slate-200">{formatCurrency(analytics.totalTargetRevenue)}</strong>
          </div>
        </div>

        {/* Avg Profit / Phone */}
        <div className="bg-[#12151E] p-4 rounded-xl border border-slate-800/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Avg Profit / Mobile Sold</span>
              <div className="p-1.5 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-indigo-400">+{formatCurrency(analytics.avgProfitPerUnit)}</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-400 border-t border-slate-800 pt-1.5">
            Average Margin: <strong className="text-slate-200">{analytics.avgProfitMargin.toFixed(1)}%</strong>
          </div>
        </div>

        {/* Total Billed Revenue */}
        <div className="bg-[#12151E] p-4 rounded-xl border border-slate-800/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total POS Cash Flow</span>
              <div className="p-1.5 rounded-lg bg-purple-950/60 border border-purple-800/40 text-purple-400">
                <ReceiptText className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-white">{formatCurrency(analytics.totalSalesRevenue)}</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-400 border-t border-slate-800 pt-1.5">
            <strong className="text-slate-200">{analytics.totalSalesCount}</strong> Completed Invoices
          </div>
        </div>

      </div>

      {/* Comparison: Brand New Mobiles vs Used / Pre-Owned Mobiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Brand New Performance */}
        <div className="bg-[#12151E] p-5 rounded-2xl border border-slate-800/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center justify-center font-bold">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Brand New Mobiles</h3>
                <span className="text-xs text-slate-400">Box Pack / Factory Sealed Stock</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/50">
              {analytics.newInStockCount} in stock
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-[#171B26] p-3 rounded-xl text-xs border border-slate-700/60">
            <div>
              <span className="text-slate-400 block">Stock Investment</span>
              <span className="font-bold text-white text-sm">{formatCurrency(analytics.newStockCost)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Realized Profit</span>
              <span className="font-bold text-emerald-400 text-sm">+{formatCurrency(analytics.newSalesProfit)}</span>
            </div>
          </div>

          <div className="text-xs text-slate-400 flex justify-between items-center">
            <span>Sold Volume: <strong className="text-slate-200">{analytics.newSalesCount} units</strong></span>
            <span>Avg margin: <strong className="text-emerald-400">12-16%</strong></span>
          </div>
        </div>

        {/* Used / Pre-Owned Performance */}
        <div className="bg-[#12151E] p-5 rounded-2xl border border-slate-800/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-800/40 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Used / Pre-Owned Mobiles</h3>
                <span className="text-xs text-slate-400">Customer Trade-ins & Tested Phones</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/50">
              {analytics.usedInStockCount} in stock
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-[#171B26] p-3 rounded-xl text-xs border border-slate-700/60">
            <div>
              <span className="text-slate-400 block">Stock Investment</span>
              <span className="font-bold text-white text-sm">{formatCurrency(analytics.usedStockCost)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Realized Profit</span>
              <span className="font-bold text-indigo-400 text-sm">+{formatCurrency(analytics.usedSalesProfit)}</span>
            </div>
          </div>

          <div className="text-xs text-slate-400 flex justify-between items-center">
            <span>Sold Volume: <strong className="text-slate-200">{analytics.usedSalesCount} units</strong></span>
            <span className="text-emerald-400 font-bold">Higher Margin: 20-30%</span>
          </div>
        </div>

      </div>

      {/* Brand Breakdown Table */}
      <div className="bg-[#12151E] rounded-2xl border border-slate-800/90 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-white">Brand Distribution & Profit Contribution</h3>
          <span className="text-xs text-slate-400">Active stock & sales by manufacturer</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0B0D14] text-slate-300 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                <th className="py-3 px-4">Brand / Manufacturer</th>
                <th className="py-3 px-3">Units in Stock</th>
                <th className="py-3 px-3">Capital Invested</th>
                <th className="py-3 px-3">Units Sold</th>
                <th className="py-3 px-4 text-right">Realized Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {(Object.entries(analytics.brandDistribution) as [string, BrandStatItem][]).map(([brand, stats]) => (
                <tr key={brand} className="hover:bg-[#171B26]/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{brand}</td>
                  <td className="py-3 px-3 font-semibold text-slate-300">{stats.inStock} phones</td>
                  <td className="py-3 px-3 text-slate-300 font-medium">{formatCurrency(stats.totalCost)}</td>
                  <td className="py-3 px-3 text-slate-400">{stats.sold} sold</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-400">
                    +{formatCurrency(stats.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
