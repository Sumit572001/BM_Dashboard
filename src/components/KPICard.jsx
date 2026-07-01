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
  borderStyle = 'border-l-4 border-nyati-orange',
  simple = false,
  bgClass = 'bg-white'
}) {
  // Status Badge Logic
  let statusColor = 'bg-nyati-danger/10 text-nyati-danger';
  let statusText = 'Critical';

  if (eff >= 80) {
    statusColor = 'bg-nyati-success/10 text-nyati-success';
    statusText = 'On Target';
  } else if (eff >= 50) {
    statusColor = 'bg-nyati-warning/10 text-nyati-warning';
    statusText = 'Progressing';
  }

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`${bgClass} rounded-2xl p-5 shadow-premium hover:shadow-premium-hover flex flex-col justify-between relative overflow-hidden ${borderStyle} h-full`}
    >
      {/* Top Header */}
      <div className="flex justify-between items-start">
        <div>
          <span className={`${simple ? 'text-[13px] font-extrabold' : 'text-[11px] font-semibold'} uppercase tracking-wider text-slate-700`}>{title}</span>
          <h2 className={`${simple ? 'text-3xl font-black mt-2.5' : 'text-3xl font-black mt-2'} text-nyati-navy`}>
            <AnimatedNumber value={actual} prefix={prefix} suffix={suffix} decimals={decimals} />
          </h2>
        </div>
        <div className="p-2 bg-nyati-navy/5 text-nyati-navy rounded-lg">
          {Icon && <Icon className="w-4 h-4 text-nyati-navy" />}
        </div>
      </div>

      {!simple && (
        <>
          {/* Target Comparison */}
          <div className="grid grid-cols-2 gap-2 mb-2 mt-3 border-t border-b border-slate-100 py-2 text-sm">
            <div>
              <span className="text-slate-500 block text-[11px]">Budget Target</span>
              <span className="font-semibold text-slate-700 text-[13px]">
                {prefix}{budget.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Variance</span>
              <span className={`font-semibold text-[13px] ${(budget - actual) > 0 ? 'text-nyati-danger' : 'text-nyati-success'}`}>
                {prefix}{(actual - budget).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
              </span>
            </div>
          </div>

          {/* Progress & Efficiency Indicator */}
          <div className="space-y-2 mt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-600">Efficiency Rate</span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColor}`}>
                  {statusText}
                </span>
                <span className="font-bold text-nyati-navy text-[13px]">
                  <AnimatedNumber value={eff} suffix="%" decimals={1} />
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, eff)}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className={`h-full rounded-full ${eff >= 80 ? 'bg-nyati-success' : eff >= 50 ? 'bg-nyati-warning' : 'bg-nyati-danger'}`}
              />
            </div>
          </div>
        </>
      )}

      {/* Extra details (e.g. ERP, area specifications) */}
      {extraInfo && (
        <div className="mt-2 pt-2 border-t border-dashed border-slate-100 grid grid-cols-2 gap-1 text-xs font-semibold text-slate-700">
          {extraInfo}
        </div>
      )}
    </motion.div>
  );
}
