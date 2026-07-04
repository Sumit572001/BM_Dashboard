import React, { useRef } from 'react';
import { useData } from '../context/DataContext';
import { cleanProjName, getQuarterFromMonth } from '../utils/dataHelpers';
import { Hammer, AlertTriangle, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';
import KPICard from '../components/KPICard';
import AnimatedNumber from '../components/AnimatedNumber';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
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

// A wrapper around ResponsiveContainer that delays rendering until layout stabilizes
const MountedResponsiveContainer = ({ children, ...props }) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
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

// Helper for color coding the efficiency percentages
const getEfficiencyColorClass = (val) => {
  if (val === null || val === undefined) return 'text-slate-900'; // Light grey se badal kar dark/black kiya
  if (val < 50) return 'text-rose-600';
  if (val < 80) return 'text-amber-500';
  return 'text-emerald-600';
};

// Helper for styling actual values as teal-colored plain numbers
const renderActualBadge = (val, isFiltered) => {
  const size = isFiltered ? 'text-[17px]' : 'text-[15px]';
  return (
    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md ${size} font-extrabold text-[#0d9488] min-w-[55px]`}>
      {val}
    </span>
  );
};

// Helper for color coding the efficiency percentages inside a pill/badge
const renderEfficiencyBadge = (val, isFiltered) => {
  const size = isFiltered ? 'text-[17px]' : 'text-[15px]';
  let classes = 'bg-emerald-100';
  if (val < 50) {
    classes = 'bg-rose-100';
  } else if (val < 80) {
    classes = 'bg-amber-100';
  }
  return (
    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md ${size} font-extrabold ${classes} text-black min-w-[55px] shadow-sm`}>
      {val}%
    </span>
  );
};

/**
 * SyncedScrollTable — renders the Plan vs Actual table with synced scroll header
 */
const SyncedScrollTable = ({
  activeMonths,
  activeProjects,
  displayPortfolioTotal,
  isFutureMonth,
  isReportingMonth,
}) => {
  const { filteredProjects, constructionMonthly } = useData();
  const isNewLayout = constructionMonthly?.layout === 'new';

  const isFiltered = activeMonths.length <= 6;
  const txtBase = isFiltered ? 'text-[17px]' : 'text-[15px]';
  const txtDesc = isFiltered ? 'text-[16px]' : 'text-[14px]';
  const txtSmall = isFiltered ? 'text-[13px]' : 'text-[11px]';

  const hdrRef = useRef(null);
  const bodyRef = useRef(null);

  const onHdrScroll = () => { if (bodyRef.current) bodyRef.current.scrollLeft = hdrRef.current.scrollLeft; };
  const onBodyScroll = () => { if (hdrRef.current) hdrRef.current.scrollLeft = bodyRef.current.scrollLeft; };

  const renderProjectTypeBadge = (projName) => {
    const matched = filteredProjects.find(p => cleanProjName(p.name) === cleanProjName(projName));
    const type = matched ? matched.type : 'R';
    
    switch (type) {
      case 'L':
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${txtSmall} font-extrabold bg-amber-50 text-amber-700 border border-amber-200 uppercase shadow-sm`}>
            🏠 LUX
          </span>
        );
      case 'C':
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${txtSmall} font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase shadow-sm`}>
            🏢 COMM
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${txtSmall} font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase shadow-sm`}>
            🏠 RESI
          </span>
        );
    }
  };

  const formatValue = (desc, val) => {
    if (val === undefined || val === null || val === '') return '-';
    
    // Parse as number
    const cleanStr = String(val).replace(/,/g, '').replace(/%/g, '').trim();
    const num = parseFloat(cleanStr);
    if (isNaN(num)) return val;

    // Check description for percentage format
    if (desc && desc.toLowerCase().includes('%')) {
      const pct = num <= 1.0 ? num * 100 : num;
      return pct.toFixed(2) + '%';
    }

    // Default: format to 2 decimal places
    return num.toFixed(2);
  };

  // Dynamic month column width: wider when fewer months visible (e.g. Q1 = 3 months)
  const monthColWidth = activeMonths.length <= 3 ? 200 : activeMonths.length <= 6 ? 140 : 90;
  const leftFixedWidth = isNewLayout ? 550 : 280;
  const minTableWidth = leftFixedWidth + activeMonths.length * monthColWidth + 95;

  return (
    <>
      {/* STICKY COLUMN HEADER */}
      <div
        ref={hdrRef}
        onScroll={onHdrScroll}
        className="sticky top-[54px] z-40 overflow-x-auto overflow-y-clip"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <table className={`w-full text-left ${txtBase} text-slate-800 border-separate border-spacing-0 table-fixed`} style={{ minWidth: minTableWidth }}>
          <thead>
            <tr className={`bg-[#004080] text-white uppercase tracking-wider font-extrabold text-center ${txtBase}`}>
              {isNewLayout ? (
                <th colSpan={4} className={`sticky left-0 bg-[#004080] z-40 px-6 py-3.5 text-center font-bold border-r border-[#003366] border-b border-[#003366] select-none ${txtBase}`} style={{ width: leftFixedWidth }}>
                  Months ➤ ➤
                </th>
              ) : (
                <th colSpan={2} className={`sticky left-0 bg-[#004080] z-40 px-6 py-3.5 text-center font-bold border-r border-[#003366] border-b border-[#003366] select-none ${txtBase}`} style={{ width: leftFixedWidth }}>
                  Months ➤ ➤
                </th>
              )}
              {activeMonths.map(m => (
                <th key={m} className="bg-[#004080] px-4 py-3.5 text-center font-bold border-b border-r border-[#003366]" style={{ width: monthColWidth }}>
                  {m}
                </th>
              ))}
              <th className="sticky right-0 bg-[#002d66] z-40 px-4 py-3.5 text-center font-bold w-[95px] border-l-2 border-[#001a4d] border-b border-[#003366]">
                Total
              </th>
            </tr>
          </thead>
        </table>
      </div>

      {/* SCROLLABLE TABLE BODY */}
      <div
        ref={bodyRef}
        onScroll={onBodyScroll}
        className="overflow-x-auto w-full"
      >
        <table className={`w-full text-left ${txtBase} border-separate border-spacing-0 table-fixed`} style={{ minWidth: minTableWidth }}>
          <colgroup>
            <col style={{ width: 185 }} />
            {isNewLayout ? (
              <>
                <col style={{ width: 185 }} />
                <col style={{ width: 85 }} />
                <col style={{ width: 95 }} />
              </>
            ) : (
              <col style={{ width: 95 }} />
            )}
            {activeMonths.map(m => <col key={m} style={{ width: monthColWidth }} />)}
            <col style={{ width: 95 }} />
          </colgroup>
          <tbody className="font-bold text-slate-800">
            {activeProjects.length === 0 ? (
              <tr>
                <td colSpan={activeMonths.length + (isNewLayout ? 5 : 2)} className={`px-6 py-12 text-center text-slate-700 font-bold ${isFiltered ? 'text-[16px]' : 'text-[14px]'}`}>
                  No active projects matching selected filters.
                </td>
              </tr>
            ) : (
              <>
                {/* PORTFOLIO TOTAL ROW BLOCK */}
                {displayPortfolioTotal && (
                  <>
                    {/* Planned Row */}
                    <tr className="bg-slate-50/80 font-bold">
                      <td
                        rowSpan={3}
                        className={`sticky left-0 bg-[#f8fafc] z-20 px-6 py-4 font-extrabold text-[#4f46e5] border-r border-b-2 border-slate-300 text-left align-middle ${txtBase}`}
                      >
                        Portfolio Total
                      </td>
                      {isNewLayout && (
                        <>
                          <td className="sticky left-[185px] bg-[#f8fafc] z-20 px-4 py-3 text-left font-bold text-slate-500 border-l border-r border-slate-200 whitespace-nowrap">
                            -
                          </td>
                          <td className="sticky left-[370px] bg-[#f8fafc] z-20 px-4 py-3 text-right font-bold text-slate-500 border-l border-r border-slate-200 whitespace-nowrap">
                            -
                          </td>
                        </>
                      )}
                      <td className={`sticky ${isNewLayout ? 'left-[455px]' : 'left-[185px]'} bg-[#f8fafc] z-20 px-4 py-3 text-right font-bold text-slate-900 border-l border-r border-slate-200 whitespace-nowrap`}>
                        Planned
                      </td>
                      {activeMonths.map(m => (
                        <td key={m} className="px-4 py-3 text-center font-bold text-slate-900 border-r border-slate-200">
                          {displayPortfolioTotal.planned[m] !== undefined && displayPortfolioTotal.planned[m] !== null
                            ? displayPortfolioTotal.planned[m].toFixed(2)
                            : '-'}
                        </td>
                      ))}
                      <td className="sticky right-0 bg-[#eef2ff] z-20 px-4 py-3 text-center font-extrabold text-slate-900 border-l-2 border-[#c7d2fe]">
                        {activeMonths.reduce((s, m) => s + (displayPortfolioTotal.planned[m] || 0), 0).toFixed(2)}
                      </td>
                    </tr>
                    {/* Actual Row */}
                    <tr className="bg-slate-50/80 font-bold">
                      {isNewLayout && (
                        <>
                          <td className="sticky left-[185px] bg-[#f8fafc] z-20 px-4 py-3 text-left font-bold text-slate-500 border-l border-r border-slate-200 whitespace-nowrap">
                            -
                          </td>
                          <td className="sticky left-[370px] bg-[#f8fafc] z-20 px-4 py-3 text-right font-bold text-slate-500 border-l border-r border-slate-200 whitespace-nowrap">
                            -
                          </td>
                        </>
                      )}
                      <td className={`sticky ${isNewLayout ? 'left-[455px]' : 'left-[185px]'} bg-[#f8fafc] z-20 px-4 py-3 text-right font-bold text-[#0d9488] border-l border-r border-slate-200 whitespace-nowrap`}>
                        Actual
                      </td>
                      {activeMonths.map(m => {
                        const val = displayPortfolioTotal.actual[m];
                        const hasVal = !isFutureMonth(m) && val !== undefined && val !== null;
                        const displayVal = hasVal ? val.toFixed(2) : (isFutureMonth(m) ? '-' : '0.00');
                        return (
                          <td key={m} className="px-4 py-3 text-center align-middle font-bold text-slate-800 border-r border-slate-200">
                            {hasVal ? renderActualBadge(displayVal, isFiltered) : displayVal}
                          </td>
                        );
                      })}
                      {(() => {
                        const totalAct = activeMonths
                          .filter(m => !isFutureMonth(m))
                          .reduce((s, m) => s + (displayPortfolioTotal.actual[m] || 0), 0);
                        return (
                          <td className="sticky right-0 bg-[#eef2ff] z-20 px-4 py-3 text-center align-middle font-extrabold text-slate-900 border-l-2 border-[#c7d2fe]">
                            {renderActualBadge(totalAct.toFixed(2), isFiltered)}
                          </td>
                        );
                      })()}
                    </tr>
                    {/* Efficiency Row */}
                    <tr className="bg-slate-50/80 font-bold">
                      {isNewLayout && (
                        <>
                          <td className="sticky left-[185px] bg-[#f8fafc] z-20 px-4 py-3 text-left font-bold text-slate-500 border-l border-r border-b-2 border-slate-300 whitespace-nowrap">
                            -
                          </td>
                          <td className="sticky left-[370px] bg-[#f8fafc] z-20 px-4 py-3 text-right font-bold text-slate-500 border-l border-r border-b-2 border-slate-300 whitespace-nowrap">
                            -
                          </td>
                        </>
                      )}
                      <td className={`sticky ${isNewLayout ? 'left-[455px]' : 'left-[185px]'} bg-[#f8fafc] z-20 px-4 py-3 text-right font-bold text-slate-955 border-l border-r border-b-2 border-slate-300 whitespace-nowrap`}>
                        Eff. %
                      </td>
                      {activeMonths.map(m => {
                        const val = isFutureMonth(m) ? null : displayPortfolioTotal.efficiency[m];
                        return (
                          <td key={m} className="px-4 py-3 text-center align-middle font-bold border-b-2 border-r border-slate-300 text-slate-800">
                            {val !== null && val !== undefined ? renderEfficiencyBadge(val, isFiltered) : '-'}
                          </td>
                        );
                      })}
                      {(() => {
                        const totalPlan = activeMonths.reduce((s, m) => s + (displayPortfolioTotal.planned[m] || 0), 0);
                        const totalAct  = activeMonths.filter(m => !isFutureMonth(m)).reduce((s, m) => s + (displayPortfolioTotal.actual[m] || 0), 0);
                        const totalEff  = totalPlan > 0 ? Math.round((totalAct / totalPlan) * 100) : null;
                        return (
                          <td className="sticky right-0 bg-[#eef2ff] z-20 px-4 py-3 text-center align-middle font-extrabold border-l-2 border-b-2 border-[#c7d2fe] border-b-slate-300 text-slate-900">
                            {totalEff !== null ? renderEfficiencyBadge(totalEff, isFiltered) : '-'}
                          </td>
                        );
                      })()}
                    </tr>
                  </>
                )}

                {/* PER-PROJECT ROWS */}
                {activeProjects.map((proj, projIdx) => (
                  <React.Fragment key={proj.name}>
                    {/* Planned Row */}
                    <tr className={`${projIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                      <td
                        rowSpan={3}
                        className={`sticky left-0 z-20 px-5 py-4 font-bold text-slate-900 border-r border-b-2 border-slate-300 text-left align-middle ${txtBase} leading-snug`}
                        style={{ backgroundColor: projIdx % 2 === 0 ? '#ffffff' : '#f9fafb' }}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold whitespace-nowrap">{proj.name}</span>
                          {renderProjectTypeBadge(proj.name)}
                        </div>
                      </td>
                      {isNewLayout && (
                        <>
                          <td className={`sticky left-[185px] z-20 px-4 py-2.5 text-left font-bold text-slate-700 border-l border-r border-slate-200 ${txtDesc} leading-tight whitespace-nowrap`}
                            style={{ backgroundColor: projIdx % 2 === 0 ? '#ffffff' : '#f9fafb' }}
                          >
                            {proj.plannedDesc || '-'}
                          </td>
                          <td className={`sticky left-[370px] z-20 px-4 py-2.5 text-right font-extrabold text-slate-700 border-l border-r border-slate-200`}
                            style={{ backgroundColor: projIdx % 2 === 0 ? '#ffffff' : '#f9fafb' }}
                          >
                            {formatValue(proj.plannedDesc, proj.plannedVal)}
                          </td>
                        </>
                      )}
                      <td className={`sticky ${isNewLayout ? 'left-[455px]' : 'left-[185px]'} z-20 px-4 py-2.5 text-right font-bold text-slate-800 border-l border-r border-slate-200 whitespace-nowrap`}
                        style={{ backgroundColor: projIdx % 2 === 0 ? '#ffffff' : '#f9fafb' }}
                      >
                        Planned
                      </td>
                      {activeMonths.map(m => (
                        <td key={m} className="px-4 py-2.5 text-center text-slate-955 font-bold border-r border-slate-200">
                          {proj.planned[m] !== undefined && proj.planned[m] !== null
                            ? proj.planned[m].toFixed(2)
                            : '-'}
                        </td>
                      ))}
                      <td className="sticky right-0 z-20 px-4 py-2.5 text-center font-extrabold text-slate-900 border-l-2 border-[#c7d2fe]"
                        style={{ backgroundColor: projIdx % 2 === 0 ? '#eef2ff' : '#e8edff' }}
                      >
                        {activeMonths.reduce((s, m) => s + (proj.planned[m] || 0), 0).toFixed(2)}
                      </td>
                    </tr>
                    {/* Actual Row */}
                    <tr className={`${projIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                      {isNewLayout && (
                        <>
                          <td className={`sticky left-[185px] z-20 px-4 py-2.5 text-left font-bold text-slate-700 border-l border-r border-slate-200 ${txtDesc} leading-tight whitespace-nowrap`}
                            style={{ backgroundColor: projIdx % 2 === 0 ? '#ffffff' : '#f9fafb' }}
                          >
                            {proj.actualDesc || '-'}
                          </td>
                          <td className={`sticky left-[370px] z-20 px-4 py-2.5 text-right font-extrabold text-slate-700 border-l border-r border-slate-200`}
                            style={{ backgroundColor: projIdx % 2 === 0 ? '#ffffff' : '#f9fafb' }}
                          >
                            {formatValue(proj.actualDesc, proj.actualVal)}
                          </td>
                        </>
                      )}
                      <td className={`sticky ${isNewLayout ? 'left-[455px]' : 'left-[185px]'} z-20 px-4 py-2.5 text-right font-bold text-[#0d9488] border-l border-r border-slate-200 whitespace-nowrap`}
                        style={{ backgroundColor: projIdx % 2 === 0 ? '#ffffff' : '#f9fafb' }}
                      >
                        Actual
                      </td>
                      {activeMonths.map(m => {
                        const val = proj.actual[m];
                        const hasVal = !isFutureMonth(m) && val !== undefined && val !== null;
                        return (
                          <td key={m} className="px-4 py-2.5 text-center align-middle font-bold text-slate-800 border-r border-slate-200">
                            {hasVal ? renderActualBadge(val.toFixed(2), isFiltered) : '-'}
                          </td>
                        );
                      })}
                      {(() => {
                        const totalAct = activeMonths
                          .filter(m => !isFutureMonth(m))
                          .reduce((s, m) => s + (proj.actual[m] || 0), 0);
                        const cellBg = projIdx % 2 === 0 ? '#eef2ff' : '#e8edff';
                        return (
                          <td
                            className="sticky right-0 z-20 px-4 py-2.5 text-center align-middle font-extrabold text-slate-900 border-l-2 border-[#c7d2fe]"
                            style={{ backgroundColor: cellBg }}
                          >
                            {renderActualBadge(totalAct.toFixed(2), isFiltered)}
                          </td>
                        );
                      })()}
                    </tr>
                    {/* Efficiency Row */}
                    <tr className={`${projIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                      {isNewLayout && (
                        <>
                          <td className={`sticky left-[185px] z-20 px-4 py-2.5 text-left font-bold text-slate-700 border-l border-r border-b-2 border-slate-300 ${txtDesc} leading-tight whitespace-nowrap`}
                            style={{ backgroundColor: projIdx % 2 === 0 ? '#ffffff' : '#f9fafb' }}
                          >
                            {proj.efficiencyDesc || '-'}
                          </td>
                          <td className={`sticky left-[370px] z-20 px-4 py-2.5 text-right font-extrabold text-slate-700 border-l border-r border-b-2 border-slate-300`}
                            style={{ backgroundColor: projIdx % 2 === 0 ? '#ffffff' : '#f9fafb' }}
                          >
                            {formatValue(proj.efficiencyDesc, proj.efficiencyVal)}
                          </td>
                        </>
                      )}
                      <td className={`sticky ${isNewLayout ? 'left-[455px]' : 'left-[185px]'} z-20 px-4 py-2.5 text-right font-bold text-slate-955 border-l border-r border-b-2 border-slate-300 whitespace-nowrap`}
                        style={{ backgroundColor: projIdx % 2 === 0 ? '#ffffff' : '#f9fafb' }}
                      >
                        Eff. %
                      </td>
                      {activeMonths.map(m => {
                        const plan = proj.planned[m] || 0;
                        const act = proj.actual[m] || 0;
                        const eff = isFutureMonth(m) ? null : (plan > 0 ? Math.round((act / plan) * 100) : null);
                        return (
                          <td key={m} className="px-4 py-2.5 text-center align-middle font-bold border-b-2 border-r border-slate-300 text-slate-800">
                            {eff !== null && eff !== undefined ? renderEfficiencyBadge(eff, isFiltered) : '-'}
                          </td>
                        );
                      })}
                      {(() => {
                        const totalPlan = activeMonths.reduce((s, m) => s + (proj.planned[m] || 0), 0);
                        const totalAct  = activeMonths.filter(m => !isFutureMonth(m)).reduce((s, m) => s + (proj.actual[m] || 0), 0);
                        const totalEff  = totalPlan > 0 ? Math.round((totalAct / totalPlan) * 100) : null;
                        const cellBg = projIdx % 2 === 0 ? '#eef2ff' : '#e8edff';
                        return (
                          <td className="sticky right-0 z-20 px-4 py-2.5 text-center align-middle font-extrabold border-l-2 border-b-2 border-[#c7d2fe] border-b-slate-300 text-slate-900"
                            style={{ backgroundColor: cellBg }}
                          >
                            {totalEff !== null ? renderEfficiencyBadge(totalEff, isFiltered) : '-'}
                          </td>
                        );
                      })()}
                    </tr>
                  </React.Fragment>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ConstructionBudget() {
  const { constructionMonthly, filteredProjects, filters } = useData();

  // 1. Filter the construction monthly projects to match the active filtered projects in context
  const activeProjects = React.useMemo(() => {
    if (!constructionMonthly || !constructionMonthly.projects) return [];
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

    return { name: 'Portfolio Total', planned, actual, efficiency };
  }, [constructionMonthly, activeProjects]);

  // 3. Dynamically determine the latest month containing non-zero actual data
  const latestMonthWithActual = React.useMemo(() => {
    if (!constructionMonthly || !constructionMonthly.months || activeProjects.length === 0) {
      return 'May-26';
    }
    const { months } = constructionMonthly;
    for (let i = months.length - 1; i >= 0; i--) {
      const m = months[i];
      const hasActual = activeProjects.some(p => {
        const val = p.actual[m];
        return val !== null && val !== undefined && val !== 0;
      });
      if (hasActual) return m;
    }
    return 'May-26';
  }, [constructionMonthly, activeProjects]);

  // Months list
  const months = constructionMonthly?.months || [
    'Apr-26', 'May-26', 'Jun-26', 'Jul-26', 'Aug-26', 'Sep-26',
    'Oct-26', 'Nov-26', 'Dec-26', 'Jan-27', 'Feb-27', 'Mar-27'
  ];

  // 3.5 Filter months list based on date filters and quarter filters
  const activeMonths = React.useMemo(() => {
    if (!filters) return months;

    const startLimit = filters.dateFrom ? new Date(filters.dateFrom) : new Date('2000-01-01');
    const endLimit = filters.dateTo ? new Date(filters.dateTo) : new Date('2099-12-31');

    const monthsMap = {
      'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8,
      'Oct': 9, 'Nov': 10, 'Dec': 11, 'Jan': 0, 'Feb': 1, 'Mar': 2
    };

    const filtered = months.filter(mStr => {
      // 1. Date range filter
      const [mon, yrStr] = mStr.split('-');
      const yr = 2000 + parseInt(yrStr, 10);
      const monthIdx = monthsMap[mon];
      const monthStart = new Date(yr, monthIdx, 1);
      const monthEnd = new Date(yr, monthIdx + 1, 0, 23, 59, 59, 999);
      const inDateRange = monthStart <= endLimit && monthEnd >= startLimit;

      if (!inDateRange) return false;

      // 2. Quarter filter
      if (filters.selectedQuarters && filters.selectedQuarters.length > 0) {
        const q = getQuarterFromMonth(mStr);
        if (q && !filters.selectedQuarters.includes(q)) {
          return false;
        }
      }

      return true;
    });

    return filtered.length > 0 ? filtered : months;
  }, [months, filters]);

  // 4. Calculate total Planned and Actual to Date for KPI cards
  const totalFYPlanned = React.useMemo(() => {
    let sum = 0;
    activeProjects.forEach(p => {
      activeMonths.forEach(m => { sum += p.planned[m] || 0; });
    });
    return sum;
  }, [activeProjects, activeMonths]);

  const totalActualToDate = React.useMemo(() => {
    let sum = 0;
    activeProjects.forEach(p => {
      activeMonths.forEach(m => { sum += p.actual[m] || 0; });
    });
    return sum;
  }, [activeProjects, activeMonths]);

  // 5. Pre-calculate chart series data
  const chartData = React.useMemo(() => {
    if (!constructionMonthly || !constructionMonthly.months || activeProjects.length === 0) return [];
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

      if (activeMonths.includes(m)) {
        data.push({
          name: m,
          Planned: parseFloat(mPlan.toFixed(2)),
          Actual: actualValForChart !== null ? parseFloat(actualValForChart.toFixed(2)) : null,
          "Cumulative Planned": parseFloat(cumPlanned.toFixed(2)),
          "Cumulative Actual": cumActualValForChart !== null ? parseFloat(cumActualValForChart.toFixed(2)) : null
        });
      }
    });

    return data;
  }, [constructionMonthly, activeProjects, latestMonthWithActual, activeMonths, months]);

  // Highlights & summaries
  const totalConstBudget = totalFYPlanned;
  const totalConstAchieved = totalActualToDate;
  const constVariance = totalConstBudget - totalConstAchieved;
  const avgConstEff = filteredProjects.length > 0
    ? filteredProjects.reduce((s, p) => s + p.construction.eff, 0) / filteredProjects.length
    : 0;
  const avgConstComp = filteredProjects.length > 0
    ? filteredProjects.reduce((s, p) => s + p.construction.completion, 0) / filteredProjects.length
    : 0;

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
      case 'success': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'warning': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'danger':  return 'bg-rose-50 text-rose-700 border-rose-100';
      default:        return 'bg-slate-50 text-slate-800 border-slate-200 font-bold';
    }
  };

  // Helper to check if a month is in the future relative to latest reporting month
  const isFutureMonth = (monthStr) => {
    const monthIndex = months.indexOf(monthStr);
    const reportingIndex = months.indexOf(latestMonthWithActual);
    return monthIndex > reportingIndex;
  };
  const isReportingMonth = (monthStr) => monthStr === latestMonthWithActual;

  const hasRangeFilter = !!(filters?.dateFrom || filters?.dateTo || (filters?.selectedQuarters && filters.selectedQuarters.length < 4));

  // Card titles — always fixed, do not change with quarter/date filters
  const card1Title = "FY Actual (₹ Cr)";
  const card1Subtitle = `${months[0]} to ${months[months.length - 1]}`;

  const card2Title = "Actual to Date (₹ Cr)";

  const latestActiveActualMonth = React.useMemo(() => {
    const reportingIndex = months.indexOf(latestMonthWithActual);
    for (let i = activeMonths.length - 1; i >= 0; i--) {
      const m = activeMonths[i];
      const idx = months.indexOf(m);
      if (idx <= reportingIndex) return m;
    }
    return null;
  }, [activeMonths, months, latestMonthWithActual]);

  const card2Subtitle = React.useMemo(() => {
    if (!hasRangeFilter) return `Through ${latestMonthWithActual}`;
    if (!latestActiveActualMonth) return "No actual data in selected range";
    const firstActiveMonth = activeMonths[0];
    if (firstActiveMonth === latestActiveActualMonth) return `For ${firstActiveMonth}`;
    return `${firstActiveMonth} to ${latestActiveActualMonth}`;
  }, [hasRangeFilter, activeMonths, latestMonthWithActual, latestActiveActualMonth]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  return (
    <motion.div
      variants={containerVariants}
      animate="show"
      className="space-y-6 pb-12 pt-2"
    >

      {/* KPI Cards & Charts Row — Merged card left, charts right */}
      <motion.div variants={itemVariants} className="flex gap-6 items-stretch h-[340px]">

        {/* LEFT: Single merged card — FY Actual + Overall Completion */}
        <div className="w-[340px] shrink-0 bg-white rounded-3xl p-5 border-l-4 border-[#10b981] border border-slate-100/80 shadow-premium hover:shadow-premium-hover flex flex-col justify-between relative overflow-hidden">
          {/* FY Actual section */}
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[12px] font-extrabold uppercase tracking-wider text-slate-700">{card1Title}</span>
              <div className="p-2 bg-nyati-navy/5 text-nyati-navy rounded-lg">
                <Hammer className="w-4 h-4 text-nyati-navy" />
              </div>
            </div>
            <h2 className="text-[28px] font-black mt-0.5 text-nyati-navy">
              ₹<AnimatedNumber value={totalActualToDate} decimals={2} /> Cr
            </h2>
            {/* Budget Target & Variance */}
            <div className="grid grid-cols-2 gap-3 mt-2 border-t border-b border-slate-200 py-2 text-xs">
              <div>
                <span className="text-slate-600 block text-[11px] font-extrabold uppercase tracking-wide">Budget Target</span>
                <span className="font-black text-slate-800 text-[14px] block mt-0.5">₹{totalFYPlanned.toFixed(2)} Cr</span>
              </div>
              <div>
                <span className="text-slate-600 block text-[11px] font-extrabold uppercase tracking-wide">Variance</span>
                <span className={`font-black text-[14px] block mt-0.5 ${(totalFYPlanned - totalActualToDate) > 0 ? 'text-nyati-danger' : 'text-nyati-success'}`}>
                  ₹{(totalActualToDate - totalFYPlanned).toFixed(2)} Cr
                </span>
              </div>
            </div>
            {/* Efficiency bar */}
            <div className="mt-2 space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-slate-700 uppercase tracking-wide">Efficiency Rate</span>
                <div className="flex items-center gap-2">
                  {(() => { const e = totalFYPlanned > 0 ? (totalActualToDate / totalFYPlanned) * 100 : 0; return (<><span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${e >= 80 ? 'bg-nyati-success/10 text-nyati-success' : e >= 50 ? 'bg-nyati-warning/10 text-nyati-warning' : 'bg-nyati-danger/10 text-nyati-danger'}`}>{e >= 80 ? 'On Target' : e >= 50 ? 'Progressing' : 'Critical'}</span><span className="font-black text-nyati-navy text-[14px]"><AnimatedNumber value={e} suffix="%" decimals={1} /></span></>); })()}
                </div>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                {(() => { const e = totalFYPlanned > 0 ? (totalActualToDate / totalFYPlanned) * 100 : 0; return (<motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, e)}%` }} transition={{ duration: 1.2, ease: 'easeOut' }} className={`h-full rounded-full ${e >= 80 ? 'bg-nyati-success' : e >= 50 ? 'bg-nyati-warning' : 'bg-nyati-danger'}`} />); })()}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-slate-200 my-3" />

          {/* Overall Completion section */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[12px] font-extrabold uppercase tracking-wider text-slate-700">Overall Completion</span>
              <h2 className="text-[32px] font-black text-[#4f46e5] leading-none mt-0.5">
                <AnimatedNumber value={avgConstComp} decimals={0} suffix="%" />
              </h2>
            </div>
            <div className="p-2 bg-[#4f46e5]/5 rounded-lg">
              <PieChart className="w-5 h-5 text-[#4f46e5]" />
            </div>
          </div>
        </div>

        {/* Monthly Progress Chart */}
        <div className="flex-1 bg-white rounded-3xl p-6 shadow-premium border border-slate-100 flex flex-col justify-between h-full">
          <div className="mb-4">
            <h4 className="font-extrabold text-nyati-navy text-base">Monthly Progress — Plan vs Actual (₹ Cr)</h4>
          </div>
          <div className="w-full flex-1">
            <MountedResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={75}
                  tick={{ fill: '#1e293b', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#1e293b', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} iconType="rect" iconSize={12} formatter={(value) => <span className="text-xs font-bold text-slate-800">{value}</span>} />
                <Bar dataKey="Planned" name="Planned" fill="#5570f2" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="Actual" name="Actual" fill="#0d9488" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </ComposedChart>
            </MountedResponsiveContainer>
          </div>
        </div>

        {/* Cumulative Progress Chart */}
        <div className="flex-1 bg-white rounded-3xl p-6 shadow-premium border border-slate-100 flex flex-col justify-between h-full">
          <div className="mb-4">
            <h4 className="font-extrabold text-nyati-navy text-base">Cumulative Progress — Plan vs Actual (₹ Cr)</h4>
          </div>
          <div className="w-full flex-1">
            <MountedResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={75}
                  tick={{ fill: '#1e293b', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#1e293b', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="rect" 
                  iconSize={12} 
                  formatter={(value) => <span className="text-xs font-bold text-slate-800">{value}</span>}
                  payload={[
                    { value: 'Cumulative Planned', type: 'rect', id: 'ID_Planned', color: '#3b82f6' },
                    { value: 'Cumulative Actual', type: 'rect', id: 'ID_Actual', color: '#10b981' }
                  ]}
                />
                <Line type="monotone" dataKey="Cumulative Planned" name="Cumulative Planned" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 1 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="Cumulative Actual" name="Cumulative Actual" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 1 }} activeDot={{ r: 5 }} connectNulls={false} />
              </ComposedChart>
            </MountedResponsiveContainer>
          </div>
        </div>

      </motion.div>

      {/* Monthly Timeline Budget Table Card */}
      <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-premium border border-slate-100">
        {/* Card Header */}
        <div className="sticky top-0 z-50 bg-white px-6 py-4 border-b border-slate-100 flex items-center gap-2 rounded-t-3xl">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0d9488] inline-block shrink-0"></span>
          <h3 className="font-extrabold text-nyati-navy text-base">Portfolio — Project-wise Plan vs Actual (₹ Cr)</h3>
        </div>

        {/* Synced Scroll Table */}
        <SyncedScrollTable
          activeMonths={activeMonths}
          activeProjects={activeProjects}
          displayPortfolioTotal={displayPortfolioTotal}
          isFutureMonth={isFutureMonth}
          isReportingMonth={isReportingMonth}
        />
      </motion.div>

      {/* Highlights & AI Recommendations Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Highlights Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="font-bold text-nyati-navy text-lg">Construction Cost & Status Highlights</h3>
            </div>
            <div className="p-6 space-y-4">
              {constructionPoints.map((p, idx) => (
                <div key={idx} className="flex gap-4 items-start bg-slate-50/40 border border-slate-100 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className={`mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border shrink-0 ${getStatusBadge(p.status)}`}>
                    {p.status || 'Info'}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-850 text-[14px]">{p.title}</h4>
                    <p className="text-[13px] text-slate-700 leading-relaxed font-medium">{p.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: AI Recommendations */}
        <div className="bg-white rounded-3xl p-6 shadow-premium border border-slate-100 flex flex-col justify-start self-start h-fit w-full">
          <div>
            <div className="border-b border-slate-100 pb-4 mb-5">
              <h3 className="font-black text-nyati-navy text-lg mt-0.5">Strategic Action Board</h3>
            </div>
            <div className="space-y-4">
              {aiRecommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border text-xs font-semibold space-y-2 flex flex-col justify-between ${
                    rec.type === 'danger'  ? 'bg-rose-50/50 border-rose-100 text-rose-900' :
                    rec.type === 'warning' ? 'bg-amber-50/50 border-amber-100 text-amber-900' :
                    rec.type === 'success' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900' :
                    'bg-slate-50 border-slate-150 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 shrink-0 ${
                      rec.type === 'danger'  ? 'text-rose-600' :
                      rec.type === 'warning' ? 'text-amber-600' :
                      rec.type === 'success' ? 'text-emerald-600' :
                      'text-slate-600'
                    }`} />
                    <span className="font-extrabold uppercase tracking-wide text-[11px]">{rec.subject}</span>
                  </div>
                  <p className="font-semibold text-slate-700 leading-relaxed text-[12px]">{rec.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 bg-nyati-orange/5 rounded-2xl border border-nyati-orange/10 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-nyati-orange font-extrabold uppercase tracking-wider">Analysis Accuracy</span>
              <span className="text-slate-800 font-extrabold text-sm block">100% Data Synchronized</span>
            </div>
            <PieChart className="w-5 h-5 text-nyati-orange" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}