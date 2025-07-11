import { useState, useEffect, useCallback } from 'react';
import { logService } from '../services/logService';
import { AuditLog, AuditLogFilters } from '../types';
import { useNotifications } from '../contexts/NotificationContext';

export const useAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState<AuditLogFilters>({
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
      const response = await logService.getAuditLogs(filters);
      setLogs(response.data);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      addNotification({ 
        title: 'Error', 
        message: 'Failed to fetch audit logs', 
        type: 'error', 
        source: 'AuditLogs' 
      });
    } finally {
      setLoading(false);
    }
  }, [filters, addNotification]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFiltersChange = (newFilters: AuditLogFilters) => {
    setFilters({ ...newFilters, page: 1 });
    setCurrentPage(1);
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      await logService.exportLogs('audit', filters, format);
      addNotification({ 
        title: 'Success', 
        message: `Audit logs exported as ${format.toUpperCase()}`, 
        type: 'success', 
        source: 'AuditLogs' 
      });
    } catch (error) {
      console.error('Error exporting logs:', error);
      addNotification({ 
        title: 'Error', 
        message: 'Failed to export logs', 
        type: 'error', 
        source: 'AuditLogs' 
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
      const log = await logService.getAuditLogById(logId);
      setSelectedLog(log);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching log details:', error);
      addNotification({ 
        title: 'Error', 
        message: 'Failed to fetch log details', 
        type: 'error', 
        source: 'AuditLogs' 
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