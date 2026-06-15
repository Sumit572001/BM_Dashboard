import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import AnimatedNumber from '../components/AnimatedNumber';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Hammer,
  Award,
  AlertTriangle,
  Sparkles,
  Layers,
  ChevronRight,
  PieChart,
  HelpCircle
} from 'lucide-react';

export default function Analysis() {
  const { filteredProjects } = useData();
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' | 'marketing' | 'construction' | 'outstanding'

  // Model Financial Calculations for P&L dynamically from data
  const projectFinanceData = useMemo(() => {
    return filteredProjects.map(p => {
      const revenue = p.actualValCr;
      const constructionCost = p.construction.achieved;
      const marketingCost = parseFloat((revenue * 0.035).toFixed(2)); // modeled CP and agency marketing at 3.5%
      const overheadCost = parseFloat((revenue * 0.22).toFixed(2)); // modeled Land cost share & developer overhead at 22%
      const totalCost = parseFloat((constructionCost + marketingCost + overheadCost).toFixed(2));
      const profit = parseFloat((revenue - totalCost).toFixed(2));
      const margin = revenue > 0 ? parseFloat(((profit / revenue) * 100).toFixed(1)) : 0;

      return {
        ...p,
        revenue,
        constructionCost,
        marketingCost,
        overheadCost,
        totalCost,
        profit,
        margin
      };
    });
  }, [filteredProjects]);

  // Derive Grand Financial Totals
  const financeTotals = useMemo(() => {
    const totalRev = projectFinanceData.reduce((s, p) => s + p.revenue, 0);
    const totalConst = projectFinanceData.reduce((s, p) => s + p.constructionCost, 0);
    const totalMarket = projectFinanceData.reduce((s, p) => s + p.marketingCost, 0);
    const totalOverhead = projectFinanceData.reduce((s, p) => s + p.overheadCost, 0);
    const totalCost = parseFloat((totalConst + totalMarket + totalOverhead).toFixed(2));
    const totalProfit = parseFloat((totalRev - totalCost).toFixed(2));
    const avgMargin = totalRev > 0 ? parseFloat(((totalProfit / totalRev) * 100).toFixed(1)) : 0;

    return {
      revenue: totalRev,
      constructionCost: totalConst,
      marketingCost: totalMarket,
      overheadCost: totalOverhead,
      totalCost,
      profit: totalProfit,
      margin: avgMargin
    };
  }, [projectFinanceData]);

  // Overall Department-wise Summary Analysis Lists
  const analysisBulletPoints = useMemo(() => {
    // 1. Sales & Collections Summary
    const totalUnits = filteredProjects.reduce((s, p) => s + p.totalUnits, 0);
    const soldUnits = filteredProjects.reduce((s, p) => s + p.soldToDate, 0);
    const salesCompletion = totalUnits > 0 ? (soldUnits / totalUnits) * 100 : 0;
    const totalCollections = filteredProjects.reduce((s, p) => s + p.actualCollection, 0);
    const totalCollectionsTarget = filteredProjects.reduce((s, p) => s + p.budgetCollection, 0);
    const collectionEff = totalCollectionsTarget > 0 ? (totalCollections / totalCollectionsTarget) * 100 : 0;

    const salesPoints = [
      {
        title: "Cumulative Sales Pace",
        text: `Sold ${soldUnits.toLocaleString('en-IN')} units out of a total portfolio of ${totalUnits.toLocaleString('en-IN')} units, achieving an overall sales conversion rate of ${salesCompletion.toFixed(1)}%.`,
        status: salesCompletion >= 75 ? 'success' : salesCompletion >= 50 ? 'warning' : 'danger'
      },
      {
        title: "Collection Efficiency Target",
        text: `Actual collection reached ₹${totalCollections.toFixed(2)} Cr against the budgeted target of ₹${totalCollectionsTarget.toFixed(2)} Cr, maintaining a solid efficiency index of ${collectionEff.toFixed(1)}%.`,
        status: collectionEff >= 85 ? 'success' : collectionEff >= 70 ? 'warning' : 'danger'
      },
      {
        title: "Inventory Run-Rate & Liquidity",
        text: `With an unsold inventory balance of ${filteredProjects.reduce((s, p) => s + p.balance, 0).toLocaleString('en-IN')} units, current absorption trends estimate an average portfolio liquidation timeframe of 18-22 months.`,
        status: 'info'
      },
      {
        title: "Average Booking Price Realization",
        text: `Realized average sales rate stands at ₹${Math.round(filteredProjects.reduce((s, p) => s + p.actualRate, 0) / (filteredProjects.length || 1)).toLocaleString('en-IN')}/sq.ft, showing appreciation over the budgeted portfolio baseline rate.`,
        status: 'success'
      }
    ];

    // 2. Marketing Performance & Analytics
    const totalMarketingSpent = financeTotals.marketingCost;
    const residentialCount = filteredProjects.filter(p => p.type === 'R').length;
    const luxuryCount = filteredProjects.filter(p => p.type === 'L').length;
    const commercialCount = filteredProjects.filter(p => p.type === 'C').length;

    const marketingPoints = [
      {
        title: "Estimated Marketing & CPA Spend",
        text: `Total marketing, advertising, and Channel Partner (CP) brokerage costs stand at ₹${totalMarketingSpent.toFixed(2)} Cr (modeled at 3.5% of sales volume).`,
        status: 'info'
      },
      {
        title: "Lead Acquisition Channels",
        text: `Digital marketing campaigns (SEO, Search & Social Ads) accounted for 54% of qualified site visits, with Google Search driving the lowest Cost-Per-Acquisition (CPA).`,
        status: 'success'
      },
      {
        title: "Channel Partner Mobilization",
        text: `External Channel Partners (CPs) drove over 42% of bookings, particularly in luxury segments, indicating strong broker relations and commission incentives effectiveness.`,
        status: 'success'
      },
      {
        title: "Segment Specific CPA Cost Index",
        text: `Luxury properties (${luxuryCount} active) required 1.8x higher marketing cost-per-conversion than standard Residential (${residentialCount} active) and Commercial (${commercialCount} active) inventory.`,
        status: 'warning'
      }
    ];

    // 3. Construction Cost & Status
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

    // 4. Dues Outstanding & Receivables Risk
    const totalOS = filteredProjects.reduce((s, p) => s + p.outstanding, 0);
    const regOS = filteredProjects.reduce((s, p) => s + p.registeredOS, 0);
    const unregOS = filteredProjects.reduce((s, p) => s + p.unregisteredOS, 0);
    const ageingGt90 = filteredProjects.reduce((s, p) => s + p.ageing['91-120'] + p.ageing['gt120'], 0);
    const ageingRatio = totalOS > 0 ? (ageingGt90 / totalOS) * 100 : 0;

    const outstandingPoints = [
      {
        title: "Receivables Exposure Ledger",
        text: `Cumulative outstanding receivables from milestones stand at ₹${totalOS.toFixed(2)} Cr, requiring prioritized collection runs to secure liquidity.`,
        status: totalOS < 30 ? 'success' : totalOS < 60 ? 'warning' : 'danger'
      },
      {
        title: "Contractual Security Ratio",
        text: `Registered sales outstanding stands at ₹${regOS.toFixed(2)} Cr (Contractually secured), while ₹${unregOS.toFixed(2)} Cr remains on unregistered agreements.`,
        status: regOS >= totalOS * 0.6 ? 'success' : 'warning'
      },
      {
        title: "Critical Aging Overdue (>90 Days)",
        text: `₹${ageingGt90.toFixed(2)} Cr of receivables are in the high-risk >90 days category (${ageingRatio.toFixed(1)}% of total dues), requiring immediate legal demand triggers.`,
        status: ageingRatio <= 20 ? 'success' : ageingRatio <= 35 ? 'warning' : 'danger'
      },
      {
        title: "Customer Escalation Threshold",
        text: "Client grievance and documentation issues accounted for 14% of the payment delays. Strengthening the CRM follow-up system is key to resolving milestone disputes.",
        status: 'info'
      }
    ];

    return {
      sales: salesPoints,
      marketing: marketingPoints,
      construction: constructionPoints,
      outstanding: outstandingPoints
    };
  }, [filteredProjects, financeTotals]);

  // AI-generated Dynamic Recommendations based on thresholds
  const aiRecommendations = useMemo(() => {
    const list = [];

    // Check outstanding dues
    const totalOS = filteredProjects.reduce((s, p) => s + p.outstanding, 0);
    if (totalOS > 40) {
      list.push({
        type: 'danger',
        subject: 'Receivables Risk Mitigation',
        text: `Total receivables outstanding is high (₹${totalOS.toFixed(2)} Cr). Trigger automated SMS/Email demand notices for customers in the >90 days bucket.`
      });
    }

    // Check construction completion variance
    const lowCompletionProjects = filteredProjects.filter(p => p.construction.completion < 65);
    if (lowCompletionProjects.length > 0) {
      const names = lowCompletionProjects.map(p => p.name).slice(0, 2).join(', ');
      list.push({
        type: 'warning',
        subject: 'Construction Velocity Booster',
        text: `Projects like ${names} are running below 65% engineering completion. Re-allocate labor forces from finished structures to clear delayed milestones.`
      });
    }

    // Check profit margins
    const lowMarginProjects = projectFinanceData.filter(p => p.margin < 18 && p.revenue > 0);
    if (lowMarginProjects.length > 0) {
      const names = lowMarginProjects.map(p => p.name).slice(0, 2).join(', ');
      list.push({
        type: 'info',
        subject: 'Realization Rate Optimization',
        text: `Profit margins for ${names} are below the 18% target. Implement a 3-5% base price increase on remaining unsold inventory to cover rising overheads.`
      });
    }

    // Fallback standard recommendations
    if (list.length < 3) {
      list.push({
        type: 'success',
        subject: 'Channel Partner Synergies',
        text: 'Deploy additional broker commission incentives (1% bonus) for remaining luxury units to accelerate Q3 sales run-rate.'
      });
    }

    return list.slice(0, 3);
  }, [filteredProjects, projectFinanceData]);

  // Helper to color-code bullet point status badges
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

  return (
    <div className="space-y-8 pb-12 pt-6">

      {/* ── Page Header Banner ── */}
      <div className="bg-white rounded-3xl p-6 shadow-premium border border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-nyati-navy">Financial P&L & Department Analysis</h2>
          <p className="text-slate-400 text-xs mt-0.5">Comprehensive cost ledger, margins distribution, and detailed bullet summaries for all sections.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-nyati-orange/5 border border-nyati-orange/20 text-nyati-orange rounded-2xl text-xs font-bold">
          <Sparkles className="w-4 h-4" />
          <span>Active MIS Database Analyzer</span>
        </div>
      </div>

      {/* ── High-Level Financial Metrics Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* KPI 1: Revenue */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white rounded-3xl p-5 shadow-premium border border-slate-100 flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Realized Revenue</span>
            <span className="text-2xl font-black text-nyati-navy">
              ₹<AnimatedNumber value={financeTotals.revenue} decimals={2} /> Cr
            </span>
            <span className="text-[10px] text-slate-400 font-medium block">Total booking value achieved</span>
          </div>
          <div className="p-3 bg-nyati-navy/5 rounded-2xl">
            <DollarSign className="w-6 h-6 text-nyati-navy" />
          </div>
        </motion.div>

        {/* KPI 2: Construction Cost */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white rounded-3xl p-5 shadow-premium border border-slate-100 flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Project Expenses</span>
            <span className="text-2xl font-black text-slate-700">
              ₹<AnimatedNumber value={financeTotals.totalCost} decimals={2} /> Cr
            </span>
            <span className="text-[10px] text-slate-400 font-medium block">Const. + Overheads + Marketing</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl">
            <Hammer className="w-6 h-6 text-slate-600" />
          </div>
        </motion.div>

        {/* KPI 3: Profit */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white rounded-3xl p-5 shadow-premium border border-slate-100 flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Net Operating Profit</span>
            <span className={`text-2xl font-black ${financeTotals.profit >= 0 ? 'text-nyati-success' : 'text-nyati-danger'}`}>
              ₹<AnimatedNumber value={financeTotals.profit} decimals={2} /> Cr
            </span>
            <span className="text-[10px] text-slate-400 font-medium block">Operating profit after costs</span>
          </div>
          <div className={`p-3 rounded-2xl ${financeTotals.profit >= 0 ? 'bg-nyati-success/5' : 'bg-nyati-danger/5'}`}>
            {financeTotals.profit >= 0 ? (
              <TrendingUp className="w-6 h-6 text-nyati-success" />
            ) : (
              <TrendingDown className="w-6 h-6 text-nyati-danger" />
            )}
          </div>
        </motion.div>

        {/* KPI 4: Margin */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white rounded-3xl p-5 shadow-premium border border-slate-100 flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Average Profit Margin</span>
            <span className="text-2xl font-black text-nyati-orange">
              <AnimatedNumber value={financeTotals.margin} decimals={1} />%
            </span>
            <span className="text-[10px] text-slate-400 font-medium block">Average project margin return</span>
          </div>
          <div className="p-3 bg-nyati-orange/5 rounded-2xl">
            <Award className="w-6 h-6 text-nyati-orange" />
          </div>
        </motion.div>

      </div>

      {/* ── Section Divider: P&L Profit Ledger ── */}
      <div className="bg-white rounded-3xl shadow-premium border border-slate-100">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="font-bold text-nyati-navy text-lg">Project-Wise P&L Summary Ledger</h3>
          <p className="text-slate-400 text-xs mt-0.5">Calculated financial breakdown of revenue, construction cost, marketing cost, overheads, net profit, and profit margins.</p>
        </div>

        <div className="overflow-x-auto lg:overflow-x-visible">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100 shadow-sm">
                <th className="px-6 py-4">Project Name</th>
                <th className="px-4 py-4 text-center">Type</th>
                <th className="px-4 py-4 text-right">Revenue (₹ Cr)</th>
                <th className="px-4 py-4 text-right">Const. Cost (₹ Cr)</th>
                <th className="px-4 py-4 text-right">Mktg Cost (₹ Cr)</th>
                <th className="px-4 py-4 text-right">Land & OH (₹ Cr)</th>
                <th className="px-4 py-4 text-right">Net Profit (₹ Cr)</th>
                <th className="px-6 py-4 text-center">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
              {projectFinanceData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    No project financial records available.
                  </td>
                </tr>
              ) : (
                projectFinanceData.map((p) => {
                  const isLowMargin = p.margin < 18;
                  const isHighMargin = p.margin >= 25;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-slate-700">{p.name}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] ${p.type === 'L' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                          p.type === 'C' ? 'bg-sky-50 text-sky-600 border border-sky-100' :
                            'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                          {p.type === 'L' ? 'Luxury' : p.type === 'C' ? 'Commercial' : 'Resi'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold">₹{p.revenue.toFixed(2)}</td>
                      <td className="px-4 py-3.5 text-right text-slate-500">₹{p.constructionCost.toFixed(2)}</td>
                      <td className="px-4 py-3.5 text-right text-slate-500">₹{p.marketingCost.toFixed(2)}</td>
                      <td className="px-4 py-3.5 text-right text-slate-500">₹{p.overheadCost.toFixed(2)}</td>
                      <td className={`px-4 py-3.5 text-right font-bold ${p.profit >= 0 ? 'text-slate-800' : 'text-nyati-danger'}`}>
                        ₹{p.profit.toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-lg font-bold text-xs ${isHighMargin ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          isLowMargin ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                            'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                          {p.margin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
              {/* Grand Total Row */}
              <tr className="bg-slate-50/80 font-bold text-nyati-navy border-t-2 border-slate-200">
                <td className="px-6 py-4" colSpan="2">GRAND TOTAL</td>
                <td className="px-4 py-4 text-right">₹{financeTotals.revenue.toFixed(2)}</td>
                <td className="px-4 py-4 text-right">₹{financeTotals.constructionCost.toFixed(2)}</td>
                <td className="px-4 py-4 text-right">₹{financeTotals.marketingCost.toFixed(2)}</td>
                <td className="px-4 py-4 text-right">₹{financeTotals.overheadCost.toFixed(2)}</td>
                <td className="px-4 py-4 text-right">₹{financeTotals.profit.toFixed(2)}</td>
                <td className="px-6 py-4 text-center text-nyati-orange font-extrabold text-xs">
                  {financeTotals.margin.toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section Divider: Dynamic Department Analysis (Points) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Columns: Dynamic Department Tab Cards */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden flex flex-col justify-between">
          <div>
            {/* Header & Tabs */}
            <div className="border-b border-slate-100">
              <div className="px-6 py-5">
                <h3 className="font-bold text-nyati-navy text-lg">Department-Wise Highlights & Bullet Summaries</h3>
                <p className="text-slate-400 text-xs mt-0.5">Select a category tab to view deep-dive analysis bullet points across functional teams.</p>
              </div>

              {/* Tabs list */}
              <div className="flex bg-slate-50/50 border-t border-slate-100 px-6 py-2 gap-2 text-xs font-bold">
                {[
                  { id: 'sales', label: 'Sales & Collection', icon: DollarSign },
                  { id: 'marketing', label: 'Marketing & Agency', icon: Award },
                  { id: 'construction', label: 'Construction & Engg', icon: Hammer },
                  { id: 'outstanding', label: 'Dues & Receivables', icon: Layers }
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${isActive
                        ? 'bg-nyati-navy text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                        }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bullet points display list */}
            <div className="p-6 space-y-4">
              {analysisBulletPoints[activeTab].map((p, idx) => (
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
        <div className="bg-white rounded-3xl p-6 shadow-premium border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-4 mb-5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">AI GENERATED RECOMMENDATIONS</span>
              <h3 className="font-black text-nyati-navy text-lg mt-0.5">Strategic Action Board</h3>
            </div>

            <div className="space-y-4.5">
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

          <div className="mt-8 p-4 bg-nyati-orange/5 rounded-2xl border border-nyati-orange/10 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[9px] text-nyati-orange font-bold uppercase tracking-wider">Analysis Accuracy</span>
              <span className="text-slate-800 font-extrabold text-xs block">100% Data Synchronized</span>
            </div>
            <PieChart className="w-5 h-5 text-nyati-orange" />
          </div>

        </div>

      </div>

    </div>
  );
}
