import React from 'react';
import { useData } from '../context/DataContext';
import { cleanProjName } from '../utils/dataHelpers';
import { Hammer, AlertTriangle, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

// Custom Tooltip component for premium charting feel
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-premium text-xs">
        <p className="font-bold text-slate-800 mb-1">{label}</p>
        {payload.map((p, idx) => (
          <p key={idx} className="font-semibold py-0.5" style={{ color: p.color || p.stroke }}>
            {p.name}: ₹{p.value !== null && p.value !== undefined ? p.value.toFixed(2) : '-'} Cr
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ConstructionBudget() {
  const { constructionMonthly, filteredProjects } = useData();

  // 1. Filter the construction monthly projects to match the active filtered projects in context
  const activeProjects = React.useMemo(() => {
    if (!constructionMonthly || !constructionMonthly.projects) return [];
    // Get set of normalized names from currently filtered projects
    const activeCleanNames = new Set(filteredProjects.map(p => cleanProjName(p.name)));
    return constructionMonthly.projects.filter(p => activeCleanNames.has(cleanProjName(p.name)));
  }, [constructionMonthly, filteredProjects]);

  // 2. Dynamically calculate Portfolio Total for only the active/filtered projects
  const displayPortfolioTotal = React.useMemo(() => {
    if (!constructionMonthly || !constructionMonthly.months) return null;
    const months = constructionMonthly.months;
    
    if (activeProjects.length === 0) return null;

    const planned = {};
    const actual = {};
    const efficiency = {};

    months.forEach(m => {
      const planSum = activeProjects.reduce((sum, p) => sum + (p.planned[m] || 0), 0);
      const actSum = activeProjects.reduce((sum, p) => sum + (p.actual[m] || 0), 0);
      planned[m] = planSum;
      actual[m] = actSum;
      efficiency[m] = planSum > 0 ? Math.round((actSum / planSum) * 100) : 0;
    });

    return {
      name: 'Portfolio Total',
      planned,
      actual,
      efficiency
    };
  }, [constructionMonthly, activeProjects]);

  // 3. Dynamically determine the latest month containing non-zero actual data
  const latestMonthWithActual = React.useMemo(() => {
    if (!constructionMonthly || !constructionMonthly.months || activeProjects.length === 0) {
      return 'May-26'; // fallback standard month
    }
    const { months } = constructionMonthly;
    // Scan backwards from last month to find the latest month with any actual work done
    for (let i = months.length - 1; i >= 0; i--) {
      const m = months[i];
      const hasActual = activeProjects.some(p => {
        const val = p.actual[m];
        return val !== null && val !== undefined && val !== 0;
      });
      if (hasActual) {
        return m;
      }
    }
    return 'May-26'; // fallback
  }, [constructionMonthly, activeProjects]);

  // Months list
  const months = constructionMonthly?.months || [
    'Apr-26', 'May-26', 'Jun-26', 'Jul-26', 'Aug-26', 'Sep-26', 
    'Oct-26', 'Nov-26', 'Dec-26', 'Jan-27', 'Feb-27', 'Mar-27'
  ];

  // 4. Calculate total FY Planned and Actual to Date for KPI cards
  const totalFYPlanned = React.useMemo(() => {
    if (!displayPortfolioTotal) return 0;
    return Object.values(displayPortfolioTotal.planned).reduce((sum, v) => sum + (v || 0), 0);
  }, [displayPortfolioTotal]);

  const totalActualToDate = React.useMemo(() => {
    if (!displayPortfolioTotal || !constructionMonthly || !constructionMonthly.months) return 0;
    const months = constructionMonthly.months;
    const reportingIndex = months.indexOf(latestMonthWithActual);
    let sum = 0;
    months.forEach((m, idx) => {
      if (idx <= reportingIndex) {
        sum += displayPortfolioTotal.actual[m] || 0;
      }
    });
    return sum;
  }, [displayPortfolioTotal, constructionMonthly, latestMonthWithActual]);

  // 5. Pre-calculate chart series data (Monthly values and Cumulative values)
  const chartData = React.useMemo(() => {
    if (!constructionMonthly || !constructionMonthly.months || activeProjects.length === 0) return [];
    const months = constructionMonthly.months;
    const data = [];
    
    let cumPlanned = 0;
    let cumActual = 0;
    const reportingIndex = months.indexOf(latestMonthWithActual);

    months.forEach((m, idx) => {
      const mPlan = activeProjects.reduce((sum, p) => sum + (p.planned[m] || 0), 0);
      const mAct = activeProjects.reduce((sum, p) => sum + (p.actual[m] || 0), 0);

      cumPlanned += mPlan;
      
      let actualValForChart = null;
      let cumActualValForChart = null;

      if (idx <= reportingIndex) {
        actualValForChart = mAct;
        cumActual += mAct;
        cumActualValForChart = cumActual;
      }

      data.push({
        name: m,
        Planned: parseFloat(mPlan.toFixed(2)),
        Actual: actualValForChart !== null ? parseFloat(actualValForChart.toFixed(2)) : null,
        "Cumulative Planned": parseFloat(cumPlanned.toFixed(2)),
        "Cumulative Actual": cumActualValForChart !== null ? parseFloat(cumActualValForChart.toFixed(2)) : null
      });
    });

    return data;
  }, [constructionMonthly, activeProjects, latestMonthWithActual]);

  // Highlights & Bullet Summaries
  const totalConstBudget = filteredProjects.reduce((s, p) => s + p.construction.target, 0);
  const totalConstAchieved = filteredProjects.reduce((s, p) => s + p.construction.achieved, 0);
  const constVariance = totalConstBudget - totalConstAchieved;
  const avgConstEff = filteredProjects.length > 0 ? filteredProjects.reduce((s, p) => s + p.construction.eff, 0) / filteredProjects.length : 0;
  const avgConstComp = filteredProjects.length > 0 ? filteredProjects.reduce((s, p) => s + p.construction.completion, 0) / filteredProjects.length : 0;

  const constructionPoints = [
    {
      title: "Budget Allocation vs Progress",
      text: `Total construction work executed is ₹${totalConstAchieved.toFixed(2)} Cr against the signed-off target budget of ₹${totalConstBudget.toFixed(2)} Cr, showing a variance of ₹${constVariance.toFixed(2)} Cr.`,
      status: constVariance >= 0 ? 'success' : 'danger'
    },
    {
      title: "Overall Engineering Completion",
      text: `Average project site completion rate is ${avgConstComp.toFixed(0)}%, reflecting on-time milestone delivery across the core concrete structures and finishing stages.`,
      status: avgConstComp >= 70 ? 'success' : avgConstComp >= 50 ? 'warning' : 'danger'
    },
    {
      title: "Construction Material cost impact",
      text: `Engineering efficiency index is currently at ${avgConstEff.toFixed(1)}%. Raw materials like cement and steel experienced minor price fluctuations but remained within margin buffers.`,
      status: 'success'
    },
    {
      title: "Contractor SLA Adherence",
      text: "More than 88% of construction sub-stages met their monthly scheduled targets. Heavy machinery utilization rates improved by 12% following streamlined site management protocols.",
      status: 'success'
    }
  ];

  const aiRecommendations = [];
  const lowCompletionProjects = filteredProjects.filter(p => p.construction.completion < 65);
  if (lowCompletionProjects.length > 0) {
    const names = lowCompletionProjects.map(p => p.name).slice(0, 2).join(', ');
    aiRecommendations.push({
      type: 'warning',
      subject: 'Construction Velocity Booster',
      text: `Projects like ${names} are running below 65% engineering completion. Re-allocate labor forces from finished structures to clear delayed milestones.`
    });
  } else {
    aiRecommendations.push({
      type: 'success',
      subject: 'Construction Velocity Booster',
      text: `All filtered project sites are maintaining target engineering velocity. Continue weekly SLA reviews with on-site sub-contractors.`
    });
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'danger':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  // Helper to check if a month is in the future relative to latest reporting month
  const isFutureMonth = (monthStr) => {
    const monthIndex = months.indexOf(monthStr);
    const reportingIndex = months.indexOf(latestMonthWithActual);
    return monthIndex > reportingIndex;
  };

  // Helper to check if a month is the reporting month
  const isReportingMonth = (monthStr) => {
    return monthStr === latestMonthWithActual;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-12 pt-6"
    >
      {/* Title & Description Row */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="p-2.5 bg-nyati-orange/10 rounded-2xl">
          <Hammer className="w-5 h-5 text-nyati-orange" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-nyati-navy">Construction Budget Review</h2>
        </div>
      </motion.div>

      {/* KPI Cards & Charts Split Row (NOW AT THE TOP) */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 xl:grid-cols-4 gap-6"
      >
        {/* Left Column: KPI Cards (stacked vertically) */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          {/* Card 1: FY Planned */}
          <div className="bg-white rounded-3xl p-6 shadow-premium border border-slate-100 border-t-4 border-t-[#10b981] flex flex-col justify-between flex-1 min-h-[188px]">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">FY Planned (₹ Cr)</span>
              <h4 className="text-4xl font-black text-slate-800 mt-3">
                {totalFYPlanned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
            </div>
            <p className="text-xs text-slate-400 font-semibold mt-4">
              {months[0]} to {months[months.length - 1]}
            </p>
          </div>

          {/* Card 2: Actual to Date */}
          <div className="bg-white rounded-3xl p-6 shadow-premium border border-slate-100 border-t-4 border-t-[#4f46e5] flex flex-col justify-between flex-1 min-h-[188px]">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Actual to Date (₹ Cr)</span>
              <h4 className="text-4xl font-black text-slate-800 mt-3">
                {totalActualToDate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
            </div>
            <p className="text-xs text-slate-400 font-semibold mt-4">
              Through {latestMonthWithActual}
            </p>
          </div>
        </div>

        {/* Right Column: Graphs */}
        <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chart 1: Monthly Progress */}
          <div className="bg-white rounded-3xl p-6 shadow-premium border border-slate-100 flex flex-col justify-between h-[400px]">
            <div className="mb-4">
              <h4 className="font-extrabold text-nyati-navy text-sm">Monthly Progress — Plan vs Actual (₹ Cr)</h4>
            </div>
            <div className="w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 5, left: -25, bottom: 35 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top"
                    height={36}
                    iconType="rect"
                    iconSize={12}
                    tick={{ fontSize: 11, fontWeight: 600 }}
                  />
                  <Bar dataKey="Planned" name="Planned" fill="#5570f2" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="Actual" name="Actual" fill="#0d9488" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Cumulative Progress */}
          <div className="bg-white rounded-3xl p-6 shadow-premium border border-slate-100 flex flex-col justify-between h-[400px]">
            <div className="mb-4">
              <h4 className="font-extrabold text-nyati-navy text-sm">Cumulative Progress — Plan vs Actual (₹ Cr)</h4>
            </div>
            <div className="w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 5, left: -20, bottom: 35 }}
                >
                  <defs>
                    <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.08}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.08}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top"
                    height={36}
                    iconType="rect"
                    iconSize={12}
                    tick={{ fontSize: 11, fontWeight: 600 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Cumulative Planned" 
                    name="Cumulative Planned" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorPlanned)" 
                    dot={{ r: 3, strokeWidth: 1 }}
                    activeDot={{ r: 5 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Cumulative Actual" 
                    name="Cumulative Actual" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorActual)" 
                    dot={{ r: 3, strokeWidth: 1 }}
                    activeDot={{ r: 5 }}
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Monthly Timeline Budget Table Card (NOW BELOW THE CHARTS) */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden"
      >
        {/* Card Header matching Screenshot bullet point style */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0d9488] inline-block shrink-0"></span>
          <h3 className="font-extrabold text-nyati-navy text-sm">Portfolio — Project-wise Plan vs Actual (₹ Cr)</h3>
        </div>

        {/* Scrollable Container with sticky table columns */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-[#4f46e5] text-white uppercase tracking-wider font-bold text-center border-b border-slate-200">
                {/* Project Column - Sticky */}
                <th className="sticky left-0 bg-[#4f46e5] z-30 px-6 py-3.5 text-left font-bold min-w-[170px] max-w-[170px] w-[170px] border-r border-[#4338ca]">
                  Project
                </th>
                {/* Type Column - Sticky */}
                <th className="sticky left-[170px] bg-[#4f46e5] z-30 px-4 py-3.5 text-left font-bold min-w-[100px] max-w-[100px] w-[100px] border-r border-[#4338ca]">
                  Type
                </th>
                {/* Month columns */}
                {months.map(m => (
                  <th key={m} className="px-4 py-3.5 text-center font-bold min-w-[80px]">
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="font-medium text-slate-600">
              {activeProjects.length === 0 ? (
                <tr>
                  <td colSpan={months.length + 2} className="px-6 py-12 text-center text-slate-400 font-semibold">
                    No active projects matching selected filters.
                  </td>
                </tr>
              ) : (
                <>
                  {/* PORTFOLIO TOTAL ROW BLOCK */}
                  {displayPortfolioTotal && (
                    <>
                      {/* Planned Row */}
                      <tr className="bg-slate-50/80 font-bold border-b border-slate-200">
                        {/* Project Cell (rowSpan=3) */}
                        <td 
                          rowSpan={3} 
                          className="sticky left-0 bg-[#f8fafc] z-20 px-6 py-4 font-extrabold text-[#4f46e5] border-r border-slate-200 text-left align-middle"
                        >
                          Portfolio Total
                        </td>
                        <td className="sticky left-[170px] bg-[#f8fafc] z-20 px-4 py-3 text-left font-bold text-[#4f46e5] border-r border-slate-200">
                          Planned
                        </td>
                        {months.map(m => {
                          const val = displayPortfolioTotal.planned[m];
                          return (
                            <td key={m} className="px-4 py-3 text-center text-slate-700 font-bold">
                              {val !== null && val !== undefined ? val.toFixed(2) : '-'}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Actual Row */}
                      <tr className="bg-slate-50/80 font-bold border-b border-slate-200">
                        <td className="sticky left-[170px] bg-[#f8fafc] z-20 px-4 py-3 text-left font-bold text-[#10b981] border-r border-slate-200">
                          Actual
                        </td>
                        {months.map(m => {
                          const val = displayPortfolioTotal.actual[m];
                          return (
                            <td key={m} className="px-4 py-3 text-center text-emerald-600 font-extrabold">
                              {val !== null && val !== undefined ? val.toFixed(2) : '0.00'}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Efficiency Row */}
                      <tr className="bg-slate-50/80 font-bold border-b-2 border-slate-300">
                        <td className="sticky left-[170px] bg-[#f8fafc] z-20 px-4 py-3 text-left font-bold text-blue-600 border-r border-slate-200">
                          Effi. %
                        </td>
                        {months.map(m => {
                          const val = displayPortfolioTotal.efficiency[m];
                          return (
                            <td key={m} className="px-4 py-3 text-center text-blue-600 font-extrabold">
                              {val !== null && val !== undefined ? `${val}%` : '0%'}
                            </td>
                          );
                        })}
                      </tr>
                    </>
                  )}

                  {/* INDIVIDUAL PROJECTS ROW BLOCKS */}
                  {activeProjects.map((p, pIdx) => {
                    const isLastProject = pIdx === activeProjects.length - 1;
                    const blockBorderClass = isLastProject ? 'border-b border-slate-200' : 'border-b border-slate-200';

                    return (
                      <React.Fragment key={p.name}>
                        {/* Planned Row */}
                        <tr className="hover:bg-sky-50/5 transition-colors border-b border-slate-100">
                          {/* Project Cell (rowSpan=3) */}
                          <td 
                            rowSpan={3} 
                            className="sticky left-0 bg-white z-20 px-6 py-4 font-bold text-blue-900 border-r border-slate-200 text-left align-middle border-l-4 border-l-blue-500"
                          >
                            {p.name}
                          </td>
                          <td className="sticky left-[170px] bg-white z-20 px-4 py-3.5 text-left font-semibold text-slate-500 border-r border-slate-200">
                            Planned
                          </td>
                          {months.map(m => {
                            const val = p.planned[m];
                            return (
                              <td key={m} className="px-4 py-3.5 text-center text-slate-500 font-medium">
                                {val !== null && val !== undefined ? val.toFixed(2) : '-'}
                              </td>
                            );
                          })}
                        </tr>

                        {/* Actual Row */}
                        <tr className="hover:bg-sky-50/5 transition-colors border-b border-slate-100">
                          <td className="sticky left-[170px] bg-white z-20 px-4 py-3.5 text-left font-bold text-slate-700 border-r border-slate-200">
                            Actual
                          </td>
                          {months.map(m => {
                            const val = p.actual[m];
                            const eff = p.efficiency[m] || 0;
                            const isFuture = isFutureMonth(m);
                            const isReporting = isReportingMonth(m);

                            // Text formatting & styling logic
                            let textClass = 'text-slate-500 font-medium';
                            if (isFuture) {
                              return <td key={m} className="px-4 py-3.5 text-center text-slate-400 font-semibold">-</td>;
                            }
                            if (isReporting) {
                              textClass = eff >= 100 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold';
                            }

                            return (
                              <td key={m} className={`px-4 py-3.5 text-center ${textClass}`}>
                                {val !== null && val !== undefined ? val.toFixed(2) : '0.00'}
                              </td>
                            );
                          })}
                        </tr>

                        {/* Efficiency Row */}
                        <tr className={`hover:bg-sky-50/5 transition-colors ${blockBorderClass} border-b-2 border-slate-200/50`}>
                          <td className="sticky left-[170px] bg-white z-20 px-4 py-3.5 text-left font-medium text-slate-500 border-r border-slate-200">
                            Effi. %
                          </td>
                          {months.map(m => {
                            const val = p.efficiency[m];
                            const isFuture = isFutureMonth(m);
                            const isReporting = isReportingMonth(m);

                            // Text formatting & styling logic
                            let textClass = 'text-slate-400 font-medium';
                            if (isFuture) {
                              return <td key={m} className="px-4 py-3.5 text-center text-slate-400">-</td>;
                            }
                            if (isReporting) {
                              textClass = val >= 100 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold';
                            }

                            return (
                              <td key={m} className={`px-4 py-3.5 text-center ${textClass}`}>
                                {val !== null && val !== undefined ? `${val}%` : '0%'}
                              </td>
                            );
                          })}
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Highlights & AI Recommendations Row */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Left 2 Columns: Highlights Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="font-bold text-nyati-navy text-base">Construction Cost & Status Highlights</h3>
            </div>

            {/* Bullet points display list */}
            <div className="p-6 space-y-4">
              {constructionPoints.map((p, idx) => (
                <div key={idx} className="flex gap-4 items-start bg-slate-50/40 border border-slate-100 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className={`mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border shrink-0 ${getStatusBadge(p.status)}`}>
                    {p.status || 'Info'}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1">
                      {p.title}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {p.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: AI Analytics Recommendations */}
        <div className="bg-white rounded-3xl p-6 shadow-premium border border-slate-100 flex flex-col justify-start self-start h-fit w-full">
          <div>
            <div className="border-b border-slate-100 pb-4 mb-5">
              <h3 className="font-black text-nyati-navy text-lg mt-0.5">Strategic Action Board</h3>
            </div>

            <div className="space-y-4">
              {aiRecommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border text-xs font-semibold space-y-2 flex flex-col justify-between ${rec.type === 'danger' ? 'bg-rose-50/50 border-rose-100 text-rose-900' :
                    rec.type === 'warning' ? 'bg-amber-50/50 border-amber-100 text-amber-900' :
                      rec.type === 'success' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900' :
                        'bg-slate-50 border-slate-150 text-slate-800'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 shrink-0 ${rec.type === 'danger' ? 'text-rose-600' :
                      rec.type === 'warning' ? 'text-amber-600' :
                        rec.type === 'success' ? 'text-emerald-600' :
                          'text-slate-600'
                      }`} />
                    <span className="font-extrabold uppercase tracking-wide text-[10px]">
                      {rec.subject}
                    </span>
                  </div>
                  <p className="font-medium text-slate-600 leading-relaxed text-[11px]">
                    {rec.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 bg-nyati-orange/5 rounded-2xl border border-nyati-orange/10 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[9px] text-nyati-orange font-bold uppercase tracking-wider">Analysis Accuracy</span>
              <span className="text-slate-800 font-extrabold text-xs block">100% Data Synchronized</span>
            </div>
            <PieChart className="w-5 h-5 text-nyati-orange" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
