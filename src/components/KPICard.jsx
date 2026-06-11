import React from 'react';
import { motion } from 'framer-motion';
import AnimatedNumber from './AnimatedNumber';

/**
 * Premium KPI Display Card
 * @param {Object} props
 * @param {string} props.title - Metric title
 * @param {number} props.budget - Budget target
 * @param {number} props.actual - Actual achieved
 * @param {number} props.eff - Efficiency percentage
 * @param {string} [props.prefix=''] - Value prefix (e.g. ₹)
 * @param {string} [props.suffix=''] - Value suffix (e.g. Cr)
 * @param {number} [props.decimals=0] - Decimals formatting
 * @param {React.ReactNode} props.icon - Lucide icon component
 * @param {React.ReactNode} [props.extraInfo] - Custom sub-labels / detail rows
 * @param {string} [props.borderStyle='border-l-4 border-nyati-orange'] - Custom left border design
 */
export default function KPICard({
  title,
  budget,
  actual,
  eff,
  prefix = '',
  suffix = '',
  decimals = 0,
  icon: Icon,
  extraInfo,
  borderStyle = 'border-l-4 border-nyati-orange'
}) {
  // Status Badge Logic
  let statusColor = 'bg-nyati-danger/10 text-nyati-danger';
  let statusText = 'Critical';
  
  if (eff >= 100) {
    statusColor = 'bg-nyati-success/10 text-nyati-success';
    statusText = 'On Target';
  } else if (eff >= 80) {
    statusColor = 'bg-nyati-warning/10 text-nyati-warning';
    statusText = 'Warning';
  }

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-2xl p-6 shadow-premium hover:shadow-premium-hover flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${borderStyle}`}
    >
      {/* Top Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">{title}</span>
          <h2 className="text-3xl font-extrabold text-nyati-navy mt-1">
            <AnimatedNumber value={actual} prefix={prefix} suffix={suffix} decimals={decimals} />
          </h2>
        </div>
        <div className="p-3 bg-nyati-navy/5 text-nyati-navy rounded-xl">
          {Icon && <Icon className="w-6 h-6 text-nyati-navy" />}
        </div>
      </div>

      {/* Target Comparison */}
      <div className="grid grid-cols-2 gap-4 mb-4 border-t border-b border-slate-50 py-3 text-sm">
        <div>
          <span className="text-slate-400 block text-xs">Budget Target</span>
          <span className="font-semibold text-slate-700">
            {prefix}{budget.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-xs">Variance</span>
          <span className={`font-semibold ${(budget - actual) > 0 ? 'text-nyati-danger' : 'text-nyati-success'}`}>
            {prefix}{(actual - budget).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
          </span>
        </div>
      </div>

      {/* Progress & Efficiency Indicator */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-medium text-slate-500">Efficiency Rate</span>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColor}`}>
              {statusText}
            </span>
            <span className="font-bold text-nyati-navy">
              <AnimatedNumber value={eff} suffix="%" decimals={1} />
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, eff)}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              eff >= 100 ? 'bg-nyati-success' : eff >= 80 ? 'bg-nyati-warning' : 'bg-nyati-danger'
            }`}
          />
        </div>
      </div>

      {/* Extra details (e.g. ERP, area specifications) */}
      {extraInfo && (
        <div className="mt-4 pt-3 border-t border-dashed border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
          {extraInfo}
        </div>
      )}
    </motion.div>
  );
}
