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
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, Tooltip, XAxis, YAxis, ReferenceLine, LineChart, Line, CartesianGrid, AreaChart, Area, Legend } from 'recharts';

// Reusable component for stacked vertical KPI strips
const OverviewMetricRow = ({ label, actual, budget, prefix = '', suffix = '', decimals = 0, status, icon: Icon }) => {
  const isAchieved = status === 'On Target';
  const isProgressing = status === 'Progressing';
  
  return (
    <div className="flex items-center justify-between py-1.5 px-3.5 bg-slate-50/50 hover:bg-slate-50/80 rounded-xl border border-slate-100/70 transition-all duration-200">
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 select-none whitespace-nowrap">
            {label}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-black text-nyati-navy whitespace-nowrap">
            {prefix}<AnimatedNumber value={actual} decimals={decimals} />{suffix}
          </span>
          {budget !== undefined && (
            <span className="text-[9.5px] text-slate-500 font-semibold whitespace-nowrap select-none">
              Tgt: {prefix}{budget.toLocaleString('en-IN', { maximumFractionDigits: decimals })}{suffix}
            </span>
          )}
        </div>
      </div>
      {status && (
        <span className={`px-2 py-0.5 text-[9.5px] font-black rounded-full border select-none shrink-0 ${
          isAchieved 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
            : isProgressing
              ? 'bg-amber-50 text-amber-700 border-amber-100' 
              : 'bg-red-50 text-red-700 border-red-100'
        }`}>
          {status}
        </span>
      )}
    </div>
  );
};

// Reusable component for the donut charts in Outstanding section
const OverviewDonutChart = ({ data, centerValue, centerLabel }) => {
  return (
    <div className="relative w-full h-20 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={18}
            outerRadius={25}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[10px] font-black text-slate-800 leading-none">
          {centerValue}
        </span>
        <span className="text-[5.5px] font-extrabold text-slate-600 uppercase tracking-wider leading-none mt-0.5">
          {centerLabel}
        </span>
      </div>
    </div>
  );
};

// A wrapper around ResponsiveContainer that delays rendering until layout stabilizes,
// preventing width-calculation bugs during browser mount and CSS animations.
const MountedResponsiveContainer = ({ children, ...props }) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    // Delay of 100ms ensures Framer Motion or block-level reflows are complete
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return <div className="w-full h-full min-h-[192px] bg-slate-50/30 rounded-2xl animate-pulse" />;
  }

  return (
    <ResponsiveContainer {...props}>
      {children}
    </ResponsiveContainer>
  );
};

// Sales & Collection normalized target achievement bar chart
const SalesComboChart = ({ data }) => {
  return (
    <div className="w-full h-full relative">
      <MountedResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
          barSize={60}
        >
          <defs>
            <linearGradient id="salesAchievedGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 9, fontWeight: 800, fill: '#475569' }} 
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9, fontWeight: 700, fill: '#475569' }}
            domain={[0, 120]}
            tickFormatter={(val) => `${val}%`}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const actualVal = payload[0].payload.rawActual;
                const targetVal = payload[0].payload.rawTarget;
                const unit = payload[0].payload.unit || '';
                const prefix = payload[0].payload.prefix || '';
                const pct = payload[0].payload.value;
                return (
                  <div className="bg-slate-900/95 text-white px-3 py-2 rounded-xl text-[10px] shadow-xl border border-slate-800 space-y-1">
                    <p className="font-extrabold text-slate-300 uppercase tracking-wider">{payload[0].payload.name}</p>
                    <p className="font-bold flex items-center justify-between gap-4 text-slate-200">
                      <span>Actual:</span>
                      <span className="text-emerald-400 font-black">{prefix}{actualVal.toLocaleString('en-IN')}{unit}</span>
                    </p>
                    <p className="font-bold flex items-center justify-between gap-4 text-slate-200">
                      <span>Target:</span>
                      <span className="text-slate-400 font-black">{prefix}{targetVal.toLocaleString('en-IN')}{unit}</span>
                    </p>
                    <p className="font-black border-t border-slate-800 pt-1 flex items-center justify-between gap-4">
                      <span className="text-slate-300">Achievement:</span>
                      <span className="text-nyati-orange">{pct.toFixed(1)}%</span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine 
            y={100} 
            stroke="#475569" 
            strokeDasharray="3 3" 
            strokeWidth={1.5} 
            label={{ value: 'Target', position: 'top', fill: '#475569', fontSize: 8, fontWeight: 800 }} 
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.value >= 100 ? 'url(#salesAchievedGrad)' : '#f97316'} 
              />
            ))}
          </Bar>
        </BarChart>
      </MountedResponsiveContainer>
    </div>
  );
};

