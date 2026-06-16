import React from 'react';
import { useData } from '../context/DataContext';
import { calculateGrandTotals } from '../utils/dataHelpers';
import { useNavigate } from 'react-router-dom';
import AnimatedNumber from '../components/AnimatedNumber';
import {
  LayoutDashboard, BarChart3, Layers,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  IndianRupee, ClipboardList, Maximize, CreditCard,
  ArrowRight, Activity, Landmark, Hammer
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Overview() {
  const { filteredProjects } = useData();
  const navigate = useNavigate();
  const totals = calculateGrandTotals(filteredProjects);

  // --- Sales & Collection derived ---
  const unitsEff = totals.budgetUnits > 0 ? (totals.soldToDate / totals.budgetUnits) * 100 : 0;
  const rateEff = totals.rateEff;
  const collectionEff = totals.collectionEff;
  const areaEff = totals.areaEff;

  // --- Outstanding & Cost derived ---
  const grandTotalOutstanding = filteredProjects.reduce((s, p) => s + p.outstanding, 0);
  const grandTotalDueMilestone = filteredProjects.reduce((s, p) => s + p.dueMilestone, 0);
  const grandTotalCollection = filteredProjects.reduce((s, p) => s + p.actualCollection, 0);
  const grandAgeingGt120 = filteredProjects.reduce((s, p) => s + p.ageing['gt120'], 0);
  const grandConstTarget = filteredProjects.reduce((s, p) => s + p.construction.target, 0);
  const grandConstAchieved = filteredProjects.reduce((s, p) => s + p.construction.achieved, 0);
  const constEff = grandConstTarget > 0 ? (grandConstAchieved / grandConstTarget) * 100 : 0;

  // --- Portfolio derived ---
  const totalInventory = filteredProjects.reduce((s, p) => s + p.totalUnits, 0);
  const totalSold = filteredProjects.reduce((s, p) => s + p.soldToDate, 0);
  const totalUnsold = totalInventory - totalSold;
  const avgCompletion = filteredProjects.length > 0
    ? filteredProjects.reduce((s, p) => s + (p.construction.completion || 0), 0) / filteredProjects.length
    : 0;

  const getEffColor = (eff) => {
    if (eff >= 100) return 'text-emerald-600';
    if (eff >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const getEffBg = (eff) => {
    if (eff >= 100) return 'bg-emerald-500';
    if (eff >= 50) return 'bg-amber-400';
    return 'bg-red-500';
  };

  const getEffBadge = (eff) => {
    if (eff >= 100) return { text: 'On Target', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    if (eff >= 50) return { text: 'Progressing', cls: 'bg-amber-50 text-amber-700 border-amber-100' };
    return { text: 'Critical', cls: 'bg-red-50 text-red-700 border-red-100' };
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-10">

      {/* Page Title */}
      <motion.div variants={item}>
        <h2 className="text-2xl font-black text-nyati-navy">Dashboard Overview</h2>
        <p className="text-slate-400 text-xs mt-1">
          Consolidated snapshot across all sections — Sales, Outstanding & Portfolio.
        </p>
      </motion.div>

      {/* ── SECTION 1: SALES & COLLECTION ────────────────────────── */}
      <motion.div variants={item}
        className="bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden"
      >
        {/* Section Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-nyati-navy/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-nyati-orange/10 rounded-xl">
              <LayoutDashboard className="w-4 h-4 text-nyati-orange" />
            </div>
            <div>
              <h3 className="font-bold text-nyati-navy text-sm">Sales & Collection</h3>
              <p className="text-slate-400 text-[10px]">FY actuals vs budget targets</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-[11px] font-bold text-nyati-orange hover:text-nyati-navy transition-colors"
          >
            View Full <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 KPI tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100">
          {[
            {
              label: 'Units Sold', icon: ClipboardList,
              actual: totals.soldToDate, budget: totals.budgetUnits,
              eff: unitsEff, suffix: '', decimals: 0
            },
            {
              label: 'Avg Rate', icon: IndianRupee,
              actual: totals.actualRate, budget: totals.budgetRate,
              eff: rateEff, prefix: '₹', suffix: '/sf', decimals: 0
            },
            {
              label: 'Saleable Area', icon: Maximize,
              actual: totals.actualArea, budget: totals.budgetArea,
              eff: areaEff, suffix: ' sf', decimals: 0
            },
            {
              label: 'Total Collection', icon: CreditCard,
              actual: totals.actualCollection, budget: totals.budgetCollection,
              eff: collectionEff, prefix: '₹', suffix: ' Cr', decimals: 2
            },
          ].map((kpi) => {
            const badge = getEffBadge(kpi.eff);
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{kpi.label}</span>
                  <Icon className="w-3.5 h-3.5 text-slate-300" />
                </div>
                <p className={`text-lg font-extrabold ${getEffColor(kpi.eff)}`}>
                  {kpi.prefix || ''}<AnimatedNumber value={kpi.actual} decimals={kpi.decimals} />{kpi.suffix}
                </p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Budget: {kpi.prefix || ''}{kpi.budget.toLocaleString('en-IN', { maximumFractionDigits: kpi.decimals })}{kpi.suffix}</span>
                    <span className={`px-1.5 py-0.5 rounded-full border font-bold ${badge.cls}`}>{badge.text}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, kpi.eff)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full rounded-full ${getEffBg(kpi.eff)}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── SECTION 2: OUTSTANDING ────────────────────────── */}
      <motion.div variants={item}
        className="bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-nyati-navy/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 rounded-xl">
              <BarChart3 className="w-4 h-4 text-sky-500" />
            </div>
            <div>
              <h3 className="font-bold text-nyati-navy text-sm">Outstanding</h3>
              <p className="text-slate-400 text-[10px]">Consolidated dues, collections, and ageing matrix</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/outstanding')}
            className="flex items-center gap-1.5 text-[11px] font-bold text-nyati-orange hover:text-nyati-navy transition-colors"
          >
            View Full <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100">
          {/* Total Outstanding */}
          <div className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Outstanding</span>
              <Landmark className="w-3.5 h-3.5 text-slate-300" />
            </div>
            <p className="text-lg font-extrabold text-red-500">
              ₹<AnimatedNumber value={grandTotalOutstanding} decimals={2} /> Cr
            </p>
            <p className="text-[10px] text-slate-400">
              Due milestone: ₹{grandTotalDueMilestone.toFixed(2)} Cr
            </p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (grandTotalCollection / grandTotalDueMilestone) * 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-sky-500"
              />
            </div>
            <p className="text-[10px] text-slate-400">
              {grandTotalDueMilestone > 0 ? ((grandTotalCollection / grandTotalDueMilestone) * 100).toFixed(1) : 0}% collected
            </p>
          </div>

          {/* Total Collection */}
          <div className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Collection</span>
              <CreditCard className="w-3.5 h-3.5 text-slate-300" />
            </div>
            <p className="text-lg font-extrabold text-emerald-600">
              ₹<AnimatedNumber value={grandTotalCollection} decimals={2} /> Cr
            </p>
            <p className="text-[10px] text-slate-400">Against ₹{grandTotalDueMilestone.toFixed(2)} Cr due</p>
          </div>

          {/* Critical Ageing > 120 days */}
          <div className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ageing &gt;120 Days</span>
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            </div>
            <p className="text-lg font-extrabold text-red-500">
              ₹<AnimatedNumber value={grandAgeingGt120} decimals={2} /> Cr
            </p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">
              <AlertTriangle className="w-2.5 h-2.5" /> Needs Follow-up
            </span>
          </div>

          {/* Construction Cost Efficiency */}
          <div className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Construction EFF</span>
              <Hammer className="w-3.5 h-3.5 text-slate-300" />
            </div>
            <p className={`text-lg font-extrabold ${getEffColor(constEff)}`}>
              <AnimatedNumber value={constEff} decimals={1} suffix="%" />
            </p>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400">
                ₹{grandConstAchieved.toFixed(1)} Cr / ₹{grandConstTarget.toFixed(1)} Cr target
              </p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, constEff)}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${getEffBg(constEff)}`}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── SECTION 3: PROJECT PORTFOLIO ────────────────────────── */}
      <motion.div variants={item}
        className="bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-nyati-navy/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <Layers className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-nyati-navy text-sm">Project Portfolio</h3>
              <p className="text-slate-400 text-[10px]">Inventory funnel & construction completion</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/portfolio')}
            className="flex items-center gap-1.5 text-[11px] font-bold text-nyati-orange hover:text-nyati-navy transition-colors"
          >
            View Full <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100">
          {/* Total Projects */}
          <div className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Projects</span>
              <Activity className="w-3.5 h-3.5 text-slate-300" />
            </div>
            <p className="text-lg font-extrabold text-nyati-navy">
              <AnimatedNumber value={filteredProjects.length} decimals={0} />
            </p>
            <p className="text-[10px] text-slate-400">{filteredProjects.filter(p => p.type === 'R').length} Resi · {filteredProjects.filter(p => p.type === 'C').length} Comm · {filteredProjects.filter(p => p.type === 'L').length} Luxe</p>
          </div>

          {/* Total Inventory */}
          <div className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Inventory</span>
              <ClipboardList className="w-3.5 h-3.5 text-slate-300" />
            </div>
            <p className="text-lg font-extrabold text-nyati-navy">
              <AnimatedNumber value={totalInventory} decimals={0} /> <span className="text-sm font-semibold text-slate-400">units</span>
            </p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${totalInventory > 0 ? (totalSold / totalInventory) * 100 : 0}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-nyati-navy"
              />
            </div>
            <p className="text-[10px] text-slate-400">
              {totalInventory > 0 ? ((totalSold / totalInventory) * 100).toFixed(1) : 0}% sold
            </p>
          </div>

          {/* Unsold Balance */}
          <div className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unsold Balance</span>
              <TrendingDown className="w-3.5 h-3.5 text-slate-300" />
            </div>
            <p className="text-lg font-extrabold text-amber-500">
              <AnimatedNumber value={totalUnsold} decimals={0} /> <span className="text-sm font-semibold text-slate-400">units</span>
            </p>
            <p className="text-[10px] text-slate-400">
              {totalInventory > 0 ? ((totalUnsold / totalInventory) * 100).toFixed(1) : 0}% remaining inventory
            </p>
          </div>

          {/* Avg Construction Completion */}
          <div className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg Completion</span>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className={`text-lg font-extrabold ${getEffColor(avgCompletion)}`}>
              <AnimatedNumber value={avgCompletion} decimals={1} suffix="%" />
            </p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, avgCompletion)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full ${getEffBg(avgCompletion)}`}
              />
            </div>
            <p className="text-[10px] text-slate-400">Avg across {filteredProjects.length} projects</p>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
}
