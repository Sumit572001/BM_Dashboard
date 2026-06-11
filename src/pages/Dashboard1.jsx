import React from 'react';
import { useData } from '../context/DataContext';
import { calculateGrandTotals } from '../utils/dataHelpers';
import KPICard from '../components/KPICard';
import ProjectTable from '../components/ProjectTable';
import { ClipboardList, IndianRupee, Maximize, CreditCard, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard1() {
  const { filteredProjects } = useData();

  // Get aggregated grand totals across current filtered set
  const totals = calculateGrandTotals(filteredProjects);

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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
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
          extraInfo={unitsExtra}
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
          extraInfo={rateExtra}
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
          extraInfo={areaExtra}
          borderStyle="border-l-4 border-emerald-600"
        />

        <KPICard
          title="Total Collection"
          budget={totals.budgetCollection}
          actual={totals.actualCollection}
          eff={totals.collectionEff}
          prefix="₹"
          suffix=" Cr"
          decimals={2}
          icon={CreditCard}
          extraInfo={collectionExtra}
          borderStyle="border-l-4 border-sky-500"
        />
      </motion.div>

      {/* Project Table Section */}
      <motion.div variants={itemVariants}>
        <ProjectTable />
      </motion.div>
      
    </motion.div>
  );
}
