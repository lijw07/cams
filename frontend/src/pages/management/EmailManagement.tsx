import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Plus, 
  Search, 
  Eye, 
  Trash2, 
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Users,
  FileText
} from 'lucide-react';
import { emailService, EmailMessage, EmailStatus, EmailPriority } from '../../services/emailService';
import { useNotifications } from '../contexts/NotificationContext';

const EmailManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalCount: 0,
    pageCount: 0,
  });

  const [filters, setFilters] = useState({
    status: undefined as EmailStatus | undefined,
    priority: undefined as EmailPriority | undefined,
    fromDate: '',
    toDate: '',
  });

  const [stats, setStats] = useState({
    totalSent: 0,
    totalFailed: 0,
    totalQueued: 0,
    deliveryRate: 0,
  });

  const loadEmails = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        searchTerm: searchTerm || undefined,
        status: filters.status,
        priority: filters.priority,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
      };

      const response = await emailService.getEmails(params);
      setEmails(response.emails);
      setPagination({
        currentPage: response.currentPage,
        pageSize: response.pageSize,
        totalCount: response.totalCount,
        pageCount: response.pageCount,
      });
    } catch (error) {
      console.error('Error loading emails:', error);
      toast.error('Failed to load emails');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await emailService.getEmailStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading email stats:', error);
    }
  };

  useEffect(() => {
    loadEmails();
  }, [pagination.currentPage, pagination.pageSize, filters, searchTerm]);

  useEffect(() => {
    loadStats();
  }, []);

  const handleRetryEmail = async (emailId: number) => {
    try {
      await emailService.retryEmail(emailId);
      toast.success('Email queued for retry');
      loadEmails();
    } catch (error) {
      console.error('Error retrying email:', error);
      toast.error('Failed to retry email');
    }
  };

  const handleDeleteEmail = async (emailId: number) => {
    if (!confirm('Are you sure you want to delete this email? This action cannot be undone.')) {
      return;
    }

    try {
      await emailService.deleteEmail(emailId);
      toast.success('Email deleted successfully');
      loadEmails();
    } catch (error) {
      console.error('Error deleting email:', error);
      toast.error('Failed to delete email');
    }
  };

  const handleProcessQueue = async () => {
    try {
      const response = await emailService.processQueue();
      toast.success(response.message);
      loadEmails();
      loadStats();
    } catch (error) {
      console.error('Error processing queue:', error);
      toast.error('Failed to process email queue');
    }
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const getStatusIcon = (status: EmailStatus) => {
    switch (status) {
      case EmailStatus.Sent:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case EmailStatus.Failed:
        return <XCircle className="w-4 h-4 text-red-500" />;
      case EmailStatus.Queued:
        return <Clock className="w-4 h-4 text-blue-500" />;
      case EmailStatus.Sending:
        return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
      case EmailStatus.Cancelled:
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Mail className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: EmailStatus) => {
    const statusMap = {
      [EmailStatus.Draft]: { label: 'Draft', className: 'badge-secondary' },
      [EmailStatus.Queued]: { label: 'Queued', className: 'badge-warning' },
      [EmailStatus.Sending]: { label: 'Sending', className: 'badge-info' },
      [EmailStatus.Sent]: { label: 'Sent', className: 'badge-success' },
      [EmailStatus.Failed]: { label: 'Failed', className: 'badge-error' },
      [EmailStatus.Cancelled]: { label: 'Cancelled', className: 'badge-secondary' },
    };

    const statusInfo = statusMap[status] || { label: 'Unknown', className: 'badge-secondary' };
    return <span className={`badge ${statusInfo.className}`}>{statusInfo.label}</span>;
  };

  const getPriorityBadge = (priority: EmailPriority) => {
    const priorityMap = {
      [EmailPriority.Low]: { label: 'Low', className: 'badge-secondary' },
      [EmailPriority.Normal]: { label: 'Normal', className: 'badge-info' },
      [EmailPriority.High]: { label: 'High', className: 'badge-warning' },
      [EmailPriority.Urgent]: { label: 'Urgent', className: 'badge-error' },
    };

    const priorityInfo = priorityMap[priority] || { label: 'Normal', className: 'badge-info' };
    return <span className={`badge ${priorityInfo.className}`}>{priorityInfo.label}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="w-6 h-6" />
            Email Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Manage email messages, templates, and delivery</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleProcessQueue}
            className="btn btn-secondary"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Process Queue
          </button>
          <button
            onClick={() => navigate('/management/emails/compose')}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Compose Email
          </button>
        </div>
      </div>

      {/* Email Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sent</p>
              <p className="text-3xl font-bold text-green-600">{stats.totalSent}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Queued</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalQueued}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed</p>
              <p className="text-3xl font-bold text-red-600">{stats.totalFailed}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Delivery Rate</p>
              <p className="text-3xl font-bold text-purple-600">{stats.deliveryRate}%</p>
            </div>
            <Mail className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search emails by subject, recipient, or content..."
                className="input pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              className="input"
              value={filters.status?.toString() || ''}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                status: e.target.value === '' ? undefined : parseInt(e.target.value) as EmailStatus
              }))}
            >
              <option value="">All Status</option>
              <option value={EmailStatus.Draft}>Draft</option>
              <option value={EmailStatus.Queued}>Queued</option>
              <option value={EmailStatus.Sending}>Sending</option>
              <option value={EmailStatus.Sent}>Sent</option>
              <option value={EmailStatus.Failed}>Failed</option>
              <option value={EmailStatus.Cancelled}>Cancelled</option>
            </select>

            <select
              className="input"
              value={filters.priority?.toString() || ''}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                priority: e.target.value === '' ? undefined : parseInt(e.target.value) as EmailPriority
              }))}
            >
              <option value="">All Priority</option>
              <option value={EmailPriority.Low}>Low</option>
              <option value={EmailPriority.Normal}>Normal</option>
              <option value={EmailPriority.High}>High</option>
              <option value={EmailPriority.Urgent}>Urgent</option>
            </select>

            <input
              type="date"
              className="input"
              value={filters.fromDate}
              onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
              placeholder="From Date"
            />

            <input
              type="date"
              className="input"
              value={filters.toDate}
              onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
              placeholder="To Date"
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/management/emails/templates')}
            className="btn btn-secondary"
          >
            <FileText className="w-4 h-4 mr-2" />
            Manage Templates
          </button>
          <button
            onClick={() => navigate('/management/emails/bulk-send')}
            className="btn btn-secondary"
          >
            <Users className="w-4 h-4 mr-2" />
            Bulk Send
          </button>
          <button
            onClick={() => navigate('/management/emails/analytics')}
            className="btn btn-secondary"
          >
            <Download className="w-4 h-4 mr-2" />
            Analytics
          </button>
        </div>
      </div>

      {/* Emails Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Loading emails...</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="p-8 text-center">
            <Mail className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No emails found</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {searchTerm ? 'No emails match your search criteria.' : 'Get started by composing your first email.'}
            </p>
            <button
              onClick={() => navigate('/management/emails/compose')}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Compose Email
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Recipient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Sent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {emails.map((email) => (
                    <tr key={email.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(email.status)}
                          {getStatusBadge(email.status)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {email.subject}
                          </div>
                          {email.attachmentCount > 0 && (
                            <div className="text-xs text-gray-500">
                              {email.attachmentCount} attachment{email.attachmentCount !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{email.toEmail}</div>
                        {email.toName && (
                          <div className="text-xs text-gray-500">{email.toName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPriorityBadge(email.priority)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(email.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {email.sentAt 
                          ? new Date(email.sentAt).toLocaleDateString()
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/management/emails/${email.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {email.status === EmailStatus.Failed && (
                            <button
                              onClick={() => handleRetryEmail(email.id)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Retry"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteEmail(email.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pageCount > 1 && (
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of{' '}
                    {pagination.totalCount} emails
                  </div>
                  <div className="flex gap-2">
                    {Array.from({ length: pagination.pageCount }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 text-sm rounded ${
                          page === pagination.currentPage
                            ? 'bg-primary text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EmailManagementPage;