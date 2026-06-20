import React, { createContext, useState, useContext, useMemo } from 'react';
import { processRawData, filterData, getConstructionMonthlyData } from '../utils/dataHelpers';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [rawData, setRawData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeProjectName, setActiveProjectName] = useState('');

  // Global filters
  const [filters, setFilters] = useState({
    selectedProjects: [], // Empty array means "All Projects"
    dateFrom: '',
    dateTo: '',
    selectedQuarters: ['Q1', 'Q2', 'Q3', 'Q4'], // All active by default
    selectedType: 'All' // 'All' | 'R' | 'L' | 'C'
  });

  // Parse raw data into project-level derived statistics
  const processedProjects = useMemo(() => {
    if (!rawData) return [];
    return processRawData(rawData);
  }, [rawData]);

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
      selectedQuarters: ['Q1', 'Q2', 'Q3', 'Q4'],
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
      filters,
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
