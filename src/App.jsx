import React, { useState, Component } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider, useData } from './context/DataContext';

// Components
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import FilterBar from './components/FilterBar';
import UploadZone from './components/UploadZone';

// Pages
import Dashboard1 from './pages/Dashboard1';
import Dashboard2 from './pages/Dashboard2';
import Dashboard3 from './pages/Dashboard3';

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
    <div className="min-h-screen bg-nyati-bg flex">
      {/* Navigation Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[260px]">
        {/* Sticky Topbar */}
        <TopBar toggleSidebar={toggleSidebar} />

        {/* Sticky Filters Header */}
        <FilterBar />

        {/* Dynamic Page Views wrapped in ErrorBoundary */}
        <main className="flex-1 p-6 overflow-y-auto max-w-[1600px] w-full mx-auto">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Dashboard1 />} />
              <Route path="/outstanding" element={<Dashboard2 />} />
              <Route path="/portfolio" element={<Dashboard3 />} />
              {/* Fallback to index */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
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
