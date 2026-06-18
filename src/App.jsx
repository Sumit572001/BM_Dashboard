import React, { useState, Component } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DataProvider, useData } from './context/DataContext';
import { motion } from 'framer-motion';

// Components
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import FilterBar from './components/FilterBar';
import UploadZone from './components/UploadZone';

// Pages
import Dashboard1 from './pages/Dashboard1';
import Dashboard2 from './pages/Dashboard2';
import Dashboard3 from './pages/Dashboard3';
import Overview from './pages/Overview';
import ConstructionBudget from './pages/ConstructionBudget';

// Error Boundary Class Component for catching React runtime rendering errors
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full border border-slate-100 shadow-2xl space-y-6">
            <div className="flex items-center gap-4 text-nyati-danger">
              <div className="p-3 bg-nyati-danger/10 rounded-2xl">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-slate-800">Something went wrong</h2>
                <p className="text-xs text-slate-400">The dashboard encountered a runtime rendering exception.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-left">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Error Message</span>
              <pre className="text-xs font-mono text-nyati-danger whitespace-pre-wrap break-all bg-red-50/50 p-3 rounded-xl border border-red-100/50">
                {this.state.error?.toString()}
                {this.state.error?.stack && `\n\nStack:\n${this.state.error.stack}`}
              </pre>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 bg-nyati-navy text-white text-xs font-bold rounded-xl hover:bg-nyati-navy/90 transition-all cursor-pointer"
              >
                Reload Dashboard
              </button>
              <button
                onClick={() => {
                  window.location.href = '#/';
                  window.location.reload();
                }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Reset Dashboard View
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const { rawData } = useData();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const location = useLocation();

  // Pages where FilterBar should be hidden
  const hideFilterBar = ['/portfolio', '/'].includes(location.pathname);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // If no spreadsheet data is uploaded, render the Upload Landing Zone
  if (!rawData) {
    return (
      <div className="min-h-screen bg-nyati-bg flex items-center justify-center p-4">
        <UploadZone />
      </div>
    );
  }

  return (
    <div className="h-screen bg-nyati-bg flex overflow-hidden">
      {/* Navigation Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} onHoverChange={setSidebarExpanded} />

      {/* Main Layout Area — shifts right when sidebar expands */}
      <motion.div
        animate={{ paddingLeft: sidebarExpanded ? 220 : 64 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex-1 flex flex-col min-w-0 hidden lg:flex"
      >
        {/* Sticky Topbar */}
        <TopBar toggleSidebar={toggleSidebar} />

        {/* Sticky Filters Header — hidden on Portfolio & Overview */}
        {!hideFilterBar && <FilterBar />}

        {/* Dynamic Page Views wrapped in ErrorBoundary */}
        <main className={`flex-1 overflow-y-auto w-full ${location.pathname === '/portfolio' ? '' :
          ['/outstanding', '/construction-budget', '/'].includes(location.pathname) ? 'px-6 pb-6 pt-2' :
            'p-6'
          }`}>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/sales-collection" element={<Dashboard1 />} />
              <Route path="/outstanding" element={<Dashboard2 />} />
              <Route path="/construction-budget" element={<ConstructionBudget />} />
              <Route path="/portfolio" element={<Dashboard3 />} />
              {/* Fallback to overview */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </motion.div>
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <Router>
        <AppContent />
      </Router>
    </DataProvider>
  );
}