// Outstanding line graph representing all 4 KPIs (styled as Area Chart matching the user's Rework Analysis design)
const OutstandingLineChart = ({ collection, outstanding, regOS, ageing120 }) => {
  const data = [
    { name: 'Collection', value: collection, display: `₹${collection.toFixed(2)} Cr` },
    { name: 'Outstanding', value: outstanding, display: `₹${outstanding.toFixed(2)} Cr` },
    { name: 'Registered O/S', value: regOS, display: `₹${regOS.toFixed(2)} Cr` },
    { name: 'Ageing >120D', value: ageing120, display: `₹${ageing120.toFixed(2)} Cr` }
  ];

  return (
    <div className="w-full h-full relative">
      <MountedResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
        >
          <defs>
            <linearGradient id="outstandingAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 9, fontWeight: 800, fill: '#475569' }} 
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9, fontWeight: 700, fill: '#475569' }}
            domain={[0, 'auto']}
            tickFormatter={(val) => `₹${val.toFixed(0)}Cr`}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-slate-900/95 text-white px-3 py-1.5 rounded-xl text-[10px] shadow-xl border border-slate-800">
                    <span className="font-extrabold text-slate-300 uppercase tracking-wider block mb-0.5">{item.name}</span>
                    <span className="font-black text-sm text-white">{item.display}</span>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#6366f1" 
            strokeWidth={3} 
            fillOpacity={1} 
            fill="url(#outstandingAreaGrad)" 
            dot={{ r: 5, strokeWidth: 2, stroke: '#ffffff', fill: '#6366f1' }}
            activeDot={{ r: 7, strokeWidth: 2, fill: '#6366f1', stroke: '#ffffff' }}
          />
        </AreaChart>
      </MountedResponsiveContainer>
    </div>
  );
};

// Construction Budget row graph (horizontal bar chart) representing all 4 KPIs
const ConstructionRowChart = ({ target, achieved, variance, efficiency }) => {
  // Normalize values to percentage of Target Planned for horizontal rendering scale
  const targetPct = 100;
  const achievedPct = target > 0 ? (achieved / target) * 100 : 0;
  const variancePct = target > 0 ? (variance / target) * 100 : 0;
  const efficiencyPct = efficiency;

  const data = [
    { name: 'Target Planned', pct: targetPct, display: `₹${target.toFixed(2)} Cr`, color: '#64748b' },
    { name: 'Achieved Value', pct: achievedPct, display: `₹${achieved.toFixed(2)} Cr (${achievedPct.toFixed(1)}%)`, color: '#4f46e5' },
    { name: 'Variance', pct: variancePct, display: `₹${variance.toFixed(2)} Cr (${variancePct.toFixed(1)}%)`, color: target >= achieved ? '#14b8a6' : '#f43f5e' },
    { name: 'Efficiency', pct: efficiencyPct, display: `${efficiency.toFixed(1)}%`, color: '#8b5cf6' }
  ];

  // Custom SVG text renderer to place values statically to the right of each bar
  const renderCustomBarLabel = ({ x, y, width, height, index }) => {
    const item = data[index];
    return (
      <text 
        x={x + width + 8} 
        y={y + height / 2 + 4} 
        fill="#334155" 
        fontSize={10} 
        fontWeight={800}
        className="font-sans"
      >
        {item.display}
      </text>
    );
  };

  return (
    <div className="w-full h-full relative">
      <MountedResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 10, right: 110, left: 10, bottom: 5 }}
        >
          <XAxis type="number" hide domain={[0, 100]} />
          <YAxis 
            dataKey="name" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 9, fontWeight: 800, fill: '#475569' }}
            width={95}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-slate-900/95 text-white px-3 py-1.5 rounded-xl text-[10px] shadow-xl border border-slate-800">
                    <span className="font-extrabold text-slate-300 uppercase tracking-wider block mb-0.5">{item.name}</span>
                    <span className="font-black text-sm text-white">{item.display}</span>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="pct" radius={[0, 4, 4, 0]} barSize={24} label={renderCustomBarLabel}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </MountedResponsiveContainer>
    </div>
  );
};

