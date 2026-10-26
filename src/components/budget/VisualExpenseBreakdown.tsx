/**
 * Smart AI Travel Planner 3.0
 * Visual Expense Breakdown Chart Component (Powered by Recharts)
 *
 * Implements:
 * 1. Dynamic category-wise spending distribution (Accommodations, Transit, Gastronomy, Experiences, Buffer).
 * 2. Responsive Donut PieChart and BarChart with animated transitions.
 * 3. Interactive Tooltips with formatted currency values.
 * 4. Center-hole total spend metrics.
 * 5. Color-coordinated category pill legend.
 */

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { CurrencyCode } from '../../types/travel';
import { formatCurrency, convertCurrency } from '../../lib/budget';

interface VisualExpenseBreakdownProps {
  totals: Record<string, number>;
  percentages: Record<string, number>;
  totalCommittedINR: number;
  currency: CurrencyCode;
  className?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  accommodations: '#14213D', // Ink
  transit: '#2A9D8F',        // Teal
  gastronomy: '#D4A24C',     // Gold
  experiences: '#E76F51',    // Terracotta
  other: '#6B6F80',          // Muted
};

const CATEGORY_LABELS: Record<string, string> = {
  accommodations: 'Accommodations',
  transit: 'Transit & Travel',
  gastronomy: 'Food & Dining',
  experiences: 'Experiences & Tours',
  other: 'Other / Contingency',
};

export const VisualExpenseBreakdown: React.FC<VisualExpenseBreakdownProps> = ({
  totals,
  percentages,
  totalCommittedINR,
  currency,
  className = '',
}) => {
  const [viewType, setViewType] = useState<'donut' | 'bar'>('donut');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartData = [
    {
      key: 'accommodations',
      name: CATEGORY_LABELS.accommodations,
      amountINR: totals.accommodations || 0,
      convertedAmount: convertCurrency(totals.accommodations || 0, 'INR', currency),
      percentage: percentages.accommodations || 0,
      color: CATEGORY_COLORS.accommodations,
    },
    {
      key: 'transit',
      name: CATEGORY_LABELS.transit,
      amountINR: totals.transit || 0,
      convertedAmount: convertCurrency(totals.transit || 0, 'INR', currency),
      percentage: percentages.transit || 0,
      color: CATEGORY_COLORS.transit,
    },
    {
      key: 'gastronomy',
      name: CATEGORY_LABELS.gastronomy,
      amountINR: totals.gastronomy || 0,
      convertedAmount: convertCurrency(totals.gastronomy || 0, 'INR', currency),
      percentage: percentages.gastronomy || 0,
      color: CATEGORY_COLORS.gastronomy,
    },
    {
      key: 'experiences',
      name: CATEGORY_LABELS.experiences,
      amountINR: totals.experiences || 0,
      convertedAmount: convertCurrency(totals.experiences || 0, 'INR', currency),
      percentage: percentages.experiences || 0,
      color: CATEGORY_COLORS.experiences,
    },
  ].filter((d) => d.amountINR > 0);

  const totalConverted = convertCurrency(totalCommittedINR, 'INR', currency);

  return (
    <div className={`bg-white rounded-2xl border border-[rgba(20,33,61,0.12)] shadow-[0_2px_8px_rgba(20,33,61,0.06)] p-5 space-y-4 ${className}`}>
      {/* Header and Toggle */}
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(20,33,61,0.08)]">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#D4A24C] text-base">pie_chart</span>
            <h3 className="text-sm font-bold text-[#14213D]">Visual Expense Allocation</h3>
          </div>
          <p className="text-[11px] text-[#6B6F80]">Category distribution across trip ledger</p>
        </div>

        {/* View Switcher: Donut vs Bar */}
        <div className="flex items-center bg-[#FBF6EE] p-0.5 rounded-xl border border-[rgba(20,33,61,0.12)]">
          <button
            type="button"
            onClick={() => setViewType('donut')}
            title="Donut Chart"
            className={`p-1.5 rounded-lg text-xs flex items-center transition-all cursor-pointer ${
              viewType === 'donut'
                ? 'bg-[#14213D] text-white shadow-xs font-bold'
                : 'text-[#6B6F80] hover:text-[#14213D]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">donut_large</span>
          </button>
          <button
            type="button"
            onClick={() => setViewType('bar')}
            title="Bar Chart"
            className={`p-1.5 rounded-lg text-xs flex items-center transition-all cursor-pointer ${
              viewType === 'bar'
                ? 'bg-[#14213D] text-white shadow-xs font-bold'
                : 'text-[#6B6F80] hover:text-[#14213D]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">bar_chart</span>
          </button>
        </div>
      </div>

      {/* Visual Chart Area */}
      <div className="relative h-56 w-full flex items-center justify-center">
        {chartData.length === 0 ? (
          <div className="text-center text-xs text-[#94A3B8]">
            <span className="material-symbols-outlined text-2xl mb-1 block">receipt_long</span>
            No categorized expenses recorded yet.
          </div>
        ) : viewType === 'donut' ? (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="convertedAmount"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.45}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `${formatCurrency(Number(value), currency)}`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                  itemStyle={{ color: '#FFFFFF' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Center Metrics */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B]">
                {activeIndex !== null && chartData[activeIndex]
                  ? chartData[activeIndex].name.split(' ')[0]
                  : 'Total Spend'}
              </span>
              <span className="text-xs sm:text-sm font-bold font-mono text-[#0F172A] mt-0.5">
                {activeIndex !== null && chartData[activeIndex]
                  ? formatCurrency(chartData[activeIndex].convertedAmount, currency)
                  : formatCurrency(totalConverted, currency)}
              </span>
              <span className="text-[9px] font-mono font-semibold text-[#0891B2]">
                {activeIndex !== null && chartData[activeIndex]
                  ? `${chartData[activeIndex].percentage}%`
                  : '100%'}
              </span>
            </div>
          </>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
              <XAxis
                type="number"
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                tick={{ fontSize: 10, fill: '#64748B' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={70}
                tick={{ fontSize: 9, fill: '#0F172A' }}
              />
              <Tooltip
                formatter={(value: any) => [
                  `${formatCurrency(Number(value), currency)}`,
                  'Cost',
                ]}
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              />
              <Bar dataKey="convertedAmount" radius={[0, 6, 6, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category Legend Pills with Amounts and Percentages */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E2E8F0]">
        {chartData.map((item) => (
          <div
            key={item.key}
            onMouseEnter={() => setActiveIndex(chartData.findIndex((c) => c.key === item.key))}
            onMouseLeave={() => setActiveIndex(null)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              activeIndex === chartData.findIndex((c) => c.key === item.key)
                ? 'bg-slate-50 border-[#0891B2] shadow-2xs'
                : 'bg-[#F8FAFC] border-[#E2E8F0] hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[11px] font-semibold text-[#0F172A] truncate">
                {item.name}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] mt-1 font-mono">
              <span className="text-[#64748B] font-semibold">{item.percentage}%</span>
              <span className="font-bold text-[#0F172A]">
                {formatCurrency(item.convertedAmount, currency)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
