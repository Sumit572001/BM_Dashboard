import React from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Menu, Calendar, FileSpreadsheet, RefreshCw } from 'lucide-react';

export default function TopBar({ toggleSidebar }) {
  const location = useLocation();
  const { fileName, resetData } = useData();

  // Map routes to human readable headers
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Management Information System';
      case '/sales-collection':
        return 'Sales & Collection Dashboard';
      case '/outstanding':
        return 'Outstanding';
      case '/construction-budget':
        return 'Construction Budget Review';
      case '/portfolio':
        return 'Project Portfolio Details';
      default:
        return 'Management Information System';
    }
  };

  const getPageSubtitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Nyati Engineers & Consultants Pvt. Ltd. corporate dashboard';
      case '/sales-collection':
        return 'FY sales achievements, rate analysis, and actual vs budget collection rates';
      case '/outstanding':
        return 'Milestone dues, collection status, and project ageing matrices';
      case '/construction-budget':
        return 'Target planned vs achieved construction costs and variance tracking';
      case '/portfolio':
        return 'Granular view of buildings inventory funnel, RERA timings, and cost details';
      default:
        return 'Nyati Engineers & Consultants Pvt. Ltd. corporate dashboard';
    }
  };

  const formattedDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      
      {/* Left section: Hamburger & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-50 active:bg-slate-100 lg:hidden focus:outline-none"
        >
          <Menu className="w-6 h-6 text-nyati-navy" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-nyati-navy leading-snug">
            {getPageTitle()}
          </h1>
          <p className="text-xs text-slate-400 font-medium hidden md:block mt-0.5">
            {getPageSubtitle()}
          </p>
        </div>
      </div>

      {/* Right section: Date & File Indicator */}
      <div className="flex items-center gap-4">
        {/* Date Indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100">
          <Calendar className="w-4 h-4 text-nyati-navy" />
          <span>{formattedDate}</span>
        </div>

        {/* Database Quick Stats */}
        {fileName && (
          <div className="flex items-center gap-2 bg-nyati-orange/5 border border-nyati-orange/20 px-3 py-1.5 rounded-xl text-xs font-semibold text-nyati-orange">
            <FileSpreadsheet className="w-4 h-4 text-nyati-orange shrink-0" />
            <span className="max-w-[120px] truncate hidden md:inline">{fileName}</span>
            <button
              onClick={resetData}
              title="Upload another file"
              className="p-1 rounded-md hover:bg-nyati-orange/10 ml-1.5 transition-all text-nyati-orange"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

    </header>
  );
}
