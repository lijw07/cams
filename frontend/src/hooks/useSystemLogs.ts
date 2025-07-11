import { useState, useEffect, useCallback } from 'react';
import { logService } from '../services/logService';
import { SystemLog, SystemLogFilters } from '../types';
import { useNotifications } from '../contexts/NotificationContext';

export const useSystemLogs = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState<SystemLogFilters>({
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
      const response = await logService.getSystemLogs(filters);
      setLogs(response.data);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error('Error fetching system logs:', error);
      addNotification({ 
        title: 'Error', 
        message: 'Failed to fetch system logs', 
        type: 'error', 
        source: 'SystemLogs' 
      });
    } finally {
      setLoading(false);
    }
  }, [filters, addNotification]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFiltersChange = (newFilters: SystemLogFilters) => {
    setFilters({ ...newFilters, page: 1 });
    setCurrentPage(1);
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      await logService.exportLogs('system', filters, format);
      addNotification({ 
        title: 'Success', 
        message: `System logs exported as ${format.toUpperCase()}`, 
        type: 'success', 
        source: 'SystemLogs' 
      });
    } catch (error) {
      console.error('Error exporting logs:', error);
      addNotification({ 
        title: 'Error', 
        message: 'Failed to export logs', 
        type: 'error', 
        source: 'SystemLogs' 
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
      const log = await logService.getSystemLogById(logId);
      setSelectedLog(log);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching log details:', error);
      addNotification({ 
        title: 'Error', 
        message: 'Failed to fetch log details', 
        type: 'error', 
        source: 'SystemLogs' 
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