// Project Portfolio Pie chart representing all 4 KPIs (with inside percentage labels and right-aligned legend matching user mockup)
const PortfolioPieChart = ({ activeProjects, totalInventory, totalUnsold, avgCompletion }) => {
  const data = [
    { name: 'Active Projects', value: activeProjects, display: `${activeProjects} Projects`, fill: '#1f77b4' }, // D3 Blue
    { name: 'Total Inventory', value: totalInventory, display: `${totalInventory.toLocaleString('en-IN')} Units`, fill: '#cbd5e1' }, // Default gray (or we can use Red: #d62728, but let's use red)
    { name: 'Unsold Balance', value: totalUnsold, display: `${totalUnsold.toLocaleString('en-IN')} Units`, fill: '#ff7f0e' }, // D3 Orange
    { name: 'Avg Completion', value: parseFloat(avgCompletion.toFixed(1)), display: `${avgCompletion.toFixed(1)}%`, fill: '#2ca02c' } // D3 Green
  ];

  // Adjust Total Inventory color to Red to match D3 style
  data[1].fill = '#d62728';

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central" 
        fontSize={10} 
        fontWeight="black"
        className="font-sans select-none"
      >
        {percent > 0.03 ? `${(percent * 100).toFixed(1)}%` : ''}
      </text>
    );
  };

  return (
    <div className="w-full h-full relative">
      <MountedResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 10, right: 10, left: -25, bottom: 10 }}>
          <Pie
            data={data}
            cx="40%"
            cy="50%"
            outerRadius="85%"
            dataKey="value"
            label={renderCustomizedLabel}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const entry = payload[0].payload;
                return (
                  <div className="bg-slate-900/95 text-white px-3 py-1.5 rounded-xl text-[10px] shadow-xl border border-slate-800 space-y-0.5">
                    <span className="font-extrabold text-slate-300 uppercase tracking-wider block">{entry.name}</span>
                    <span className="font-black text-[11px] text-white">{entry.display}</span>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend 
            layout="vertical" 
            align="right" 
            verticalAlign="middle" 
            iconType="square"
            iconSize={8}
            wrapperStyle={{ 
              fontSize: '9px', 
              fontWeight: 800, 
              color: '#334155',
              paddingLeft: '15px'
            }}
          />
        </PieChart>
      </MountedResponsiveContainer>
    </div>
  );
};

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
  const grandTotalRegOS = filteredProjects.reduce((s, p) => s + p.registeredOS, 0);
  const grandTotalUnregOS = filteredProjects.reduce((s, p) => s + p.unregisteredOS, 0);
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
    <motion.div 
      variants={container} 
      initial="hidden" 
      animate="show" 
      className="flex flex-col h-[calc(100vh-110px)] gap-4 pb-4 overflow-hidden select-none"
    >

      {/* Page Title */}
      <motion.div variants={item} className="flex-shrink-0">
        <h2 className="text-2xl font-black text-nyati-navy">Dashboard Overview</h2>
        <p className="text-slate-600 text-xs mt-1">
          Consolidated snapshot across all sections — Sales, Outstanding, Construction & Portfolio.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-1 min-h-0">

        {/* ── SECTION 1: SALES & COLLECTION ────────────────────────── */}
        <motion.div 
          variants={item}
          className="bg-white rounded-3xl shadow-premium border border-slate-100 flex flex-col h-full overflow-hidden"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-100 bg-gradient-to-r from-nyati-navy/5 to-transparent flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-nyati-orange/10 rounded-xl">
                <LayoutDashboard className="w-4 h-4 text-nyati-orange" />
              </div>
              <div>
                <h3 className="font-bold text-nyati-navy text-sm">Sales & Collection</h3>
                <p className="text-slate-600 text-[10px] mt-0.5">FY actuals vs budget targets</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/sales-collection')}
              className="flex items-center gap-1.5 text-[11px] font-bold text-nyati-orange hover:text-nyati-navy transition-colors"
            >
              View Full <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 p-4 gap-4 min-h-0 items-center justify-between">
            {/* Left Side: Stacking list of 4 metric rows */}
            <div className="w-full md:w-[280px] xl:w-[320px] flex-shrink-0 flex flex-col gap-1.5 justify-center">
              <OverviewMetricRow 
                label="Units Sold" 
                actual={totals.soldToDate} 
                budget={totals.budgetUnits} 
                decimals={0} 
                status={unitsEff >= 100 ? 'On Target' : unitsEff >= 70 ? 'Progressing' : 'Critical'} 
                icon={ClipboardList} 
              />
              <OverviewMetricRow 
                label="Avg Rate" 
                actual={totals.actualRate} 
                budget={totals.budgetRate} 
                prefix="₹" 
                suffix="/sf" 
                decimals={0} 
                status={rateEff >= 100 ? 'On Target' : rateEff >= 70 ? 'Progressing' : 'Critical'} 
                icon={IndianRupee} 
              />
              <OverviewMetricRow 
                label="Saleable Area" 
                actual={totals.actualArea} 
                budget={totals.budgetArea} 
                suffix=" sf" 
                decimals={0} 
                status={areaEff >= 100 ? 'On Target' : areaEff >= 70 ? 'Progressing' : 'Critical'} 
                icon={Maximize} 
              />
              <OverviewMetricRow 
                label="Total Collection" 
                actual={totals.actualCollection} 
                budget={totals.budgetCollection} 
                prefix="₹" 
                suffix=" Cr" 
                decimals={2} 
                status={collectionEff >= 100 ? 'On Target' : collectionEff >= 70 ? 'Progressing' : 'Critical'} 
                icon={CreditCard} 
              />
            </div>

            {/* Right Side: Sales Combo Chart */}
            <div className="flex-1 w-full h-full min-h-0 md:pl-4">
              <SalesComboChart 
                data={[
                  { name: 'Units', value: unitsEff, rawActual: totals.soldToDate, rawTarget: totals.budgetUnits, unit: ' units' },
                  { name: 'Rate', value: rateEff, rawActual: totals.actualRate, rawTarget: totals.budgetRate, prefix: '₹', unit: '/sf' },
                  { name: 'Area', value: areaEff, rawActual: totals.actualArea, rawTarget: totals.budgetArea, unit: ' sf' },
                  { name: 'Collection', value: collectionEff, rawActual: totals.actualCollection, rawTarget: totals.budgetCollection, prefix: '₹', unit: ' Cr' }
                ]} 
              />
            </div>
          </div>
        </motion.div>

        {/* ── SECTION 2: OUTSTANDING ────────────────────────── */}
        <motion.div 
          variants={item}
          className="bg-white rounded-3xl shadow-premium border border-slate-100 flex flex-col h-full overflow-hidden"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-100 bg-gradient-to-r from-nyati-navy/5 to-transparent flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-sky-500/10 rounded-xl">
                <BarChart3 className="w-4 h-4 text-sky-500" />
              </div>
              <div>
                <h3 className="font-bold text-nyati-navy text-sm">Outstanding</h3>
                <p className="text-slate-600 text-[10px] mt-0.5">Consolidated dues, collections, and ageing matrix</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/outstanding')}
              className="flex items-center gap-1.5 text-[11px] font-bold text-nyati-orange hover:text-nyati-navy transition-colors"
            >
              View Full <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 p-4 gap-4 min-h-0 items-center justify-between">
            {/* Left Side: Stacking list of 4 metric rows */}
            <div className="w-full md:w-[280px] xl:w-[320px] flex-shrink-0 flex flex-col gap-1.5 justify-center">
              <OverviewMetricRow 
                label="Total Outstanding" 
                actual={grandTotalOutstanding} 
                prefix="₹" 
                suffix=" Cr" 
                decimals={2} 
                status="Critical" 
                icon={Landmark} 
              />
              <OverviewMetricRow 
                label="Total Collection" 
                actual={grandTotalCollection} 
                prefix="₹" 
                suffix=" Cr" 
                decimals={2} 
                status="On Target" 
                icon={CreditCard} 
              />
              <OverviewMetricRow 
                label="Registered O/S" 
                actual={grandTotalRegOS} 
                prefix="₹" 
                suffix=" Cr" 
                decimals={2} 
                status="Progressing" 
                icon={Activity} 
              />
              <OverviewMetricRow 
                label="Ageing >120 Days" 
                actual={grandAgeingGt120} 
                prefix="₹" 
                suffix=" Cr" 
                decimals={2} 
                status="Critical" 
                icon={AlertTriangle} 
              />
            </div>

            {/* Right Side: Outstanding Line Chart */}
            <div className="flex-1 w-full h-full min-h-0 md:pl-4">
              <OutstandingLineChart 
                collection={grandTotalCollection} 
                outstanding={grandTotalOutstanding} 
                regOS={grandTotalRegOS} 
                ageing120={grandAgeingGt120} 
              />
            </div>
          </div>
        </motion.div>

        {/* ── SECTION 3: CONSTRUCTION BUDGET ────────────────────────── */}
        <motion.div 
          variants={item}
          className="bg-white rounded-3xl shadow-premium border border-slate-100 flex flex-col h-full overflow-hidden"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-100 bg-gradient-to-r from-nyati-navy/5 to-transparent flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-nyati-orange/10 rounded-xl">
                <Hammer className="w-4 h-4 text-nyati-orange" />
              </div>
              <div>
                <h3 className="font-bold text-nyati-navy text-sm">Construction Budget</h3>
                <p className="text-slate-600 text-[10px] mt-0.5">Target planned vs achieved construction costs and progress</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/construction-budget')}
              className="flex items-center gap-1.5 text-[11px] font-bold text-nyati-orange hover:text-nyati-navy transition-colors"
            >
              View Full <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 p-4 gap-4 min-h-0 items-center justify-between">
            {/* Left Side: Stacking list of 4 metric rows */}
            <div className="w-full md:w-[280px] xl:w-[320px] flex-shrink-0 flex flex-col gap-1.5 justify-center">
              <OverviewMetricRow 
                label="Target Planned" 
                actual={grandConstTarget} 
                prefix="₹" 
                suffix=" Cr" 
                decimals={2} 
                status="On Target" 
                icon={ClipboardList} 
              />
              <OverviewMetricRow 
                label="Achieved Value" 
                actual={grandConstAchieved} 
                prefix="₹" 
                suffix=" Cr" 
                decimals={2} 
                status="Progressing" 
                icon={Landmark} 
              />
              <OverviewMetricRow 
                label="Variance" 
                actual={Math.abs(grandConstTarget - grandConstAchieved)} 
                prefix="₹" 
                suffix=" Cr" 
                decimals={2} 
                status={grandConstTarget - grandConstAchieved >= 0 ? 'On Target' : 'Critical'} 
                icon={TrendingDown} 
              />
              <OverviewMetricRow 
                label="Efficiency" 
                actual={constEff} 
                suffix="%" 
                decimals={1} 
                status={constEff >= 100 ? 'On Target' : constEff >= 70 ? 'Progressing' : 'Critical'} 
                icon={Hammer} 
              />
            </div>

            {/* Right Side: Construction Row Chart */}
            <div className="flex-1 w-full h-full min-h-0 md:pl-4">
              <ConstructionRowChart 
                target={grandConstTarget} 
                achieved={grandConstAchieved} 
                variance={grandConstTarget - grandConstAchieved} 
                efficiency={constEff} 
              />
            </div>
          </div>
        </motion.div>

        {/* ── SECTION 4: PROJECT PORTFOLIO ────────────────────────── */}
        <motion.div 
          variants={item}
          className="bg-white rounded-3xl shadow-premium border border-slate-100 flex flex-col h-full overflow-hidden"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-100 bg-gradient-to-r from-nyati-navy/5 to-transparent flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-emerald-500/10 rounded-xl">
                <Layers className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-nyati-navy text-sm">Project Portfolio</h3>
                <p className="text-slate-600 text-[10px] mt-0.5">Inventory funnel & construction completion</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/portfolio')}
              className="flex items-center gap-1.5 text-[11px] font-bold text-nyati-orange hover:text-nyati-navy transition-colors"
            >
              View Full <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 p-4 gap-4 min-h-0 items-center justify-between">
            {/* Left Side: Stacking list of 4 metric rows */}
            <div className="w-full md:w-[280px] xl:w-[320px] flex-shrink-0 flex flex-col gap-1.5 justify-center">
              <OverviewMetricRow 
                label="Active Projects" 
                actual={filteredProjects.length} 
                decimals={0} 
                status="On Target" 
                icon={Activity} 
              />
              <OverviewMetricRow 
                label="Total Inventory" 
                actual={totalInventory} 
                suffix=" units" 
                decimals={0} 
                status="Progressing" 
                icon={ClipboardList} 
              />
              <OverviewMetricRow 
                label="Unsold Balance" 
                actual={totalUnsold} 
                suffix=" units" 
                decimals={0} 
                status="Progressing" 
                icon={TrendingDown} 
              />
              <OverviewMetricRow 
                label="Avg Completion" 
                actual={avgCompletion} 
                suffix="%" 
                decimals={1} 
                status={avgCompletion >= 90 ? 'On Target' : avgCompletion >= 60 ? 'Progressing' : 'Critical'} 
                icon={CheckCircle} 
              />
            </div>

            {/* Right Side: Portfolio Pie Chart */}
            <div className="flex-1 w-full h-full min-h-0 md:pl-4">
              <PortfolioPieChart 
                activeProjects={filteredProjects.length} 
                totalInventory={totalInventory} 
                totalUnsold={totalUnsold} 
                avgCompletion={avgCompletion} 
              />
            </div>
          </div>
        </motion.div>

      </div>

    </motion.div>
  );
}