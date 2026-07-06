import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { processRawData, filterData, getConstructionMonthlyData, getPortfolioKpiOverrides, getQuarterFromMonth } from '../utils/dataHelpers';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [rawData, setRawData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeProjectName, setActiveProjectName] = useState('');
  const [defaultQuarter, setDefaultQuarter] = useState('Q1');

  // Global filters
  const [filters, setFilters] = useState({
    selectedProjects: [], // Empty array means "All Projects"
    dateFrom: '',
    dateTo: '',
    selectedQuarters: ['Q1'], // Default to Q1 initially
    selectedType: 'All' // 'All' | 'R' | 'L' | 'C'
  });

  // Parse raw data into project-level derived statistics
  const processedProjects = useMemo(() => {
    if (!rawData) return [];
    return processRawData(rawData);
  }, [rawData]);

  // Auto-detect and set current active quarter when rawData is uploaded
  useEffect(() => {
    if (processedProjects && processedProjects.length > 0) {
      const monthsOrder = ['Apr-26', 'May-26', 'Jun-26', 'Jul-26', 'Aug-26', 'Sep-26', 'Oct-26', 'Nov-26', 'Dec-26', 'Jan-27', 'Feb-27', 'Mar-27'];
      let latestMonth = 'Apr-26';
      let foundActual = false;
      
      processedProjects.forEach(p => {
        if (p.monthlyData) {
          Object.keys(p.monthlyData).forEach(m => {
            const d = p.monthlyData[m];
            if (d && (d.unitsActual > 0 || d.salesValueActual > 0)) {
              foundActual = true;
              const mIdx = monthsOrder.indexOf(m);
              const latIdx = monthsOrder.indexOf(latestMonth);
              if (mIdx > latIdx) {
                latestMonth = m;
              }
            }
          });
        }
      });

      const q = foundActual ? (getQuarterFromMonth(latestMonth) || 'Q1') : 'Q1';
      setDefaultQuarter(q);
      setFilters(prev => ({
        ...prev,
        selectedQuarters: [q]
      }));
    }
  }, [processedProjects]);


  // Extract unique project names from parsed list
  const projectList = useMemo(() => {
    return processedProjects.map(p => p.name).sort();
  }, [processedProjects]);

  // Reactively filter data based on user filter selections
  const filteredProjects = useMemo(() => {
    return filterData(processedProjects, filters);
  }, [processedProjects, filters]);

  // Active project selection details for Dashboard 3
  const activeProject = useMemo(() => {
    if (processedProjects.length === 0) return null;
    if (activeProjectName) {
      return processedProjects.find(p => p.name === activeProjectName) || null;
    }
    return null;
  }, [processedProjects, activeProjectName]);

  // Monthly construction budget timeline data
  const constructionMonthly = useMemo(() => {
    return getConstructionMonthlyData(rawData, filteredProjects);
  }, [rawData, filteredProjects]);

  // Extract explicit KPI overrides from the uploaded "Overview" sheet (if present)
  // This allows values like "In Process = 10" to be read directly from the Excel
  const portfolioKpiOverrides = useMemo(() => {
    return getPortfolioKpiOverrides(rawData);
  }, [rawData]);

  // Handle data upload
  const uploadData = (parsedArray, name) => {
    setIsLoading(true);
    setRawData(parsedArray);
    setFileName(name);
    setIsLoading(false);
  };

  // Reset all states
  const resetData = () => {
    setRawData(null);
    setFileName('');
    setActiveProjectName('');
    setFilters({
      selectedProjects: [],
      dateFrom: '',
      dateTo: '',
      selectedQuarters: [defaultQuarter],
      selectedType: 'All'
    });
  };

  // Helper to update specific filter properties
  const updateFilters = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  return (
    <DataContext.Provider value={{
      rawData,
      processedProjects,
      filteredProjects,
      projectList,
      fileName,
      isLoading,
      setIsLoading,
      activeProject,
      activeProjectName,
      setActiveProjectName,
      constructionMonthly,
      portfolioKpiOverrides,
      filters,
      defaultQuarter,
      updateFilters,
      uploadData,
      resetData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
