import { useState, useEffect, useCallback } from 'react';

import { useNotifications } from '../contexts/NotificationContext';
import { logService } from '../services/logService';
import { SecurityLog, SecurityLogFilters } from '../types';

export const useSecurityLogs = () => {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedLog, setSelectedLog] = useState<SecurityLog | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState<SecurityLogFilters>({
    page: 1,
    pageSize: 20,
    search: '',
    sortBy: 'timestamp',
    sortDirection: 'desc'
  });
  const { addNotification } = useNotifications();

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await logService.getSecurityLogs(filters);
      setLogs(response.data);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error('Error fetching security logs:', error);
      addNotification({ 
        title: 'Error', 
        message: 'Failed to fetch security logs', 
        type: 'error', 
        source: 'SecurityLogs' 
      });
    } finally {
      setLoading(false);
    }
  }, [filters, addNotification]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFiltersChange = (newFilters: SecurityLogFilters) => {
    setFilters({ ...newFilters, page: 1 });
    setCurrentPage(1);
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      await logService.exportLogs('security', filters, format);
      addNotification({ 
        title: 'Success', 
        message: `Security logs exported as ${format.toUpperCase()}`, 
        type: 'success', 
        source: 'SecurityLogs' 
      });
    } catch (error) {
      console.error('Error exporting logs:', error);
      addNotification({ 
        title: 'Error', 
        message: 'Failed to export logs', 
        type: 'error', 
        source: 'SecurityLogs' 
      });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setFilters({ ...filters, page });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    setFilters({ ...filters, pageSize: newPageSize, page: 1 });
  };

  const viewLogDetails = async (logId: string) => {
    try {
      const log = await logService.getSecurityLogById(logId);
      setSelectedLog(log);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching log details:', error);
      addNotification({ 
        title: 'Error', 
        message: 'Failed to fetch log details', 
        type: 'error', 
        source: 'SecurityLogs' 
      });
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    logs,
    loading,
    totalCount,
    currentPage,
    pageSize,
    selectedLog,
    showModal,
    setShowModal,
    filters,
    totalPages,
    handleFiltersChange,
    handleExport,
    handlePageChange,
    handlePageSizeChange,
    viewLogDetails
  };
};