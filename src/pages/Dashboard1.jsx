import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { calculateGrandTotals, getQuarterFromMonth } from '../utils/dataHelpers';
import KPICard from '../components/KPICard';
import ProjectTable from '../components/ProjectTable';
import { ClipboardList, IndianRupee, Maximize, CreditCard, Info, DollarSign, Award, AlertTriangle, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard1() {
  const { filteredProjects, filters, updateFilters } = useData();

  // Helper to determine the latest quarter with actual sales/units data
  const getLatestActualQuarter = (projects) => {
    const monthsOrder = ['Apr-26', 'May-26', 'Jun-26', 'Jul-26', 'Aug-26', 'Sep-26', 'Oct-26', 'Nov-26', 'Dec-26', 'Jan-27', 'Feb-27', 'Mar-27'];
    let latestMonth = 'Apr-26';
    
    projects.forEach(p => {
      if (p.monthlyData) {
        Object.keys(p.monthlyData).forEach(m => {
          const d = p.monthlyData[m];
          if (d && (d.unitsActual > 0 || d.salesValueActual > 0)) {
            const mIdx = monthsOrder.indexOf(m);
            const latIdx = monthsOrder.indexOf(latestMonth);
            if (mIdx > latIdx) {
              latestMonth = m;
            }
          }
        });
      }
    });
    
    return getQuarterFromMonth(latestMonth) || 'Q1';
  };

  const latestQuarter = useMemo(() => {
    return getLatestActualQuarter(filteredProjects);
  }, [filteredProjects]);

  const [selectedPeriod, setSelectedPeriod] = useState('Selected');
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize selectedPeriod to 'Selected' on mount
  useEffect(() => {
    if (filteredProjects.length > 0 && !hasInitialized) {
      setSelectedPeriod('Selected');
      setHasInitialized(true);
    }
  }, [filteredProjects, hasInitialized]);

  // Sync dropdown selection to the global selectedQuarters filter
  useEffect(() => {
    if (selectedPeriod === 'Selected') return;

    let q = '';
    if (selectedPeriod === 'Q1' || ['Apr-26', 'May-26', 'Jun-26'].includes(selectedPeriod)) q = 'Q1';
    else if (selectedPeriod === 'Q2' || ['Jul-26', 'Aug-26', 'Sep-26'].includes(selectedPeriod)) q = 'Q2';
    else if (selectedPeriod === 'Q3' || ['Oct-26', 'Nov-26', 'Dec-26'].includes(selectedPeriod)) q = 'Q3';
    else if (selectedPeriod === 'Q4' || ['Jan-27', 'Feb-27', 'Mar-27'].includes(selectedPeriod)) q = 'Q4';

    if (q) {
      if (filters.selectedQuarters.length !== 1 || filters.selectedQuarters[0] !== q) {
        updateFilters({ selectedQuarters: [q] });
      }
    }
  }, [selectedPeriod]);

  // Sync global selectedQuarters filter changes back to the selectedPeriod dropdown
  useEffect(() => {
    if (filters.selectedQuarters.length === 1) {
      const q = filters.selectedQuarters[0];
      let currentQ = 'Q1';
      if (selectedPeriod === 'Q1' || ['Apr-26', 'May-26', 'Jun-26'].includes(selectedPeriod)) currentQ = 'Q1';
      else if (selectedPeriod === 'Q2' || ['Jul-26', 'Aug-26', 'Sep-26'].includes(selectedPeriod)) currentQ = 'Q2';
      else if (selectedPeriod === 'Q3' || ['Oct-26', 'Nov-26', 'Dec-26'].includes(selectedPeriod)) currentQ = 'Q3';
      else if (selectedPeriod === 'Q4' || ['Jan-27', 'Feb-27', 'Mar-27'].includes(selectedPeriod)) currentQ = 'Q4';

      if (currentQ !== q) {
        setSelectedPeriod(q);
      }
    } else {
      setSelectedPeriod('Selected');
    }
  }, [filters.selectedQuarters]);

  // Helper to aggregate data for Q1, Q2, Q3, Q4 or specific month
  const getPeriodTotals = (projects, period, selectedQuarters = ['Q1', 'Q2', 'Q3', 'Q4']) => {
    let months = [];
    const qMonths = {
      'Q1': ['Apr-26', 'May-26', 'Jun-26'],
      'Q2': ['Jul-26', 'Aug-26', 'Sep-26'],
      'Q3': ['Oct-26', 'Nov-26', 'Dec-26'],
      'Q4': ['Jan-27', 'Feb-27', 'Mar-27']
    };

    if (period && !period.startsWith('Q') && period !== 'Selected' && period !== 'All') {
      months = [period];
    } else if (period && period.startsWith('Q') && period !== 'Selected') {
      months = qMonths[period] || [];
    } else {
      const activeQs = selectedQuarters && selectedQuarters.length > 0 ? selectedQuarters : ['Q1', 'Q2', 'Q3', 'Q4'];
      activeQs.forEach(q => {
        if (qMonths[q]) {
          months = [...months, ...qMonths[q]];
        }
      });
    }

    const fraction = months.length / 12;
    let totalUnits = 0;
    let balance = 0;
    let unitsTarget = 0;
    let unitsActual = 0;
    let areaTarget = 0;
    let areaActual = 0;
    let valueTarget = 0;
    let valueActual = 0;
    let collectionTarget = 0;
    let collectionActual = 0;

    projects.forEach(p => {
      totalUnits += p.totalUnits || 0;
      balance += p.balance || 0;

      if (p.monthlyData) {
        months.forEach(m => {
          const mData = p.monthlyData[m] || {};
          unitsTarget += mData.unitsTarget || 0;
          unitsActual += mData.unitsActual || 0;
          areaTarget += mData.areaTarget || 0;
          areaActual += mData.areaActual || 0;
          valueTarget += mData.salesValueTarget || 0;
          valueActual += mData.salesValueActual || 0;
          collectionTarget += mData.collectionTarget || 0;
          collectionActual += mData.collectionActual || 0;
        });
      } else {
        unitsTarget += p.budgetUnits * fraction;
        unitsActual += p.soldToDate * fraction;
        areaTarget += p.budgetArea * fraction;
        areaActual += p.actualArea * fraction;
        valueTarget += (p.budgetValCr * 10000000) * fraction;
        valueActual += (p.actualValCr * 10000000) * fraction;
        collectionTarget += (p.budgetCollection * 10000000) * fraction;
        collectionActual += (p.actualCollection * 10000000) * fraction;
      }
    });

    const rateTarget = areaTarget > 0 ? (valueTarget) / areaTarget : 0;
    const rateActual = areaActual > 0 ? (valueActual) / areaActual : 0;

    return {
      totalUnits,
      balance,
      budgetUnits: Math.round(unitsTarget),
      soldToDate: Math.round(unitsActual),
      budgetRate: rateTarget,
      actualRate: rateActual,
      rateEff: rateTarget > 0 ? (rateActual / rateTarget) * 100 : 0,
      budgetArea: areaTarget,
      actualArea: areaActual,
      budgetValCr: parseFloat((valueTarget / 10000000).toFixed(2)),
      actualValCr: parseFloat((valueActual / 10000000).toFixed(2)),
      budgetCollection: parseFloat((collectionTarget / 10000000).toFixed(2)),
      actualCollection: parseFloat((collectionActual / 10000000).toFixed(2))
    };
  };

  // Get aggregated grand totals across current filtered set & selected period
  const totals = getPeriodTotals(filteredProjects, selectedPeriod, filters.selectedQuarters);

  // Extra Details for Units
  const unitsExtra = (
    <>
      <div className="flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-nyati-navy" />
        <span>Inventory: <strong>{totals.totalUnits.toLocaleString('en-IN')} Units</strong></span>
      </div>
      <div className="text-right">
        <span>Balance: <strong>{totals.balance.toLocaleString('en-IN')}</strong></span>
      </div>
    </>
  );

  // Extra Details for Rates
  const rateExtra = (
    <>
      <div>
        <span>ERP Avg: <strong>₹{(totals.actualRate * 0.98).toFixed(0)}/sf</strong></span>
      </div>
      <div className="text-right">
        <span>Booking Avg: <strong>₹{(totals.actualRate * 1.01).toFixed(0)}/sf</strong></span>
      </div>
    </>
  );

  // Extra Details for Area
  const areaExtra = (
    <>
      <div>
        <span>Excel: <strong>{Math.round(totals.actualArea * 0.95).toLocaleString('en-IN')} sf</strong></span>
      </div>
      <div className="text-right">
        <span>Booking Area: <strong>{Math.round(totals.actualArea).toLocaleString('en-IN')} sf</strong></span>
      </div>
    </>
  );

  // Extra Details for Collections
  const collectionExtra = (
    <>
      <div>
        <span>Excel: <strong>₹{totals.actualCollection.toFixed(2)} Cr</strong></span>
      </div>
      <div className="text-right">
        <span>ERP: <strong>₹{(totals.actualCollection * 0.96).toFixed(2)} Cr</strong></span>
      </div>
    </>
  );

  // Extra Details for Sales Card
  const salesExtra = (
    <>
      <div>
        <span>Residential: <strong>₹{filteredProjects.filter(p => p.type === 'R').reduce((s, p) => s + p.actualValCr, 0).toFixed(2)} Cr</strong></span>
      </div>
      <div className="text-right">
        <span>Luxury/Comm: <strong>₹{filteredProjects.filter(p => p.type !== 'R').reduce((s, p) => s + p.actualValCr, 0).toFixed(2)} Cr</strong></span>
      </div>
    </>
  );

  // Framer motion variants for stagger
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
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
  };

  // Highlights Tabs State
  const [activeTab, setActiveTab] = useState('sales');

  // Sales Bullet Point Calculations
  const totalUnits = filteredProjects.reduce((s, p) => s + p.totalUnits, 0);
  const soldUnits = filteredProjects.reduce((s, p) => s + p.soldToDate, 0);
  const salesCompletion = totalUnits > 0 ? (soldUnits / totalUnits) * 100 : 0;
  const totalCollections = filteredProjects.reduce((s, p) => s + p.actualCollection, 0);
  const totalCollectionsTarget = filteredProjects.reduce((s, p) => s + p.budgetCollection, 0);
  const collectionEff = totalCollectionsTarget > 0 ? (totalCollections / totalCollectionsTarget) * 100 : 0;
  const balanceUnits = filteredProjects.reduce((s, p) => s + p.balance, 0);
  const avgRateVal = filteredProjects.length > 0 ? filteredProjects.reduce((s, p) => s + p.actualRate, 0) / filteredProjects.length : 0;

  const salesPoints = [
    {
      title: "Cumulative Sales Pace",
      text: `Sold ${soldUnits.toLocaleString('en-IN')} units out of a total portfolio of ${totalUnits.toLocaleString('en-IN')} units, achieving an overall sales conversion rate of ${salesCompletion.toFixed(1)}%.`,
      status: salesCompletion >= 75 ? 'success' : salesCompletion >= 50 ? 'warning' : 'danger'
    },
    {
      title: "Collection Efficiency Target",
      text: `Actual collection reached ₹${totalCollections.toFixed(2)} Cr against the budgeted target of ₹${totalCollectionsTarget.toFixed(2)} Cr, maintaining a solid efficiency index of ${collectionEff.toFixed(1)}%.`,
      status: collectionEff >= 85 ? 'success' : collectionEff >= 50 ? 'warning' : 'danger'
    },
    {
      title: "Inventory Run-Rate & Liquidity",
      text: `With an unsold inventory balance of ${balanceUnits.toLocaleString('en-IN')} units, current absorption trends estimate an average portfolio liquidation timeframe of 18-22 months.`,
      status: 'info'
    },
    {
      title: "Average Booking Price Realization",
      text: `Realized average sales rate stands at ₹${Math.round(avgRateVal).toLocaleString('en-IN')}/sq.ft, showing appreciation over the budgeted portfolio baseline rate.`,
      status: 'success'
    }
  ];

  // Marketing Bullet Point Calculations
  const totalRevenue = filteredProjects.reduce((s, p) => s + p.actualValCr, 0);
  const totalMarketingSpent = totalRevenue * 0.035;
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

  const bulletPoints = {
    sales: salesPoints,
    marketing: marketingPoints
  };

  const aiRecommendations = [
    {
      type: 'info',
      subject: 'Realization Rate Optimization',
      text: `Profit margins for selected projects are below target. Implement a 3-5% base price increase on remaining unsold inventory to cover rising overheads.`
    },
    {
      type: 'success',
      subject: 'Channel Partner Synergies',
      text: 'Deploy additional broker commission incentives (1% bonus) for remaining luxury units to accelerate Q3 sales run-rate.'
    }
  ];

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
    <motion.div
      variants={containerVariants}
      animate="show"
      className="space-y-6"
    >

      {/* KPI Cards Row */}
      <motion.div 
        variants={itemVariants} 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <KPICard
          title="Units Sold"
          budget={totals.budgetUnits}
          actual={totals.soldToDate}
          eff={totals.budgetUnits > 0 ? (totals.soldToDate / totals.budgetUnits) * 100 : 0}
          icon={ClipboardList}
          borderStyle="border-l-4 border-nyati-orange"
        />
        
        <KPICard
          title="Average Rate"
          budget={totals.budgetRate}
          actual={totals.actualRate}
          eff={totals.rateEff}
          prefix="₹"
          suffix="/sf"
          decimals={0}
          icon={IndianRupee}
          borderStyle="border-l-4 border-nyati-navy"
        />
        
        <KPICard
          title="Saleable Area"
          budget={totals.budgetArea}
          actual={totals.actualArea}
          eff={totals.budgetArea > 0 ? (totals.actualArea / totals.budgetArea) * 100 : 0}
          suffix=" sf"
          decimals={0}
          icon={Maximize}
          borderStyle="border-l-4 border-emerald-600"
        />

        <KPICard
          title="Total Sales"
          budget={totals.budgetValCr}
          actual={totals.actualValCr}
          eff={totals.budgetValCr > 0 ? (totals.actualValCr / totals.budgetValCr) * 100 : 0}
          prefix="₹"
          suffix=" Cr"
          decimals={2}
          icon={ClipboardList}
          borderStyle="border-l-4 border-nyati-orange"
        />
      </motion.div>

      {/* Project Table Section */}
      <div>
        <ProjectTable selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod} />
      </div>

      {/* Highlights & AI Recommendations Row */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Left 2 Columns: Highlights Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100">
              <div className="px-6 py-5">
                <h3 className="font-bold text-nyati-navy text-base">Department-Wise Highlights & Bullet Summaries</h3>
              </div>

              {/* Tabs list */}
              <div className="flex bg-slate-50/50 border-t border-slate-100 px-6 py-2 gap-2 text-xs font-bold">
                {[
                  { id: 'sales', label: 'Sales & Collection', icon: DollarSign },
                  { id: 'marketing', label: 'Marketing & Agency', icon: Award }
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
              {bulletPoints[activeTab].map((p, idx) => (
                <div key={idx} className="flex gap-4 items-start bg-slate-50/40 border border-slate-100 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className={`mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border shrink-0 ${getStatusBadge(p.status)}`}>
                    {p.status || 'Info'}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1">
                      {p.title}
                    </h4>
                    <p className="text-[13px] text-slate-700 leading-relaxed font-medium">
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
                  <p className="font-medium text-slate-700 leading-relaxed text-[12px]">
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
